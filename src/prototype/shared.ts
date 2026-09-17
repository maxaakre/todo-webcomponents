// PROTOTYPE — throwaway. Ticket 05.
import { css } from 'lit';

export const base = css`
  :host {
    display: block;
    font: 15px/1.5 -apple-system, system-ui, sans-serif;
    color: #16181d;
    --ink: #16181d;
    --dim: #6b7280;
    --line: #e5e7eb;
    --accent: #2563eb;
    --danger: #b91c1c;
  }
  * { box-sizing: border-box; }
  button {
    font: inherit;
    cursor: pointer;
    border: 1px solid var(--line);
    background: #fff;
    border-radius: 7px;
    padding: 0.35rem 0.7rem;
    color: var(--ink);
  }
  button:hover { border-color: #9ca3af; }
  button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  button.danger { color: var(--danger); }
  h1, h2, h3 { margin: 0; font-weight: 620; letter-spacing: -0.01em; }
  ul { list-style: none; margin: 0; padding: 0; }
  .dim { color: var(--dim); }
  .stale { font-size: 0.78rem; color: var(--dim); }
`;
