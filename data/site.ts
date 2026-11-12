// Contact details used across the site. Change them here and every link updates.

export const WA_NUMBER = '919737106333'; // digits only, with country code, for wa.me links
export const PHONE_DISPLAY = '+91 97371 06333';
export const PHONE_TEL = '+919737106333';
export const EMAIL = 'info@businesspositiveglobal.com';

export const waLink = (text?: string) =>
  `https://wa.me/${WA_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`;