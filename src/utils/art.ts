import { Drawing } from '../types';

export function makeSvgDataUri(drawing: Drawing, size = 320) {
  const [sky, sun, ground] = drawing.palette;
  const shadowX = drawing.shadowSlot === 1 ? 94 : 205;
  const companionX = drawing.shadowSlot === 1 ? 218 : 82;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="28" fill="${sky}"/>
      <circle cx="260" cy="54" r="30" fill="${sun}"/>
      <path d="M0 235 C60 208 112 251 168 226 C226 200 260 222 320 198 L320 320 L0 320 Z" fill="${ground}"/>
      <rect x="34" y="176" width="252" height="76" rx="22" fill="rgba(255,255,255,.56)"/>
      <g transform="translate(${companionX} 130)">
        <circle cx="0" cy="-34" r="24" fill="#fff2bd"/>
        <rect x="-22" y="-9" width="44" height="70" rx="20" fill="#ffffff"/>
        <path d="M-34 8 C-58 28 -52 58 -24 50" fill="none" stroke="#4b5563" stroke-width="8" stroke-linecap="round"/>
        <path d="M34 8 C58 28 52 58 24 50" fill="none" stroke="#4b5563" stroke-width="8" stroke-linecap="round"/>
        <circle cx="-8" cy="-38" r="3" fill="#1f2937"/>
        <circle cx="8" cy="-38" r="3" fill="#1f2937"/>
        <path d="M-7 -27 Q0 -21 8 -27" fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/>
      </g>
      <g transform="translate(${shadowX} 130)">
        <circle cx="0" cy="-34" r="25" fill="#ffffff" opacity=".95"/>
        <rect x="-24" y="-8" width="48" height="74" rx="22" fill="#ffffff" opacity=".95"/>
        <path d="M-36 8 C-60 28 -54 60 -24 52" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
        <path d="M36 8 C60 28 54 60 24 52" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
        <path d="M-16 64 L-22 99" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
        <path d="M16 64 L22 99" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
      </g>
      <text x="160" y="294" text-anchor="middle" font-size="18" font-family="Arial, sans-serif" fill="#344054">mock art</text>
    </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}
