import { describe, expect, it } from 'vitest';
import { addDays, currentDay, makeClock } from './day.js';

describe('currentDay', () => {
  it('is device LOCAL time, not UTC', () => {
    // The trap: new Date().toISOString().slice(0,10) is UTC, so anyone east of
    // Greenwich late at night (or west early in the morning) gets the wrong Day.
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const localExpected = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    expect(currentDay()).toBe(localExpected);
  });

  it('is a plain YYYY-MM-DD label with no time and no zone', () => {
    expect(currentDay()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('addDays', () => {
  it('moves forward a day', () => {
    expect(addDays('2026-09-17', 1)).toBe('2026-09-18');
  });

  it('crosses a month boundary', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
  });

  it('crosses a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('goes backwards', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('makeClock', () => {
  it('gives a Day label and an absolute instant, and they are different kinds of value', () => {
    const clock = makeClock();
    expect(clock.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // updatedAt must stay an absolute instant — day-start logic may shift `today`,
    // but must never touch `now`.
    expect(clock.now).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });
});
