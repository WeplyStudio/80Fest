
import { MongoClient, Collection, Document } from 'mongodb';
import type { Artwork } from './types';

const uri = process.env.MONGODB_URI || "mongodb+srv://hahahalucukokrek:Z5ImxXzsGeS4QkJF@cluster0.u4gea61.mongodb.net/80Fest";

if (!uri) {
  throw new Error('MongoDB URI is not defined. Please add it to your .env.local file');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Extend the NodeJS global type to include a MongoDB client promise
declare const global: {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, { tls: true });
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, { tls: true });
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

export async function getSettingsCollection(): Promise<Collection<Document>> {
    const db = await getDb();
    return db.collection('settings');
}
