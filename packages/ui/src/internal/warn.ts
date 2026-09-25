import { DEV } from './dev.js';
import { slotText } from './slot-text.js';

const warned = new WeakMap<Element, Set<string>>();

/** console.warn in dev, at most once per element and message. */
export function warnOnce(host: Element, message: string) {
  if (!DEV) return;
  let seen = warned.get(host);
  if (!seen) warned.set(host, (seen = new Set()));
  if (seen.has(message)) return;
  seen.add(message);
  console.warn(message, host);
}

/**
 * Warn when a slot that provides an accessible name shows no text. Call it
 * from firstUpdated (an empty slot never fires slotchange) and from the
 * slot's slotchange (content that arrives later).
 */
export function warnIfSlotEmpty(host: Element, slot: HTMLSlotElement | null, message: string) {
  if (slot && !slotText(slot)) warnOnce(host, message);
}
