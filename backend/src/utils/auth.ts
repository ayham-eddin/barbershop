import * as bcrypt from 'bcrypt';
import {
  sign as jwtSign,
  verify as jwtVerify,
  type SignOptions,
  type JwtPayload,
} from 'jsonwebtoken';

const SALT_ROUNDS = 10;

// eslint-disable-next-line n/no-process-env
const JWT_SECRET: string = process.env.JWT_SECRET ?? 'dev_secret_change_me';

// The JWT payload we store inside tokens
export interface AuthTokenPayload extends JwtPayload {
  sub: string;       // user id
  role?: string;     // 'user' or 'admin'
}

/** Hash a plaintext password */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Verify a plaintext password against a stored hash */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Create a JWT token (includes user id + role) */
export function createToken(
  payload: AuthTokenPayload,
  options: SignOptions = { expiresIn: '7d' },
): string {
  return jwtSign(payload, JWT_SECRET, options);
}

/** Verify and return token payload */
export function verifyToken(token: string): AuthTokenPayload {
  return jwtVerify(token, JWT_SECRET) as AuthTokenPayload;
}
