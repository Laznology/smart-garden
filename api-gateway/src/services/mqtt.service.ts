import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { PrismaClient } from '@prisma/client';
import { mqttSensorConfig } from '../config/mqtt';
import EventEmitter from 'events';

class MQTTService extends EventEmitter {
  private client: MqttClient;
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  constructor() {
    super();
    try {
      this.prisma = new PrismaClient();
      this.initializeMQTTClient();
    } catch (error) {
      console.error('Failed to initialize MQTT service:', error);
      throw error;
    }
  }

  private initializeMQTTClient() {
    const { broker, port, clientId, options } = mqttSensorConfig;
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
    this.client.on('connect', () => {
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
    if (mqttSensorConfig.topics) {
      mqttSensorConfig.topics.forEach(topic => {
        this.subscribeTopic(topic);
      });
    }
  }

  public subscribeTopic(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error(`Gagal subscribe ke topic ${topic}:`, error);
          reject(error);
        } else {
          console.log(`Berhasil subscribe ke topic: ${topic}`);
          resolve();
        }
      });
    });
  }

  public unsubscribeTopic(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.unsubscribe(topic, (error) => {
        if (error) {
          console.error(`Gagal unsubscribe dari topic ${topic}:`, error);
          reject(error);
        } else {
          console.log(`Berhasil unsubscribe dari topic: ${topic}`);
          resolve();
        }
      });
    });
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`Menerima pesan dari topic ${topic}:`, payload);
      
      // Emit event for subscribers to handle
      this.emit('message', topic, payload);

      // Here you can add logic to save to database if needed
      // await this.prisma.sensorReading.create({
      //   data: {
      //     // Map payload to your database schema
      //   }
      // });
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