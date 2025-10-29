/* eslint-disable n/no-process-env */
import { NodeEnvs } from '.';

interface Env {
  NodeEnv: NodeEnvs;
  Port: number;
  MongoUri: string;
  BookingBufferMin: number;
}

function parseNodeEnv(): NodeEnvs {
  const v = process.env.NODE_ENV;
  const values = Object.values(NodeEnvs) as string[];
  if (v && values.includes(v)) return v as NodeEnvs;
  return NodeEnvs.Dev;
}

function requireString(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function parseNumber(name: string, def?: number): number {
  const raw = process.env[name];
  if (raw == null || raw === '') {
    if (def !== undefined) return def;
    throw new Error(`Missing env ${name}`);
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid number for ${name}: "${raw}"`);
  }
  return n;
}

const ENV: Env = {
  NodeEnv: parseNodeEnv(),
  Port: parseNumber('PORT', 3000),
  MongoUri: requireString('MONGO_URI'),
  BookingBufferMin: parseNumber('BOOKING_BUFFER_MIN', 5),
};

export default ENV;
