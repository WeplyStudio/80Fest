import { MongoClient, Collection, Document } from 'mongodb';
import type { Artwork } from './types';

// The MONGODB_URI is hardcoded here to bypass environment variable loading issues.
// In a production environment, it's highly recommended to use environment variables.
const uri = "mongodb+srv://hahahalucukokrek:Z5ImxXzsGeS4QkJF@cluster0.u4gea61.mongodb.net/VisiKreasi";

if (!uri) {
  throw new Error('MongoDB URI is not defined.');
}

const options = {
    tls: true,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb() {
    const client = await clientPromise;
    return client.db();
}

export async function getArtworksCollection(): Promise<Collection<Document>> {
    const db = await getDb();
    return db.collection('artworks');
}
