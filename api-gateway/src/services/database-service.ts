import prisma from '../config/prisma';

interface ContextualData {
  metadata: {
    total_farms: number;
    timestamp: string;
    available_sensors: string[];
  };
  farms: Array<{
    farm_info: {
      id: number;
      name: string;
    };
    current_readings: {
      [key: string]: {
        value: number;
        timestamp: string;
      };
    };
    latest_analytics: {
      [key: string]: {
        trend: string;
        summary: {
          min: number;
          max: number;
          mean: number;
        };
        period: {
          start: string;
          end: string;
        };
      };
    };
  }>;
}

type SensorReading = {
  sensor_type: string;
  value: number;
  createdAt: Date;
};

type Analytic = {
  sensor_type: string;
  trend: string;
  min: number;
  max: number;
  mean: number;
  startDate: Date;
  endDate: Date;
};

type Farm = {
  id: number;
  name: string;
  sensor_reading: SensorReading[];
  Analytic: Analytic[];
};

export const dbService = {
  async createFarm(name: string) {
    return await prisma.farm.create({
      data: { name }
    });
  },
  
  async getFarmByName(name: string) {
    return await prisma.farm.findFirst({
      where: { name }
    });
  },
  
  async getAllFarms() {
    return await prisma.farm.findMany();
  },
  
  async saveSensorReading(farmId: number, sensorType: string, value: number) {
    return await prisma.sensorReading.create({
      data: {
        farm_id: farmId,
        sensor_type: sensorType,
        value
      }
    });
  },
  
  async getLatestSensorReading(farmId: number, sensorType: string) {
    return await prisma.sensorReading.findFirst({
      where: {
        farm_id: farmId,
        sensor_type: sensorType
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },
  
  async getSensorReadingHistory(farmId: number, sensorType: string, days: number = 30) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return await prisma.sensorReading.findMany({
      where: {
        farm_id: farmId,
        sensor_type: sensorType,
        createdAt: {
          gte: daysAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },
  
  async getAllTopics() {
    return await prisma.topic.findMany();
  },
  
  async createTopic(name: string, url: string) {
    return await prisma.topic.create({
      data: {
        name,
        url
      }
    });
  },
  
  async getTopicByName(name: string) {
    return await prisma.topic.findFirst({
      where: {
        name
      }
    });
  },
  
  async deleteTopic(id: number) {
    return await prisma.topic.delete({
      where: {
        id
      }
    });
  },
  
  async createAnalytic(
    sensor_type: string,
    label: string,
    trend: string,
    min: number,
    max: number,
    mean: number,
    startDate: Date,
    endDate: Date,
    farm_id: number
  ) {
    return await prisma.analytic.create({
      data: {
        sensor_type,
        label,
        trend,
        min, 
        max,
        mean,
        startDate,
        endDate,
        farm_id
      }
    });
  },
  
  // Data contextual untuk Gemini AI
  async getContextualData(): Promise<ContextualData> {
    try {
      // Ambil semua farm beserta relasinya
      const farms = await prisma.farm.findMany({
        include: {
          sensor_reading: {
            orderBy: {
              createdAt: 'desc'
            },
            distinct: ['sensor_type'],
            where: {
              sensor_type: {
                in: ['temperature', 'humidity', 'soil_moisture', 'light']
              }
            }
          },
          Analytic: {
            orderBy: {
              createdAt: 'desc'
            },
            where: {
              sensor_type: {
                in: ['temperature', 'humidity', 'soil_moisture', 'light']
              }
            },
            take: 1
          }
        }
      });

      const contextData = farms.map((farm: Farm) => ({
        farm_info: {
          id: farm.id,
          name: farm.name
        },
        current_readings: farm.sensor_reading.reduce<{[key: string]: { value: number; timestamp: string }}>((acc, reading) => {
          acc[reading.sensor_type] = {
            value: reading.value,
            timestamp: reading.createdAt.toLocaleString('id-ID')
          };
          return acc;
        }, {}),
        latest_analytics: farm.Analytic.reduce<{[key: string]: { trend: string; summary: { min: number; max: number; mean: number }; period: { start: string; end: string } }}>((acc, analytic) => {
          acc[analytic.sensor_type] = {
            trend: analytic.trend,
            summary: {
              min: analytic.min,
              max: analytic.max,
              mean: analytic.mean
            },
            period: {
              start: analytic.startDate.toLocaleString('id-ID'),
              end: analytic.endDate.toLocaleString('id-ID')
            }
          };
          return acc;
        }, {})
      }));

      return {
        metadata: {
          total_farms: farms.length,
          timestamp: new Date().toLocaleString('id-ID'),
          available_sensors: ['temperature', 'humidity', 'soil_moisture', 'light']
        },
        farms: contextData
      };
      
    } catch (error) {
      console.error('Error in getContextualData:', error);
      throw error;
    }
  }
};
