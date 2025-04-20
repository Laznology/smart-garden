import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { PrismaClient } from '@prisma/client';
import {
  // mqttSensorConfig, 
  mqttConfig
} from '../config/mqtt';
import { Sensor } from 'src/types';

class MQTTService {
  private client: MqttClient;
  private prisma: PrismaClient;
  private serviceType: string;

  constructor( serviceType : string) {
    this.prisma = new PrismaClient();
    this.serviceType = serviceType;
    this.initializeMQTTClient();
  }

  private initializeMQTTClient() {
    const { broker, port, clientId, options } = mqttConfig;
    const connectUrl = `mqtt://${broker}:${port}`;

    const mqttOptions: IClientOptions = {
      ...options,
      clientId
    };
    this.client = mqtt.connect(connectUrl, mqttOptions);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', async () => {
      console.log('Terhubung ke MQTT broker');
      this.subscribeToTopics();
    });

    this.client.on('error', (error: Error) => {
      console.error('Kesalahan koneksi MQTT:', error);
    });

    this.client.on('message', this.handleMessage.bind(this));
  }

  private async subscribeToTopics() {
    try {
      const topic = await this.prisma.topic.findFirst({
        where: {
          name: {
            contains: this.serviceType,
          }
        },
        orderBy: {
          id: 'desc',
        }
      });
      const topicName = topic?.name || 'suhu/topic';  

      this.client.subscribe(topicName || 'suhu/topic', (err: Error | null) => {
        if (err) {
          console.error(`Gagal subscribe ke topic ${topicName}:`, err);
        } else {
          console.log(`Berhasil subscribe ke topic: ${topicName}`);
        }
      });
    } catch (error) {
      console.error(`Gagal fetch dan subscripe ke topic`);
    }
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      const payload: Sensor = JSON.parse(message.toString());
      console.log(`topic: ${topic}, ${payload}`);
      await this.prisma.sensorReading.createMany({
        data: [{
          farm_id: 1,
          value: payload.humidity,
          sensor_type: "Humidity",
        }, {
          farm_id: 1,
          value: payload.temperature,
          sensor_type: "Temperature",
        }]
      });
      console.log('Data berhasil disimpan ke database');
    } catch (error) {
      console.error('Gagal memproses pesan:', error);
    }
  }

  public disconnect() {
    if (this.client) {
      this.client.end();
    }
    this.prisma.$disconnect();
  }
}

export default MQTTService;
