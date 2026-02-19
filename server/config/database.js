import mysql from "mysql2/promise";
import dotenv from "dotenv";
import createAllTables from "../utils/dbUtils.js";
import { insertDefaultData } from "../scripts/insert_admin_data.js";
import { addSupplierIdToItemMaster } from "../scripts/add_supplier_id_to_item_master.js";

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'kitcottc_healthsynclionbitn',
    // user: process.env.DB_USER || 'kitcottc_smartstock',
    password: process.env.DB_PASSWORD || 'rootroot',
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'kitcottc_smartstock',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

export const pool = mysql.createPool(dbConfig);

export async function initDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password 
    })
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await connection.end();
        
        await createAllTables();
        await addSupplierIdToItemMaster();
        await insertDefaultData();
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

export default pool;