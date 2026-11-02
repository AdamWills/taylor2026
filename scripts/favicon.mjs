// Regenerates the favicon set in public/ from Taylor's head in the backpack
// illustration: node scripts/favicon.mjs src/assets/cast/taylor-backpack.png public
import { createRequire } from 'node:module';
const sharp = createRequire(process.cwd() + '/')('sharp');
import { writeFileSync } from 'node:fs';
const [src, out] = process.argv.slice(2);
const D = 470; // canvas size
// Tight crop of the head and neck. The bottom-left corner holds a sliver of the
// waving hand, which is erased; the flat cut at the neck sits below the disc's
// edge, so the clip hides it and Taylor peeks up from the bottom.
const CH = 470; // source crop height: head, neck and collar
const W = 340, H = Math.round((CH / 440) * W);
const eraser = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="440" height="470"><rect x="0" y="384" width="52" height="86"/></svg>');
const crop = await sharp(src).extract({ left: 186, top: 0, width: 440, height: CH })
	.composite([{ input: eraser, blend: 'dest-out' }]).png().toBuffer();
const scaled = await sharp(crop).resize(W, H).png().toBuffer();
const head = await sharp({ create: { width: D, height: D, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
	.composite([{ input: scaled, left: Math.round((D - W) / 2) + 10, top: D - H + 12 }]).png().toBuffer();
const disc = (fill, inset = 0) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${D}" height="${D}"><circle cx="${D/2}" cy="${D/2}" r="${D/2 - inset}" fill="${fill}"/></svg>`);
const ring = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${D}" height="${D}"><circle cx="${D/2}" cy="${D/2}" r="${D/2 - 11}" fill="none" stroke="#2e4a26" stroke-width="22"/></svg>`);
// Head on mustard, clipped to the disc, then the ring on top.
const inner = await sharp(disc('#f0b843')).composite([{ input: head }, { input: disc('#000'), blend: 'dest-in' }]).png().toBuffer();
const badge = await sharp(inner).composite([{ input: ring }]).png().toBuffer();
// Apple: the badge on a full mustard square (iOS rounds the corners itself and
// dislikes transparency), inset so the ring clears the rounded corners.
const square = await sharp({ create: { width: 560, height: 560, channels: 4, background: '#f0b843' } })
	.composite([{ input: await sharp(badge).resize(500, 500).toBuffer(), left: 30, top: 30 }]).png().toBuffer();
await sharp(badge).resize(512, 512).png().toFile(`${out}/icon-512.png`);
await sharp(badge).resize(192, 192).png().toFile(`${out}/icon-192.png`);
await sharp(square).resize(180, 180).flatten({ background: '#f0b843' }).png().toFile(`${out}/apple-touch-icon.png`);
// favicon.ico: an ICO container holding 32px and 16px PNGs.
const sizes = [32, 16];
const pngs = await Promise.all(sizes.map((s) => sharp(badge).resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach((png, i) => {
	const e = 6 + 16 * i;
	header.writeUInt8(sizes[i], e); header.writeUInt8(sizes[i], e + 1);
	header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
	header.writeUInt32LE(png.length, e + 8); header.writeUInt32LE(offset, e + 12);
	offset += png.length;
});
writeFileSync(`${out}/favicon.ico`, Buffer.concat([header, ...pngs]));
