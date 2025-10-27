import * as bcrypt from 'bcrypt';
import {
  sign as jwtSign,
  verify as jwtVerify,
  SignOptions,
  JwtPayload,
} from 'jsonwebtoken';

const SALT_ROUNDS = 10;

// single env read (allow here)
// eslint-disable-next-line n/no-process-env
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me';

/** Hash a plaintext password */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Verify a plaintext password against a stored hash */
export function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
   
  return bcrypt.compare(plain, hash);
}

/** Create a JWT token */
export function createToken(
  payload: object,
  options: SignOptions = { expiresIn: '7d' },
): string {
  return jwtSign(payload, JWT_SECRET, options);
}

/** Verify a JWT token */
export function verifyToken<
  T extends JwtPayload | string = JwtPayload
>(token: string): T {
  return jwtVerify(token, JWT_SECRET) as T;
}
