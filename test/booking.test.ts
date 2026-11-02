import { describe, expect, it } from 'vitest';
import { bookingEmail, validateBooking } from '../src/lib/booking';
import { VALID } from './booking-fixture';

const form = (overrides: Record<string, string> = {}) => new URLSearchParams({ ...VALID, ...overrides });

describe('validateBooking', () => {
	it('accepts a complete request', () => {
		expect(validateBooking(form())).toMatchObject({ ok: true });
	});

	it.each(['requestType', 'groupSize', 'ageRange', 'dates', 'name', 'email', 'fees'])('requires %s', (field) => {
		expect(validateBooking(form({ [field]: '  ' }))).toMatchObject({ ok: false });
	});

	it('rejects a request type that is not on the form', () => {
		expect(validateBooking(form({ requestType: 'free-pizza' }))).toMatchObject({ ok: false });
	});

	it('needs the "please specify" text for Other', () => {
		expect(validateBooking(form({ requestType: 'other' }))).toMatchObject({ ok: false });
		expect(validateBooking(form({ requestType: 'other', otherType: 'Podcast' }))).toMatchObject({ ok: true });
	});

	it('needs an amount when there are fees', () => {
		expect(validateBooking(form({ fees: 'yes' }))).toMatchObject({ ok: false });
		expect(validateBooking(form({ fees: 'yes', feeAmount: '25' }))).toMatchObject({ ok: true });
	});

	it('rejects a malformed email and over-long fields', () => {
		expect(validateBooking(form({ email: 'not-an-email' }))).toMatchObject({ ok: false });
		expect(validateBooking(form({ details: 'x'.repeat(3001) }))).toMatchObject({ ok: false });
	});

	it('drops follow-up answers that do not apply', () => {
		const result = validateBooking(form({ otherType: 'stray', feeAmount: '99' }));
		expect(result.ok && result.booking.otherType).toBe('');
		expect(result.ok && result.booking.feeAmount).toBe('');
	});
});

describe('bookingEmail', () => {
	const booking = (overrides: Record<string, string> = {}) => {
		const result = validateBooking(form(overrides));
		if (!result.ok) throw new Error(result.error);
		return result.booking;
	};

	it('replies to the requester and names the request in the subject', () => {
		const email = bookingEmail(booking(), new Date('2026-11-02T15:00:00Z'));
		expect(email.replyTo).toEqual({ email: 'sam@example.org', name: 'Sam Rivera' });
		expect(email.subject).toBe(
			'Book a Visit request: Community-Based Engagement: Mascot Appearance (Sam Rivera, Maple Daycare)',
		);
		expect(email.text).toContain('Any weekday morning in March');
		expect(email.text).toContain('November 2, 2026'); // received, in Toronto time
	});

	it('escapes HTML from the form', () => {
		const email = bookingEmail(booking({ details: '<script>alert(1)</script>' }), new Date());
		expect(email.html).not.toContain('<script>');
		expect(email.html).toContain('&lt;script&gt;');
	});

	it('keeps the subject on one line', () => {
		const email = bookingEmail(booking({ name: 'Sam\r\nBcc: someone@example.com' }), new Date());
		expect(email.subject).not.toMatch(/[\r\n]/);
	});
});
