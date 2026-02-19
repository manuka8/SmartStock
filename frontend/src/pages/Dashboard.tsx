import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import Overview from "./dashboard/Overview";
import Products from "./dashboard/Products";
import Inventory from "./dashboard/Inventory";
import Alerts from "./dashboard/Alerts";
import Suppliers from "./dashboard/Suppliers";
import SupplierDetails from "./dashboard/SupplierDetails";
import Reports from "./dashboard/Reports";
import Analytics from "./dashboard/Analytics";
import Settings from "./dashboard/Settings";
import TeamManagement from "./dashboard/Management";
import GRN from "./dashboard/GRN";
import Employees from "./dashboard/Employees";
import VehicleInventory from "./dashboard/VehicleInventory";
import VehicleSales from "./dashboard/Sales";
import Finance from "./dashboard/Finance";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers/:id" element={<SupplierDetails />} />
        <Route path="grn" element={<GRN />} />
        <Route path="vehicle-inventory" element={<VehicleInventory />} />
        <Route path="vehicle-sales" element={<VehicleSales />} />
        <Route path="employees" element={<Employees/>} />
        {/* <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="stock-transfer" element={<StockTransfer />} /> */}
        <Route path="reports" element={<Reports />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="finance" element={<Finance />} />
        <Route path="team" element={<TeamManagement />} />
        <Route path="*" element={<Overview />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
