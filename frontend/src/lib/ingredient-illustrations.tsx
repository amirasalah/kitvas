/**
 * Ingredient Illustration Mapping
 *
 * Maps ingredient names to inline SVG illustrations.
 * Includes food-family fallbacks for unmapped ingredients
 * (e.g., "yuzu" → citrus → lemon illustration).
 *
 * ~55 unique SVG illustrations covering all major food categories.
 * ~150+ direct ingredient-name mappings.
 * ~250+ family fallback mappings for long-tail ingredients.
 */

import React from 'react';

type SvgProps = { className?: string };

// ─── Inline SVG Illustrations ──────────────────────────────────

// FRUITS

const Tomato = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <ellipse cx="32" cy="36" rx="22" ry="20" fill="#EF4444" />
    <ellipse cx="26" cy="30" rx="6" ry="8" fill="#F87171" opacity="0.4" />
    <path d="M28 16c1.5-3 4-5 4-5s2.5 2 4 5c-1.5 1-3 1.5-4 1.2-1-.3-2.5-.7-4-1.2z" fill="#22C55E" />
    <line x1="32" y1="11" x2="32" y2="17" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Lemon = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <ellipse cx="32" cy="34" rx="20" ry="17" fill="#FDE047" />
    <ellipse cx="28" cy="30" rx="6" ry="8" fill="#FEF08A" opacity="0.5" />
    <ellipse cx="32" cy="34" rx="14" ry="11" fill="none" stroke="#EAB308" strokeWidth="1" opacity="0.3" />
    <path d="M48 22c3-2 6-1 6-1s-1 3-3 5-4 2-4 2 -1-4 1-6z" fill="#22C55E" />
  </svg>
);

const Orange = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="34" r="22" fill="#F97316" />
    <ellipse cx="26" cy="28" rx="6" ry="8" fill="#FB923C" opacity="0.4" />
    <circle cx="32" cy="34" r="14" fill="none" stroke="#EA580C" strokeWidth="0.8" opacity="0.2" />
    <path d="M32 12c0-2 1-4 3-4" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M34 9c2 0 4 1 5 3" fill="#22C55E" stroke="#22C55E" strokeWidth="0.5" />
  </svg>
);

const Apple = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M32 14c-14-2-24 10-22 24s10 18 22 18 20-4 22-18S46 12 32 14z" fill="#DC2626" />
    <ellipse cx="24" cy="30" rx="6" ry="8" fill="#EF4444" opacity="0.4" />
    <path d="M32 14c0-6 3-10 6-10" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M36 6c2 0 4 2 5 4" fill="#22C55E" stroke="#22C55E" strokeWidth="0.5" />
  </svg>
);

const Strawberry = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M32 56c-10-4-20-16-20-28c0-6 4-10 10-10h20c6 0 10 4 10 10c0 12-10 24-20 28z" fill="#EF4444" />
    <path d="M22 18c-2-4 0-8 4-10c2 4 6 6 6 6s4-2 6-6c4 2 6 6 4 10" fill="#22C55E" />
    <circle cx="26" cy="30" r="1" fill="#FDE047" opacity="0.6" />
    <circle cx="34" cy="34" r="1" fill="#FDE047" opacity="0.6" />
    <circle cx="30" cy="42" r="1" fill="#FDE047" opacity="0.6" />
    <circle cx="38" cy="26" r="1" fill="#FDE047" opacity="0.6" />
    <circle cx="26" cy="40" r="1" fill="#FDE047" opacity="0.6" />
    <circle cx="36" cy="46" r="1" fill="#FDE047" opacity="0.6" />
  </svg>
);

const Mango = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M32 8c-16 2-24 14-22 26s12 20 22 22c10-2 20-10 22-22S48 10 32 8z" fill="#F97316" />
    <ellipse cx="28" cy="28" rx="8" ry="10" fill="#FB923C" opacity="0.4" />
    <path d="M32 8c0-2 2-4 4-4" stroke="#65A30D" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Peach = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="36" r="20" fill="#FB923C" />
    <ellipse cx="27" cy="30" rx="6" ry="8" fill="#FDBA74" opacity="0.5" />
    <path d="M32 16c0-4 2-8 6-8" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M36 10c2 0 4 1 5 3" fill="#22C55E" stroke="#22C55E" strokeWidth="0.5" />
    <path d="M32 16v4" stroke="#92400E" strokeWidth="1" opacity="0.3" />
  </svg>
);

const Banana = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M16 50c2 4 8 6 14 4c8-2 18-10 22-22s0-22-4-24c-2 0-4 2-4 6s-2 14-10 22-14 10-18 14z" fill="#FBBF24" />
    <path d="M48 8c-2 0-4 2-4 6s-2 14-10 22" fill="none" stroke="#EAB308" strokeWidth="1" opacity="0.4" />
    <path d="M16 50c-2-1-3-3-2-4" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Pineapple = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <ellipse cx="32" cy="38" rx="16" ry="20" fill="#F59E0B" />
    <path d="M20 38l8-8M28 38l8-8M36 38l8-8" stroke="#D97706" strokeWidth="1" opacity="0.3" />
    <path d="M20 44l8-8M28 44l8-8M36 44l8-8" stroke="#D97706" strokeWidth="1" opacity="0.3" />
    <path d="M26 18c-4-6-2-12 2-14" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M32 18c0-6 2-12 6-14" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M38 18c4-6 6-10 8-10" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const Coconut = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="34" r="22" fill="#92400E" />
    <path d="M32 12a22 22 0 0 1 0 44" fill="#78350F" />
    <circle cx="24" cy="28" r="2.5" fill="#57534E" />
    <circle cx="36" cy="26" r="2.5" fill="#57534E" />
    <circle cx="30" cy="36" r="2" fill="#57534E" />
  </svg>
);

const Watermelon = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M8 40a28 28 0 0 1 48 0z" fill="#22C55E" />
    <path d="M12 40a24 24 0 0 1 40 0z" fill="#DC2626" />
    <path d="M8 40h48" stroke="#15803D" strokeWidth="2" />
    <circle cx="24" cy="34" r="1.5" fill="#1E293B" />
    <circle cx="32" cy="30" r="1.5" fill="#1E293B" />
    <circle cx="40" cy="34" r="1.5" fill="#1E293B" />
    <circle cx="28" cy="38" r="1" fill="#1E293B" />
    <circle cx="36" cy="37" r="1" fill="#1E293B" />
  </svg>
);

const Cherry = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="22" cy="44" r="12" fill="#DC2626" />
    <ellipse cx="18" cy="40" rx="4" ry="5" fill="#EF4444" opacity="0.4" />
    <circle cx="42" cy="40" r="12" fill="#B91C1C" />
    <ellipse cx="38" cy="36" rx="4" ry="5" fill="#DC2626" opacity="0.4" />
    <path d="M22 32c2-12 10-20 14-22" stroke="#15803D" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M42 28c-2-10 -4-16 -6-18" stroke="#15803D" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M36 10c2 0 6 2 8 1" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const Blueberry = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="36" r="10" fill="#3B82F6" />
    <circle cx="20" cy="40" r="9" fill="#2563EB" />
    <circle cx="42" cy="42" r="8" fill="#1D4ED8" />
    <circle cx="26" cy="30" r="8" fill="#60A5FA" />
    <circle cx="38" cy="32" r="7" fill="#3B82F6" />
    <ellipse cx="24" cy="28" rx="2" ry="3" fill="#93C5FD" opacity="0.4" />
    <ellipse cx="34" cy="34" rx="2" ry="2" fill="#93C5FD" opacity="0.3" />
    <circle cx="32" cy="36" r="2" fill="#1E3A8A" opacity="0.3" />
    <circle cx="20" cy="40" r="2" fill="#1E3A8A" opacity="0.3" />
  </svg>
);

