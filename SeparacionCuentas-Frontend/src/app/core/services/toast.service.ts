import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private counter = 0;

  show(text: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', durationMs = 3800): void {
    const id = ++this.counter;
    this.toasts.update(list => [...list, { id, text, type }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
