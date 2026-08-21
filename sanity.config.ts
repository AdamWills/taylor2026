// Configuration for the Sanity Studio embedded at /admin (see astro.config.mjs).
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './src/sanity/schemaTypes';

export default defineConfig({
	name: 'taylor-the-turtle',
	title: 'Taylor the Turtle',
	projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'placeholder',
	dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
	plugins: [structureTool()],
	schema: { types: schemaTypes },
});
