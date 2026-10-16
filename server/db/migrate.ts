import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

async function runMigration() {
  console.log('🚀 Running NeonDB Schema Migration...');

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not set in environment or .env file.');
    console.log('👉 Please set DATABASE_URL=postgres://... in your .env file.');
    process.exit(1);
  }

  const schemaPath = path.join(process.cwd(), 'server', 'db', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    const sql = neon(databaseUrl);
    
    // Execute DDL statements
    console.log('⏳ Applying DDL schema to NeonDB...');
    
    // Strip SQL comments and split statements cleanly
    const cleanSql = schemaSql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await (sql as any).query(statement);
    }

    console.log('✅ Migration completed successfully!');
    console.log('   - Table `coins` created/verified.');
    console.log('   - Table `market_snapshots` created/verified.');
    console.log('   - Table `promotions` created/verified.');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message || err);
    process.exit(1);
  }
}

runMigration();
