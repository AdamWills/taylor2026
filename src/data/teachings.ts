import myBody from '../assets/MyBodyBelongsToMe.png';
import safeBody from '../assets/IHaveTheRighToASafeBody.png';
import safeSchool from '../assets/IHaveTheRighToASafeSchool.png';
import beMyself from '../assets/IHaveTheRighToBeMyself.png';
import proudFamily from '../assets/IHaveTheRighToBeProudOfMyFamily.png';
import safeOnline from '../assets/IHaveTheRighToBeSafeOnline.png';

import myBodyPdf from '../assets/colour_pages/my-body-belongs-to-me.pdf?url';
import healthyBodyPdf from '../assets/colour_pages/healthy-body.pdf?url';
import safeBodyPdf from '../assets/colour_pages/safe-body.pdf?url';
import safeSchoolPdf from '../assets/colour_pages/safe-school.pdf?url';
import safeCommunityPdf from '../assets/colour_pages/safe-community.pdf?url';
import talkToSomeonePdf from '../assets/colour_pages/talk-to-someone.pdf?url';
import safeOnlinePdf from '../assets/colour_pages/safe-online.pdf?url';
import beMyselfPdf from '../assets/colour_pages/be-myself.pdf?url';
import proudFamilyPdf from '../assets/colour_pages/proud-of-my-family.pdf?url';
import emergenciesPdf from '../assets/colour_pages/cared-for-during-emergencies.pdf?url';

import myBodyBelongsToMeThumb from '../assets/colour_pages/thumbnails/my-body-belongs-to-me.png';
import healthyBodyThumb from '../assets/colour_pages/thumbnails/healthy-body.png';
import safeBodyThumb from '../assets/colour_pages/thumbnails/safe-body.png';
import safeSchoolThumb from '../assets/colour_pages/thumbnails/safe-school.png';
import safeCommunityThumb from '../assets/colour_pages/thumbnails/safe-community.png';
import talkToSomeoneThumb from '../assets/colour_pages/thumbnails/talk-to-someone.png';
import safeOnlineThumb from '../assets/colour_pages/thumbnails/safe-online.png';
import beMyselfThumb from '../assets/colour_pages/thumbnails/be-myself.png';
import proudOfMyFamilyThumb from '../assets/colour_pages/thumbnails/proud-of-my-family.png';
import caredForDuringEmergenciesThumb from '../assets/colour_pages/thumbnails/cared-for-during-emergencies.png';

import myBodyBelongsToMeLine from '../assets/teachings-line/my-body-belongs-to-me.png';
import healthyBodyLine from '../assets/teachings-line/healthy-body.png';
import safeBodyLine from '../assets/teachings-line/safe-body.png';
import safeSchoolLine from '../assets/teachings-line/safe-school.png';
import safeCommunityLine from '../assets/teachings-line/safe-community.png';
import talkToSomeoneLine from '../assets/teachings-line/talk-to-someone.png';
import safeOnlineLine from '../assets/teachings-line/safe-online.png';
import beMyselfLine from '../assets/teachings-line/be-myself.png';
import proudOfMyFamilyLine from '../assets/teachings-line/proud-of-my-family.png';
import caredForDuringEmergenciesLine from '../assets/teachings-line/cared-for-during-emergencies.png';

export interface Teaching {
	slug: string;
	title: string;
	image: ImageMetadata | null;
	pdf: string;
	/** Colouring-sheet preview, used on /colouring and as the stand-in until the full-colour art arrives. */
	thumbnail: ImageMetadata;
	/** The colouring sheet's drawing alone (caption cropped, paper transparent, lines in forest).
	 * /teachings uses these for all ten until every teaching has full-colour art (AW-17). */
	lineArt: ImageMetadata;
}

/** Spec order, per the content PDF "Taylor's Teachings" list. Images exist for 6 of 10;
 * the rest arrive with the new illustration batch (see docs/REQUIREMENTS.md). */
export const teachings: Teaching[] = [
	{ slug: 'my-body-belongs-to-me', title: 'My body belongs to me!!', image: myBody, pdf: myBodyPdf, thumbnail: myBodyBelongsToMeThumb, lineArt: myBodyBelongsToMeLine },
	{ slug: 'healthy-body', title: 'I have the right to a healthy body!!', image: null, pdf: healthyBodyPdf, thumbnail: healthyBodyThumb, lineArt: healthyBodyLine },
	{ slug: 'safe-body', title: 'I have the right to a safe body!!', image: safeBody, pdf: safeBodyPdf, thumbnail: safeBodyThumb, lineArt: safeBodyLine },
	{ slug: 'safe-school', title: 'I have the right to a safe school!!', image: safeSchool, pdf: safeSchoolPdf, thumbnail: safeSchoolThumb, lineArt: safeSchoolLine },
	{ slug: 'safe-community', title: 'I have the right to a safe community!!', image: null, pdf: safeCommunityPdf, thumbnail: safeCommunityThumb, lineArt: safeCommunityLine },
	{ slug: 'talk-to-someone', title: "I have the right to talk to someone when I don't feel safe!!", image: null, pdf: talkToSomeonePdf, thumbnail: talkToSomeoneThumb, lineArt: talkToSomeoneLine },
	{ slug: 'safe-online', title: 'I have the right to be safe online!!', image: safeOnline, pdf: safeOnlinePdf, thumbnail: safeOnlineThumb, lineArt: safeOnlineLine },
	{ slug: 'be-myself', title: 'I have the right to be myself!!', image: beMyself, pdf: beMyselfPdf, thumbnail: beMyselfThumb, lineArt: beMyselfLine },
	{ slug: 'proud-of-my-family', title: 'I have the right to be proud of my family!!', image: proudFamily, pdf: proudFamilyPdf, thumbnail: proudOfMyFamilyThumb, lineArt: proudOfMyFamilyLine },
	{ slug: 'cared-for-during-emergencies', title: 'I have the right to be cared for during emergencies!!', image: null, pdf: emergenciesPdf, thumbnail: caredForDuringEmergenciesThumb, lineArt: caredForDuringEmergenciesLine },
];

const featured = ['safe-online', 'safe-school', 'be-myself'];
export const featuredTeachings = featured.map(
	(slug) => teachings.find((t) => t.slug === slug)!,
);