const Grape = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="24" cy="28" r="8" fill="#7C3AED" />
    <circle cx="40" cy="28" r="8" fill="#6D28D9" />
    <circle cx="32" cy="22" r="8" fill="#8B5CF6" />
    <circle cx="20" cy="40" r="8" fill="#6D28D9" />
    <circle cx="32" cy="38" r="8" fill="#7C3AED" />
    <circle cx="44" cy="40" r="8" fill="#5B21B6" />
    <circle cx="32" cy="50" r="8" fill="#6D28D9" />
    <ellipse cx="28" cy="20" rx="2" ry="3" fill="#A78BFA" opacity="0.4" />
    <path d="M32 14c0-4 2-8 4-10" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Kiwi = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <ellipse cx="32" cy="34" rx="20" ry="18" fill="#92400E" />
    <ellipse cx="32" cy="34" rx="16" ry="14" fill="#84CC16" />
    <ellipse cx="32" cy="34" rx="6" ry="5" fill="#BEF264" />
    <line x1="32" y1="20" x2="26" y2="26" stroke="#65A30D" strokeWidth="0.8" opacity="0.4" />
    <line x1="32" y1="20" x2="38" y2="26" stroke="#65A30D" strokeWidth="0.8" opacity="0.4" />
    <line x1="32" y1="48" x2="26" y2="42" stroke="#65A30D" strokeWidth="0.8" opacity="0.4" />
    <line x1="32" y1="48" x2="38" y2="42" stroke="#65A30D" strokeWidth="0.8" opacity="0.4" />
    <circle cx="26" cy="30" r="1" fill="#1E293B" opacity="0.5" />
    <circle cx="38" cy="30" r="1" fill="#1E293B" opacity="0.5" />
    <circle cx="26" cy="38" r="1" fill="#1E293B" opacity="0.5" />
    <circle cx="38" cy="38" r="1" fill="#1E293B" opacity="0.5" />
  </svg>
);

const Pomegranate = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="36" r="20" fill="#DC2626" />
    <ellipse cx="26" cy="30" rx="5" ry="6" fill="#EF4444" opacity="0.4" />
    <path d="M28 16c1-3 3-4 4-4s3 1 4 4" fill="#B91C1C" />
    <circle cx="26" cy="36" r="3" fill="#FCA5A5" opacity="0.6" />
    <circle cx="34" cy="32" r="2.5" fill="#FCA5A5" opacity="0.6" />
    <circle cx="30" cy="42" r="2.5" fill="#FCA5A5" opacity="0.6" />
    <circle cx="38" cy="40" r="2" fill="#FCA5A5" opacity="0.6" />
  </svg>
);

// VEGETABLES

const Carrot = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M32 56c-2 0-4-1-5-3L20 24c-1-3 1-6 4-6h16c3 0 5 3 4 6L37 53c-1 2-3 3-5 3z" fill="#F97316" />
    <path d="M26 24l2 12M32 22l1 14M38 24l-2 12" stroke="#EA580C" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
    <path d="M28 18c-3-4-6-8-4-10s6 0 8 4c2-4 6-6 8-4s-1 6-4 10" fill="#22C55E" />
  </svg>
);

const Onion = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <ellipse cx="32" cy="38" rx="20" ry="18" fill="#C084FC" />
    <ellipse cx="28" cy="34" rx="6" ry="8" fill="#D8B4FE" opacity="0.4" />
    <path d="M32 20c-12 0-20 8-20 18" fill="none" stroke="#A855F7" strokeWidth="1" opacity="0.3" />
    <path d="M32 20c12 0 20 8 20 18" fill="none" stroke="#A855F7" strokeWidth="1" opacity="0.3" />
    <path d="M30 20c0-4 1-8 2-10s2 6 2 10" fill="#D8B4FE" />
  </svg>
);

const Garlic = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <ellipse cx="32" cy="38" rx="18" ry="16" fill="#F5F5F4" />
    <ellipse cx="32" cy="38" rx="18" ry="16" fill="none" stroke="#D6D3D1" strokeWidth="1" />
    <path d="M24 38c0-8 3.5-14 8-14" fill="none" stroke="#D6D3D1" strokeWidth="1" />
    <path d="M40 38c0-8-3.5-14-8-14" fill="none" stroke="#D6D3D1" strokeWidth="1" />
    <path d="M32 24c0-4 0-8 0-12" stroke="#A8A29E" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M30 14c1-2 2-3 2-3s1 1 2 3" fill="#E7E5E4" />
  </svg>
);

const Mushroom = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M8 34c0-14 10.7-24 24-24s24 10 24 24H8z" fill="#92400E" />
    <path d="M14 30c2-8 8-14 18-14" fill="none" stroke="#78350F" strokeWidth="1" opacity="0.3" />
    <rect x="26" y="34" width="12" height="20" rx="4" fill="#FEF3C7" />
    <rect x="26" y="34" width="12" height="20" rx="4" fill="none" stroke="#D6D3D1" strokeWidth="1" opacity="0.5" />
  </svg>
);

const Broccoli = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="24" cy="22" r="10" fill="#22C55E" />
    <circle cx="38" cy="20" r="9" fill="#16A34A" />
    <circle cx="31" cy="14" r="9" fill="#4ADE80" />
    <circle cx="20" cy="28" r="6" fill="#15803D" />
    <circle cx="42" cy="26" r="6" fill="#15803D" />
    <rect x="28" y="30" width="8" height="22" rx="3" fill="#65A30D" />
  </svg>
);

const BellPepper = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M18 24c-2 10-1 22 4 28c4 4 12 4 20 0c5-6 6-18 4-28" fill="#EF4444" />
    <ellipse cx="28" cy="32" rx="4" ry="8" fill="#F87171" opacity="0.3" />
    <path d="M18 24c2-6 6-8 14-8s12 2 14 8" fill="#DC2626" />
    <path d="M30 16c0-4 1-8 2-10s2 6 2 10" fill="#22C55E" />
    <path d="M28 16c-1-2 0-6 2-6" stroke="#15803D" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const Eggplant = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M32 58c-8 0-14-6-16-16s0-22 4-28c2-4 6-6 12-6s10 2 12 6c4 6 6 18 4 28s-8 16-16 16z" fill="#7C3AED" />
    <ellipse cx="26" cy="28" rx="4" ry="10" fill="#8B5CF6" opacity="0.4" />
    <path d="M28 8c-2-4 0-6 4-6s6 2 4 6" fill="#22C55E" />
    <path d="M32 8c0-2 0-4 1-5" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Potato = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <ellipse cx="32" cy="36" rx="22" ry="16" fill="#D97706" />
    <ellipse cx="26" cy="32" rx="6" ry="6" fill="#F59E0B" opacity="0.3" />
    <circle cx="22" cy="34" r="1.5" fill="#92400E" opacity="0.4" />
    <circle cx="30" cy="28" r="1" fill="#92400E" opacity="0.4" />
    <circle cx="38" cy="38" r="1.5" fill="#92400E" opacity="0.4" />
    <circle cx="42" cy="32" r="1" fill="#92400E" opacity="0.4" />
  </svg>
);

const Avocado = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M32 6c-14 0-22 16-22 30c0 10 8 18 22 18s22-8 22-18C54 22 46 6 32 6z" fill="#65A30D" />
    <path d="M32 18c-8 0-12 10-12 18c0 6 5 10 12 10s12-4 12-10C44 28 40 18 32 18z" fill="#BEF264" />
    <circle cx="32" cy="34" r="8" fill="#92400E" />
    <ellipse cx="30" cy="31" rx="3" ry="4" fill="#A16207" opacity="0.4" />
  </svg>
);

const Cucumber = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <rect x="18" y="10" width="28" height="44" rx="14" fill="#22C55E" />
    <rect x="24" y="14" width="16" height="36" rx="8" fill="#4ADE80" opacity="0.3" />
    <circle cx="30" cy="22" r="1.5" fill="#15803D" opacity="0.3" />
    <circle cx="34" cy="32" r="1.5" fill="#15803D" opacity="0.3" />
    <circle cx="30" cy="42" r="1.5" fill="#15803D" opacity="0.3" />
  </svg>
);

