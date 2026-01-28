import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

interface MongoClientCache {
  client: MongoClient | null
  promise: Promise<MongoClient> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientCache: MongoClientCache | undefined
}

const cached: MongoClientCache = global._mongoClientCache ?? {
  client: null,
  promise: null,
}

if (!global._mongoClientCache) {
  global._mongoClientCache = cached
}

export async function getMongoClient(): Promise<MongoClient> {
  if (cached.client) {
    return cached.client
  }

  if (!cached.promise) {
    cached.promise = MongoClient.connect(MONGODB_URI!).then((client) => {
      cached.client = client
      return client
    })
  }

  return cached.promise
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient()
  return client.db()
}
