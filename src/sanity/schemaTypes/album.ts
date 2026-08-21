import { defineArrayMember, defineField, defineType } from 'sanity';

/** Photo album schema — spec §Part 3 of the gallery/auth design doc.
 * `consentOnFile` is a safeguarding prompt at the moment of publishing;
 * the site refuses to render albums where it is false. */
export const album = defineType({
	name: 'album',
	title: 'Photo album',
	type: 'document',
	fields: [
		defineField({
			name: 'title',
			title: 'Album title',
			type: 'string',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'slug',
			title: 'Web address',
			description: 'Auto-generated from the title — click "Generate".',
			type: 'slug',
			options: { source: 'title', maxLength: 96 },
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'date',
			title: 'Date of the visit',
			type: 'date',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'location',
			title: 'Where was it?',
			type: 'string',
		}),
		defineField({
			name: 'description',
			title: 'A sentence about the day',
			type: 'text',
			rows: 3,
		}),
		defineField({
			name: 'consentOnFile',
			title: 'I have photo consent on file for everyone pictured',
			description: 'Albums without consent confirmed will not appear on the website.',
			type: 'boolean',
			initialValue: false,
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'photos',
			title: 'Photos',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'image',
					options: { hotspot: true },
					fields: [
						defineField({ name: 'caption', title: 'Caption', type: 'string' }),
					],
				}),
			],
			validation: (rule) => rule.min(1),
		}),
	],
	orderings: [
		{
			title: 'Date, newest first',
			name: 'dateDesc',
			by: [{ field: 'date', direction: 'desc' }],
		},
	],
	preview: {
		select: { title: 'title', date: 'date', media: 'photos.0' },
		prepare({ title, date, media }) {
			return { title, subtitle: date, media };
		},
	},
});
