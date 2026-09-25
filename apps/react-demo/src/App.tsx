import { useState, type FormEvent } from 'react';
import '@maxaakre/ui/button';
import '@maxaakre/ui/checkbox';
import '@maxaakre/ui/dialog';
import '@maxaakre/ui/disclosure';
import '@maxaakre/ui/tabs';
import '@maxaakre/ui/text-field';

type Task = { id: number; title: string; done: boolean };

/**
 * Every @maxaakre/ui component, used from React 19 the way a product team
 * would: state lives in React, flows down as properties, and user actions
 * come back up as events.
 */
export function App() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Buy oat milk', done: false },
    { id: 2, title: 'Renew passport', done: true },
  ]);
  const [view, setView] = useState(0);
  const [showDone, setShowDone] = useState(true);
  const [pending, setPending] = useState<Task | null>(null);
  const [error, setError] = useState('');

  // The form reads ui-text-field through FormData: it is form-associated,
  // so React needs no ref and no onChange wiring to get the value.
  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = String(new FormData(e.currentTarget).get('title') ?? '').trim();
    if (!title) return setError('Give the task a name.');
    setError('');
    setTasks((ts) => [...ts, { id: Date.now(), title, done: false }]);
    e.currentTarget.reset();
  };

  const toggle = (id: number) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  const row = (t: Task) => (
    <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
      <ui-checkbox checked={t.done} onChange={() => toggle(t.id)} style={{ flex: 1 }}>
        {t.title}
      </ui-checkbox>
      <ui-button variant="ghost" size="sm" label={`Erase "${t.title}"`} onClick={() => setPending(t)}>
        ✕
      </ui-button>
    </li>
  );

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>@maxaakre/ui in React 19</h1>

      <form onSubmit={add} style={{ display: 'flex', gap: 8, alignItems: 'start', marginBottom: 16 }}>
        <ui-text-field label="New task" hideLabel name="title" placeholder="Add a task"
                       error={error} style={{ flex: 1 }} />
        <ui-button type="submit" variant="primary">Add</ui-button>
      </form>

      <ui-tabs label="Task views" selectedIndex={view} onui-tab-change={(e) => setView(e.detail.index)}>
        <ui-tab value="open">Open ({open.length})</ui-tab>
        <ui-tab value="all">All ({tasks.length})</ui-tab>
        <ui-tab-panel>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{open.map(row)}</ul>
        </ui-tab-panel>
        <ui-tab-panel>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{open.map(row)}</ul>
          <ui-disclosure open={showDone} onui-toggle={(e) => setShowDone(e.detail.open)}>
            <span slot="summary">Done ({done.length})</span>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{done.map(row)}</ul>
          </ui-disclosure>
        </ui-tab-panel>
      </ui-tabs>

      <ui-dialog open={pending !== null}
                 label={pending ? `Erase “${pending.title}”?` : ''}
                 onui-close={(e) => {
                   if (e.detail.returnValue === 'erase' && pending) {
                     setTasks((ts) => ts.filter((t) => t.id !== pending.id));
                   }
                   setPending(null);
                 }}>
        <p style={{ margin: 0 }}>This cannot be undone.</p>
        <ui-button slot="footer" data-dialog-close="cancel">Cancel</ui-button>
        <ui-button slot="footer" variant="danger" data-dialog-close="erase">Erase</ui-button>
      </ui-dialog>

      <p data-testid="state" hidden>{JSON.stringify({ view, showDone, tasks })}</p>
    </main>
  );
}
