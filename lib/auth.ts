import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const jwtSecret = process.env.JWT_SECRET;
const isDev = process.env.NODE_ENV === 'development';

if (!isDev && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET environment variable must be set and at least 32 characters');
}

const SECRET_KEY = new TextEncoder().encode(
  jwtSecret || 'dev-secret-key-for-local-development-only'
);

export interface JWTPayload {
  email: string;
  role: 'user' | 'organizer' | 'admin';
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}