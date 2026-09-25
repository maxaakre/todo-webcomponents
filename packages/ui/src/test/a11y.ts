import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Run axe on one element and fail with a readable list of violations.
 * Remember the limit: axe finds roughly a third of real a11y problems.
 * A pass here is necessary, not sufficient.
 */
export async function expectNoA11yViolations(el: Element) {
  const { violations } = await axe.run(el);
  const report = violations.map(
    (v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`,
  );
  expect(report, 'axe violations').toEqual([]);
}
