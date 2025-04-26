import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { PrismaClient } from '@prisma/client';
import EventEmitter from 'events';

export interface IMQTTConfig {
  broker: string;
  port: number;
  clientId: string;
  topics?: string[];
  options?: IClientOptions;
}

export type MessageHandler = (topic: string, payload: any) => void | Promise<void>;

export class MQTTService extends EventEmitter {
  private client: MqttClient;
  private prisma?: PrismaClient;
  private topicHandlers: Map<string, MessageHandler>;
  private config: IMQTTConfig;
  private isConnected: boolean = false;

  constructor(config: IMQTTConfig, useDatabase: boolean = true) {
    super();
    this.config = config;
    this.topicHandlers = new Map();
    
    try {
      if (useDatabase) {
        this.prisma = new PrismaClient();
      }
      
      this.initializeMQTTClient();
    } catch (error) {
      console.error('Failed to initialize MQTT service:', error);
      throw error;
    }
  }

  private initializeMQTTClient() {
    const { broker, port, clientId, options } = this.config;
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
      
      if (this.config.topics) {
        this.subscribeToTopics(this.config.topics);
      }
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

  public async subscribeToTopics(topics: string[]) {
    for (const topic of topics) {
      await this.subscribeTopic(topic);
    }
  }

  public async subscribeTopic(topic: string): Promise<void> {
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

  public async unsubscribeTopic(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.unsubscribe(topic, (error) => {
        if (error) {
          console.error(`Gagal unsubscribe dari topic ${topic}:`, error);
          reject(error);
        } else {
          this.topicHandlers.delete(topic);
          console.log(`Berhasil unsubscribe dari topic: ${topic}`);
          resolve();
        }
      });
    });
  }

  public setTopicHandler(topic: string, handler: MessageHandler) {
    this.topicHandlers.set(topic, handler);
  }

  public removeTopicHandler(topic: string) {
    this.topicHandlers.delete(topic);
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      const payload = JSON.parse(message.toString());

      this.emit('message', topic, payload);

      const handler = this.topicHandlers.get(topic);
      if (handler) {
        await handler(topic, payload);
      } else {
        console.log(`[MQTTService] No specific handler found for topic ${topic}.`);
      }

    } catch (error) {
      console.error(`[MQTTService] Error processing message on topic ${topic}:`, error); 
      this.emit('error', error);
    }
  }

  public async publishMessage(topic: string, message: any): Promise<void> {
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
