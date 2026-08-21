// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import sanity from '@sanity/astro';
import react from '@astrojs/react';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

// Until the real Sanity project exists, builds run against a placeholder id:
// queries fail fast and the gallery renders its empty state (see src/lib/sanity.ts).
const projectId = env.PUBLIC_SANITY_PROJECT_ID || 'placeholder';
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
