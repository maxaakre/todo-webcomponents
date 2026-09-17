// PROTOTYPE — throwaway. Ticket 05. Not production code.
// In-memory only: no localStorage, no persistence. That is what we are checking.

export type Verdict = 'today' | 'tomorrow' | 'drop';

export type Task = {
  id: string;
  title: string;
  done: boolean;
  day: string; // "YYYY-MM-DD"
  order: number;
};

export type Scenario = 'normal' | 'nothing-to-triage' | 'empty-day';

const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const today = () => iso(0);

let n = 0;
const task = (title: string, day: string, done = false): Task => ({
  id: `t${++n}`,
  title,
  done,
  day,
  order: n,
});

export function scenarioTasks(scenario: Scenario): Task[] {
  if (scenario === 'nothing-to-triage') {
    return [
      task('Write the Lit component seams ticket', today()),
      task('Buy oat milk', today()),
      task('Call the dentist', today(), true),
    ];
  }
  if (scenario === 'empty-day') {
    // leftovers exist, today is empty — the worst-feeling case
    return [
      task('Renew passport', iso(-1)),
      task('Reply to the landlord', iso(-4)),
    ];
  }
  return [
    // leftovers, deliberately spanning more than one day (ticket 04)
    task('Renew passport', iso(-1)),
    task('Reply to the landlord', iso(-1)),
    task('Fix the squeaky door', iso(-3)),
    task('Read the signals RFC', iso(-4)),
    // today
    task('Write the Lit component seams ticket', today()),
    task('Buy oat milk', today()),
    task('Call the dentist', today(), true),
  ];
}

export const daysAgo = (day: string) => {
  const ms = new Date(today()).getTime() - new Date(day).getTime();
  const d = Math.round(ms / 86_400_000);
  return d === 1 ? 'yesterday' : `${d} days ago`;
};