const Corn = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M22 10c-4 10-4 22-2 32c1 4 4 8 12 10c8-2 11-6 12-10c2-10 2-22-2-32" fill="#FBBF24" />
    <path d="M22 10c-4 10-4 22-2 32" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.3" />
    <circle cx="28" cy="20" r="2" fill="#EAB308" opacity="0.5" />
    <circle cx="36" cy="22" r="2" fill="#EAB308" opacity="0.5" />
    <circle cx="28" cy="30" r="2" fill="#EAB308" opacity="0.5" />
    <circle cx="36" cy="32" r="2" fill="#EAB308" opacity="0.5" />
    <circle cx="28" cy="40" r="2" fill="#EAB308" opacity="0.5" />
    <circle cx="36" cy="42" r="2" fill="#EAB308" opacity="0.5" />
    <path d="M42 8c4 2 6 8 4 14" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M44 6c4 0 8 4 6 10" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const Spinach = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M32 56c-2-4-2-10-8-16s-14-10-14-18c0-6 4-10 10-10c4 0 8 2 12 8c4-6 8-8 12-8c6 0 10 4 10 10c0 8-8 12-14 18s-6 12-8 16z" fill="#15803D" />
    <path d="M32 56c-2-4-2-10-8-16s-14-10-14-18" fill="none" stroke="#166534" strokeWidth="1" opacity="0.4" />
    <path d="M32 56V18" stroke="#166534" strokeWidth="1" opacity="0.3" />
  </svg>
);

const Celery = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M24 56c0-14 -2-28 -2-40c0-4 2-6 4-6s4 2 4 6c0 12 0 26 0 40" fill="#4ADE80" />
    <path d="M30 56c0-14 0-28 0-40c0-4 2-6 4-6s4 2 4 6c0 12 -2 26 -2 40" fill="#22C55E" />
    <path d="M36 56c0-14 2-28 2-40c0-4 2-6 4-6s4 2 4 6c0 12 -4 26 -4 40" fill="#16A34A" />
    <path d="M22 12c-2-4 -1-8 2-8" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M44 10c2-4 3-6 5-5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Asparagus = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <rect x="18" y="16" width="5" height="40" rx="2.5" fill="#22C55E" />
    <rect x="26" y="12" width="5" height="44" rx="2.5" fill="#16A34A" />
    <rect x="34" y="14" width="5" height="42" rx="2.5" fill="#22C55E" />
    <rect x="42" y="18" width="5" height="38" rx="2.5" fill="#15803D" />
    <ellipse cx="20.5" cy="16" rx="4" ry="5" fill="#4ADE80" />
    <ellipse cx="28.5" cy="12" rx="4" ry="5" fill="#22C55E" />
    <ellipse cx="36.5" cy="14" rx="4" ry="5" fill="#4ADE80" />
    <ellipse cx="44.5" cy="18" rx="4" ry="5" fill="#15803D" />
  </svg>
);

const Peas = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M8 32c4-16 16-20 24-20s20 4 24 20c-4 16-16 20-24 20S12 48 8 32z" fill="#22C55E" />
    <ellipse cx="8" cy="32" rx="2" ry="4" fill="#16A34A" />
    <circle cx="22" cy="32" r="7" fill="#4ADE80" />
    <circle cx="36" cy="32" r="7" fill="#4ADE80" />
    <circle cx="49" cy="32" r="5" fill="#4ADE80" />
    <ellipse cx="22" cy="29" rx="2" ry="3" fill="#86EFAC" opacity="0.5" />
    <ellipse cx="36" cy="29" rx="2" ry="3" fill="#86EFAC" opacity="0.5" />
  </svg>
);

const Zucchini = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <rect x="14" y="20" width="36" height="24" rx="12" fill="#16A34A" />
    <rect x="18" y="24" width="28" height="16" rx="8" fill="#22C55E" opacity="0.3" />
    <circle cx="20" cy="32" r="1" fill="#15803D" opacity="0.4" />
    <circle cx="32" cy="28" r="1" fill="#15803D" opacity="0.4" />
    <circle cx="44" cy="34" r="1" fill="#15803D" opacity="0.4" />
    <path d="M50 32c2 0 4-1 5-3" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Cauliflower = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="24" cy="24" r="10" fill="#F5F5F4" />
    <circle cx="38" cy="22" r="9" fill="#E7E5E4" />
    <circle cx="31" cy="16" r="9" fill="#FAFAF9" />
    <circle cx="20" cy="30" r="6" fill="#D6D3D1" />
    <circle cx="42" cy="28" r="6" fill="#D6D3D1" />
    <rect x="28" y="32" width="8" height="20" rx="3" fill="#65A30D" />
    <path d="M24 38l4-4M40 36l-4-2" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Cabbage = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="34" r="22" fill="#22C55E" />
    <circle cx="32" cy="34" r="16" fill="#4ADE80" />
    <circle cx="32" cy="34" r="10" fill="#86EFAC" />
    <circle cx="32" cy="34" r="5" fill="#BBF7D0" />
    <path d="M32 12c-2 4-4 8-4 12" fill="none" stroke="#16A34A" strokeWidth="1" opacity="0.3" />
    <path d="M32 12c2 4 4 8 4 12" fill="none" stroke="#16A34A" strokeWidth="1" opacity="0.3" />
  </svg>
);

// PROTEINS

const Chicken = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M20 16c-2 4-3 10-2 16s4 14 10 18c2 1 4 1 6 0 3-3 5-8 5-14l4-4c2-2 3-6 1-8s-6-2-8 0l-4 2c-4-6-8-10-12-10z" fill="#D97706" />
    <path d="M20 16c-2 4-3 10-2 16s4 14 10 18c2 1 4 1 6 0 3-3 5-8 5-14" fill="none" stroke="#B45309" strokeWidth="1" opacity="0.3" />
    <ellipse cx="24" cy="28" rx="4" ry="6" fill="#F59E0B" opacity="0.4" />
    <circle cx="38" cy="50" r="5" fill="#92400E" />
    <circle cx="38" cy="50" r="3" fill="#78350F" />
  </svg>
);

const Beef = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M12 24c-2 6-2 14 2 20s12 10 18 12c6-2 14-6 18-12s4-14 2-20c-2-4-8-8-20-8s-18 4-20 8z" fill="#991B1B" />
    <ellipse cx="28" cy="32" rx="8" ry="10" fill="#DC2626" opacity="0.4" />
    <path d="M24 28c2-2 6-4 10-2s6 6 6 10" fill="none" stroke="#7F1D1D" strokeWidth="1.5" opacity="0.3" />
    <path d="M16 36c0 0 4 4 8 4" fill="none" stroke="#FCA5A5" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
    <path d="M40 30c2 2 4 6 4 10" fill="none" stroke="#FCA5A5" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
  </svg>
);

const Fish = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M10 32c0 0 8-16 26-16c8 0 14 6 18 16c-4 10-10 16-18 16C18 48 10 32 10 32z" fill="#06B6D4" />
    <path d="M14 32c4-8 12-12 22-12" fill="none" stroke="#0891B2" strokeWidth="1" opacity="0.3" />
    <circle cx="44" cy="30" r="3" fill="white" />
    <circle cx="45" cy="30" r="1.5" fill="#1E3A5F" />
    <path d="M4 32c4-6 6-10 6-10s-2 4-6 10c4 6 6 10 6 10s-2-4-6-10z" fill="#0891B2" />
  </svg>
);

const Shrimp = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M44 14c6 4 10 10 8 18s-10 14-20 16c-8 2-16-2-18-8s2-14 10-18" fill="#F97316" />
    <path d="M24 22c8-4 16-2 20 4s2 14-4 18" fill="none" stroke="#EA580C" strokeWidth="1.5" opacity="0.4" />
    <path d="M14 48c-2 2-2 6 0 8s6 2 8 0" stroke="#F97316" strokeWidth="2" strokeLinecap="round" fill="none" />
    <circle cx="46" cy="18" r="2" fill="#1E3A5F" />
    <path d="M48 12c2-2 4-2 6 0" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M50 14c2-2 4-2 6 0" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const Egg = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M32 8c-12 0-20 14-20 28c0 10 8 18 20 18s20-8 20-18C52 22 44 8 32 8z" fill="#FEF3C7" />
    <path d="M32 8c-12 0-20 14-20 28c0 10 8 18 20 18s20-8 20-18C52 22 44 8 32 8z" fill="none" stroke="#E5E7EB" strokeWidth="1.5" />
    <ellipse cx="28" cy="24" rx="6" ry="8" fill="white" opacity="0.5" />
  </svg>
);

