import prisma from '../config/prisma';

interface ContextualData {
  metadata: {
    current_readings: {
      [key: string]: {
        value: number;
        timestamp: string;
      };
    };
  };
}

interface SensorReading {
  farmId: number;
  sensor_type: string;
  value: number;
}


export const dbService = {
  async saveSensorReading(data: SensorReading) {
    return await prisma.sensorReading.create({
      data
    });
  },

  async getLatestSensorReading() {
    return await prisma.sensorReading.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });
  },

  async getSensorReadingHistory(days: number = 30) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return await prisma.sensorReading.findMany({
      where: {
        createdAt: {
          gte: daysAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },
  
  async createAnalytic(
    label: string,
    trend: string,
    min: number,
    max: number,
    mean: number,
    sensorType: string,
    startDate: Date,
    endDate: Date
  ) {
    return await prisma.analytic.create({
      data: {
        label,
        trend,
        min, 
        max,
        mean,
        sensorType,
        startDate,
        endDate,
      }
    });
  },
  
  // Data contextual untuk Gemini AI
  async getContextualData(): Promise<ContextualData> {
    try {
      const history = await this.getSensorReadingHistory(30);
      return {
        metadata: {
          current_readings: history.reduce((acc, reading) => {
            acc[reading.sensor_type] = {
              value: reading.value,
              timestamp: reading.createdAt.toISOString()
            };
            return acc;
          }, {} as { [key: string]: { value: number; timestamp: string } })
        }
      };
    } catch (error) {
      console.error('Error in getContextualData:', error);
      throw error;
    }
  },

  async getFarmByName(name: string) {
    return await prisma.farm.findFirst({
      where: { name }
    });
  },

  async createFarm(name: string) {
    return await prisma.farm.create({
      data: { name }
    });
  },

  async ensureFarmExists(name: string) {
    let farm = await this.getFarmByName(name);
    if (!farm) {
      farm = await this.createFarm(name);
      console.log(`✨ Created new farm: ${name}`);
    }
    return farm;
  },

  async addTopic(farmName: string, sensorType: string, topic: string) {
    // Pastikan farm exists sebelum menambah topic
    const farm = await this.ensureFarmExists(farmName);
    
    return await prisma.topic.create({
      data: {
        farmId: farm.id,
        sensorType,
        topic
      }
    });
  },

  async getTopics(farmId?: number) {
    return await prisma.topic.findMany({
      where: farmId ? { farmId } : undefined,
      orderBy: {
        createdAt: 'desc'
      }
    });
  },

  async removeTopic(farmId: number, sensorType: string) {
    return await prisma.topic.delete({
      where: {
        farmId_sensorType: {
          farmId,
          sensorType
        }
      }
    });
  }
};
