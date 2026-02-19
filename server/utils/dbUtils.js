import pool from "../config/database.js";

const agencyTableQuery = `
    CREATE TABLE IF NOT EXISTS agencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agency_id VARCHAR(50) UNIQUE NOT NULL,
        agency_name VARCHAR(255) NOT NULL,
        registration_number VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        logo_url VARCHAR(500),
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_agency_id (agency_id),
        INDEX idx_status (status)
    );
`;

const userTableQuery = `
    CREATE TABLE IF NOT EXISTS users(
        id INT AUTO_INCREMENT PRIMARY KEY,
        agency_id INT,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'owner', 'employee') NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        store_name VARCHAR(255),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
    );
`;

const itemMasterTableQuery = `
CREATE TABLE IF NOT EXISTS item_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    supplier_id INT,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),

    unit VARCHAR(20) NOT NULL,
    unit_size DECIMAL(10,2),

    buying_price DECIMAL(10,2) NOT NULL,
    selling_price_1 DECIMAL(10,2) NOT NULL,
    selling_price_2 DECIMAL(10,2),
    selling_price_3 DECIMAL(10,2),

    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    barcode VARCHAR(100),
    image_url VARCHAR(255),

    is_expirable BOOLEAN DEFAULT false,
    shelf_life_days INT,

    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (agency_id, item_code),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);
`;

const inventoryTableQuery = `
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,
    item_id INT NOT NULL,

    current_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 0,

    average_cost DECIMAL(10,2),
    last_purchase_cost DECIMAL(10,2),

    last_stock_in_date DATETIME,
    last_stock_out_date DATETIME,

    status ENUM('ACTIVE','OUT_OF_STOCK') DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (agency_id, item_id),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES item_master(id) ON DELETE CASCADE
);
`;

const inventoryTransactionsTableQuery = `
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,
    item_id INT NOT NULL,

    transaction_type ENUM('IN','OUT','ADJUSTMENT','RETURN') NOT NULL,
    quantity INT NOT NULL,

    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),

    reference_type ENUM('PURCHASE','SALE','VEHICLE_TRANSFER', 'VEHICLE_RETURN','DAMAGE','MANUAL','SALE_FREE'),
    reference_id INT,

    batch_number VARCHAR(100),
    expiry_date DATE,

    source_location ENUM('MAIN','VEHICLE','SUPPLIER','CUSTOMER'),
    destination_location ENUM('MAIN','VEHICLE','CUSTOMER','SCRAP'),


    note VARCHAR(255),
    performed_by INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES item_master(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);
`;

const suppliersTableQuery = `
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,

    supplier_code VARCHAR(50),
    supplier_name VARCHAR(255) NOT NULL,

    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),

    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    district VARCHAR(100),
    postal_code VARCHAR(20),

    tax_number VARCHAR(100),

    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (agency_id, supplier_code),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);
`;

const customersTableQuery = `
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,

    customer_code VARCHAR(50),
    customer_type ENUM('REGISTERED','WHOLESALE','VIP') DEFAULT 'REGISTERED',

    first_name VARCHAR(150),
    last_name VARCHAR(150),
    business_name VARCHAR(255),

    email VARCHAR(255),
    phone VARCHAR(20),

    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    district VARCHAR(100),
    postal_code VARCHAR(20),

    tax_number VARCHAR(100),

    credit_limit DECIMAL(10,2) DEFAULT 0.00,
    outstanding_balance DECIMAL(10,2) DEFAULT 0.00,
    credit_days INT DEFAULT 0,

    loyalty_points INT DEFAULT 0,
    total_purchases DECIMAL(12,2) DEFAULT 0.00,

    status ENUM('ACTIVE','INACTIVE','BLOCKED') DEFAULT 'ACTIVE',

    notes VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (agency_id, customer_code),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);
`;

