import { sanityClient } from 'sanity:client';
import { createImageUrlBuilder } from '@sanity/image-url';

export interface AlbumPhoto {
	caption?: string;
	asset: {
		_id: string;
		metadata: { dimensions: { width: number; height: number; aspectRatio: number }; lqip?: string };
	};
	hotspot?: { x: number; y: number };
	crop?: { top: number; bottom: number; left: number; right: number };
}

export interface Album {
	_id: string;
	title: string;
	slug: string;
	date: string;
	location?: string;
	description?: string;
	photos: AlbumPhoto[];
}

/** Safeguarding filter is part of the query: albums without photo consent
 * confirmed never leave the Content Lake. Spec §Part 3. */
const ALBUMS_QUERY = `*[
	_type == "album" &&
	consentOnFile == true &&
	defined(slug.current) &&
	count(photos) > 0
] | order(date desc) {
	_id,
	title,
	"slug": slug.current,
	date,
	location,
	description,
	photos[] {
		caption,
		hotspot,
		crop,
		asset-> { _id, metadata { dimensions, lqip } }
	}
}`;

/** Build-time fetch. Before the real Sanity project is configured
 * (PUBLIC_SANITY_PROJECT_ID unset — see .env.example) this fails fast and the
 * gallery renders its empty state instead of failing the build. */
export async function getAlbums(): Promise<Album[]> {
	// No project configured yet: skip the network entirely rather than fail —
	// a dead connection attempt can emit late socket errors that crash the build.
	if (sanityClient.config().projectId === 'placeholder') {
		console.warn('[photos] PUBLIC_SANITY_PROJECT_ID not set; rendering empty gallery');
		return [];
	}
	try {
		return await sanityClient.fetch<Album[]>(ALBUMS_QUERY);
	} catch (error) {
		console.warn(`[photos] Sanity fetch failed, rendering empty gallery: ${error instanceof Error ? error.message : error}`);
		return [];
	}
}

const builder = createImageUrlBuilder(sanityClient);

/** Always emit transformed URLs with an explicit width — the transformation
 * re-encode is what strips EXIF (incl. GPS) from what we serve. Never link the
 * bare asset URL. Spec §Part 3 safeguarding notes. */
export function photoUrl(photo: AlbumPhoto, width: number): string {
	return builder.image(photo).width(width).fit('max').auto('format').url();
}

/** Square-cropped variant for grid cards; honours the Studio hotspot. */
export function photoThumbUrl(photo: AlbumPhoto, size: number): string {
	return builder.image(photo).width(size).height(size).fit('crop').auto('format').url();
}

export const formatAlbumDate = (date: string) =>
	new Intl.DateTimeFormat('en-CA', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date));
