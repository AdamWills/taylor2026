import carrie from '../assets/team/carrie-sinkowski.jpg';
import katie from '../assets/team/katie-sinkowski.jpg';
import john from '../assets/team/john-sinkowski.jpg';
import jean from '../assets/team/jean-sinkowski.jpg';
import jezeth from '../assets/team/jezeth-esmas.jpg';
import alex from '../assets/team/alex-klapwyk.jpg';
import misty from '../assets/team/misty-greene.jpg';
import marcia from '../assets/team/marcia-oliver.jpg';
import kasey from '../assets/team/kasey-politano.png';
import jenn from '../assets/team/jenn-root.jpg';

export interface Person {
	name: string;
	role: string;
	org: 'SAC Brant' | 'Ganohkwasra' | 'Wilfrid Laurier University' | 'Program Creators';
	headshot: ImageMetadata | null;
	/** Bio paragraphs. Empty until the client sends one. */
	bio?: string[];
	/** "Tales with Taylor" story (creators). */
	tale?: string;
	/** "Daily reminder" quote (staff). */
	dailyReminder?: string;
}

/** Roles, orgs, and bios from docs/Website Contents - Taylor the Turtle_v1.pdf,
 * with the copy fixes agreed in AW-22. */
export const team: Person[] = [
	{
		name: 'Carrie Sinkowski', role: "Program Founder (aka Taylor's Mom)", org: 'Program Creators', headshot: carrie,
		bio: ['A long-time community developer, Carrie’s passion for community started early: growing up in her grandfather’s store and surrounded by care and connection. That same spirit helped bring Taylor the Turtle to life.'],
		tale: 'Carrie has so many favourite times with Taylor! Creating the program with her family and community colleagues would be the top highlight. There are so many stories from when Taylor was out and about in classrooms, summer camps, and community events that make her smile.',
	},
	{
		name: 'Katie Sinkowski', role: 'Graphic Designer', org: 'Program Creators', headshot: katie,
		bio: ['Katie Sinkowski is a Registered Graphic Designer with over two decades of experience bringing creative ideas to life!'],
		tale: 'Katie’s favourite memory of Taylor is creating the Taylor stuffies. Watching her kids play with their own mini-Taylors made it especially meaningful. She says, “It was a pretty memorable moment to watch my design come to life like that!”',
	},
	{
		name: 'John Sinkowski', role: 'Artist and Co-Creator', org: 'Program Creators', headshot: john,
		bio: [
			'John Sinkowski has recently retired after working for over 50 years at Stoney’s Home Hardware in Port Dover!',
			'He received the industry’s “Golden Hammer” to recognize his contribution to the hardware industry. During his time at Stoney’s he volunteered with the Port Dover Fire Department working in both fire suppression and fire safety education. John was a member of a provincial committee that worked together to bring “Risk Watch”, a children’s safety program, to Canada.',
		],
		tale: 'A love and passion for art and drawing, combined with his experiences in community work, led to his participation in creating the Taylor the Turtle program with his two daughters. He describes Taylor as being an exciting part of his life. Two of his favourite memories of working with Taylor include the launch party at Woodland Cultural Centre, and the creation of the storybook, “The Riverbank Project”. Though perhaps his favourite memory was seeing Taylor brought to life in stuffy form, and witnessing the smiles those turtles bring for little ones.',
	},
	{
		name: 'Jean Sinkowski', role: "Curriculum Consultant (aka Taylor's Nan)", org: 'Program Creators', headshot: jean,
		bio: ['Jean Sinkowski is a retired primary teacher and has been a caring consultant for the Taylor the Turtle program, helping ensure the curriculum remains developmentally appropriate and engaging for children of all ages.'],
		tale: 'Jean’s favourite memory is the excitement of Taylor’s launch in 2010, and watching the program continue to grow and expand throughout the years. Her care, knowledge, and dedication have helped shape the program that families and communities know today.',
	},
	{
		name: 'Jezeth Esmas', role: 'Community Development Coordinator', org: 'SAC Brant', headshot: jezeth,
		bio: [
			'Jezeth Esmas connects community members with tools and support to help children (and adults!) learn about their body rights, how to express their feelings, and feel safe. She’s passionate about building strong, caring networks where everyone can grow and thrive.',
			'Her work blends digital innovation, community engagement, and consent education to help children, youth, and families build confidence, safety awareness, and self-expression.',
		],
		dailyReminder: 'I am becoming the kind of person who I would love to meet.',
	},
	{
		name: 'Alex Klapwyk', role: 'Placement Student, Child and Youth Worker', org: 'SAC Brant', headshot: alex,
		bio: [
			'Alex Klapwyk first joined SAC Brant as a placement student through Laurier and returned to us through Canada Summer Jobs. She’s been a great addition to the Taylor the Turtle team, bringing optimism and all the fun while diving headfirst into the community to spread awareness about Taylor’s Rights. We like to say she’s even developed a bit of an alter ego!',
			'Alex is currently studying for her Bachelor’s in Social Work, and loves reading and spending time outdoors.',
		],
		dailyReminder: 'Wake up every morning with the thought that something wonderful is about to happen.',
	},
	{
		name: 'Misty Greene', role: 'Child and Youth Counsellor', org: 'Ganohkwasra', headshot: misty,
		bio: [
			'Misty Greene is a proud community member of Six Nations. She loves working with the children at her organization and is looking forward to the upcoming year as a representative for Taylor the Turtle at Ganohkwasra.',
			'As part of the Taylor the Turtle team, Misty brings care, cultural connection, and a deep love for working with children, supporting them every step of the way.',
		],
		dailyReminder: 'Every day is a brand-new day for us to begin a new journey.',
	},
	{ name: 'Ashley Maracle-Hill', role: 'Team Member', org: 'Ganohkwasra', headshot: null },
	{
		name: 'Dr. Marcia Oliver', role: 'Associate Professor, Law & Society', org: 'Wilfrid Laurier University', headshot: marcia,
		bio: [
			'As a researcher, Marcia Oliver strives for ethical, community-engaged, social justice-oriented research. She’s worked on a range of projects, including other collaborations with SAC Brant and a recent study on the impacts of trafficking laws on shaping sex workers’ lives and working conditions. Marcia is also part of the co-director team leading the Walls to Bridges program in support of transformative prison education. She’s not a fan of symmetry, but is quite fond of people with sass, and she’s so grateful for the communities in her life that bring her hope and joy in the world.',
		],
	},
	{ name: 'Wonu Oluwo', role: 'Research and Placement Student, Event Planner', org: 'Wilfrid Laurier University', headshot: null },
	{
		name: 'Kasey Politano', role: 'Research Assistant, Community Development Coordinator', org: 'Wilfrid Laurier University', headshot: kasey,
		bio: [
			'Kasey Politano holds a Master of Arts in Social Justice and Community Engagement and has spent over ten years working in sexual and gender-based violence across research, shelter, counselling, post-secondary, and community coordination settings. She is committed to survivor-centred, intersectional practice and believes that supporting people who have experienced harm means taking seriously the systems that shape their lives.',
			'Her work focuses on community development, gender equity, and violence prevention through education, research, and advocacy.',
		],
	},
	{
		name: 'Dr. Jennifer Root', role: 'Associate Professor & Associate Dean (BSW)', org: 'Wilfrid Laurier University', headshot: jenn,
		bio: [
			'Jenn Root’s approach to research and community work is rooted in principles of intersectional feminisms and anti-oppressive practices. Prior to joining Laurier and the Brantford/Brant communities, Jenn worked as a social worker alongside various communities in southwestern Ontario and the Midwest US supporting anti-violence prevention and intervention work, primarily on issues related to women’s experiences of intimate partner violence, gender-based violence, and sexual violence. Over the past 10 years, she’s been lucky enough to work alongside Joanna Brant (Executive Director) and the amazing folks at SAC Brant, and most recently, supporting all things Taylor the Turtle.',
		],
	},
];

export const initials = (name: string) =>
	name
		.replace(/^Dr\.\s+/, '')
		.split(' ')
		.map((part) => part[0])
		.slice(0, 2)
		.join('');
