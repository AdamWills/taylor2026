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
}

/** Roles/orgs from docs/Website Contents - Taylor the Turtle_v1.pdf.
 * Full bios land on the Team page in Phase 2. */
export const team: Person[] = [
	{ name: 'Carrie Sinkowski', role: "Program Founder (aka Taylor's Mom)", org: 'Program Creators', headshot: carrie },
	{ name: 'Katie Sinkowski', role: 'Graphic Designer', org: 'Program Creators', headshot: katie },
	{ name: 'John Sinkowski', role: 'Artist and Co-Creator', org: 'Program Creators', headshot: john },
	{ name: 'Jean Sinkowski', role: "Curriculum Consultant (aka Taylor's Nan)", org: 'Program Creators', headshot: jean },
	{ name: 'Jezeth Esmas', role: 'Community Development Coordinator', org: 'SAC Brant', headshot: jezeth },
	{ name: 'Alex Klapwyk', role: 'Placement Student, Child and Youth Worker', org: 'SAC Brant', headshot: alex },
	{ name: 'Misty Greene', role: 'Child and Youth Counsellor', org: 'Ganohkwasra', headshot: misty },
	{ name: 'Ashley Maracle-Hill', role: 'Team Member', org: 'Ganohkwasra', headshot: null },
	{ name: 'Dr. Marcia Oliver', role: 'Associate Professor, Law & Society', org: 'Wilfrid Laurier University', headshot: marcia },
	{ name: 'Wonu Oluwo', role: 'Research and Placement Student, Event Planner', org: 'Wilfrid Laurier University', headshot: null },
	{ name: 'Kasey Politano', role: 'Research Assistant, Community Development Coordinator', org: 'Wilfrid Laurier University', headshot: kasey },
	{ name: 'Dr. Jennifer Root', role: 'Associate Professor & Associate Dean (BSW)', org: 'Wilfrid Laurier University', headshot: jenn },
];
