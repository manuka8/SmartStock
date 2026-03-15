import express from "express"; // Force reload check
import dotenv from "dotenv"
import cors from "cors";
import { initDatabase } from "./config/database.js";
import authRoutes from './routes/auth.js'
import inventoryRoutes from './routes/inventory.js'
import itemMasterRoutes from './routes/itemMaster.js'
import inventoryManagementRoutes from './routes/inventoryManagement.js'
import inventoryTransactionsRoutes from './routes/inventoryTransactions.js'
import supplierRoutes from './routes/suppliers.js'
import agencyRoutes from './routes/agencies.js'
import customerRoutes from './routes/customers.js'
import grnRoutes from './routes/grn.js'
import vehicleRoutes from './routes/vehicles.js'
import vehicleStockTransferRoutes from './routes/vehicleStockTransfers.js'
import vehicleSalesRoutes from './routes/vehicleSales.js'
import invoiceRoutes from './routes/invoices.js'
import salesReturnsRoutes from './routes/salesReturns.js'
import employeeRoutes from './routes/employee.js'
import financeRoutes from './routes/finance.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8091

// CORS middleware - Allow all origins for development and production
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://localhost','https://smartstock.gamer.gd','	http://163.245.221.172'], // Allow specific origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Log all incoming requests with origin
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('origin') || 'No origin'}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/itemMaster', itemMasterRoutes);
app.use('/api/inventoryManagement', inventoryManagementRoutes);
app.use('/api/inventoryTransactions', inventoryTransactionsRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/grn', grnRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicleStockTransfers', vehicleStockTransferRoutes);
app.use('/api/vehicleSales', vehicleSalesRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/salesReturns', salesReturnsRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/finance', financeRoutes);

app.get('/api/health', (req, res) => {
    res.json({status: '✅ OK', message: '🚀 Smart Stock Lion:Bit API is running on port ${PORT}'})
})

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    status: '✅ CORS OK', 
    origin: req.get('origin'),
    message: '🛡️ CORS is working properly' 
  });
});


initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🦁 Smart Stock Lion:Bit Server running on port ${PORT}`);
        console.log(`🌍 API Health Check: http://localhost:${PORT}/api/health`);
        console.log(`🛡️  CORS enabled for methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`);
        console.log(`🔧 CORS Test Check: http://localhost:${PORT}/api/cors-test`);
    }).on('error', (err) => {
        console.error('❌ Server failed to start:', err);
    });
}).catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    console.error('Error details:', error.message);
    process.exit(1);
});