const grnTableQuery = `
CREATE TABLE IF NOT EXISTS grn (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,
    supplier_id INT NOT NULL,

    grn_number VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(100),

    invoice_date DATE,
    due_date DATE,
    received_date DATE NOT NULL,

    source VARCHAR(100),
    warehouse VARCHAR(100),

    total_items INT DEFAULT 0,

    subtotal DECIMAL(12,2) DEFAULT 0.00,
    discount_total DECIMAL(12,2) DEFAULT 0.00,
    tax_total DECIMAL(12,2) DEFAULT 0.00,
    grand_total DECIMAL(12,2) DEFAULT 0.00,

    status ENUM('DRAFT','RECEIVED','CANCELLED') DEFAULT 'DRAFT',

    notes VARCHAR(500),

    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (agency_id, grn_number),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
`;

const grnItemsTableQuery = `
CREATE TABLE IF NOT EXISTS grn_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,
    grn_id INT NOT NULL,
    item_id INT NOT NULL,

    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,

    discount_percent DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,

    tax_percent DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,

    line_total DECIMAL(12,2) NOT NULL,

    batch_number VARCHAR(100),
    expiry_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (grn_id) REFERENCES grn(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES item_master(id)
);
`;

const vehiclesTableQuery = `
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,

    vehicle_code VARCHAR(50) UNIQUE NOT NULL,
    vehicle_number VARCHAR(50),

    vehicle_type ENUM('VAN','BIKE','TRUCK') DEFAULT 'VAN',
    ownership_type ENUM('OWN','RENTED') NOT NULL DEFAULT 'OWN',
    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);
`;

const vehicleInventoryTableQuery = `
CREATE TABLE IF NOT EXISTS vehicle_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    item_id INT NOT NULL,

    current_quantity INT NOT NULL DEFAULT 0,

    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (vehicle_id, item_id),

    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES item_master(id) ON DELETE CASCADE
);
`;

const vehicleStockTransfersTableQuery = `
CREATE TABLE IF NOT EXISTS vehicle_stock_transfers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    invoice_number VARCHAR(50),
    total_items INT DEFAULT 0,
    total_quantity INT DEFAULT 0,

    transfer_type ENUM('OUT','RETURN') NOT NULL,

    reference_number VARCHAR(50),
    transfer_date DATE NOT NULL,

    status ENUM('DRAFT','CONFIRMED','CANCELLED') DEFAULT 'DRAFT',

    created_by INT,
    notes VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agency_id) REFERENCES agencies(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
`;

const vehicleStockTransferItemsTableQuery = `
CREATE TABLE IF NOT EXISTS vehicle_stock_transfer_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,
    transfer_id INT NOT NULL,
    item_id INT NOT NULL,

    quantity INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agency_id) REFERENCES agencies(id),
    FOREIGN KEY (transfer_id) REFERENCES vehicle_stock_transfers(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES item_master(id)
);
`;

const vehicleSalesTableQuery = `
CREATE TABLE IF NOT EXISTS vehicle_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,
    vehicle_id INT NOT NULL,

    sale_date DATE NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,

    customer_name VARCHAR(255),
    customer_address VARCHAR(500),
    customer_phone VARCHAR(20),

    subtotal DECIMAL(12,2) DEFAULT 0.00,
    discount_total DECIMAL(12,2) DEFAULT 0.00,
    tax_total DECIMAL(12,2) DEFAULT 0.00,
    grand_total DECIMAL(12,2) DEFAULT 0.00,

    payment_method ENUM('CASH','CARD','CREDIT'),
    cash DECIMAL(12,2) DEFAULT 0.00,
    cheque DECIMAL(12,2) DEFAULT 0.00,
    status ENUM('DRAFT','COMPLETED','CANCELLED') DEFAULT 'DRAFT',

    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (agency_id, invoice_number),

    FOREIGN KEY (agency_id) REFERENCES agencies(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
`;

const vehicleSalesItemsTableQuery = `
CREATE TABLE IF NOT EXISTS vehicle_sales_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,
    vehicle_sale_id INT NOT NULL,
    item_id INT NOT NULL,

    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agency_id) REFERENCES agencies(id),
    FOREIGN KEY (vehicle_sale_id) REFERENCES vehicle_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES item_master(id)
);
`;

