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
	{ name: 'Jezeth Esmas', role: 'Community Development Coordinator', org: 'SAC Brant', headshot: jezeth },
	{ name: 'Alex Klapwyk', role: 'Placement Student, Child and Youth Worker', org: 'SAC Brant', headshot: alex },
	{ name: 'Misty Greene', role: 'Child and Youth Counsellor', org: 'Ganohkwasra', headshot: misty },
	{ name: 'Ashley Maracle-Hill', role: 'Team Member', org: 'Ganohkwasra', headshot: null },
	{ name: 'Dr. Marcia Oliver', role: 'Associate Professor, Law & Society', org: 'Wilfrid Laurier University', headshot: marcia },
	{ name: 'Wonu Oluwo', role: 'Research and Placement Student, Event Planner', org: 'Wilfrid Laurier University', headshot: null },
	{ name: 'Kasey Politano', role: 'Research Assistant, Community Development Coordinator', org: 'Wilfrid Laurier University', headshot: kasey },
	{ name: 'Dr. Jennifer Root', role: 'Associate Professor & Associate Dean (BSW)', org: 'Wilfrid Laurier University', headshot: jenn },
];

export const initials = (name: string) =>
	name
		.replace(/^Dr\.\s+/, '')
		.split(' ')
		.map((part) => part[0])
		.slice(0, 2)
		.join('');
