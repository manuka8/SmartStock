import AgencyManagement from "@/components/dashboard/AgencyManagement";
import CustomerManagement from "@/components/dashboard/CustomerManagement";
import InvoiceManagement from "@/components/dashboard/InvoiceManagement";
import TeamManagement from "@/components/dashboard/TeamManagement";
import UserManagement from "@/components/dashboard/UserManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import Suppliers from "./Suppliers";
import GRN from "./GRN";
import Reports from "./Reports";
import Employees from "./Employees";
import VehicleInventory from "./VehicleInventory";
import Vehicles from "./Vehicles";
import ReorderProducts from "@/components/dashboard/ReorderProducts";
import Finance from "./Finance";
import CustomerCredit from "./CustomerCredit";

const Management = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "super_admin";
  const isOwnerOrEmployee =
    user?.role === "owner" || user?.role === "employee";

  useEffect(() => {
    if (!user) return;

    if (isSuperAdmin) setTab("agency-management");
    else if (isOwnerOrEmployee) setTab("team-management");
    else setTab("user-management");
  }, [user, isSuperAdmin, isOwnerOrEmployee]);

  if (!tab) return null; // or loader

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex flex-col items-center w-full"
      >
        <TabsList className="flex mb-6 flex-wrap justify-center gap-1">
          {isSuperAdmin && (
            <TabsTrigger
              value="agency-management"
              className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
            >
              Agencies
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger
              value="user-management"
              className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
            >
              Users
            </TabsTrigger>
          )}
          {isOwnerOrEmployee && (
            <TabsTrigger
              value="team-management"
              className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
            >
              Team
            </TabsTrigger>
          )}
          <TabsTrigger
            value="supplier-management"
            className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
          >
            Suppliers
          </TabsTrigger>
          <TabsTrigger
            value="customer-management"
            className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
          >
            Customers
          </TabsTrigger>
          <TabsTrigger
            value="employee-management"
            className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
          >
            Employees
          </TabsTrigger>
          <TabsTrigger
            value="vehicle-inventory"
            className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
          >
            Vehicles
          </TabsTrigger>
          <TabsTrigger
            value="grn-management"
            className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
          >
            GRN
          </TabsTrigger>
          <TabsTrigger
            value="reorder-management"
            className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
          >
            Reorders
          </TabsTrigger>
          <TabsTrigger
            value="invoice-management"
            className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
          >
            Invoices
          </TabsTrigger>
          <TabsTrigger
            value="finance-management"
            className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
          >
            Finance
          </TabsTrigger>
          <TabsTrigger
            value="credit-management"
            className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
          >
            Credit
          </TabsTrigger>
          <TabsTrigger
            value="report-management"
            className="data-[state=active]:bg-gradient-to-r from-[#1c3d40] to-[#27a599] hover:from-[#27a599] hover:to-[#1c3d40] data-[state=active]:text-white data-[state=active]:border-green-600"
          >
            Reports
          </TabsTrigger>
        </TabsList>
        {isSuperAdmin && (
          <TabsContent className="w-full" value="user-management">
            <UserManagement />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent className="w-full" value="agency-management">
            <AgencyManagement />
          </TabsContent>
        )}
        {isOwnerOrEmployee && (
          <TabsContent className="w-full" value="team-management">
            <TeamManagement />
          </TabsContent>
        )}
        <TabsContent className="w-full" value="supplier-management">
          <Suppliers />
        </TabsContent>
        <TabsContent className="w-full" value="customer-management">
          <CustomerManagement />
        </TabsContent>
        <TabsContent className="w-full" value="employee-management">
          <Employees />
        </TabsContent>
        <TabsContent className="w-full" value="grn-management">
          <GRN />
        </TabsContent>
        <TabsContent className="w-full" value="vehicle-inventory">
          <Vehicles />
        </TabsContent>
        <TabsContent className="w-full" value="reorder-management">
          <ReorderProducts />
        </TabsContent>
        <TabsContent className="w-full" value="invoice-management">
          <InvoiceManagement />
        </TabsContent>
        <TabsContent className="w-full" value="finance-management">
          <Finance />
        </TabsContent>
        <TabsContent className="w-full" value="credit-management">
          <CustomerCredit />
        </TabsContent>
        <TabsContent className="w-full" value="report-management">
          <Reports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Management;

