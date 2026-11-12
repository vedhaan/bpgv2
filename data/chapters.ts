// Chapter data for the map. Positions are in the India map's own 612 x 696 coordinate space.
// To add real details for a city, fill in its `details` object. Any field left out is simply not shown.
// Example:
//   details: { zone: 'West Zone', area: 'Prahlad Nagar', leaders: ['Name One', 'Name Two'], members: '40+', meetings: 'Every Friday, 8 AM' }

export type Details = {
  zone?: string;
  area?: string;
  leaders?: string[];
  members?: string;
  meetings?: string;
};

export type ViewKey = 'gujarat' | 'mumbai' | 'udaipur' | 'noida';

export type City = {
  name: string;
  state: string;
  x: number;
  y: number;
  view: ViewKey;
  hq?: boolean;
  details?: Details;
};

export const CITIES: City[] = [
  { name: 'Ahmedabad', state: 'Gujarat', x: 93.4, y: 341.9, view: 'gujarat', hq: true, details: { zone: 'West Zone', area: 'Prahlad Nagar', leaders: ['Name One', 'Name Two'], members: '40+', meetings: 'Every Friday, 8 AM' } },
  { name: 'Gandhinagar', state: 'Gujarat', x: 94.8, y: 337.6, view: 'gujarat', details: {} },
  { name: 'Anand', state: 'Gujarat', x: 100.9, y: 352.6, view: 'gujarat', details: {} },
  { name: 'Surat', state: 'Gujarat', x: 98.8, y: 383.9, view: 'gujarat', details: {} },
  { name: 'Rajkot', state: 'Gujarat', x: 56.4, y: 358.4, view: 'gujarat', details: {} },
  { name: 'Amreli', state: 'Gujarat', x: 65.2, y: 374.2, view: 'gujarat', details: {} },
  { name: 'Bhavnagar', state: 'Gujarat', x: 84.6, y: 370.6, view: 'gujarat', details: {} },
  { name: 'Mumbai', state: 'Maharashtra', x: 99.8, y: 430.8, view: 'mumbai', details: {} },
  { name: 'Udaipur', state: 'Rajasthan', x: 117.2, y: 306.4, view: 'udaipur', details: {} },
  { name: 'Noida', state: 'Uttar Pradesh', x: 194.0, y: 213.7, view: 'noida', details: {} },
];

// How far the map zooms in for each group of cities (centre point and zoom factor)
export const VIEWS: Record<ViewKey | 'all', { cx: number; cy: number; k: number }> = {
  all: { cx: 306, cy: 348, k: 1 },
  gujarat: { cx: 82, cy: 358, k: 4 },
  mumbai: { cx: 100, cy: 431, k: 3 },
  udaipur: { cx: 117, cy: 306, k: 3 },
  noida: { cx: 194, cy: 214, k: 3 },
};

// States that have BPG chapters, tinted on the map
export const ACTIVE_STATES = ['gj', 'mh', 'rj', 'up'];