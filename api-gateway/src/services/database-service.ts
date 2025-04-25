import prisma from '../config/prisma';

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
  
  // Analytics
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
  async getContextualData() {
    const farms = await prisma.farm.findMany();
    const contextData = [];
    
    for (const farm of farms) {
      const sensorTypes = ['temperature', 'humidity', 'soil_moisture', 'light'];
      const farmData: any = {
        farm_name: farm.name,
        sensors: {}
      };
      
      for (const sensorType of sensorTypes) {
        const latestReading = await this.getLatestSensorReading(farm.id, sensorType);
        if (latestReading) {
          farmData.sensors[sensorType] = {
            value: latestReading.value,
            timestamp: latestReading.createdAt.toLocaleString('id-ID')
          };
        }
      }
      
      contextData.push(farmData);
    }
    
    return contextData;
  }
}; 