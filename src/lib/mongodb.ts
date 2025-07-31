import { MongoClient, Collection, Document } from 'mongodb';
import type { Artwork } from './types';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

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

export async function getArtworks(): Promise<Artwork[]> {
    const collection = await getArtworksCollection();
    const artworks = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Convert ObjectId to string for client-side usage
    return artworks.map(art => ({
        ...art,
        id: art._id.toString(),
    })) as unknown as Artwork[];
}
