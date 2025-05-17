import { MongoClient } from 'mongodb';

let client: MongoClient;

export function configure(config: any, _layouts?: any) {
  const { connectionString, dbName, collectionName } = config;

  return async function (loggingEvent: any) {
    try {
      if (!client) {
        client = await MongoClient.connect(connectionString);
      }

      const db = client.db(dbName);
      const collection = db.collection(collectionName);

      await collection.insertOne({
        timestamp: loggingEvent.startTime,
        level: loggingEvent.level.levelStr,
        category: loggingEvent.categoryName,
        data: loggingEvent.data,
      });
    } catch (err) {
      console.error('MongoDB Logging Error:', err);
    }
  };
}

export function shutdown(cb: () => void) {
  if (client) {
    client.close().finally(cb);
  } else {
    cb();
  }
}
