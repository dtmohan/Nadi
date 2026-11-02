import { norm360 } from "./astro";
import { VARGA_BY_KEY, type VargaKey } from "./vargas";

/** The existing BPHS sign mapping, with the input longitude kept at full precision. */
export function vargaSignAt(key: VargaKey, lon: number): number {
  const degree = norm360(lon);
  const sign = Math.floor(degree / 30);
  return VARGA_BY_KEY[key].signOf(sign, degree - sign * 30);
}
