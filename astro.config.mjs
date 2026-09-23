// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import sanity from '@sanity/astro';
import react from '@astrojs/react';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

// "Taylor the Turtle" project at sanity.io/manage. The id is public (it ships
// in the browser bundle), so it is baked in; the env vars exist to point a
// build at a different project or dataset without touching code.
const projectId = env.PUBLIC_SANITY_PROJECT_ID || 'aq8y8vyq';
const dataset = env.PUBLIC_SANITY_DATASET || 'production';

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		sanity({
			projectId,
			dataset,
			useCdn: false, // build-time fetches should see fresh content
			apiVersion: '2026-08-01',
			studioBasePath: '/admin',
		}),
		react(),
	],
});
