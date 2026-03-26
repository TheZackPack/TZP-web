import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL ?? null;
}

export function hasDatabase(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getPool(): Pool {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured");
    }

    pool = new Pool({
      connectionString,
      max: 10,
      ssl:
        process.env.PGSSLMODE === "disable"
          ? false
          : { rejectUnauthorized: false },
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
