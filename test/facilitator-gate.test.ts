// Runs the real wrangler.jsonc against the real build in dist/, so it catches
// the silent bypass the spec warns about: if run_worker_first stops covering
// /facilitators, workerd serves the assets straight from dist/ and these fail.
// Run `npm run build` first.
import { existsSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestHarness } from 'wrangler';

const PASSWORD = 'correct horse battery staple';
const COOKIE_SECRET = 'test-cookie-secret';
/** Only on the protected /facilitators page itself. */
const PROTECTED_LINK = 'href="/facilitators/sample-session-guide.pdf"';

const server = createTestHarness({
	workers: [
		{
			configPath: './wrangler.jsonc',
			secrets: { FACILITATOR_PASSWORD: PASSWORD, COOKIE_SECRET },
		},
	],
});

beforeAll(async () => {
	if (!existsSync('dist/facilitators/index.html')) {
		throw new Error('dist/ has no facilitators page. Run `npm run build` first.');
	}
	await server.listen();
});

afterAll(() => server.close());

async function expectPasswordForm(response: Awaited<ReturnType<typeof server.fetch>>) {
	const body = await response.text();
	expect(response.status, 'status').toBeLessThan(300);
	expect(response.headers.get('Content-Type')).toMatch(/^text\/html/);
	expect(/<form[^>]*method="post"/i.test(body), 'has a POST form').toBe(true);
	expect(/<input[^>]*name="password"/.test(body), 'has a password input').toBe(true);
	expect(body.startsWith('%PDF'), 'is the PDF').toBe(false);
	expect(body.includes(PROTECTED_LINK), 'is the protected page').toBe(false);
	expect(response.headers.get('Cache-Control')).toBe('private, no-store');
}

describe('without the cookie, the gate serves the password form', () => {
	for (const path of ['/facilitators', '/facilitators/', '/facilitators/sample-session-guide.pdf']) {
		it(path, async () => {
			await expectPasswordForm(await server.fetch(path, { redirect: 'manual' }));
		});
	}
});

let nextIp = 1;
/** Each test signs in from its own address so the rate limit only bites where tested. */
function freshIp() {
	return `203.0.113.${nextIp++}`;
}

function signIn(password: string, ip = freshIp(), path = '/facilitators/') {
	return server.fetch(path, {
		method: 'POST',
		body: new URLSearchParams({ password }),
		headers: { 'CF-Connecting-IP': ip },
		redirect: 'manual',
	});
}

async function signedInCookie() {
	const setCookie = (await signIn(PASSWORD)).headers.get('Set-Cookie') ?? '';
	return setCookie.split(';')[0];
}

/** Mirrors the Worker's signing, so tests can build cookies it did not issue. */
async function sign(value: string) {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(COOKIE_SECRET),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
	return Buffer.from(sig).toString('base64url');
}

describe('signing in', () => {
	it('sets a signed, 14-day, HttpOnly, Secure, SameSite=Lax cookie and redirects back', async () => {
		const response = await signIn(PASSWORD, freshIp(), '/facilitators/sample-session-guide.pdf');
		expect(response.status).toBe(303);
		expect(response.headers.get('Location')).toBe('/facilitators/sample-session-guide.pdf');
		const cookie = response.headers.get('Set-Cookie') ?? '';
		expect(cookie).toMatch(/^tt_fac=\d+\.[\w-]+;/);
		expect(cookie).toContain('Path=/facilitators');
		expect(cookie).toContain(`Max-Age=${60 * 60 * 24 * 14}`);
		expect(cookie).toContain('HttpOnly');
		expect(cookie).toContain('Secure');
		expect(cookie).toContain('SameSite=Lax');
	});

	it('refuses a wrong password with the form and a message', async () => {
		const response = await signIn('turtle');
		const body = await response.text();
		expect(response.status).toBe(401);
		expect(response.headers.get('Set-Cookie')).toBeNull();
		expect(body).toContain('That password was not right.');
		expect(body.includes(PROTECTED_LINK)).toBe(false);
	});
});

describe('with a valid cookie', () => {
	it('serves the protected page, kept out of search and caches', async () => {
		const response = await server.fetch('/facilitators/', { headers: { Cookie: await signedInCookie() } });
		expect(response.status).toBe(200);
		expect((await response.text()).includes(PROTECTED_LINK)).toBe(true);
		expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
		expect(response.headers.get('Cache-Control')).toBe('private, no-store');
	});

	it('serves the PDF', async () => {
		const response = await server.fetch('/facilitators/sample-session-guide.pdf', {
			headers: { Cookie: await signedInCookie() },
		});
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('application/pdf');
		expect((await response.text()).startsWith('%PDF')).toBe(true);
		expect(response.headers.get('Cache-Control')).toBe('private, no-store');
	});
});

describe('cookies the Worker did not issue are refused', () => {
	const cases: Record<string, () => Promise<string>> = {
		'a forged signature': async () => `tt_fac=${Math.floor(Date.now() / 1000) + 3600}.not-a-real-signature`,
		'an expired, correctly signed cookie': async () => {
			const expiry = String(Math.floor(Date.now() / 1000) - 60);
			return `tt_fac=${expiry}.${await sign(expiry)}`;
		},
		'a real cookie with its expiry pushed out': async () => {
			const [, signature] = (await signedInCookie()).split('.');
			return `tt_fac=${Math.floor(Date.now() / 1000) + 10 ** 8}.${signature}`;
		},
		'garbage': async () => 'tt_fac=garbage',
	};
	for (const [name, cookie] of Object.entries(cases)) {
		it(name, async () => {
			await expectPasswordForm(await server.fetch('/facilitators/', { headers: { Cookie: await cookie() } }));
		});
	}
});

describe('rate limit on sign-in', () => {
	it('refuses the sixth attempt in a minute from one address, even with the right password', async () => {
		const ip = freshIp();
		for (let i = 0; i < 5; i++) {
			expect((await signIn('wrong guess', ip)).status).toBe(401);
		}
		const response = await signIn(PASSWORD, ip);
		expect(response.status).toBe(429);
		expect(response.headers.get('Set-Cookie')).toBeNull();
		expect(await response.text()).toContain('Too many attempts');
	});

	it('does not count other addresses', async () => {
		expect((await signIn(PASSWORD)).status).toBe(303);
	});
});
