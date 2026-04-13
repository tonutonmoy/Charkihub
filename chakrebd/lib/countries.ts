/** ISO 3166-1 alpha-2 → English display name (subset for job regions). */
export const COUNTRY_NAMES: Record<string, string> = {
  BD: 'Bangladesh',
  IN: 'India',
  PK: 'Pakistan',
  NP: 'Nepal',
  LK: 'Sri Lanka',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  SA: 'Saudi Arabia',
  AE: 'United Arab Emirates',
  MY: 'Malaysia',
  SG: 'Singapore',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  BR: 'Brazil',
  NG: 'Nigeria',
  ZA: 'South Africa',
  EG: 'Egypt',
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
  ID: 'Indonesia',
  PH: 'Philippines',
  TH: 'Thailand',
  VN: 'Vietnam',
};

export function getCountryName(code: string): string {
  const c = code.trim().toUpperCase();
  return COUNTRY_NAMES[c] ?? c;
}

export const COUNTRY_OPTIONS = Object.entries(COUNTRY_NAMES)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));
