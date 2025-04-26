import dotenv from 'dotenv';

dotenv.config();

export const mqttConfig = {
  broker: process.env.MQTT_BROKER || 'broker.emqx.io',
  port: parseInt(process.env.MQTT_PORT || '1883', 10),
  clientId: process.env.MQTT_CLIENT_ID || `smart_garden_gateway_${Math.random().toString(16).slice(2, 8)}`,
  options: {
    keepalive: 60,
    reconnectPeriod: 1000,
    clean: true,
    encoding: 'utf8' as BufferEncoding,
    protocol: 'mqtt' as 'mqtt' | 'mqtts' | 'ws' | 'wss'
  }
};