export interface CommunityEvent {
	date: Date;
	title: string;
	details: string;
}

/** PLACEHOLDER — sample entries only, so the homepage section has realistic
 * shape. Replace with real events before launch. */
export const PLACEHOLDER = true;

export const events: CommunityEvent[] = [
	{
		date: new Date('2026-07-12'),
		title: "Brantford Farmers' Market",
		details: 'Meet Taylor and pick up colouring sheets · 9am–1pm',
	},
	{
		date: new Date('2026-07-26'),
		title: 'Six Nations Community Day',
		details: "Taylor joins Ganohkwasra's family activity tent · 11am–3pm",
	},
	{
		date: new Date('2026-08-09'),
		title: 'Caring Adult Training Session',
		details: 'Facilitator training with SAC Brant · Registration required',
	},
];
