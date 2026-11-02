// Two jobs, both routed here by run_worker_first in wrangler.jsonc; every other
// path is served straight from dist/.
//
// 1. Facilitator gate. See docs/superpowers/specs/2026-08-19-gallery-and-auth-design.md,
//    Part 4. Covers /facilitators and everything under it.
// 2. Book a Visit form (POST /api/book-a-visit): checks Turnstile, validates,
//    saves the request to D1, then emails it to SAC through the BOOKING_EMAIL
//    binding. The hourly cron resends any email that failed and deletes
//    requests after 90 days.
//
// Secrets, set with `wrangler secret put` (and .dev.vars locally):
//   FACILITATOR_PASSWORD  the shared password
//   COOKIE_SECRET         signs the session cookie; rotating it signs everyone out
//   TURNSTILE_SECRET      the Turnstile widget's secret key
// Vars (wrangler.jsonc): TURNSTILE_HOSTNAMES, comma-separated hostnames the form
// may be submitted from; BOOKING_TO, who receives Book a Visit requests.

import { type Booking, bookingEmail, HONEYPOT, validateBooking } from './lib/booking';

interface Env {
	ASSETS: Fetcher;
	SIGN_IN_LIMITER: RateLimit;
	BOOKING_LIMITER: RateLimit;
	BOOKING_EMAIL: SendEmail;
	BOOKINGS_DB: D1Database;
	FACILITATOR_PASSWORD?: string;
	COOKIE_SECRET?: string;
	TURNSTILE_SECRET?: string;
	TURNSTILE_HOSTNAMES?: string;
	BOOKING_TO: string;
}

const BOOKING_PATH = '/api/book-a-visit';
const BOOKING_FROM = { email: 'bookings@taylorsrights.ca', name: 'Taylor the Turtle website' };
const TURNSTILE_ACTION = 'book_visit';
const HOUR = 60 * 60 * 1000;
/** Resend for about a day (the cron is hourly), then leave the row as failed. */
const MAX_ATTEMPTS = 24;
const RETENTION = 90 * 24 * HOUR;

const SIGN_IN_PAGE = '/facilitator-sign-in/';
const COOKIE_NAME = 'tt_fac';
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days
const encoder = new TextEncoder();

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === BOOKING_PATH) {
			return handleBooking(request, env);
		}

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

	async scheduled(_controller, env) {
		await resendUnsent(env);
		await env.BOOKINGS_DB.prepare('DELETE FROM bookings WHERE created_at < ?').bind(Date.now() - RETENTION).run();
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

/**
 * The Book a Visit form posts here with fetch and reads back JSON. Order matters:
 * the cheap checks (rate limit, honeypot, validation) run before the network call
 * to Turnstile, and nothing is sent until Turnstile has passed.
 */
async function handleBooking(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return json({ ok: false, error: 'Method not allowed.' }, 405, { Allow: 'POST' });
	}

	const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
	const { success } = await env.BOOKING_LIMITER.limit({ key: ip });
	if (!success) {
		return json({ ok: false, error: 'Too many requests. Please wait a minute and try again.' }, 429);
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return json({ ok: false, error: 'Something went wrong sending the form. Please try again.' }, 400);
	}

	// Bots that fill every field get a success message and send nothing.
	const trap = form.get(HONEYPOT);
	if (typeof trap === 'string' && trap !== '') return json({ ok: true });

	const result = validateBooking(form);
	if (!result.ok) return json(result, 400);

	if (!(await turnstilePassed(form.get('cf-turnstile-response'), ip, env))) {
		return json(
			{ ok: false, error: 'We could not confirm you are not a bot. Please try again, or call 519.751.1164.' },
			403,
		);
	}

	// Save first, so a failed email never loses the request: the hourly cron
	// resends anything still unsent.
	const id = crypto.randomUUID();
	const receivedAt = Date.now();
	let saved = false;
	try {
		await env.BOOKINGS_DB.prepare('INSERT INTO bookings (id, created_at, booking) VALUES (?, ?, ?)')
			.bind(id, receivedAt, JSON.stringify(result.booking))
			.run();
		saved = true;
	} catch (error) {
		console.error('Book a Visit request not saved', (error as Error).message);
	}

	const error = await sendBooking(env, result.booking, receivedAt);
	if (saved) await recordAttempt(env, id, error);

	// Saved means it will be delivered, by the cron if not now, so the requester
	// is told it went through. Only when it is neither sent nor saved is it lost.
	if (error && !saved) {
		return json(
			{ ok: false, error: 'Sorry, your request could not be sent. Please try again, or call 519.751.1164.' },
			502,
		);
	}
	return json({ ok: true });
}