const Tofu = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <rect x="12" y="18" width="40" height="28" rx="4" fill="#FEF3C7" />
    <rect x="12" y="18" width="40" height="28" rx="4" fill="none" stroke="#E5E7EB" strokeWidth="1.5" />
    <line x1="32" y1="18" x2="32" y2="46" stroke="#E5E7EB" strokeWidth="1" />
    <line x1="12" y1="32" x2="52" y2="32" stroke="#E5E7EB" strokeWidth="1" />
  </svg>
);

const Bacon = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M10 18c8 4 12-2 20 2s12 6 20 2c0 6-2 10-2 14s2 8 2 14c-8-4-12 2-20-2s-12-6-20-2c0-6 2-10 2-14s-2-8-2-14z" fill="#DC2626" />
    <path d="M14 22c6 2 10-1 16 1s10 4 16 2" stroke="#FCA5A5" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
    <path d="M14 34c6 2 10-1 16 1s10 4 16 2" stroke="#FCA5A5" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
  </svg>
);

const Crab = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <ellipse cx="32" cy="38" rx="18" ry="14" fill="#DC2626" />
    <ellipse cx="32" cy="36" rx="12" ry="8" fill="#EF4444" opacity="0.3" />
    <circle cx="24" cy="28" r="4" fill="#EF4444" />
    <circle cx="40" cy="28" r="4" fill="#EF4444" />
    <circle cx="24" cy="27" r="1.5" fill="#1E293B" />
    <circle cx="40" cy="27" r="1.5" fill="#1E293B" />
    <path d="M14 30c-4-4-6-10-4-14" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M50 30c4-4 6-10 4-14" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <circle cx="9" cy="15" r="3" fill="#DC2626" />
    <circle cx="55" cy="15" r="3" fill="#DC2626" />
  </svg>
);

// DAIRY

const Cheese = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M8 48L32 12l24 36H8z" fill="#FBBF24" />
    <path d="M8 48L32 12l24 36H8z" fill="none" stroke="#F59E0B" strokeWidth="1" />
    <circle cx="24" cy="38" r="3" fill="#F59E0B" opacity="0.5" />
    <circle cx="36" cy="42" r="2" fill="#F59E0B" opacity="0.5" />
    <circle cx="30" cy="30" r="2.5" fill="#F59E0B" opacity="0.5" />
  </svg>
);

const Butter = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <rect x="10" y="24" width="44" height="24" rx="4" fill="#FBBF24" />
    <rect x="10" y="24" width="44" height="24" rx="4" fill="none" stroke="#F59E0B" strokeWidth="1" />
    <rect x="10" y="24" width="22" height="24" rx="4" fill="#FDE047" opacity="0.4" />
    <line x1="32" y1="24" x2="32" y2="48" stroke="#F59E0B" strokeWidth="0.5" opacity="0.5" />
  </svg>
);

const Milk = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <rect x="16" y="18" width="32" height="38" rx="4" fill="#F5F5F4" />
    <rect x="16" y="18" width="32" height="38" rx="4" fill="none" stroke="#D6D3D1" strokeWidth="1.5" />
    <path d="M20 18l4-8h16l4 8" fill="#E7E5E4" stroke="#D6D3D1" strokeWidth="1" />
    <rect x="24" y="28" width="16" height="14" rx="2" fill="#DBEAFE" opacity="0.5" />
    <path d="M28 32c2 2 4 4 8 2" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const Yogurt = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M18 20h28l-4 36H22L18 20z" fill="#F5F5F4" />
    <path d="M18 20h28l-4 36H22L18 20z" fill="none" stroke="#D6D3D1" strokeWidth="1.5" />
    <rect x="16" y="16" width="32" height="6" rx="2" fill="#93C5FD" />
    <circle cx="32" cy="38" r="6" fill="#DBEAFE" opacity="0.4" />
    <path d="M28 36c2 2 4 4 8 0" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

// HERBS & SPICES

const Basil = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M32 56V20" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 20c-12-2-20 4-18 12s12 10 18 4" fill="#22C55E" />
    <path d="M32 20c12-2 20 4 18 12s-12 10-18 4" fill="#16A34A" />
    <path d="M32 32c-8-2-14 2-12 8s8 8 12 4" fill="#4ADE80" />
    <path d="M32 32c8-2 14 2 12 8s-8 8-12 4" fill="#22C55E" />
  </svg>
);

const Chili = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M22 14c-2 8-4 18 0 26s12 14 18 10c4-2 4-8 2-16s-6-16-10-20c-2-2-4-2-6 0" fill="#DC2626" />
    <path d="M22 14c-2 8-4 18 0 26" fill="none" stroke="#991B1B" strokeWidth="1" opacity="0.3" />
    <path d="M28 10c0-4 2-6 4-6s3 2 2 6" fill="#15803D" />
    <path d="M30 10c1-2 2.5-3 3.5-3" stroke="#166534" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const Ginger = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M20 30c-4-8 0-16 8-16c4 0 8 4 8 8c4-4 10-4 12 0s0 12-4 16c4 4 4 10 0 12s-12 0-16-4c-4 4-10 4-12 0s0-8 4-16z" fill="#D97706" />
    <path d="M24 30c-2-4 0-8 4-8c2 0 4 2 4 4" fill="none" stroke="#B45309" strokeWidth="1" opacity="0.3" />
  </svg>
);

const Mint = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M32 54V28" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 28c-10-6-18-2-16 6s10 10 16 4" fill="#4ADE80" />
    <path d="M32 28c10-6 18-2 16 6s-10 10-16 4" fill="#22C55E" />
    <path d="M32 18c-8-4-12 0-10 6s8 6 10 2" fill="#86EFAC" />
    <path d="M32 18c8-4 12 0 10 6s-8 6-10 2" fill="#4ADE80" />
    <path d="M32 12c-4-2-6 0-5 3s4 3 5 1" fill="#BBF7D0" />
    <path d="M32 12c4-2 6 0 5 3s-4 3-5 1" fill="#86EFAC" />
  </svg>
);

const Rosemary = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <line x1="32" y1="8" x2="32" y2="56" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="26" cy="18" rx="6" ry="3" fill="#22C55E" transform="rotate(-30 26 18)" />
    <ellipse cx="38" cy="24" rx="6" ry="3" fill="#16A34A" transform="rotate(30 38 24)" />
    <ellipse cx="25" cy="30" rx="6" ry="3" fill="#22C55E" transform="rotate(-25 25 30)" />
    <ellipse cx="39" cy="36" rx="6" ry="3" fill="#16A34A" transform="rotate(25 39 36)" />
    <ellipse cx="26" cy="42" rx="5" ry="3" fill="#4ADE80" transform="rotate(-20 26 42)" />
    <ellipse cx="38" cy="48" rx="5" ry="3" fill="#22C55E" transform="rotate(20 38 48)" />
  </svg>
);

const Cinnamon = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <rect x="10" y="22" width="44" height="8" rx="4" fill="#92400E" />
    <path d="M50 26c4 0 6 2 6 6s-4 6-8 4" stroke="#78350F" strokeWidth="2" fill="none" />
    <rect x="12" y="34" width="44" height="8" rx="4" fill="#B45309" />
    <path d="M52 38c4 0 6 2 6 6s-4 6-8 4" stroke="#92400E" strokeWidth="2" fill="none" />
    <ellipse cx="20" cy="26" rx="4" ry="2" fill="#A16207" opacity="0.3" />
    <ellipse cx="22" cy="38" rx="4" ry="2" fill="#D97706" opacity="0.3" />
  </svg>
);

const Turmeric = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M18 30c-4-8 0-16 8-16c4 0 6 4 6 8c4-4 8-4 10 0s0 12-4 16c4 4 2 10-2 12s-10-2-12-6c-4 4-8 2-10-2s0-6 4-12z" fill="#EAB308" />
    <path d="M22 30c-2-4 0-8 4-8" fill="none" stroke="#CA8A04" strokeWidth="1" opacity="0.3" />
    <ellipse cx="30" cy="32" rx="4" ry="3" fill="#FDE047" opacity="0.3" />
  </svg>
);

// GRAINS & PASTA

