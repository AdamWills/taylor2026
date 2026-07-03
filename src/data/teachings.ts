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

export interface Teaching {
	slug: string;
	title: string;
	image: ImageMetadata | null;
	pdf: string;
}

/** Spec order — content PDF "Taylor's Teachings" list. Images exist for 5 of 10;
 * the rest arrive with the new illustration batch (see docs/REQUIREMENTS.md). */
export const teachings: Teaching[] = [
	{ slug: 'my-body-belongs-to-me', title: 'My body belongs to me!!', image: null, pdf: myBodyPdf },
	{ slug: 'healthy-body', title: 'I have the right to a healthy body!!', image: null, pdf: healthyBodyPdf },
	{ slug: 'safe-body', title: 'I have the right to a safe body!!', image: safeBody, pdf: safeBodyPdf },
	{ slug: 'safe-school', title: 'I have the right to a safe school!!', image: safeSchool, pdf: safeSchoolPdf },
	{ slug: 'safe-community', title: 'I have the right to a safe community!!', image: null, pdf: safeCommunityPdf },
	{ slug: 'talk-to-someone', title: "I have the right to talk to someone when I don't feel safe!!", image: null, pdf: talkToSomeonePdf },
	{ slug: 'safe-online', title: 'I have the right to be safe online!!', image: safeOnline, pdf: safeOnlinePdf },
	{ slug: 'be-myself', title: 'I have the right to be myself!!', image: beMyself, pdf: beMyselfPdf },
	{ slug: 'proud-of-my-family', title: 'I have the right to be proud of my family!!', image: proudFamily, pdf: proudFamilyPdf },
	{ slug: 'cared-for-during-emergencies', title: 'I have the right to be cared for during emergencies!!', image: null, pdf: emergenciesPdf },
];

const featured = ['safe-online', 'safe-school', 'be-myself'];
export const featuredTeachings = featured.map(
	(slug) => teachings.find((t) => t.slug === slug)!,
);
