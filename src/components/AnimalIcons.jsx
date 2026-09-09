import React from 'react';

/**
 * Icon Ayam (Rooster / Chicken)
 * Menampilkan jengger khas di kepala, paruh, gelambir (wattle), dan ekor ayam.
 */
export const IconAyam = ({ size = 26, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Jengger Ayam (Comb) */}
    <path d="M10 2.5c-.8-.2-1.6.4-1.6 1.2 0 .5.3.9.7 1.1-.9.1-1.6.8-1.6 1.7 0 .4.2.8.5 1.1" strokeWidth="1.6" fill={color} fillOpacity="0.25" />
    {/* Kepala & Paruh */}
    <path d="M8.5 7.6h4.5l3.2 1.8-3.2 1.6h-.5" fill={color} fillOpacity="0.25" />
    {/* Mata */}
    <circle cx="11" cy="7.8" r="0.75" fill={color} />
    {/* Gelambir (Wattle) */}
    <path d="M12.5 11c0 1.2-.8 2-1.8 1.8" fill={color} fillOpacity="0.3" />
    {/* Dada & Badan */}
    <path d="M8 7.6c-2.8 0-4.8 2.2-4.8 5 0 3.2 2.2 5.8 6 5.8 4 0 6.8-2.6 6.8-6v-1.8" />
    {/* Bulu Ekor Melengkung ke Atas */}
    <path d="M3.2 11.5C2 9.5 2 6.8 4 4.8c.8 2 1.2 4.2.5 6.7z" fill={color} fillOpacity="0.2" />
    <path d="M5.5 9.5c0-2.5 1-4.2 2.5-5.5" />
    {/* Sayap */}
    <path d="M7.8 13.5c1.8-1 4.2-1 5.4 1-1.2 2-3.4 2-5.4 1z" fill={color} fillOpacity="0.15" />
    {/* Kaki */}
    <path d="M9.5 18.4v2.8m-1.5 0h3" />
  </svg>
);

/**
 * Icon Bebek (Duck)
 * Menampilkan paruh bebek pipih mendatar (spatula duck bill), kepala bulat, dan ekor melengkung.
 */
export const IconBebek = ({ size = 26, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Paruh Bebek Pipih Khas (Duck Bill) */}
    <path d="M14 7.5h4.2c1.2 0 1.8.7 1.8 1.4 0 .9-.9 1.5-2.2 1.5H13" fill={color} fillOpacity="0.28" />
    {/* Kepala & Leher */}
    <path d="M14 7c0-2.4-1.8-4.2-4.2-4.2S5.6 4.6 5.6 7c0 1.5.8 2.8 2 3.5v2.2" />
    {/* Mata */}
    <circle cx="11.2" cy="6.2" r="0.75" fill={color} />
    {/* Badan Bebek Berenang / Duduk */}
    <path d="M7.6 12.7c-3.6 0-5.8 2-5.8 5 0 2.6 2.4 4.3 6.4 4.3h7.5c3.5 0 5.5-1.8 5.5-4 0-1.5-.9-2.6-2.2-3.2-1.5-.7-3.2-.9-5.8-.9H7.6z" />
    {/* Sayap Bebek */}
    <path d="M7 16c2.5-1.2 5.5-1.2 7.5 1-2 1.6-5 1.8-7.5 0z" fill={color} fillOpacity="0.18" />
    {/* Ekor Bebek Melengkung ke Atas */}
    <path d="M19.5 17.5c1.2-.5 2-1.8 1.8-3.2" />
  </svg>
);

/**
 * Icon Puyuh (Quail)
 * Menampilkan jambul khas melengkung ke depan (topknot crest) dan badan bulat gemuk.
 */
