/**
 * The single source of "today". Nothing else calls `new Date()` to decide
 * which Day it is.
 */

/** Device local time. NOT toISOString() — that is UTC and would be wrong. */
const localDay = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const currentDay = (): string => localDay(new Date());

export const addDays = (day: string, n: number): string => {
  const [y, m, d] = day.split('-').map(Number);
  return localDay(new Date(y, m - 1, d + n));
};

/**
 * Time, passed to the store rather than read inside it, so store operations
 * stay pure and predictable.
 */
export type Clock = { today: string; now: string };

export const makeClock = (): Clock => ({
  today: currentDay(),
  now: new Date().toISOString(),
});
