import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testConnection() {
    console.log("Testing connection to:", process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@'));
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const res = await pool.query('SELECT NOW()');
        console.log("✅ Success:", res.rows[0]);
    } catch (err) {
        console.error("❌ Failed:", err);
    } finally {
        await pool.end();
    }
}

testConnection();
