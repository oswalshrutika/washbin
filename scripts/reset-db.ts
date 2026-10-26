// Dev only: drops every table in the public schema so migrations + seed can rebuild it.
import "dotenv/config";
import { Client } from "pg";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset a production database");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;");
  await client.end();
  console.log("Database reset");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
