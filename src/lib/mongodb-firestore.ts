import { MongoClient } from 'mongodb';

/**
 * MongoDB client for Firestore via Google Cloud MongoDB compatibility
 * Allows querying Firestore collections as MongoDB documents
 */

let cachedClient: MongoClient | null = null;

export async function connectToMongoDB(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const MONGODB_URI = process.env.FIRESTORE_MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('FIRESTORE_MONGODB_URI is not defined in environment variables');
  }

  try {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    console.log('Connected to Firestore via MongoDB');
    
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('Error connecting to MongoDB/Firestore:', error);
    throw error;
  }
}

export async function getMongoDBDatabase() {
  const client = await connectToMongoDB();
  return client.db('ovomonie');
}

export async function getMongoDBCollection(collectionName: string) {
  const db = await getMongoDBDatabase();
  return db.collection(collectionName);
}

export async function closeMongoDBConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    console.log('Disconnected from MongoDB/Firestore');
  }
}