export const IconPuyuh = ({ size = 26, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Jambul Khas Burung Puyuh (Curved Topknot Plume) */}
    <path d="M10.8 5.2c.4-2.4 2.2-3.4 3.8-2.5 1 .6.5 2-.8 2.2-1 .2-2 .1-3 .3z" fill={color} fillOpacity="0.4" />
    {/* Kepala & Paruh Mungil */}
    <path d="M10.8 5.2c-2 0-3.6 1.4-3.6 3.4 0 1 .4 1.8 1 2.4" />
    <path d="M10.8 7.2h2l2 1.2-2 1.2h-1" fill={color} fillOpacity="0.25" />
    {/* Mata */}
    <circle cx="9.8" cy="7.6" r="0.75" fill={color} />
    {/* Badan Bulat Khas Burung Puyuh */}
    <path d="M8.2 11C4.8 12 3 14.4 3 17c0 2.6 2.5 4.5 7.5 4.5 5 0 9.2-2 10.2-5.2.5-1.6-.4-3.2-2.2-4.2-2.2-1.1-5-1.4-7.5-1.4" />
    {/* Corak Sayap Puyuh */}
    <path d="M6.8 15.5c2-1 5.2-1 7.2 1.4-1.8 1.4-4.8 1.4-7.2 0z" fill={color} fillOpacity="0.18" />
    <path d="M8.2 18c1.5-.6 3.4-.6 4.8.8" strokeWidth="1.2" />
  </svg>
);

/**
 * Icon Kalkun (Turkey)
 * Menampilkan ekor mekar besar berbentuk kipas (fan tail) dan kepala kalkun dengan pial (snood).
 */
export const IconKalkun = ({ size = 26, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Ekor Kipas Besar Khas Kalkun (Fan Tail Feathers) */}
    <path d="M3.5 14C2.5 10 3.5 6.5 6.5 4c2.8-2.4 8.2-2.4 11 0 3 2.5 4 6 3 10" strokeDasharray="1.8 1.8" />
    <path d="M5.2 13C4.5 10.2 5.5 7.5 7.5 5.5c2.2-2 6.8-2 9 0 2 2 3 4.7 2.3 7.5" fill={color} fillOpacity="0.15" />
    {/* Kepala & Pial Kalkun (Snood) */}
    <circle cx="12" cy="10.5" r="2.2" fill={color} fillOpacity="0.25" />
    <path d="M13.2 10.5l2 .8-2 .8" />
    <circle cx="11.5" cy="10.2" r="0.65" fill={color} />
    <path d="M12.5 12.2c0 1.6-.8 2.8-1.6 2.8" strokeWidth="2.2" />
    {/* Tubuh Bulat Besar */}
    <path d="M8 14.5c-1.8 1-2.5 2.5-2.5 4.5 0 2 2 3.5 6.5 3.5s6.5-1.5 6.5-3.5c0-2-.7-3.5-2.5-4.5" />
    {/* Kaki */}
    <path d="M10 22.5v1m4-1v1" strokeWidth="1.6" />
  </svg>
);

/**
 * Icon Angsa (Goose / Swan)
 * Menampilkan leher panjang jenjang melengkung anggun berbentuk 'S'.
 */
export const IconAngsa = ({ size = 26, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Kepala & Paruh Angsa */}
    <path d="M13.5 3c1.6 0 2.6 1 2.6 2.2 0 .8-.5 1.5-1.3 1.8l3 1.2-3 1.1" fill={color} fillOpacity="0.25" />
    <circle cx="13.8" cy="4.8" r="0.75" fill={color} />
    {/* Leher Jenjang S-Curve Angsa */}
    <path d="M13.5 3c-1.6 0-2.7 1.2-2.7 2.6 0 2 2.2 3.6 2.2 6.2 0 2-1.6 3.6-3.8 3.6H7" />
    <path d="M15 7.2c.6 1.6.6 3.4-.3 4.8-.8 1.5-1.9 2.5-1.9 3.6" />
    {/* Tubuh Angsa Mengapung Anggun */}
    <path d="M7 15.4c-3 0-5 1.8-5 4.2 0 2 2 2.4 6 2.4h8.2c3.5 0 6-1.4 6-3.8 0-1.5-1.2-2.7-2.6-3.1-2-.6-4.6-.7-7.2-.7" />
    {/* Sayap Angsa */}
    <path d="M8 17.6c2.5-1.4 6-1.4 8.6.6-2.6 1.4-6.1 1.6-8.6-.6z" fill={color} fillOpacity="0.18" />
    {/* Ekor Terangkat */}
    <path d="M19.8 18c1-.6 1.8-1.6 1.4-3" />
  </svg>
);

/**
 * Icon Kustom (Sliders / Settings)
 */
export const IconKustom = ({ size = 26, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);
