import { pool } from '../src/db.js';

const [rows] = await pool.query<any[]>('SHOW COLUMNS FROM experiments');
console.log(rows.map((c) => c.Field).join('\n'));
await pool.end();
