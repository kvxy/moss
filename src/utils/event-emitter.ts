export class EventEmitter {
  private eventMap: Map<string, Set<Function>> = new Map();

  public addEventListener(type: string, listener: Function) {
    let listeners = this.eventMap.get(type);
    if (!listeners) {
      listeners = new Set();
      this.eventMap.set(type, listeners);
    }
    listeners.add(listener);
  }

  public removeEventListener(type: string, listener: Function) {
    this.eventMap.get(type)?.delete(listener);
  }

  public triggerEvent(type: string, ...args: any[]) {
    const listeners = this.eventMap.get(type);
    if (!listeners) return;
    for (let listener of listeners) {
      listener(...args);
    }
  }
}