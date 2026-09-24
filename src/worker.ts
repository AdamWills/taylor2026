// Facilitator gate. See docs/superpowers/specs/2026-08-19-gallery-and-auth-design.md,
// Part 4. wrangler.jsonc routes /facilitators and everything under it here
// (run_worker_first); all other paths are served straight from dist/.
//
// Secrets, set with `wrangler secret put` (and .dev.vars locally):
//   FACILITATOR_PASSWORD  the shared password
//   COOKIE_SECRET         signs the session cookie; rotating it signs everyone out

interface Env {
	ASSETS: Fetcher;
	SIGN_IN_LIMITER: RateLimit;
	FACILITATOR_PASSWORD?: string;
	COOKIE_SECRET?: string;
}

const SIGN_IN_PAGE = '/facilitator-sign-in/';
const COOKIE_NAME = 'tt_fac';
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days
const encoder = new TextEncoder();

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (!isGated(url.pathname)) {
			return env.ASSETS.fetch(request);
		}

		// Unset or empty secrets fail closed: nothing matches, nothing verifies.
		const password = env.FACILITATOR_PASSWORD ?? '';
		const secret = env.COOKIE_SECRET ?? '';
		const configured = password !== '' && secret !== '';

		if (request.method === 'POST') {
			// Checked before the password, so a limited address learns nothing.
			const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
			const { success } = await env.SIGN_IN_LIMITER.limit({ key: ip });
			if (!success) {
				return passwordForm(request, env, 'Too many attempts. Please wait a minute and try again.', 429);
			}

			const submitted = await submittedPassword(request);
			if (!configured || !(await passwordMatches(submitted, password))) {
				return passwordForm(request, env, 'That password was not right.', 401);
			}

			const expiry = String(Math.floor(Date.now() / 1000) + MAX_AGE);
			return new Response(null, {
				status: 303,
				headers: {
					Location: url.pathname,
					'Set-Cookie':
						`${COOKIE_NAME}=${expiry}.${await sign(expiry, secret)}; Path=/facilitators;` +
						` Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
					'Cache-Control': 'private, no-store',
				},
			});
		}

		if (!configured || !(await hasValidCookie(request, secret))) {
			return passwordForm(request, env);
		}

		const response = await env.ASSETS.fetch(request);
		return new Response(response.body, {
			status: response.status,
			headers: privateHeaders(response.headers),
		});
	},
} satisfies ExportedHandler<Env>;

/** Exact match on the folder, so /facilitator-sign-in/ is not gated. */
function isGated(pathname: string) {
	return pathname === '/facilitators' || pathname.startsWith('/facilitators/');
}

async function submittedPassword(request: Request) {
	try {
		const value = (await request.formData()).get('password');
		return typeof value === 'string' ? value : '';
	} catch {
		return ''; // not a form body
	}
}

/**
 * The built sign-in page, with its form pointed back at the requested path
 * and an optional message filled in.
 */
async function passwordForm(request: Request, env: Env, message?: string, status = 200) {
	const action = new URL(request.url).pathname;
	const page = await env.ASSETS.fetch(new URL(SIGN_IN_PAGE, request.url));
	const rewritten = new HTMLRewriter()
		.on('form', {
			element(form) {
				form.setAttribute('action', action);
			},
		})
		.on('#gate-message', {
			element(el) {
				if (!message) return;
				el.removeAttribute('hidden');
				el.setInnerContent(message);
			},
		})
		.transform(page);
	const headers = privateHeaders(page.headers);
	headers.delete('ETag'); // describes the page as built, not as rewritten
	return new Response(rewritten.body, { status, headers });
}

function privateHeaders(from: Headers) {
	const headers = new Headers(from);
	headers.set('X-Robots-Tag', 'noindex, nofollow');
	headers.set('Cache-Control', 'private, no-store');
	return headers;
}

async function sign(value: string, secret: string) {
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
	return btoa(String.fromCharCode(...new Uint8Array(sig)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

/**
 * Hash both sides first, so the comparison runs over fixed-length buffers and
 * cannot leak the length of the real password.
 */
async function passwordMatches(submitted: string, expected: string) {
	const [a, b] = await Promise.all([
		crypto.subtle.digest('SHA-256', encoder.encode(submitted)),
		crypto.subtle.digest('SHA-256', encoder.encode(expected)),
	]);
	return crypto.subtle.timingSafeEqual(a, b);
}

async function hasValidCookie(request: Request, secret: string) {
	const match = (request.headers.get('Cookie') ?? '').match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
	if (!match) return false;

	const [expiry, signature] = match[1].split('.');
	if (!expiry || !signature || !/^\d+$/.test(expiry)) return false;
	if (Number(expiry) < Math.floor(Date.now() / 1000)) return false;

	const expected = await sign(expiry, secret);
	// timingSafeEqual throws on a length mismatch, and a client controls this
	// value, so the length has to be checked first. The expected length is a
	// public constant, so checking it leaks nothing.
	if (signature.length !== expected.length) return false;
	return crypto.subtle.timingSafeEqual(encoder.encode(signature), encoder.encode(expected));
}
