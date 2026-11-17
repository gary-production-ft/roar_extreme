import { DoorTransport } from './DoorTransport.js';
import { logger } from '../../utils/logger.js';

export class SimulatedDoorTransport extends DoorTransport {
  constructor() {
    super();
    this.name = 'SimulatedInProcess';
    this.deviceListeners = new Map();
  }

  async init() {
    logger.info('[TRANSPORT] Initialized Simulated In-Process DoorTransport.');
    return true;
  }

  async publishUnlockCommand(doorId, signedCommand) {
    logger.info(`[TRANSPORT:SIMULATED] ➔ Dispatched unlock command for door: ${doorId} (ID: ${signedCommand.commandId})`);
    this.emit('command', { doorId, command: signedCommand });
    this.emit(`command:${doorId}`, signedCommand);
    return true;
  }

  async publishLockdown(doorId, isLockedDown) {
    logger.warn(`[TRANSPORT:SIMULATED] ➔ Lockdown state changed for door: ${doorId} [LockedDown: ${isLockedDown}]`);
    this.emit('lockdown', { doorId, isLockedDown });
    this.emit(`lockdown:${doorId}`, isLockedDown);
    return true;
  }

  // Simulated device sends event to backend
  simulateDeviceEvent(doorId, event) {
    this.emit('device_event', { doorId, ...event });
  }

  async disconnect() {
    this.removeAllListeners();
    logger.info('[TRANSPORT] Disconnected Simulated DoorTransport.');
  }
}
