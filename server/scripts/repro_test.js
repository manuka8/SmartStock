
// import fetch from 'node-fetch'; // Removed

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:8091/api';
const UNIQUE = Date.now();
const USER_EMAIL = `test_${UNIQUE}@test.com`;
const USER_PASS = 'password123';
const LOG_FILE = path.join(__dirname, 'test_output.txt');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, msg + '\n');
}

async function apiCall(url, method, headers, body) {
  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API Error ${url}: ${res.status} ${txt}`);
    }
    return await res.json();
  } catch (e) {
    log(`Failed call to ${url}: ${e}`);
    throw e;
  }
}

async function runTest() {
  fs.writeFileSync(LOG_FILE, ''); // Clear log
  log('--- STARTING AUTOMATED REPRO TEST ---');
  
  // Get an agency ID directly from DB
  let agencyId = 1;
  try {
      const [rows] = await pool.execute('SELECT id FROM agencies LIMIT 1');
      if (rows.length > 0) {
          agencyId = rows[0].id;
          log('Found existing agency ID: ' + agencyId);
      } else {
          log('No agencies found in DB. Creating one manually via DB...');
          const [res] = await pool.execute("INSERT INTO agencies (agency_name, registration_number, email, phone_number, address_line1, city, district, postal_code, owner_name, status) VALUES ('Test Agency', 'REG123', 'agency@test.com', '1234567890', '123 St', 'City', 'Dist', '12345', 'Owner', 'active')");
          agencyId = res.insertId;
          log('Created Agency ID: ' + agencyId);
      }
  } catch (err) {
      log('DB Setup Error: ' + err);
  }

  try {
      // 1. Signup
      log('1. Signing up...');
      const authData = await apiCall(`${BASE_URL}/auth/signup`, 'POST', {'Content-Type': 'application/json'}, {
        email: USER_EMAIL,
        password: USER_PASS,
        first_name: 'Test',
        last_name: 'User',
        role: 'owner',
        agency_id: agencyId
      });
      
      const token = authData.token;
      log('User created. Agency ID: ' + authData.user.agency_id);
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // 2. Create Vehicle
      log('2. Creating Vehicle...');
      const vehicleData = await apiCall(`${BASE_URL}/vehicles/createVehicle`, 'POST', headers, {
        vehicle_code: `V-${UNIQUE}`,
        vehicle_number: `AB-${UNIQUE}`,
        vehicle_type: 'Truck',
        status: 'Active'
      });
      const vehicleId = vehicleData.vehicleId;
      log('Vehicle ID: ' + vehicleId);

      // 3. Create Item
      log('3. Creating Item...');
      const itemData = await apiCall(`${BASE_URL}/itemMaster/addItem`, 'POST', headers, {
        item_code: `ITM-${UNIQUE}`,
        item_name: `Test Item ${UNIQUE}`,
        unit: 'pcs',
        buying_price: 100,
        selling_price_1: 150,
        agency_id: agencyId 
      });
      const itemId = itemData.itemId;
      log('Item ID: ' + itemId);

      // 4. Add Initial Stock (100)
      log('4. Adding Initial Stock (100)...');
      await apiCall(`${BASE_URL}/inventoryTransactions/createTransaction`, 'POST', headers, {
        item_id: itemId,
        transaction_type: 'IN',
        quantity: 100,
        unit_cost: 100,
        note: 'Initial Stock',
        reference_type: 'MANUAL',
        reference_id: 0
      });

      // Verify Stock
      const invData = await apiCall(`${BASE_URL}/inventoryManagement/getAllInventory`, 'GET', headers);
      if (invData.inventory) {
          const itemInv = invData.inventory.find(i => i.item_id === itemId);
          log('Initial Inventory: ' + (itemInv ? itemInv.current_quantity : 'ITEM NOT FOUND IN INV'));
      } else {
          log('Initial Inventory Check Failed: ' + JSON.stringify(invData));
      }

      // 5. Load to Vehicle (50)
      log('5. Loading to Vehicle (50)...');
      await apiCall(`${BASE_URL}/vehicleStockTransfers/loading`, 'POST', headers, {
        vehicle_id: vehicleId,
        transfer_date: new Date().toISOString().split('T')[0],
        items: [{ item_id: itemId, quantity: 50 }]
      });

      // Verify Main (50) and Vehicle (50)
      const vInvData = await apiCall(`${BASE_URL}/vehicleStockTransfers/vehicle-inventory`, 'GET', headers);
      let vItem = null;
      if (vInvData.data && vInvData.data.vehicles) {
          vInvData.data.vehicles.forEach(v => {
              if (v.vehicle_id == vehicleId) {
                 const found = v.items.find(i => i.item_id == itemId);
                 if (found) vItem = found;
              }
          });
      }
      log('Vehicle Inv after Load: ' + (vItem ? vItem.quantity : 'NOT FOUND'));

      // 6. Make Sale (10)
      log('6. Making Sale (10)...');
      await apiCall(`${BASE_URL}/vehicleSales/createSale`, 'POST', headers, {
        vehicle_id: vehicleId,
        sale_date: new Date().toISOString().split('T')[0],
        items: [{
            item_id: itemId,
            quantity: 10,
            unit_price: 150
        }],
        payment_method: 'CASH',
        cash_amount: 1500
      });

      // Verify Vehicle Should be 40
      const vInvData2 = await apiCall(`${BASE_URL}/vehicleStockTransfers/vehicle-inventory`, 'GET', headers);
      let vItem2 = null;
      if (vInvData2.data && vInvData2.data.vehicles) {
           vInvData2.data.vehicles.forEach(v => {
              if (v.vehicle_id == vehicleId) {
                 const found = v.items.find(i => i.item_id == itemId);
                 if (found) vItem2 = found;
              }
          });
      }
      log('Vehicle Inv after Sale: ' + (vItem2 ? vItem2.quantity : 'NOT FOUND'));

      // 7. Unload (Remaining 40)
      log('7. Unloading (40)...');
      await apiCall(`${BASE_URL}/vehicleStockTransfers/unloading`, 'POST', headers, {
        vehicle_id: vehicleId,
        transfer_date: new Date().toISOString().split('T')[0],
        items: [{ item_id: itemId, quantity: 40 }]
      });
      
      // Verify Main Inventory
      const invDataFinal = await apiCall(`${BASE_URL}/inventoryManagement/getAllInventory`, 'GET', headers);
      if (invDataFinal.inventory) {
          const itemInvFinal = invDataFinal.inventory.find(i => i.item_id === itemId);
          log('Final Main Inventory: ' + (itemInvFinal ? itemInvFinal.current_quantity : 'NOT FOUND'));
      } else {
          log('Final Inventory Check Failed: ' + JSON.stringify(invDataFinal));
      }

  } catch (err) {
      log("TEST FAILED: " + err);
  } finally {
      if (pool) await pool.end();
  }
}

runTest();