/** Sends the notification. Returns the error message, or null when sent. */
async function sendBooking(env: Env, booking: Booking, receivedAt: number) {
	try {
		// The binding's destination_address (wrangler.jsonc) pins the recipient, so
		// this endpoint can only ever email SAC. `to` is still passed: the local
		// simulator does not fill it in from the binding.
		await env.BOOKING_EMAIL.send({
			to: env.BOOKING_TO,
			from: BOOKING_FROM,
			...bookingEmail(booking, new Date(receivedAt)),
		});
		return null;
	} catch (error) {
		const { code, message } = error as { code?: string; message?: string };
		console.error('Book a Visit email failed', code, message);
		return [code, message].filter(Boolean).join(': ') || 'unknown error';
	}
}

async function recordAttempt(env: Env, id: string, error: string | null) {
	try {
		await env.BOOKINGS_DB.prepare(
			`UPDATE bookings SET attempts = attempts + 1, status = ?, last_error = ?, sent_at = ?
			 WHERE id = ?`,
		)
			.bind(error ? 'failed' : 'sent', error, error ? null : Date.now(), id)
			.run();
	} catch (dbError) {
		// The row stays 'pending', so the cron resends it: a possible duplicate
		// email, never a lost request.
		console.error('Book a Visit status not recorded', id, (dbError as Error).message);
	}
}

/**
 * Resends requests whose email failed, or that were left 'pending' (the update
 * after sending did not land). Skips anything under five minutes old, which may
 * still be mid-request.
 */
async function resendUnsent(env: Env) {
	const { results } = await env.BOOKINGS_DB.prepare(
		`SELECT id, created_at, booking FROM bookings
		 WHERE status != 'sent' AND attempts < ? AND created_at < ?
		 ORDER BY created_at LIMIT 50`,
	)
		.bind(MAX_ATTEMPTS, Date.now() - 5 * 60 * 1000)
		.all<{ id: string; created_at: number; booking: string }>();

	for (const row of results) {
		const error = await sendBooking(env, JSON.parse(row.booking) as Booking, row.created_at);
		await recordAttempt(env, row.id, error);
	}
}

/** Canonical server-side siteverify. Any failure, including a network error, fails closed. */
async function turnstilePassed(token: unknown, ip: string, env: Env) {
	const secret = env.TURNSTILE_SECRET ?? '';
	const hostnames = new Set(
		(env.TURNSTILE_HOSTNAMES ?? '')
			.split(',')
			.map((hostname) => hostname.trim())
			.filter(Boolean),
	);
	if (typeof token !== 'string' || token.length === 0 || token.length > 2048 || !secret || hostnames.size === 0) {
		return false;
	}

	let result: { success?: boolean; action?: string; hostname?: string; metadata?: { result_with_testing_key?: boolean } };
	try {
		const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			signal: AbortSignal.timeout(10_000),
			body: new URLSearchParams({ secret, response: token, remoteip: ip }),
		});
		if (!response.ok) return false;
		result = await response.json();
	} catch {
		return false;
	}

	// Cloudflare's testing keys (local dev and tests only) return no action. A
	// production secret never produces a testing-key result.
	const actionOk = result.action === TURNSTILE_ACTION || result.metadata?.result_with_testing_key === true;
	return result.success === true && actionOk && typeof result.hostname === 'string' && hostnames.has(result.hostname);
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
	});
}
