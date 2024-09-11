export class EventEmitter {
  private eventMap: Map<string, Set<Function>> = new Map();

  /**
   * Adds an event listener for an event.
   * @param type Type of event listener to add.
   * @param listener The listener function called when event triggers.
   */
  public addEventListener(type: string, listener: Function) {
    let listeners = this.eventMap.get(type);
    if (!listeners) {
      listeners = new Set();
      this.eventMap.set(type, listeners);
    }
    listeners.add(listener);
  }

  /**
   * Removes an event listener.
   * @param type Type of event listener to remove.
   * @param listener The listener function to remove.
   */
  public removeEventListener(type: string, listener: Function) {
    this.eventMap.get(type)?.delete(listener);
  }

  /**
   * Triggers an event.
   * @param type Type of event.
   * @param args Arguments supplied to listeners of the event.
   */
  public triggerEvent(type: string, ...args: any[]) {
    const listeners = this.eventMap.get(type);
    if (!listeners) return;
    for (let listener of listeners) {
      listener(...args);
    }
  }
}