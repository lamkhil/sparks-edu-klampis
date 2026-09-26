// Menjalankan supabase/migrations/*.sql yang belum pernah dijalankan (dicatat di public.schema_migrations).
// Dipakai otomatis saat build di Vercel (script "vercel-build"), atau manual: npm run db:migrate
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const candidates = [process.env.DATABASE_URL, process.env.POSTGRES_URL_NON_POOLING, process.env.POSTGRES_URL].filter(Boolean);
if (candidates.length === 0) {
  console.log("⚠ migrate: DATABASE_URL / POSTGRES_URL tidak diset, migrasi dilewati.");
  process.exit(0);
}

async function connect() {
  let lastErr;
  for (const raw of candidates) {
    // sslmode di URL membuat pg memverifikasi sertifikat secara ketat; atur SSL manual.
    const url = new URL(raw);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("supa");
    const local = ["localhost", "127.0.0.1"].includes(url.hostname) || url.hostname.startsWith("/");
    const client = new pg.Client({ connectionString: url.toString(), ssl: local ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    try {
      await client.connect();
      return client;
    } catch (e) {
      lastErr = e;
      console.log(`… gagal konek ke ${url.hostname}: ${e.message}`);
    }
  }
  throw lastErr;
}

const dir = join(process.cwd(), "supabase/migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const db = await connect();
try {
  await db.query(`create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now());
                  alter table public.schema_migrations enable row level security;`);
  const { rows } = await db.query("select name from public.schema_migrations");
  const done = new Set(rows.map((r) => r.name));
  let n = 0;
  for (const f of files) {
    if (done.has(f)) continue;
    process.stdout.write(`→ ${f} … `);
    await db.query("begin");
    try {
      await db.query(readFileSync(join(dir, f), "utf8"));
      await db.query("insert into public.schema_migrations (name) values ($1)", [f]);
      await db.query("commit");
      console.log("ok");
      n++;
    } catch (e) {
      await db.query("rollback");
      console.log("GAGAL");
      throw e;
    }
  }
  console.log(n ? `✅ ${n} migrasi dijalankan.` : "✅ Database sudah terbaru.");
} finally {
  await db.end();
}
