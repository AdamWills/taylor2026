export interface Theme {
	title: string;
	/** One-line version for the homepage intro. */
	summary: string;
	/** Full client copy for the /teachings page. */
	text: string;
}

/** "Overarching Themes" copy from the client's September 2026 email. */
export const themesIntro =
	'While each lesson focuses on one core right, Taylor’s Teachings are connected through broader themes woven throughout the entire program, including:';

export const themes: Theme[] = [
	{
		title: 'Human Rights',
		summary: 'Every child deserves safety, care, respect, and belonging, starting with “My body belongs to me.”',
		text: 'Children learn simple, powerful statements about their bodies and safety, beginning with “My body belongs to me,” and understand that every child deserves safety, care, respect, and a sense of belonging.',
	},
	{
		title: 'Body Awareness',
		summary: 'Noticing comfort, discomfort, and signs of stress in our bodies.',
		text: 'Children learn to notice physical sensations in their bodies, including comfort, discomfort, and signs of stress.',
	},
	{
		title: 'Emotional Literacy',
		summary: 'Words for feelings, so children can say when something isn’t right.',
		text: 'Naming feelings and connecting them to our bodies gives children the words to say when something isn’t right.',
	},
	{
		title: 'Expression',
		summary: 'Sharing thoughts, feelings, needs, boundaries, and identities.',
		text: 'Children are encouraged to communicate their thoughts, feelings, needs, boundaries, and identities.',
	},
	{
		title: 'Safety Planning',
		summary: 'Knowing trusted adults, and that adults must listen, believe, and help.',
		text: 'Children identify trusted adults and practise asking for help, while learning that adults are responsible for listening, believing them, and helping keep them safe.',
	},
	{
		title: 'Well-Being',
		summary: 'Care, belonging, joy, rest, play, and cultural connection.',
		text: 'Children learn about the importance of care, belonging, connection, joy, rest, play, cultural connection, and supportive relationships.',
	},
	{
		title: 'Strength and Support',
		summary: 'Honouring children’s courage, and never leaving them to face harm alone.',
		text: 'Recognizing the courage, knowledge, creativity, and connection children bring to their lives and communities, while making sure they are believed, protected, cared for, and never left to face harm alone.',
	},
	{
		title: 'Community Care',
		summary: 'Caring, inclusive communities where adults protect children.',
		text: 'Children learn that they can contribute to caring and inclusive communities, and that adults and communities are responsible for protecting children and responding when harm occurs.',
	},
];
