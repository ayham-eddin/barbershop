import { hash as bcryptHash, compare as bcryptCompare } from 'bcrypt';
import {
  sign as jwtSign,
  verify as jwtVerify,
  SignOptions,
  JwtPayload,
} from 'jsonwebtoken';

const SALT_ROUNDS = 10;

// eslint-disable-next-line n/no-process-env
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me';

export function hashPassword(plain: string): Promise<string> {
  return bcryptHash(plain, SALT_ROUNDS);
}

export function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcryptCompare(plain, hash);
}

export function createToken(
  payload: object,
  options: SignOptions = { expiresIn: '7d' },
): string {
  return jwtSign(payload, JWT_SECRET, options);
}

export function verifyToken<
  T extends JwtPayload | string = JwtPayload
>(token: string): T {
  return jwtVerify(token, JWT_SECRET) as T;
}
