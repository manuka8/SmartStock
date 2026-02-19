import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'kitcottc_healthsynclionbitn',
    password: process.env.DB_PASSWORD || 'rootroot',
    database: process.env.DB_NAME || 'kitcottc_smartstock',
};

async function updateEnum() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        console.log('Altering inventory_transactions table...');
        
        await connection.execute(`
            ALTER TABLE inventory_transactions 
            MODIFY COLUMN reference_type 
            ENUM('PURCHASE','SALE','VEHICLE_TRANSFER', 'VEHICLE_RETURN','DAMAGE','MANUAL', 'SALE_FREE')
        `);

        console.log('✅ Successfully updated reference_type ENUM.');

    } catch (error) {
        console.error('❌ Error updating ENUM:', error);
    } finally {
        if (connection) await connection.end();
    }
}

updateEnum();