const Rice = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M8 32c0 0 4 20 24 20s24-20 24-20H8z" fill="#D6D3D1" />
    <path d="M8 32c0 0 4 20 24 20s24-20 24-20" fill="none" stroke="#A8A29E" strokeWidth="1.5" />
    <path d="M8 32h48" stroke="#A8A29E" strokeWidth="1.5" />
    <ellipse cx="20" cy="28" rx="3" ry="2" fill="#FAFAF9" />
    <ellipse cx="28" cy="26" rx="3" ry="2" fill="#FAFAF9" />
    <ellipse cx="36" cy="27" rx="3" ry="2" fill="#FAFAF9" />
    <ellipse cx="44" cy="29" rx="3" ry="2" fill="#FAFAF9" />
    <ellipse cx="24" cy="30" rx="3" ry="2" fill="#F5F5F4" />
    <ellipse cx="32" cy="30" rx="3" ry="2" fill="#F5F5F4" />
    <ellipse cx="40" cy="31" rx="3" ry="2" fill="#F5F5F4" />
  </svg>
);

const Pasta = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M12 20c4 8 8 16 8 24s2 12 12 12s10-4 12-12s4-16 8-24" fill="none" stroke="#EAB308" strokeWidth="3" strokeLinecap="round" />
    <path d="M18 20c2 8 4 16 4 24" fill="none" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
    <path d="M36 20c0 8 2 16 4 24" fill="none" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Bread = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M10 32c0-10 10-18 22-18s22 8 22 18v16c0 2-2 4-4 4H14c-2 0-4-2-4-4V32z" fill="#D97706" />
    <path d="M10 32c0-10 10-18 22-18s22 8 22 18" fill="#F59E0B" />
    <path d="M10 32h44" stroke="#B45309" strokeWidth="1" opacity="0.3" />
    <ellipse cx="28" cy="24" rx="8" ry="4" fill="#FBBF24" opacity="0.4" />
  </svg>
);

// CONDIMENTS & OILS

const OliveOil = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <rect x="20" y="24" width="24" height="32" rx="4" fill="#84CC16" />
    <rect x="20" y="24" width="24" height="32" rx="4" fill="none" stroke="#65A30D" strokeWidth="1" />
    <rect x="26" y="14" width="12" height="12" rx="2" fill="#A8A29E" />
    <rect x="28" y="8" width="8" height="8" rx="2" fill="#D6D3D1" />
    <ellipse cx="32" cy="42" rx="6" ry="8" fill="#A3E635" opacity="0.4" />
  </svg>
);

const SoySauce = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <rect x="20" y="20" width="24" height="36" rx="4" fill="#44403C" />
    <rect x="20" y="20" width="24" height="36" rx="4" fill="none" stroke="#292524" strokeWidth="1" />
    <rect x="26" y="10" width="12" height="12" rx="2" fill="#78716C" />
    <rect x="28" y="6" width="8" height="6" rx="2" fill="#A8A29E" />
    <rect x="24" y="32" width="16" height="12" rx="2" fill="#DC2626" opacity="0.6" />
  </svg>
);

const Honey = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M18 22c0-6 6-10 14-10s14 4 14 10v28c0 4-6 8-14 8s-14-4-14-8V22z" fill="#F59E0B" />
    <path d="M18 22c0-6 6-10 14-10s14 4 14 10" fill="#FBBF24" />
    <ellipse cx="32" cy="22" rx="14" ry="4" fill="#FDE047" opacity="0.5" />
    <path d="M18 22h28" stroke="#D97706" strokeWidth="1" opacity="0.3" />
    <rect x="24" y="30" width="16" height="10" rx="2" fill="none" stroke="#FDE047" strokeWidth="1" opacity="0.5" />
  </svg>
);

// NUTS

const Almond = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M32 8c-10 4-18 16-18 28c0 8 6 14 18 18c12-4 18-10 18-18C50 24 42 12 32 8z" fill="#D97706" />
    <path d="M32 14c-6 4-12 12-12 22" fill="none" stroke="#B45309" strokeWidth="1" opacity="0.3" />
    <ellipse cx="28" cy="30" rx="4" ry="8" fill="#F59E0B" opacity="0.3" />
  </svg>
);

const Walnut = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="34" r="20" fill="#92400E" />
    <path d="M32 14v40" stroke="#78350F" strokeWidth="1.5" />
    <path d="M12 34h40" stroke="#78350F" strokeWidth="1" opacity="0.4" />
    <ellipse cx="22" cy="28" rx="6" ry="8" fill="#A16207" opacity="0.3" />
    <ellipse cx="42" cy="28" rx="6" ry="8" fill="#A16207" opacity="0.3" />
    <path d="M20 34c4-4 8-6 12-6s8 2 12 6" fill="none" stroke="#78350F" strokeWidth="1" opacity="0.3" />
  </svg>
);

const Peanut = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <ellipse cx="32" cy="20" rx="12" ry="12" fill="#D97706" />
    <ellipse cx="32" cy="44" rx="14" ry="12" fill="#D97706" />
    <path d="M20 28c4 4 8 4 12 4s8 0 12-4" fill="none" stroke="#B45309" strokeWidth="1.5" />
    <ellipse cx="28" cy="18" rx="4" ry="4" fill="#F59E0B" opacity="0.3" />
    <ellipse cx="28" cy="42" rx="4" ry="4" fill="#F59E0B" opacity="0.3" />
  </svg>
);

// LEGUMES

const Chickpea = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="22" cy="30" r="10" fill="#D97706" />
    <circle cx="40" cy="28" r="9" fill="#B45309" />
    <circle cx="30" cy="44" r="10" fill="#D97706" />
    <circle cx="46" cy="42" r="8" fill="#B45309" />
    <ellipse cx="20" cy="28" rx="3" ry="4" fill="#F59E0B" opacity="0.3" />
    <ellipse cx="28" cy="42" rx="3" ry="4" fill="#F59E0B" opacity="0.3" />
    <path d="M22 26c-2-2-2-4 0-4" stroke="#92400E" strokeWidth="1" strokeLinecap="round" />
    <path d="M30 40c-2-2-2-4 0-4" stroke="#92400E" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// OTHER

const Chocolate = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <rect x="10" y="16" width="44" height="32" rx="4" fill="#78350F" />
    <line x1="10" y1="32" x2="54" y2="32" stroke="#92400E" strokeWidth="1" />
    <line x1="21" y1="16" x2="21" y2="48" stroke="#92400E" strokeWidth="1" />
    <line x1="32" y1="16" x2="32" y2="48" stroke="#92400E" strokeWidth="1" />
    <line x1="43" y1="16" x2="43" y2="48" stroke="#92400E" strokeWidth="1" />
    <rect x="12" y="18" width="9" height="14" rx="1" fill="#92400E" opacity="0.3" />
  </svg>
);

const Coffee = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M12 24h32v24c0 4-4 8-8 8H20c-4 0-8-4-8-8V24z" fill="#78350F" />
    <path d="M12 24h32" stroke="#57534E" strokeWidth="2" />
    <ellipse cx="28" cy="24" rx="16" ry="4" fill="#92400E" />
    <path d="M44 30c6 0 10 4 10 8s-4 8-10 8" fill="none" stroke="#78350F" strokeWidth="2.5" />
    <path d="M22 14c0-4 2-6 2-6s2 2 2 6" stroke="#A8A29E" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    <path d="M30 12c0-4 2-6 2-6s2 2 2 6" stroke="#A8A29E" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
  </svg>
);

const Salt = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <rect x="18" y="20" width="28" height="36" rx="6" fill="#F5F5F4" />
    <rect x="18" y="20" width="28" height="36" rx="6" fill="none" stroke="#D6D3D1" strokeWidth="1.5" />
    <rect x="18" y="20" width="28" height="12" rx="6" fill="#D6D3D1" />
    <circle cx="28" cy="14" r="1.5" fill="#A8A29E" />
    <circle cx="32" cy="12" r="1" fill="#A8A29E" />
    <circle cx="36" cy="14" r="1.5" fill="#A8A29E" />
    <rect x="26" y="36" width="12" height="8" rx="2" fill="#E7E5E4" />
  </svg>
);

