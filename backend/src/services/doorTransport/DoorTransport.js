import { EventEmitter } from 'events';

/**
 * Base Abstract DoorTransport Interface
 * Enables zero-friction swapping between Managed Cloud MQTT (TLS),
 * WebSockets, and in-memory simulated transport.
 */
export class DoorTransport extends EventEmitter {
  constructor() {
    super();
    if (new.target === DoorTransport) {
      throw new TypeError('Cannot construct DoorTransport instances directly.');
    }
  }

  async init() {
    throw new Error('Method "init()" must be implemented.');
  }

  async publishUnlockCommand(doorId, signedCommand) {
    throw new Error('Method "publishUnlockCommand(doorId, command)" must be implemented.');
  }

  async publishLockdown(doorId, isLockedDown) {
    throw new Error('Method "publishLockdown(doorId, isLockedDown)" must be implemented.');
  }

  async disconnect() {
    throw new Error('Method "disconnect()" must be implemented.');
  }
}
