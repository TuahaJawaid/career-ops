/**
 * Shared location exclusion filters — used across job search, discovery, and DB reads.
 * Excludes US and Israel locations.
 */
export const US_LOCATION_PATTERN =
  /\bUS\b|\bUSA\b|United States|, AL\b|, AK\b|, AZ\b|, AR\b|, CA\b|, CO\b|, CT\b|, DE\b|, FL\b|, GA\b|, HI\b|, ID\b|, IL\b|, IN\b|, IA\b|, KS\b|, KY\b|, LA\b|, ME\b|, MD\b|, MA\b|, MI\b|, MN\b|, MS\b|, MO\b|, MT\b|, NE\b|, NV\b|, NH\b|, NJ\b|, NM\b|, NY\b|, NC\b|, ND\b|, OH\b|, OK\b|, OR\b|, PA\b|, RI\b|, SC\b|, SD\b|, TN\b|, TX\b|, UT\b|, VT\b|, VA\b|, WA\b|, WV\b|, WI\b|, WY\b|, DC\b/;
export const ISRAEL_LOCATION_PATTERN = /\bIsrael\b|\bIL\b|Tel Aviv|Jerusalem|Haifa|Ramat Gan|Netanya/i;

export function isUsLocation(location: string | null | undefined): boolean {
  if (!location) return false;
  return US_LOCATION_PATTERN.test(location);
}

export function isIsraelLocation(location: string | null | undefined): boolean {
  if (!location) return false;
  return ISRAEL_LOCATION_PATTERN.test(location);
}

export function isExcludedLocation(location: string | null | undefined): boolean {
  return isUsLocation(location) || isIsraelLocation(location);
}
