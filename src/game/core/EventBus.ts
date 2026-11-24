// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (...args: any[]) => void;

/** Minimal typed event emitter used by the simulation. */
export class EventBus<Events extends { [K in keyof Events]: unknown[] }> {
    private handlers = new Map<keyof Events, Set<AnyHandler>>();

    on<K extends keyof Events>(event: K, handler: (...args: Events[K]) => void): () => void {
        let set = this.handlers.get(event);
        if (!set) {
            set = new Set();
            this.handlers.set(event, set);
        }
        set.add(handler as AnyHandler);
        return () => this.off(event, handler);
    }

    off<K extends keyof Events>(event: K, handler: (...args: Events[K]) => void): void {
        this.handlers.get(event)?.delete(handler as AnyHandler);
    }

    emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
        const set = this.handlers.get(event);
        if (!set) return;
        for (const h of [...set]) h(...args);
    }

    clear(): void {
        this.handlers.clear();
    }
}
