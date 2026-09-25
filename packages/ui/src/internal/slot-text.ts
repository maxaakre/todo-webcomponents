/** The text a slot shows, through nested slots. Empty means no visible name. */
export function slotText(slot: HTMLSlotElement): string {
  return slot.assignedNodes({ flatten: true }).map((n) => n.textContent).join('').trim();
}