const salesReturnsTableQuery = `
    CREATE TABLE IF NOT EXISTS sales_returns (
        id INT AUTO_INCREMENT PRIMARY KEY,

        agency_id INT NOT NULL,
        invoice_id INT NOT NULL,
        vehicle_sale_id INT,
        vehicle_id INT,

        return_number VARCHAR(50) NOT NULL,
        return_date DATE NOT NULL,

        return_reason VARCHAR(255),

        market_return_total DECIMAL(12,2) DEFAULT 0.00,
        expired_return_total DECIMAL(12,2) DEFAULT 0.00,
        total_return_amount DECIMAL(12,2) DEFAULT 0.00,

        status ENUM('DRAFT','CONFIRMED','CANCELLED') DEFAULT 'DRAFT',

        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (agency_id, return_number),

        INDEX idx_return_date (return_date),
        INDEX idx_invoice_id (invoice_id),
        INDEX idx_vehicle_id (vehicle_id),

        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_sale_id) REFERENCES vehicle_sales(id) ON DELETE SET NULL,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
`;

const salesReturnItemsTableQuery = `
    CREATE TABLE IF NOT EXISTS sales_return_items (
        id INT AUTO_INCREMENT PRIMARY KEY,

        agency_id INT NOT NULL,
        sales_return_id INT NOT NULL,
        item_id INT NOT NULL,

        return_type ENUM('MARKET','EXPIRED') NOT NULL,

        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        line_total DECIMAL(12,2) NOT NULL,

        batch_number VARCHAR(100),
        expiry_date DATE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        INDEX idx_return_type (return_type),
        INDEX idx_item_id (item_id),

        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
        FOREIGN KEY (sales_return_id) REFERENCES sales_returns(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES item_master(id) ON DELETE CASCADE
    );
`;

const expiredStockTableQuery = `
    CREATE TABLE IF NOT EXISTS expired_stock (
        id INT AUTO_INCREMENT PRIMARY KEY,

        agency_id INT NOT NULL,
        item_id INT NOT NULL,
        vehicle_id INT,

        quantity INT NOT NULL,

        reason ENUM('EXPIRED','DAMAGED') DEFAULT 'EXPIRED',

        source ENUM('VEHICLE_RETURN','WAREHOUSE') DEFAULT 'VEHICLE_RETURN',

        reference_type ENUM('SALE_RETURN') NOT NULL,
        reference_id INT NOT NULL,

        recorded_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        INDEX idx_item_id (item_id),
        INDEX idx_vehicle_id (vehicle_id),

        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES item_master(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
    );
`;

const invoicesTableQuery = `
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,

    invoice_number VARCHAR(50) NOT NULL,
    invoice_type ENUM('VEHICLE_SALE','DIRECT_SALE','SERVICE','RETURN') DEFAULT 'VEHICLE_SALE',

    customer_name VARCHAR(255),
    customer_address VARCHAR(500),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),

    vehicle_id INT,
    vehicle_sale_id INT,

    subtotal DECIMAL(12,2) DEFAULT 0.00,
    discount_total DECIMAL(12,2) DEFAULT 0.00,
    tax_total DECIMAL(12,2) DEFAULT 0.00,
    grand_total DECIMAL(12,2) DEFAULT 0.00,

    payment_method ENUM('CASH','CARD','CREDIT','BANK_TRANSFER','CHEQUE'),
    payment_status ENUM('PAID','UNPAID','PARTIALLY_PAID') DEFAULT 'UNPAID',
    amount_paid DECIMAL(12,2) DEFAULT 0.00,
    amount_due DECIMAL(12,2) DEFAULT 0.00,
    cash_amount DECIMAL(12,2) DEFAULT 0.00,
    cheque_amount DECIMAL(12,2) DEFAULT 0.00,
    cash DECIMAL(12,2) DEFAULT 0.00,
    cheque DECIMAL(12,2) DEFAULT 0.00,
  
    invoice_date DATE,
    notes VARCHAR(500),

    status ENUM('DRAFT','SENT','PAID','OVERDUE','CANCELLED') DEFAULT 'DRAFT',

    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (agency_id, invoice_number),

    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_sale_id) REFERENCES vehicle_sales(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
`;

