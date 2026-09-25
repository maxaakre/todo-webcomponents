/**
 * Owns the focus/visibilitychange listeners, so:
 *  - the current Day re-resolves when you come back to the tab (ticket 04)
 *  - the host can re-read storage at the same moment (ticket 07)
 *
 * A reactive controller rather than listeners on the host, so teardown on
 * disconnect is automatic.
 */
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { currentDay } from './day.js';

export class DayController implements ReactiveController {
  today = currentDay();

  // Explicit fields, not constructor parameter properties: `erasableSyntaxOnly`
  // in tsconfig forbids them, because they are syntax that requires emit.
  private host: ReactiveControllerHost;
  private onWake: () => void;

  constructor(host: ReactiveControllerHost, onWake: () => void) {
    this.host = host;
    this.onWake = onWake;
    host.addController(this);
  }

  hostConnected() {
    window.addEventListener('focus', this.wake);
    document.addEventListener('visibilitychange', this.wake);
  }

  hostDisconnected() {
    window.removeEventListener('focus', this.wake);
    document.removeEventListener('visibilitychange', this.wake);
  }

  private wake = () => {
    if (document.visibilityState === 'hidden') return;
    this.today = currentDay();
    this.onWake();
    this.host.requestUpdate();
  };
}
