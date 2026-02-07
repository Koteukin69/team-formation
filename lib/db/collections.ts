import { Collection, Db, Document } from 'mongodb';
import clientPromise from './mongodb';
import type { User, Marathon, EmailCode, TelegramCode } from '@/lib/types';

const DB_NAME = process.env.MONGODB_NAME || 'db';

async function getDb() {
  const client = await clientPromise
  return client.db(DB_NAME)
}

export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  const db: Db = await getDb();
  return db.collection<T>(name);
}

export const collections = {
  marathons: () => { return getCollection<Marathon>("marathons") },
  users: () => { return getCollection<User>("users") },
  emailCodes: () => { return getCollection<EmailCode>("emailCodes") },
  telegramCodes: () => { return getCollection<TelegramCode>("telegramCodes") },
}