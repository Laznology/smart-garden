import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { PrismaClient } from '@prisma/client';
import {
  // mqttSensorConfig, 
  mqttSensorConfig
} from '../config/mqtt';

class MQTTService {
  private client: MqttClient;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.initializeMQTTClient();
  }

  private initializeMQTTClient() {
    const { broker, port, clientId, options } = mqttSensorConfig;
    const connectUrl = `mqtt://${broker}:${port}`;

    const mqttOptions: IClientOptions = {
      ...options,
      clientId
    };
    this.client = mqtt.connect(connectUrl, mqttOptions);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('Terhubung ke MQTT broker');
      this.subscribeToTopics();
    });

    this.client.on('error', (error: Error) => {
      console.error('Kesalahan koneksi MQTT:', error);
    });

    this.client.on('message', this.handleMessage.bind(this));
  }

  private subscribeToTopics() {
    mqttSensorConfig.topics.forEach(topic => {
      this.client.subscribe(topic, (err: Error | null) => {
        if (err) {
          console.error(`Gagal subscribe ke topic ${topic}:`, err);
        } else {
          console.log(`Berhasil subscribe ke topic: ${topic}`);
        }
      });
    });
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`Menerima pesan dari topic ${topic}:`, payload);
      

      // await this.prisma.sensorReading.create({
      //   data: {
          
      //   }
      // });

      // console.log('Data berhasil disimpan ke database');
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