const Sugar = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M14 20h36l-4 36H18L14 20z" fill="#FAFAF9" />
    <path d="M14 20h36l-4 36H18L14 20z" fill="none" stroke="#D6D3D1" strokeWidth="1.5" />
    <path d="M14 20h36" stroke="#D6D3D1" strokeWidth="2" />
    <rect x="24" y="30" width="16" height="10" rx="2" fill="#E7E5E4" />
    <circle cx="30" cy="16" r="1.5" fill="#E7E5E4" />
    <circle cx="34" cy="14" r="1" fill="#E7E5E4" />
  </svg>
);

const Bowl = ({ className }: SvgProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <path d="M6 28c0 0 4 24 26 24s26-24 26-24H6z" fill="#E7E5E4" />
    <path d="M6 28c0 0 4 24 26 24s26-24 26-24" fill="none" stroke="#A8A29E" strokeWidth="1.5" />
    <path d="M6 28h52" stroke="#A8A29E" strokeWidth="1.5" />
    <ellipse cx="32" cy="28" rx="26" ry="4" fill="#F5F5F4" />
  </svg>
);

// ─── Illustration Registry ─────────────────────────────────────
// Direct ingredient name → SVG component mappings (~150 entries)

const ILLUSTRATIONS: Record<string, React.FC<SvgProps>> = {
  // Fruits
  'tomato': Tomato, 'tomatoes': Tomato, 'cherry tomato': Tomato, 'cherry tomatoes': Tomato,
  'sun-dried tomato': Tomato, 'sun dried tomato': Tomato, 'roma tomato': Tomato,
  'lemon': Lemon, 'lemon juice': Lemon, 'lemon zest': Lemon,
  'lime': Lemon, 'lime juice': Lemon, 'lime zest': Lemon,
  'orange': Orange, 'orange juice': Orange, 'orange zest': Orange, 'blood orange': Orange,
  'apple': Apple, 'apples': Apple, 'green apple': Apple,
  'strawberry': Strawberry, 'strawberries': Strawberry,
  'mango': Mango, 'mangoes': Mango, 'mango puree': Mango,
  'peach': Peach, 'peaches': Peach,
  'banana': Banana, 'bananas': Banana, 'plantain': Banana,
  'pineapple': Pineapple,
  'coconut': Coconut, 'coconut milk': Coconut, 'coconut cream': Coconut,
  'coconut oil': Coconut, 'coconut flakes': Coconut, 'shredded coconut': Coconut,
  'watermelon': Watermelon,
  'cherry': Cherry, 'cherries': Cherry, 'maraschino cherry': Cherry,
  'blueberry': Blueberry, 'blueberries': Blueberry,
  'grape': Grape, 'grapes': Grape, 'raisin': Grape, 'raisins': Grape,
  'kiwi': Kiwi, 'kiwi fruit': Kiwi,
  'pomegranate': Pomegranate, 'pomegranate seeds': Pomegranate,
  'avocado': Avocado, 'avocados': Avocado, 'guacamole': Avocado,

  // Vegetables
  'carrot': Carrot, 'carrots': Carrot, 'baby carrot': Carrot, 'baby carrots': Carrot,
  'onion': Onion, 'onions': Onion, 'red onion': Onion, 'yellow onion': Onion,
  'white onion': Onion, 'sweet onion': Onion, 'shallot': Onion, 'shallots': Onion,
  'garlic': Garlic, 'garlic cloves': Garlic, 'garlic clove': Garlic,
  'minced garlic': Garlic, 'garlic powder': Garlic, 'roasted garlic': Garlic,
  'mushroom': Mushroom, 'mushrooms': Mushroom, 'shiitake': Mushroom,
  'portobello': Mushroom, 'cremini': Mushroom, 'button mushroom': Mushroom,
  'oyster mushroom': Mushroom, 'chanterelle': Mushroom, 'porcini': Mushroom,
  'enoki': Mushroom, 'king oyster mushroom': Mushroom,
  'broccoli': Broccoli, 'broccolini': Broccoli,
  'bell pepper': BellPepper, 'bell peppers': BellPepper, 'red bell pepper': BellPepper,
  'green bell pepper': BellPepper, 'yellow bell pepper': BellPepper,
  'red pepper': BellPepper, 'green pepper': BellPepper, 'sweet pepper': BellPepper,
  'capsicum': BellPepper, 'roasted pepper': BellPepper, 'roasted peppers': BellPepper,
  'eggplant': Eggplant, 'aubergine': Eggplant,
  'potato': Potato, 'potatoes': Potato, 'sweet potato': Potato, 'sweet potatoes': Potato,
  'mashed potato': Potato, 'baked potato': Potato, 'russet potato': Potato,
  'yukon gold': Potato, 'fingerling potato': Potato, 'new potatoes': Potato,
  'cucumber': Cucumber, 'cucumbers': Cucumber, 'pickle': Cucumber, 'pickles': Cucumber,
  'corn': Corn, 'corn kernels': Corn, 'sweet corn': Corn, 'corn on the cob': Corn,
  'cornmeal': Corn, 'polenta': Corn,
  'spinach': Spinach, 'baby spinach': Spinach,
  'celery': Celery, 'celery stalks': Celery, 'celery sticks': Celery,
  'asparagus': Asparagus,
  'peas': Peas, 'green peas': Peas, 'snap peas': Peas, 'snow peas': Peas,
  'sugar snap peas': Peas, 'split peas': Peas,
  'zucchini': Zucchini, 'courgette': Zucchini, 'summer squash': Zucchini,
  'cauliflower': Cauliflower, 'cauliflower florets': Cauliflower,
  'cabbage': Cabbage, 'red cabbage': Cabbage, 'napa cabbage': Cabbage,
  'sauerkraut': Cabbage, 'coleslaw': Cabbage, 'kimchi': Cabbage,

  // Proteins
  'chicken': Chicken, 'chicken breast': Chicken, 'chicken thigh': Chicken,
  'chicken thighs': Chicken, 'chicken wings': Chicken, 'chicken leg': Chicken,
  'chicken drumstick': Chicken, 'rotisserie chicken': Chicken,
  'grilled chicken': Chicken, 'fried chicken': Chicken, 'chicken tender': Chicken,
  'chicken tenders': Chicken, 'poultry': Chicken,
  'beef': Beef, 'steak': Beef, 'ground beef': Beef, 'beef stew': Beef,
  'sirloin': Beef, 'ribeye': Beef, 'tenderloin': Beef, 'brisket': Beef,
  'flank steak': Beef, 'chuck roast': Beef, 'tri-tip': Beef, 'short ribs': Beef,
  'pork': Beef, 'pork chop': Beef, 'pork loin': Beef, 'pork belly': Beef,
  'pulled pork': Beef, 'pork tenderloin': Beef, 'pork shoulder': Beef,
  'lamb': Beef, 'lamb chop': Beef, 'lamb shank': Beef, 'ground lamb': Beef,
  'veal': Beef, 'venison': Beef, 'bison': Beef,
  'turkey': Chicken, 'turkey breast': Chicken, 'ground turkey': Chicken,
  'duck': Chicken, 'duck breast': Chicken,
  'fish': Fish, 'salmon': Fish, 'tuna': Fish, 'cod': Fish, 'tilapia': Fish,
  'halibut': Fish, 'trout': Fish, 'sea bass': Fish, 'mahi mahi': Fish,
  'swordfish': Fish, 'snapper': Fish, 'sardine': Fish, 'sardines': Fish,
  'anchovy': Fish, 'anchovies': Fish, 'mackerel': Fish, 'catfish': Fish,
  'haddock': Fish, 'sole': Fish, 'flounder': Fish, 'grouper': Fish,
  'shrimp': Shrimp, 'prawns': Shrimp, 'prawn': Shrimp, 'jumbo shrimp': Shrimp,
  'crab': Crab, 'crab meat': Crab, 'lobster': Crab, 'lobster tail': Crab,
  'scallop': Crab, 'scallops': Crab, 'mussel': Crab, 'mussels': Crab,
  'clam': Crab, 'clams': Crab, 'oyster': Crab, 'oysters': Crab,
  'squid': Crab, 'calamari': Crab, 'octopus': Crab,
  'egg': Egg, 'eggs': Egg, 'egg white': Egg, 'egg whites': Egg,
  'egg yolk': Egg, 'egg yolks': Egg, 'hard boiled egg': Egg,
  'tofu': Tofu, 'silken tofu': Tofu, 'firm tofu': Tofu, 'extra firm tofu': Tofu,
  'tempeh': Tofu, 'seitan': Tofu,
  'bacon': Bacon, 'turkey bacon': Bacon, 'pancetta': Bacon,
  'prosciutto': Bacon, 'ham': Bacon, 'salami': Bacon,
  'sausage': Bacon, 'chorizo': Bacon, 'bratwurst': Bacon,
  'pepperoni': Bacon, 'hot dog': Bacon,

  // Dairy
  'cheese': Cheese, 'cheddar': Cheese, 'mozzarella': Cheese, 'parmesan': Cheese,
  'swiss cheese': Cheese, 'gouda': Cheese, 'brie': Cheese, 'feta': Cheese,
  'goat cheese': Cheese, 'cream cheese': Cheese, 'ricotta': Cheese,
  'gruyere': Cheese, 'provolone': Cheese, 'monterey jack': Cheese,
  'colby jack': Cheese, 'mascarpone': Cheese, 'cottage cheese': Cheese,
  'blue cheese': Cheese, 'gorgonzola': Cheese, 'pecorino': Cheese,
  'halloumi': Cheese, 'paneer': Cheese, 'queso': Cheese,
  'butter': Butter, 'unsalted butter': Butter, 'ghee': Butter, 'margarine': Butter,
  'milk': Milk, 'whole milk': Milk, 'skim milk': Milk, 'almond milk': Milk,
  'oat milk': Milk, 'soy milk': Milk,
  'buttermilk': Milk, 'evaporated milk': Milk, 'condensed milk': Milk,
  'cream': Milk, 'heavy cream': Milk, 'whipping cream': Milk,
  'half and half': Milk, 'half & half': Milk, 'sour cream': Milk,
  'yogurt': Yogurt, 'greek yogurt': Yogurt, 'plain yogurt': Yogurt,
  'yoghurt': Yogurt, 'kefir': Yogurt,

  // Herbs
  'basil': Basil, 'fresh basil': Basil, 'thai basil': Basil, 'dried basil': Basil,
  'mint': Mint, 'fresh mint': Mint, 'peppermint': Mint, 'spearmint': Mint,
  'rosemary': Rosemary, 'fresh rosemary': Rosemary, 'dried rosemary': Rosemary,
  'cilantro': Basil, 'fresh cilantro': Basil, 'coriander leaf': Basil,
  'parsley': Basil, 'fresh parsley': Basil, 'flat leaf parsley': Basil,
  'italian parsley': Basil, 'curly parsley': Basil,
  'dill': Basil, 'fresh dill': Basil,
  'thyme': Rosemary, 'fresh thyme': Rosemary, 'dried thyme': Rosemary,
  'oregano': Rosemary, 'dried oregano': Rosemary,
  'sage': Basil, 'fresh sage': Basil,
  'tarragon': Basil, 'bay leaf': Basil, 'bay leaves': Basil,
  'lemongrass': Celery, 'chive': Basil, 'chives': Basil,

  // Spices
  'chili': Chili, 'chilli': Chili, 'chili pepper': Chili, 'chili flakes': Chili,
  'red pepper flakes': Chili, 'crushed red pepper': Chili, 'chili powder': Chili,
  'cayenne': Chili, 'cayenne pepper': Chili, 'jalapeno': Chili, 'jalapeño': Chili,
  'habanero': Chili, 'serrano': Chili, 'chipotle': Chili, 'ancho chili': Chili,
  'hot pepper': Chili, 'scotch bonnet': Chili, 'thai chili': Chili,
  'ginger': Ginger, 'fresh ginger': Ginger, 'ground ginger': Ginger, 'ginger root': Ginger,
  'cinnamon': Cinnamon, 'cinnamon stick': Cinnamon, 'ground cinnamon': Cinnamon,
  'turmeric': Turmeric, 'ground turmeric': Turmeric, 'fresh turmeric': Turmeric,
  'cumin': Turmeric, 'ground cumin': Turmeric, 'cumin seeds': Turmeric,
  'paprika': Chili, 'smoked paprika': Chili, 'sweet paprika': Chili,
  'coriander': Turmeric, 'ground coriander': Turmeric, 'coriander seeds': Turmeric,
  'cardamom': Turmeric, 'nutmeg': Turmeric, 'clove': Turmeric, 'cloves': Turmeric,
  'saffron': Turmeric, 'star anise': Turmeric, 'fennel': Turmeric, 'fennel seeds': Turmeric,
  'allspice': Turmeric, 'five spice': Turmeric, 'curry powder': Turmeric,
  'garam masala': Turmeric, 'za\'atar': Turmeric, 'sumac': Turmeric,
  'black pepper': Salt, 'white pepper': Salt, 'pepper': Salt, 'peppercorn': Salt,
  'salt': Salt, 'sea salt': Salt, 'kosher salt': Salt, 'flaky salt': Salt,
  'pink salt': Salt, 'himalayan salt': Salt,
  'sugar': Sugar, 'brown sugar': Sugar, 'powdered sugar': Sugar,
  'granulated sugar': Sugar, 'cane sugar': Sugar, 'confectioners sugar': Sugar,
  'coconut sugar': Sugar, 'maple syrup': Sugar, 'agave': Sugar, 'molasses': Sugar,

  // Grains & Pasta
  'rice': Rice, 'white rice': Rice, 'brown rice': Rice, 'jasmine rice': Rice,
  'basmati rice': Rice, 'sushi rice': Rice, 'arborio rice': Rice,
  'wild rice': Rice, 'sticky rice': Rice, 'fried rice': Rice,
  'quinoa': Rice, 'couscous': Rice, 'bulgur': Rice, 'farro': Rice,
  'barley': Rice, 'millet': Rice, 'oats': Rice, 'oatmeal': Rice,
  'pasta': Pasta, 'spaghetti': Pasta, 'penne': Pasta, 'fusilli': Pasta,
  'rigatoni': Pasta, 'linguine': Pasta, 'fettuccine': Pasta, 'macaroni': Pasta,
  'lasagna': Pasta, 'orzo': Pasta, 'gnocchi': Pasta, 'ravioli': Pasta,
  'tortellini': Pasta, 'ramen': Pasta, 'udon': Pasta, 'soba': Pasta,
  'noodles': Pasta, 'rice noodles': Pasta, 'egg noodles': Pasta, 'lo mein': Pasta,
  'vermicelli': Pasta, 'pad thai noodles': Pasta, 'glass noodles': Pasta,
  'bread': Bread, 'sourdough': Bread, 'baguette': Bread, 'ciabatta': Bread,
  'pita': Bread, 'naan': Bread, 'focaccia': Bread, 'brioche': Bread,
  'tortilla': Bread, 'flatbread': Bread, 'roti': Bread, 'croissant': Bread,
  'flour': Bread, 'all purpose flour': Bread, 'bread flour': Bread,
  'whole wheat flour': Bread, 'almond flour': Bread, 'cornstarch': Bread,

  // Condiments & Oils
  'olive oil': OliveOil, 'extra virgin olive oil': OliveOil, 'evoo': OliveOil,
  'vegetable oil': OliveOil, 'canola oil': OliveOil, 'sunflower oil': OliveOil,
  'avocado oil': OliveOil, 'sesame oil': OliveOil, 'peanut oil': OliveOil,
  'cooking oil': OliveOil, 'oil': OliveOil,
  'soy sauce': SoySauce, 'tamari': SoySauce, 'fish sauce': SoySauce,
  'worcestershire': SoySauce, 'worcestershire sauce': SoySauce,
  'oyster sauce': SoySauce, 'hoisin sauce': SoySauce,
  'honey': Honey, 'raw honey': Honey,
  'vinegar': OliveOil, 'balsamic vinegar': OliveOil, 'apple cider vinegar': OliveOil,
  'rice vinegar': OliveOil, 'red wine vinegar': OliveOil, 'white wine vinegar': OliveOil,
  'mustard': Sugar, 'dijon mustard': Sugar, 'yellow mustard': Sugar,
  'ketchup': Tomato, 'tomato paste': Tomato, 'tomato sauce': Tomato,
  'marinara': Tomato, 'salsa': Tomato, 'tomato puree': Tomato,
  'canned tomatoes': Tomato, 'diced tomatoes': Tomato, 'crushed tomatoes': Tomato,
  'mayo': Milk, 'mayonnaise': Milk,
  'hot sauce': Chili, 'sriracha': Chili, 'tabasco': Chili,
  'tahini': Almond, 'miso': SoySauce, 'miso paste': SoySauce,
  'pesto': Basil,

  // Nuts
  'almond': Almond, 'almonds': Almond, 'sliced almonds': Almond, 'almond butter': Almond,
  'walnut': Walnut, 'walnuts': Walnut,
  'peanut': Peanut, 'peanuts': Peanut, 'peanut butter': Peanut,
  'cashew': Almond, 'cashews': Almond, 'cashew butter': Almond,
  'pistachio': Almond, 'pistachios': Almond,
  'pecan': Walnut, 'pecans': Walnut,
  'hazelnut': Walnut, 'hazelnuts': Walnut, 'nutella': Walnut,
  'macadamia': Almond, 'pine nut': Almond, 'pine nuts': Almond,
  'chestnut': Walnut, 'chestnuts': Walnut,

  // Legumes
  'chickpea': Chickpea, 'chickpeas': Chickpea, 'garbanzo': Chickpea, 'hummus': Chickpea,
  'lentil': Chickpea, 'lentils': Chickpea, 'red lentils': Chickpea, 'green lentils': Chickpea,
  'black bean': Chickpea, 'black beans': Chickpea, 'kidney bean': Chickpea,
  'kidney beans': Chickpea, 'pinto bean': Chickpea, 'pinto beans': Chickpea,
  'navy bean': Chickpea, 'cannellini': Chickpea, 'white beans': Chickpea,
  'lima beans': Chickpea, 'edamame': Peas, 'fava beans': Chickpea,

  // Other
  'chocolate': Chocolate, 'dark chocolate': Chocolate, 'chocolate chips': Chocolate,
  'cocoa': Chocolate, 'cocoa powder': Chocolate, 'cacao': Chocolate,
  'white chocolate': Chocolate,
  'coffee': Coffee, 'espresso': Coffee, 'instant coffee': Coffee,
  'tea': Coffee, 'matcha': Coffee, 'green tea': Coffee,

  // Generic fallback
  'bowl': Bowl,
};

