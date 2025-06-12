import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { PrismaClient } from '@prisma/client';
import EventEmitter from 'events';

export interface IMQTTConfig {
  broker: string;
  port: number;
  clientId: string;
  // topic: string;
  options?: IClientOptions;
}

export type MessageHandler = (topic: string, payload: any) => void | Promise<void>;

export class MQTTService extends EventEmitter {
  private _client: MqttClient;
  private prisma?: PrismaClient;
  private config: IMQTTConfig;
  private isConnected: boolean = false;

  // Getter untuk client property
  get client(): MqttClient {
    return this._client;
  }

  constructor(config: IMQTTConfig, useDatabase: boolean = true) {
    super();
    this.config = config;
    
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

    this._client = mqtt.connect(connectUrl, mqttOptions);
    this.setupEventHandlers();
  }

  private async loadAndSubscribeTopics() {
    try {
      // Get all topics from database
      const topics = await this.prisma?.topic.findMany();
      
      if (topics && topics.length > 0) {
        console.log('📥 Loading topics from database...');
        
        // Subscribe to each topic
        for (const topicData of topics) {
          await this.client.subscribe(topicData.topic);
          console.log(`✅ Subscribed to: ${topicData.topic} (${topicData.farmId} - ${topicData.sensorType})`);
        }
        
        console.log(`✨ Successfully subscribed to ${topics.length} topics`);
      } else {
        console.log('ℹ️ No topics found in database');
      }
    } catch (error) {
      console.error('❌ Error loading topics:', error);
    }
  }

  private setupEventHandlers() {
    this.client.on('connect', async () => {
      console.log('Terhubung ke MQTT broker');
      this.isConnected = true;
      
      // Load and subscribe to topics when connected
      await this.loadAndSubscribeTopics();
      
      // this.client.subscribe(this.config.topic);
      this.emit('connected');

      this.client.on('error', (error: Error) => {
        console.error('Kesalahan koneksi MQTT:', error);
        this.emit('error', error);
      });

      this.client.on('disconnect', () => {
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.client.on('message', this.handleMessage.bind(this));
    });
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`[Received] Topic: ${topic}, Payload:`, payload);

      // Get topic configuration 
      const topicConfig = await this.prisma?.topic.findFirst({
        where: { topic },
        include: { farm: true }
      });

      if (!topicConfig) {
        console.log(`[MQTT] No topic configuration found for ${topic}`);
        return;
      }

      // Emit message with farm info
      this.emit('message', topic, { ...payload, farmId: topicConfig.farmId });
      
    } catch (error) {
      console.error(`[MQTTService] Error processing message:`, error);
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
      
      this._client.publish(topic, payload, (err?: Error) => {
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
    if (this._client) {
      await new Promise<void>((resolve) => {
        this._client.end(false, () => {
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

// MQTTService is exported as named export above
