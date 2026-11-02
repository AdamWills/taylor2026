// The Book a Visit form: its options, server-side validation, and the email SAC
// receives. Shared by src/pages/book-a-visit.astro (renders the options) and
// src/worker.ts (validates and sends), so the two cannot drift apart.
// Field list from "Updates (Oct 5, 2026) - Website Contents" (Jezeth).
//
// Pure functions only: no Workers or DOM APIs, so it is unit-tested directly.

export const REQUEST_TYPES = [
	{
		group: 'Facilitator Training',
		options: [{ value: 'facilitator-training', label: 'Facilitator Training for Staff / Service Providers' }],
	},
	{
		group: 'Community-Based Engagement',
		options: [
			{ value: 'community-event', label: 'Community Event / Tabling Opportunity' },
			{ value: 'mascot', label: 'Mascot Appearance' },
			{ value: 'info-session', label: 'Info Session for Parents & Caregivers' },
			{ value: 'teaching-with-caregivers', label: 'Teaching Engagement for Children & their Parents/Caregivers' },
			{ value: 'teaching-with-consent', label: 'Teaching Engagement for Children with Parental/Caregiver Consent' },
			{
				value: 'teaching-intellectual-disabilities',
				label: 'Teaching Engagement for Children, Youth, or Adults Living with Intellectual Disabilities',
			},
		],
	},
	{
		group: 'Speaking Engagement',
		options: [
			{ value: 'panel', label: 'Panel' },
			{ value: 'conference', label: 'Conference / Presentation' },
		],
	},
	{ group: 'Other', options: [{ value: 'other', label: 'Other' }] },
] as const;

const LABELS = new Map<string, string>(
	REQUEST_TYPES.flatMap(({ group, options }) =>
		options.map(({ value, label }) => [value, options.length === 1 ? label : `${group}: ${label}`] as const),
	),
);

/** Field names, and the longest value each accepts. */
export const LIMITS = {
	requestType: 64,
	otherType: 200,
	groupSize: 100,
	ageRange: 100,
	dates: 500,
	details: 3000,
	name: 120,
	email: 254,
	phone: 40,
	organization: 200,
	fees: 3,
	feeAmount: 40,
} as const;

export type Field = keyof typeof LIMITS;
export type Booking = Record<Field, string>;

const REQUIRED: Field[] = ['requestType', 'groupSize', 'ageRange', 'dates', 'name', 'email', 'fees'];

/** Spam trap: hidden from people, so anything in it came from a bot. */
export const HONEYPOT = 'website';

export type Validation = { ok: true; booking: Booking } | { ok: false; error: string };

/** Accepts anything with a `get(name)` method, i.e. FormData or URLSearchParams. */
export function validateBooking(form: { get(name: string): unknown }): Validation {
	const booking = {} as Booking;
	for (const field of Object.keys(LIMITS) as Field[]) {
		const raw = form.get(field);
		const value = typeof raw === 'string' ? raw.trim() : '';
		if (value.length > LIMITS[field]) return { ok: false, error: `That ${describe(field)} is too long.` };
		booking[field] = value;
	}

	for (const field of REQUIRED) {
		if (!booking[field]) return { ok: false, error: `Please fill in the ${describe(field)}.` };
	}
	if (!LABELS.has(booking.requestType)) return { ok: false, error: 'Please choose a type of booking request.' };
	if (booking.requestType === 'other' && !booking.otherType) {
		return { ok: false, error: 'Please tell us what kind of request this is.' };
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) {
		return { ok: false, error: 'Please check the email address.' };
	}
	if (booking.fees !== 'no' && booking.fees !== 'yes') {
		return { ok: false, error: 'Please tell us whether there are any fees.' };
	}
	if (booking.fees === 'yes' && !booking.feeAmount) {
		return { ok: false, error: 'Please tell us the fee amount.' };
	}
	if (booking.requestType !== 'other') booking.otherType = '';
	if (booking.fees === 'no') booking.feeAmount = '';
	return { ok: true, booking };
}

function describe(field: Field) {
	return {
		requestType: 'type of booking request',
		otherType: 'request type',
		groupSize: 'group size',
		ageRange: 'age range of participants',
		dates: 'preferred dates and times',
		details: 'extra details',
		name: 'name',
		email: 'email address',
		phone: 'phone number',
		organization: 'organization',
		fees: 'event fees question',
		feeAmount: 'fee amount',
	}[field];
}

export function requestTypeLabel(booking: Booking) {
	const label = LABELS.get(booking.requestType) ?? booking.requestType;
	return booking.requestType === 'other' ? `Other: ${booking.otherType}` : label;
}

/** The notification SAC receives. Reply-To is the requester, so staff can just reply. */
export function bookingEmail(booking: Booking) {
	const who = booking.organization ? `${booking.name}, ${booking.organization}` : booking.name;
	// Header values must stay on one line.
	const subject = `Book a Visit request: ${requestTypeLabel(booking)} (${who})`.replace(/[\r\n]+/g, ' ').slice(0, 200);

	const rows: [string, string][] = [
		['Type of request', requestTypeLabel(booking)],
		['Group size', booking.groupSize],
		['Age range', booking.ageRange],
		['Preferred dates and times', booking.dates],
		['Anything else', booking.details || '(nothing added)'],
		['Name', booking.name],
		['Email', booking.email],
		['Phone', booking.phone || '(not given)'],
		['Organization', booking.organization || '(not given)'],
		['Fees to participate', booking.fees === 'yes' ? `Yes: $${booking.feeAmount}` : 'No'],
	];

	const intro = 'A new Book a Visit request came in through taylorsrights.ca. Reply to this email to answer the requester directly.';
	const text = `${intro}\n\n${rows.map(([k, v]) => `${k}:\n${v}`).join('\n\n')}\n`;
	const html =
		`<p>${escapeHtml(intro)}</p><table cellpadding="6" style="border-collapse:collapse">` +
		rows
			.map(
				([k, v]) =>
					`<tr><th align="left" valign="top" style="white-space:nowrap">${escapeHtml(k)}</th>` +
					`<td style="white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
			)
			.join('') +
		'</table>';

	return { subject, text, html, replyTo: { email: booking.email, name: booking.name.replace(/[\r\n"]+/g, ' ') } };
}

export function escapeHtml(value: string) {
	return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