// ─── Food Family Fallback System ───────────────────────────────

type FoodFamily =
  | 'citrus' | 'berries' | 'stone-fruit' | 'tropical'
  | 'root-vegetable' | 'leafy-green' | 'allium' | 'cruciferous'
  | 'protein-meat' | 'protein-seafood' | 'legume' | 'grain'
  | 'dairy' | 'herb' | 'spice' | 'nut' | 'condiment' | 'generic';

const FAMILY_MAP: Record<string, FoodFamily> = {
  // Citrus
  'yuzu': 'citrus', 'kumquat': 'citrus', 'tangerine': 'citrus',
  'mandarin': 'citrus', 'clementine': 'citrus', 'bergamot': 'citrus',
  'pomelo': 'citrus', 'citron': 'citrus', 'calamansi': 'citrus',
  'key lime': 'citrus', 'grapefruit': 'citrus',

  // Berries
  'raspberry': 'berries', 'blackberry': 'berries',
  'cranberry': 'berries', 'cranberries': 'berries',
  'gooseberry': 'berries', 'boysenberry': 'berries',
  'mulberry': 'berries', 'elderberry': 'berries', 'lingonberry': 'berries',
  'açaí': 'berries', 'acai': 'berries', 'acai berry': 'berries',
  'goji berry': 'berries', 'goji berries': 'berries',

  // Stone fruit
  'nectarine': 'stone-fruit', 'nectarines': 'stone-fruit',
  'plum': 'stone-fruit', 'plums': 'stone-fruit',
  'apricot': 'stone-fruit', 'apricots': 'stone-fruit',
  'lychee': 'stone-fruit', 'date': 'stone-fruit', 'dates': 'stone-fruit',
  'fig': 'stone-fruit', 'figs': 'stone-fruit',

  // Tropical
  'papaya': 'tropical', 'passion fruit': 'tropical', 'guava': 'tropical',
  'dragon fruit': 'tropical', 'jackfruit': 'tropical', 'starfruit': 'tropical',
  'rambutan': 'tropical', 'durian': 'tropical',
  'breadfruit': 'tropical', 'soursop': 'tropical', 'tamarind': 'tropical',
  'persimmon': 'tropical',

  // Root vegetables
  'beet': 'root-vegetable', 'beetroot': 'root-vegetable', 'beets': 'root-vegetable',
  'turnip': 'root-vegetable', 'radish': 'root-vegetable', 'radishes': 'root-vegetable',
  'parsnip': 'root-vegetable', 'parsnips': 'root-vegetable',
  'yam': 'root-vegetable', 'yams': 'root-vegetable',
  'rutabaga': 'root-vegetable', 'jicama': 'root-vegetable',
  'taro': 'root-vegetable', 'cassava': 'root-vegetable',
  'daikon': 'root-vegetable', 'celeriac': 'root-vegetable',
  'horseradish': 'root-vegetable',

  // Leafy greens
  'kale': 'leafy-green', 'lettuce': 'leafy-green',
  'arugula': 'leafy-green', 'rocket': 'leafy-green',
  'chard': 'leafy-green', 'swiss chard': 'leafy-green',
  'collard greens': 'leafy-green', 'collards': 'leafy-green',
  'watercress': 'leafy-green', 'endive': 'leafy-green',
  'radicchio': 'leafy-green', 'bok choy': 'leafy-green',
  'romaine': 'leafy-green', 'romaine lettuce': 'leafy-green',
  'iceberg lettuce': 'leafy-green', 'butter lettuce': 'leafy-green',
  'mixed greens': 'leafy-green', 'spring mix': 'leafy-green',
  'microgreens': 'leafy-green',

  // Cruciferous (those not directly mapped)
  'brussels sprouts': 'cruciferous', 'brussels sprout': 'cruciferous',
  'kohlrabi': 'cruciferous', 'bok choi': 'cruciferous',

  // Condiments (those not directly mapped)
  'bbq sauce': 'condiment', 'teriyaki sauce': 'condiment',
  'chutney': 'condiment', 'relish': 'condiment', 'aioli': 'condiment',
  'chimichurri': 'condiment', 'gochujang': 'condiment',
  'sambal': 'condiment', 'harissa': 'condiment',
  'ponzu': 'condiment', 'mirin': 'condiment', 'sake': 'condiment',
  'balsamic glaze': 'condiment',
};

