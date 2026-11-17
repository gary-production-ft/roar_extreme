import { env } from '../../config/environment.js';
import { MqttDoorTransport } from './MqttDoorTransport.js';
import { SimulatedDoorTransport } from './SimulatedDoorTransport.js';
import { logger } from '../../utils/logger.js';

let activeTransport = null;

export function getDoorTransport() {
  if (!activeTransport) {
    if (env.mqttBrokerUrl && env.mqttBrokerUrl.startsWith('mqtt')) {
      activeTransport = new MqttDoorTransport();
    } else {
      activeTransport = new SimulatedDoorTransport();
    }
  }
  return activeTransport;
}

export function setDoorTransport(transportInstance) {
  activeTransport = transportInstance;
}

export async function initDoorTransport() {
  const transport = getDoorTransport();
  await transport.init();
  return transport;
}
