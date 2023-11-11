type TypeMap<M> = {
    [K in keyof M]: K extends symbol ? never : M[K]
};


class EventDispatcher<T extends TypeMap<T>> {
    private listenerMap: Partial<Record<keyof T, Array<(payload: T[keyof T]) => void>>> = {};

    constructor() {}

    subscribe<K extends keyof T>(eventName: K, listener: (payload: T[K]) => void): () => void {
        const listeners: Array<(payload: T[K]) => void> = this.listenerMap[eventName] || (this.listenerMap[eventName] = [])
        listeners.push(listener);

        return () => {
            this.listenerMap[eventName] = this.listenerMap[eventName]?.filter(l => l !== listener) || [];
        };
    }

    dispatch<K extends keyof T>(eventName: K, payload: T[K]): void {
        const listeners = this.listenerMap[eventName]
        if (listeners) {
            listeners.forEach(listener => listener(payload));
        }
    }
}


interface MyEvents {
    data: string;
    error: Error;
}

const emitter = new EventDispatcher<MyEvents>();

// Subscribe to a 'data' event
const unsubscribeData = emitter.subscribe('data', (data: string) => {
    console.log(`Data: ${data}`);
});

// Subscribe to an 'error' event
const unsubscribeError = emitter.subscribe('error', (error: Error) => {
    console.error(`Error: ${error.message}`);
});

// Emitting events
emitter.dispatch('data', 'Hello, world!');
emitter.dispatch('error', new Error('Something went wrong'));

// Unsubscribe
unsubscribeData();
unsubscribeError();