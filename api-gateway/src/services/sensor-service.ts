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
    this.on('message', async (_topic: string, payload: any) => {
      try {
        const { temperature, humidity, soil, farmId } = payload;
        if (!farmId) {
          console.error('❌ No farmId in payload');
          return;
        }

        const readings: SensorReading[] = [];

        // Collect all available sensor readings
        const sensorData = {
          temperature,
          humidity,
          soil
        };

        // Build readings array for all present sensor values
        for (const [sensorType, value] of Object.entries(sensorData)) {
          if (value !== undefined && value !== null) {
            readings.push({
              farmId,
              sensor_type: sensorType,
              value: Number(value)
            });
          }
        }

        if (readings.length > 0) {
          await this.handleSensorReading(readings);
        }

      } catch (error) {
        console.error('❌ Error processing sensor data:', error);
        this.emit('error', error);
      }
    });
  }

  async handleSensorReading(readings: SensorReading[]) {
    try {
      // Save multiple sensor readings
      const result = await dbService.saveSensorReadings(readings);
      console.log(`✅ Saved ${result.count} sensor readings`);
      
      for (const reading of readings) {
        console.log(`  - ${reading.sensor_type}: ${reading.value}`);
      }

      // Emit event for further processing
      this.emit('sensorReading', readings);
    } catch (error) {
      console.error('❌ Error handling sensor readings:', error);
      this.emit('error', error);
    }
  }
}