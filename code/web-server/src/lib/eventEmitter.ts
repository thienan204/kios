import { EventEmitter } from 'events';

// Sử dụng global để giữ instance của EventEmitter duy nhất trong môi trường dev của Next.js (hot-reload không bị mất)
const globalForEventEmitter = global as unknown as {
  eventEmitter: EventEmitter | undefined;
  activeAudioClients: Map<number, number> | undefined;
};

export const eventEmitter = globalForEventEmitter.eventEmitter ?? new EventEmitter();
export const activeAudioClients = globalForEventEmitter.activeAudioClients ?? new Map<number, number>();

if (process.env.NODE_ENV !== 'production') {
  globalForEventEmitter.eventEmitter = eventEmitter;
  globalForEventEmitter.activeAudioClients = activeAudioClients;
}
