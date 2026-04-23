import { isExcludedLocation } from "@/lib/us-filter";

export function passesLocationExclusions(
  location: string | null | undefined,
  excludedCountryCodes: string[] | null | undefined
) {
  const normalized = (excludedCountryCodes ?? []).map((code) => code.toLowerCase());
  if (normalized.includes("us") || normalized.includes("il")) {
    return !isExcludedLocation(location);
  }
  return true;
}
