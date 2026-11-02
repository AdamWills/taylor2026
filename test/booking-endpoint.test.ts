// Runs the real wrangler.jsonc, so it also catches /api/* dropping out of
// run_worker_first. The happy path uses Cloudflare's Turnstile testing secret,
// which needs network access to challenges.cloudflare.com; `wrangler dev`
// simulates the email binding, so nothing is sent. Run `npm run build` first.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestHarness } from 'wrangler';
import { VALID } from './booking-fixture';

const PASSING_SECRET = '1x0000000000000000000000000000000AA';

const server = createTestHarness({
	workers: [
		{
			configPath: './wrangler.jsonc',
			secrets: {
				FACILITATOR_PASSWORD: 'unused',
				COOKIE_SECRET: 'unused',
				TURNSTILE_SECRET: PASSING_SECRET,
				// The testing secret reports this hostname.
				TURNSTILE_HOSTNAMES: 'example.com',
			},
		},
	],
});

beforeAll(() => server.listen());
afterAll(() => server.close());

let nextIp = 1;
function post(fields: Record<string, string>, ip = `198.51.100.${nextIp++}`) {
	return server.fetch('/api/book-a-visit', {
		method: 'POST',
		body: new URLSearchParams(fields),
		headers: { 'CF-Connecting-IP': ip },
	});
}

describe('POST /api/book-a-visit', () => {
	it('sends a valid request', async () => {
		const response = await post({ ...VALID, 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' });
		expect(await response.json()).toEqual({ ok: true });
		expect(response.status).toBe(200);
	});

	it('refuses a request without a Turnstile token', async () => {
		const response = await post(VALID);
		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({ ok: false });
	});

	it('reports a validation error before checking Turnstile', async () => {
		const response = await post({ ...VALID, email: 'nope' });
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ ok: false, error: 'Please check the email address.' });
	});

	it('quietly drops a filled-in honeypot', async () => {
		const response = await post({ ...VALID, website: 'http://spam.example' });
		expect(await response.json()).toEqual({ ok: true });
	});

	it('only accepts POST', async () => {
		const response = await server.fetch('/api/book-a-visit');
		expect(response.status).toBe(405);
	});

	it('rate limits each address', async () => {
		const ip = '198.51.100.250';
		const statuses = [];
		for (let i = 0; i < 6; i++) statuses.push((await post({ ...VALID, email: 'nope' }, ip)).status);
		expect(statuses.slice(0, 5)).toEqual([400, 400, 400, 400, 400]);
		expect(statuses[5]).toBe(429);
	});
});
