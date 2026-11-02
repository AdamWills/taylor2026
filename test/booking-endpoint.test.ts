// Runs the real wrangler.jsonc, so it also catches /api/* dropping out of
// run_worker_first. The happy path uses Cloudflare's Turnstile testing secret,
// which needs network access to challenges.cloudflare.com; `wrangler dev`
// simulates the email binding, so nothing is sent, and D1 is a local copy with
// migrations/ applied. Run `npm run build` first.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestHarness } from 'wrangler';
import { VALID } from './booking-fixture';

const PASSING_SECRET = '1x0000000000000000000000000000000AA';
const TOKEN = { 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' };
const HOUR = 60 * 60 * 1000;

/** The slice of D1 these tests use (the Workers types are not in the site's typecheck). */
type Statement = {
	bind(...values: unknown[]): Statement;
	run(): Promise<unknown>;
	all<T>(): Promise<{ results: T[] }>;
};
type Env = { BOOKINGS_DB: { prepare(sql: string): Statement } };
type Row = { id: string; status: string; attempts: number; last_error: string | null; booking: string };

function harness(extraSecrets: Record<string, string> = {}) {
	return createTestHarness({
		workers: [
			{
				configPath: './wrangler.jsonc',
				secrets: {
					FACILITATOR_PASSWORD: 'unused',
					COOKIE_SECRET: 'unused',
					TURNSTILE_SECRET: PASSING_SECRET,
					// The testing secret reports this hostname.
					TURNSTILE_HOSTNAMES: 'example.com',
					...extraSecrets,
				},
			},
		],
	});
}

const server = harness();
// The binding's destination_address only allows BOOKING_TO; pointing BOOKING_TO
// anywhere else makes every send fail, standing in for an email outage.
const broken = harness({ BOOKING_TO: 'someone-else@example.com' });

async function db(h: typeof server) {
	const env = await h.getWorker<Env>().getEnv();
	return env.BOOKINGS_DB;
}

async function rows(h: typeof server): Promise<Row[]> {
	const { results } = await (await db(h)).prepare('SELECT * FROM bookings ORDER BY created_at').all<Row>();
	return results;
}

beforeAll(async () => {
	await Promise.all([server.listen(), broken.listen()]);
	await server.getWorker().applyD1Migrations('BOOKINGS_DB');
	await broken.getWorker().applyD1Migrations('BOOKINGS_DB');
});
afterAll(() => Promise.all([server.close(), broken.close()]));
beforeEach(async () => {
	await (await db(server)).prepare('DELETE FROM bookings').run();
	await (await db(broken)).prepare('DELETE FROM bookings').run();
});

let nextIp = 1;
function post(fields: Record<string, string>, ip = `198.51.100.${nextIp++}`, h = server) {
	return h.fetch('/api/book-a-visit', {
		method: 'POST',
		body: new URLSearchParams(fields),
		headers: { 'CF-Connecting-IP': ip },
	});
}

describe('POST /api/book-a-visit', () => {
	it('saves a valid request, then sends it', async () => {
		const response = await post({ ...VALID, ...TOKEN });
		expect(await response.json()).toEqual({ ok: true });
		expect(response.status).toBe(200);

		const [row] = await rows(server);
		expect(row).toMatchObject({ status: 'sent', attempts: 1, last_error: null });
		expect(JSON.parse(row.booking)).toMatchObject({ name: VALID.name, email: VALID.email });
	});

	it('saves nothing when validation or Turnstile fails', async () => {
		await post({ ...VALID, email: 'nope', ...TOKEN });
		await post(VALID);
		expect(await rows(server)).toEqual([]);
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

describe('when the email fails', () => {
	it('keeps the request and still tells the requester it went through', async () => {
		const response = await post({ ...VALID, ...TOKEN }, undefined, broken);
		expect(await response.json()).toEqual({ ok: true });

		const [row] = await rows(broken);
		expect(row).toMatchObject({ status: 'failed', attempts: 1 });
		expect(row.last_error).toBeTruthy();
	});

	it('the hourly job keeps retrying, then gives up after a day', async () => {
		const database = await db(broken);
		await database
			.prepare("INSERT INTO bookings (id, created_at, booking, status, attempts) VALUES ('a', ?, ?, 'failed', 1), ('b', ?, ?, 'failed', 24)")
			.bind(Date.now() - HOUR, JSON.stringify(VALID), Date.now() - 2 * 24 * HOUR, JSON.stringify(VALID))
			.run();
		await broken.getWorker().scheduled({ cron: '0 * * * *', scheduledTime: new Date() });
		expect((await rows(broken)).map((r) => [r.id, r.status, r.attempts])).toEqual([
			['b', 'failed', 24], // out of attempts: left alone
			['a', 'failed', 2],
		]);
	});
});

describe('the hourly job', () => {
	it('resends failed and stuck requests', async () => {
		const database = await db(server);
		await database
			.prepare(
				"INSERT INTO bookings (id, created_at, booking, status, attempts) VALUES ('failed', ?, ?, 'failed', 3), ('stuck', ?, ?, 'pending', 0), ('fresh', ?, ?, 'pending', 0)",
			)
			.bind(
				Date.now() - HOUR, JSON.stringify(VALID),
				Date.now() - HOUR, JSON.stringify(VALID),
				Date.now(), JSON.stringify(VALID), // may still be mid-request: left alone
			)
			.run();
		await server.getWorker().scheduled({ cron: '0 * * * *', scheduledTime: new Date() });
		expect(Object.fromEntries((await rows(server)).map((r) => [r.id, [r.status, r.attempts]]))).toEqual({
			failed: ['sent', 4],
			stuck: ['sent', 1],
			fresh: ['pending', 0],
		});
	});

	it('deletes requests older than 90 days', async () => {
		const database = await db(server);
		await database
			.prepare("INSERT INTO bookings (id, created_at, booking, status, attempts) VALUES ('old', ?, '{}', 'sent', 1), ('recent', ?, '{}', 'sent', 1)")
			.bind(Date.now() - 91 * 24 * HOUR, Date.now() - 89 * 24 * HOUR)
			.run();
		await server.getWorker().scheduled({ cron: '0 * * * *', scheduledTime: new Date() });
		expect((await rows(server)).map((r) => r.id)).toEqual(['recent']);
	});
});
