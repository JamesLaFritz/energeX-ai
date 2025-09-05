import mysql from 'mysql2/promise';
import { env } from './env.js';


export const pool = mysql.createPool({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
});


export async function pingMySQL() {
    await pool.query('SELECT 1');
}