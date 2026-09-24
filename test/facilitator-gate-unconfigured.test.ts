// If the secrets were never set (or one was set empty), the gate must stay
// shut: an empty FACILITATOR_PASSWORD must not make an empty submission match.
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createTestHarness } from 'wrangler';

const server = createTestHarness({
	workers: [{ configPath: './wrangler.jsonc', secrets: { FACILITATOR_PASSWORD: '', COOKIE_SECRET: '' } }],
});

beforeAll(() => server.listen());
afterAll(() => server.close());

it('refuses every password when the secrets are missing', async () => {
	const response = await server.fetch('/facilitators/', {
		method: 'POST',
		body: new URLSearchParams({ password: '' }),
		redirect: 'manual',
	});
	expect(response.status).not.toBe(303);
	expect(response.headers.get('Set-Cookie')).toBeNull();
});