const employeeTableQuery = `
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    
    employee_type ENUM(
    'STAFF',
    'STORE_MANAGER',
    'ASSISTANT_MANAGER',
    'CASHIER',
    'SALES_ASSISTANT',
    'INVENTORY_OFFICER',
    'WAREHOUSE_STAFF',
    'DRIVER',
    'DRIVER_HELPER',
    'ACCOUNTANT',
    'PURCHASING_OFFICER',
    'CLEANER',
    'SECURITY',
    'IT_OPERATOR'
    ) DEFAULT 'STAFF',

    license_number VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);
`;

const transportationTableQuery = `
CREATE TABLE IF NOT EXISTS transportation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    trip_date DATE NOT NULL,
    origin VARCHAR(255),
    destination VARCHAR(255),
    route_details VARCHAR(500),
    load_description VARCHAR(500),
    purpose VARCHAR(255),
    status ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);
`;

const purchaseOrdersTableQuery = `
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    supplier_id INT NOT NULL,
    po_number VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    status ENUM('PENDING','APPROVED','RECEIVED','CANCELLED') DEFAULT 'PENDING',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (agency_id, po_number),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
`;

const salesTableQuery = `
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    customer_id INT,
    sales_number VARCHAR(50) NOT NULL,
    sales_date DATE NOT NULL,
    due_date DATE,
    total_items INT DEFAULT 0,
    subtotal DECIMAL(12,2) DEFAULT 0.00,
    discount_total DECIMAL(12,2) DEFAULT 0.00,
    tax_total DECIMAL(12,2) DEFAULT 0.00,
    grand_total DECIMAL(12,2) DEFAULT 0.00,
    amount_paid DECIMAL(12,2) DEFAULT 0.00,
    amount_due DECIMAL(12,2) DEFAULT 0.00,
    status ENUM('DRAFT','COMPLETED','CANCELLED') DEFAULT 'DRAFT',
    payment_status ENUM('PAID','UNPAID','PARTIALLY_PAID') DEFAULT 'UNPAID',
    notes VARCHAR(500),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (agency_id, sales_number),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
`;

const paymentsTableQuery = `
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    grn_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('CASH','CREDIT_CARD','BANK_TRANSFER','CHEQUE') NOT NULL,
    reference_number VARCHAR(100),
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (grn_id) REFERENCES grn(id) ON DELETE CASCADE
);
`;

const financeTableQuery = `
CREATE TABLE IF NOT EXISTS finance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    transaction_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type ENUM('INCOME', 'EXPENSE') NOT NULL,
    category VARCHAR(100),
    source VARCHAR(255),
    payment_method ENUM('CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'CHEQUE') NOT NULL,
    reference_number VARCHAR(100),
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);
`;

const loansTableQuery = `
CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    lender_name VARCHAR(255) NOT NULL,
    loan_amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('ACTIVE','PAID_OFF','DEFAULTED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);
`;

const loanPaymentsTableQuery = `
CREATE TABLE IF NOT EXISTS loan_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    loan_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);
`;

const salaryPaymentsTableQuery = `
CREATE TABLE IF NOT EXISTS salary_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    user_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('CASH','BANK_TRANSFER','CHEQUE') NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

const attendanceTableQuery = `
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    user_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('PRESENT','ABSENT','ON_LEAVE') NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

const payrollTableQuery = `
CREATE TABLE IF NOT EXISTS payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    user_id INT NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    gross_salary DECIMAL(12,2) NOT NULL,
    deductions DECIMAL(12,2) DEFAULT 0.00,
    net_salary DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

const taxRecordsTableQuery = `
CREATE TABLE IF NOT EXISTS tax_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    tax_year INT NOT NULL,
    tax_type ENUM('SALES_TAX','INCOME_TAX','VAT','OTHER') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    filing_date DATE,
    status ENUM('FILED','PENDING','OVERDUE') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);
