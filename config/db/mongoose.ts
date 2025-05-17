import { MongooseModuleOptions } from '@nestjs/mongoose';

export const mongooseConfig = {
  uri: process.env.MONGODB_CONNECTION_STRING,
  maxPoolSize: Number(process.env.MONGO_POOL_SIZE || 50),
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
  directConnection: false,
  autoIndex: process.env.NODE_ENV !== 'production',
} as MongooseModuleOptions;