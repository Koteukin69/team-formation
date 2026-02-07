import { SignJWT, jwtVerify } from 'jose';
import { JWTPayload, Role } from "./types";

const jwtSecret: string | undefined = process.env.JWT_SECRET;
const isProd: boolean = process.env.NODE_ENV === 'production';

if (isProd && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET environment variable must be set and at least 32 characters');
}

const SECRET_KEY: Uint8Array<ArrayBuffer> = new TextEncoder().encode(
  jwtSecret || 'dev-secret-key-for-local-development-only'
);

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

export async function getAccessLevel(role?: Role): Promise<number> {
  return role == "admin" ? 3 : role == "organizer" ? 2 : role == "user" ? 1 : 0;
}