`;

const auditLogsTableQuery = `
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    user_id INT,
    action_type VARCHAR(100) NOT NULL,
    action_details VARCHAR(500),
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
`;

const cashRegistryTableQuery = `
CREATE TABLE IF NOT EXISTS cash_registry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    date DATE NOT NULL,
    opening_balance DECIMAL(12,2) DEFAULT 0.00,
    closing_balance DECIMAL(12,2) DEFAULT 0.00,
    actual_cash DECIMAL(12,2) DEFAULT 0.00,
    difference DECIMAL(12,2) DEFAULT 0.00,
    status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
    notes VARCHAR(500),
    created_by INT,
    closed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (agency_id, date)
);
`;

const notificationsTableQuery = `
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    user_id INT,
    notification_type VARCHAR(100) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
`;

const settingsTableQuery = `
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value VARCHAR(500),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    UNIQUE (agency_id, setting_key)
);
`;

const customerCreditPaymentsTableQuery = `
CREATE TABLE IF NOT EXISTS customer_credit_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    customer_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD') NOT NULL,
    reference_number VARCHAR(100),
    notes VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
`;

const logsTableQuery = `
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    log_level ENUM('INFO','WARNING','ERROR','DEBUG') NOT NULL,
    message VARCHAR(1000) NOT NULL,
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);
`;

const reportsTableQuery = `
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_type ENUM('SALES','INVENTORY','FINANCIAL','CUSTOMER','SUPPLIER','EMPLOYEE') NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by INT,
    report_data TEXT,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);
`;

const maintenanceRecordsTableQuery = `
CREATE TABLE IF NOT EXISTS maintenance_records (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    agency_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    maintenance_date DATE NOT NULL,
    description VARCHAR(500),
    cost DECIMAL(10,2),
    performed_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);
`;

const fuelLogsTableQuery = `
CREATE TABLE IF NOT EXISTS fuel_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    log_date DATE NOT NULL,
    fuel_amount DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    mileage INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);
`;

const createTable = async (tableName, query) => {
  try {
    await pool.query(query);
    console.log(`✅ ${tableName} is created or already exists`);
  } catch (error) {
    console.error(`❌ error creating table ${tableName}`, error);
  }
};

const createAllTables = async () => {
    // Create tables in order of dependencies
    await createTable("Agencies", agencyTableQuery);
    await createTable("Users", userTableQuery);
    await createTable("Item Master", itemMasterTableQuery);
    await createTable("Inventory", inventoryTableQuery);
    await createTable("Inventory Transactions", inventoryTransactionsTableQuery);
    await createTable("Suppliers", suppliersTableQuery);
    await createTable("Customers", customersTableQuery);
    await createTable("GRN", grnTableQuery);
    await createTable("GRN Items", grnItemsTableQuery);
    await createTable("Vehicles", vehiclesTableQuery);
    await createTable("Vehicle Inventory", vehicleInventoryTableQuery);
    await createTable("Vehicle Stock Transfers", vehicleStockTransfersTableQuery);
    await createTable("Vehicle Stock Transfer Items", vehicleStockTransferItemsTableQuery);
    await createTable("Vehicle Sales", vehicleSalesTableQuery);
    await createTable("Vehicle Sales Items", vehicleSalesItemsTableQuery);
    await createTable("Sales Returns", salesReturnsTableQuery);
    await createTable("Sales Return Items", salesReturnItemsTableQuery);
    await createTable("Expired Stock", expiredStockTableQuery);
    await createTable("Invoices", invoicesTableQuery);
    await createTable("employees", employeeTableQuery);
    await createTable("Transportation", transportationTableQuery);
    await createTable("Finance", financeTableQuery);
    await createTable("Cash Registry", cashRegistryTableQuery);
    await createTable("Customer Credit Payments", customerCreditPaymentsTableQuery);
};

export default createAllTables;