const FAMILY_FALLBACK: Record<FoodFamily, string> = {
  'citrus': 'lemon',
  'berries': 'blueberry',
  'stone-fruit': 'peach',
  'tropical': 'mango',
  'root-vegetable': 'carrot',
  'leafy-green': 'spinach',
  'allium': 'onion',
  'cruciferous': 'broccoli',
  'protein-meat': 'beef',
  'protein-seafood': 'shrimp',
  'legume': 'chickpea',
  'grain': 'rice',
  'dairy': 'cheese',
  'herb': 'basil',
  'spice': 'chili',
  'nut': 'almond',
  'condiment': 'soy sauce',
  'generic': 'bowl',
};

// ─── Public API ────────────────────────────────────────────────

/**
 * Resolve an ingredient name to its illustration key.
 * 1. Direct match in ILLUSTRATIONS
 * 2. Family fallback via FAMILY_MAP → FAMILY_FALLBACK
 * 3. Generic bowl fallback
 */
function resolveIllustrationKey(name: string): string {
  const normalized = name.toLowerCase().trim();

  // Direct match
  if (ILLUSTRATIONS[normalized]) return normalized;

  // Family fallback
  const family = FAMILY_MAP[normalized];
  if (family) return FAMILY_FALLBACK[family];

  // Generic fallback
  return 'bowl';
}

/**
 * Render an ingredient illustration as an inline SVG.
 */
export function IngredientIcon({ name, className }: { name: string; className?: string }) {
  const key = resolveIllustrationKey(name);
  const Component = ILLUSTRATIONS[key] || Bowl;
  return <Component className={className} />;
}
