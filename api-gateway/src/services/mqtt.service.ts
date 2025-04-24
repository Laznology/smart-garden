import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { PrismaClient } from '@prisma/client';
import {
  // mqttSensorConfig, 
  mqttConfig
} from '../config/mqtt';
import { Sensor, Topic } from 'src/types';

class MQTTService {
  private client: MqttClient;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.initializeMQTTClient();
  }

  private initializeMQTTClient() {
    const { broker, port, clientId, options } = mqttConfig;
    const connectUrl = `mqtt://${broker}:${port}`;

    const mqttOptions: IClientOptions = {
      ...options,
      clientId,
      reconnectPeriod: options?.reconnectPeriod || 1000,
      keepalive: options?.keepalive || 60
    };
    
    this.client = mqtt.connect(connectUrl, mqttOptions);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (this.hasSubscribed) return;
    this.hasSubscribed = true;

    this.client.on('connect', async () => {
      console.log('Terhubung ke MQTT broker');
      this.isConnected = true;
      this.emit('connected');
      this.subscribeToTopics();
    });

    this.client.on('error', (error: Error) => {
      console.error('Kesalahan koneksi MQTT:', error);
      this.emit('error', error);
    });

    this.client.on('disconnect', () => {
      this.isConnected = false;
      this.emit('disconnected');
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
    } catch (error) {
      console.error(`Gagal fetch dan subscripe ke topic`);
    }
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      const payload : Sensor = JSON.parse(message.toString());
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

  public async refreshSubscription() {
    console.log('Memperbarui subscription MQTT sensor...');
    this.client.unsubscribe('#'); // Unsubscribe from all topics (or the current one)
    await this.subscribeToTopics();
  }

  public disconnect() {
    if (this.client) {
      this.client.end();
    }
    this.prisma.$disconnect();
  }
}

class DynamicTopicController {
  private hasSubscribed = false;
  private client: MqttClient;
  private prisma: PrismaClient;
  private mqttService: MQTTService;

  constructor(mqttService: MQTTService) {
    this.prisma = new PrismaClient();
    this.mqttService = mqttService;
    this.initializeMQTTClient();
  }
  
  private initializeMQTTClient() {
    const { broker, port, options } = mqttConfig;
    const connectUrl = `mqtt://${broker}:${port}`;

    const mqttOptions: IClientOptions = {
      ...options,
      clientId: `admin-${Math.random().toString(16)}`
    };
    this.client = mqtt.connect(connectUrl, mqttOptions);

    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    if (this.hasSubscribed) return;
    this.hasSubscribed = true;

    const topic = mqttConfig.topic;
    this.client.on('connect', () => {
      console.log('Terhubung ke MQTT broker');
      this.subscribeToTopic(topic || 'topic/suhu');
    });

    this.client.on('error', (error: Error) => {
      console.error('Kesalahan koneksi MQTT:', error);
    });

    this.client.on('message', this.handleMessage.bind(this));
  }

  private subscribeToTopic(topic: string) {
    this.client.subscribe(topic, (err: Error | null) => {
      if (err) {
        console.error(`Gagal subscribe ke topic ${topic}:`, err);
      } else {
        console.log(`Berhasil subscribe ke topic: ${topic}`);
      }
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
      this.emit('error', error);
    }
  }

  public publishMessage(topic: string, message: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('MQTT client tidak terhubung'));
        return;
      }

      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      
      this.client.publish(topic, payload, (err?: Error) => {
        if (err) {
          console.error(`Gagal publish ke topic ${topic}:`, err);
          reject(err);
        } else {
          console.log(`Berhasil publish ke topic: ${topic}`);
          resolve();
        }
      });
    });
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async disconnect() {
    if (this.client) {
      await new Promise<void>((resolve) => {
        this.client.end(false, () => {
          this.isConnected = false;
          resolve();
        });
      });
    }
    
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }
}

export default MQTTService;
