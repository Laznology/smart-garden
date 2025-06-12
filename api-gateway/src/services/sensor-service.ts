import { MQTTService } from './mqtt-service';
import { dbService } from './database-service';

interface SensorReading {
  farmId: number;
  sensor_type: string;
  value: number;
}

export class SensorService extends MQTTService {
  constructor(config: any, useDatabase: boolean = true) {
    super(config, useDatabase);
    
    // Listen for MQTT messages
    this.on('message', async (_topic: string, payload: SensorReading) => {
      await this.handleSensorReading(payload);
    });
  }

  async handleSensorReading(payload: SensorReading) {
    try {
      // Save sensor reading to database
      await dbService.saveSensorReading(payload);
      console.log(`✅ Sensor reading saved: ${payload.value} for ${payload.sensor_type} in farm ${payload.farmId}`);

      // Emit event for further processing
      this.emit('sensorReading', payload);
    } catch (error) {
      console.error('❌ Error handling sensor reading:', error);
      this.emit('error', error);
    }
  }
}