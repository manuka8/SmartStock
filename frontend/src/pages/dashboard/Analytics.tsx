import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users, AlertTriangle, CreditCard } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { apiFetch } from "@/lib/api";
import { format } from "date-fns";

interface SalesData {
  date: string;
  total: number;
}

interface CategoryData {
  name: string;
  value: number;
  revenue: number;
}

interface MonthlyData {
  month: string;
  sales: number;
  purchases: number;
  profit: number;
}

export default function Analytics() {
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlyData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProductsSold, setTotalProductsSold] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [outstandingCredit, setOutstandingCredit] = useState(0);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryTrend, setCategoryTrend] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [loading, setLoading] = useState(true);

  const COLORS = ["hsl(174, 62%, 40%)", "hsl(174, 62%, 50%)", "hsl(174, 40%, 60%)", "hsl(185, 45%, 50%)", "hsl(210, 20%, 70%)", "hsl(280, 50%, 60%)"];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch all invoices for sales data
        const invoicesRes = await apiFetch("/api/invoices/getAllInvoices");
        const invoicesData = await invoicesRes.json();

        // Fetch all customers
        const customersRes = await apiFetch("/api/customers/getAllCustomers");
        const customersData = await customersRes.json();

        // Fetch inventory for products and stock value
        const inventoryRes = await apiFetch("/api/inventoryManagement/getAllInventory");
        const inventoryData = await inventoryRes.json();

        // Fetch low stock alerts
        const lowStockRes = await apiFetch("/api/inventoryManagement/getLowStockAlerts");
        const lowStockData = await lowStockRes.json();

        // Fetch vehicle sales
        const vehicleSalesRes = await apiFetch("/api/vehicleSales/getAllSales?limit=1000");
        const vehicleSalesData = await vehicleSalesRes.json();

        console.log("Invoices Data:", invoicesData);
        console.log("Vehicle Sales Data:", vehicleSalesData);

        // Calculate stats
        let totalRev = 0;
        let totalProducts = 0;
        let totalOrds = 0;
        const monthlyMap: Record<string, { sales: number; purchases: number; profit: number }> = {};
        const productMap: Record<string, { name: string; quantity: number; category: string }> = {};
        const categoryMap: Record<string, number> = {};

        if (invoicesData.invoices && Array.isArray(invoicesData.invoices)) {
          totalOrds = invoicesData.invoices.length;
          
          // Fetch invoice items for each invoice to get accurate product quantities
          const invoiceItemsPromises = invoicesData.invoices.map((inv: any) =>
            apiFetch(`/api/invoices/getInvoice/${inv.id}`).then(res => res.json()).catch(err => {
              console.error("Error fetching invoice items:", err);
              return { invoice_items: [] };
            })
          );
          
          const invoiceItemsResults = await Promise.all(invoiceItemsPromises);
          
          invoicesData.invoices.forEach((inv: any, index: number) => {
            const revenue = parseFloat(inv.subtotal) || 0;
            totalRev += revenue;

            const date = new Date(inv.created_at);
            const monthKey = format(date, "MMM");
            if (!monthlyMap[monthKey]) {
              monthlyMap[monthKey] = { sales: 0, purchases: 0, profit: 0 };
            }
            monthlyMap[monthKey].sales += revenue;

            // Process invoice items
            const invoiceDetail = invoiceItemsResults[index];
            if (invoiceDetail?.invoice_items && Array.isArray(invoiceDetail.invoice_items)) {
              invoiceDetail.invoice_items.forEach((item: any) => {
                const quantity = parseInt(item.quantity) || 0;
                totalProducts += quantity;

                const productKey = item.item_name;
                if (!productMap[productKey]) {
                  productMap[productKey] = {
                    name: item.item_name,
                    quantity: 0,
                    category: item.category || "Uncategorized",
                  };
                }
                productMap[productKey].quantity += quantity;

                // Track category with actual category value
                const category = item.category || "Uncategorized";
                categoryMap[category] = (categoryMap[category] || 0) + quantity;
              });
            }
          });
        }

        // Add vehicle sales to monthly data and track products
        if (vehicleSalesData.sales && Array.isArray(vehicleSalesData.sales)) {
          // Fetch vehicle sale items details
          const vehicleSaleItemsPromises = vehicleSalesData.sales.map((sale: any) =>
            apiFetch(`/api/vehicleSales/getSale/${sale.id}`).then(res => res.json()).catch(err => {
              console.error("Error fetching vehicle sale items:", err);
              return { items: [] };
            })
          );
          
          const vehicleSaleItemsResults = await Promise.all(vehicleSaleItemsPromises);
          
          vehicleSalesData.sales.forEach((sale: any, index: number) => {
            const date = new Date(sale.sale_date);
            const monthKey = format(date, "MMM");
            if (!monthlyMap[monthKey]) {
              monthlyMap[monthKey] = { sales: 0, purchases: 0, profit: 0 };
            }
            monthlyMap[monthKey].sales += parseFloat(sale.total_amount) || 0;

            // Process vehicle sale items
            const saleDetail = vehicleSaleItemsResults[index];
            if (saleDetail?.items && Array.isArray(saleDetail.items)) {
              saleDetail.items.forEach((item: any) => {
                const quantity = parseInt(item.quantity) || 0;
                totalProducts += quantity;

                const productKey = item.item_name;
                if (!productMap[productKey]) {
                  productMap[productKey] = {
                    name: item.item_name,
                    quantity: 0,
                    category: item.category || "Uncategorized",
                  };
                }
                productMap[productKey].quantity += quantity;

                // Track category with actual category value
                const category = item.category || "Uncategorized";
                categoryMap[category] = (categoryMap[category] || 0) + quantity;
              });
            }
          });
        }

        // Calculate inventory stats
        let totalInvValue = 0;
        let totalQuantity = 0;
        let productCount = 0;
        if (inventoryData.inventory && Array.isArray(inventoryData.inventory)) {
          productCount = inventoryData.inventory.length;
          inventoryData.inventory.forEach((item: any) => {
            totalInvValue += (item.current_quantity || 0) * (item.buying_price || 0);
            totalQuantity += item.current_quantity || 0;
          });
        }

        // Calculate outstanding credit
        let outstanding = 0;
        if (customersData.customers && Array.isArray(customersData.customers)) {
          outstanding = customersData.customers.reduce((sum: number, cust: any) => {
            return sum + (parseFloat(cust.outstanding_balance) || 0);
          }, 0);
        }

        // Get payment method distribution from vehicle sales
        const paymentMethodsMap: Record<string, number> = { Cash: 0, Cheque: 0, Credit: 0 };
        if (vehicleSalesData.sales && Array.isArray(vehicleSalesData.sales)) {
          vehicleSalesData.sales.forEach((sale: any) => {
            if (sale.cash) paymentMethodsMap["Cash"] += parseFloat(sale.cash) || 0;
            if (sale.cheque) paymentMethodsMap["Cheque"] += parseFloat(sale.cheque) || 0;
            if (sale.credit) paymentMethodsMap["Credit"] += parseFloat(sale.credit) || 0;
          });
        }

        setTotalRevenue(totalRev);
        setTotalProductsSold(totalProducts);
        setTotalOrders(totalOrds);
        setActiveCustomers(customersData.customers?.length || 0);
        setLowStockItems(lowStockData.alerts?.length || 0);
        setOutstandingCredit(outstanding);
        setInventoryValue(totalInvValue);
        setTotalQuantity(totalQuantity);

        // Set top products (top 8)
        const topProductsArray = Object.values(productMap)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 8)
          .map(p => ({
            name: p.name,
            quantity: p.quantity,
            category: p.category,
          }));
        
        // Add default empty data if no products
        if (topProductsArray.length === 0) {
          topProductsArray.push({ name: "No data available", quantity: 0, category: "N/A" });
        }
        setTopProducts(topProductsArray);
        console.log("Top Products:", topProductsArray);

        // Set category trend
        const categoryTrendArray = Object.entries(categoryMap)
          .map(([name, value]) => ({
            name,
            value: parseInt(value.toString()),
          }))
          .sort((a, b) => b.value - a.value);
        
        // Add default empty data if no categories
        if (categoryTrendArray.length === 0) {
          categoryTrendArray.push({ name: "No data available", value: 0 });
        }
        setCategoryTrend(categoryTrendArray);
        console.log("Category Trend:", categoryTrendArray);

        // Set monthly data
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyDataArray = months.map((month) => {
          const data = monthlyMap[month] || { sales: 0, purchases: 0, profit: 0 };
          return {
            month,
            sales: Math.round(data.sales),
            purchases: Math.round(data.purchases || data.sales * 0.6),
            profit: Math.round(data.sales - (data.purchases || data.sales * 0.6)),
          };
        });
        setMonthlySalesData(monthlyDataArray);

        // Set payment methods data
        const paymentMethodsArray = Object.entries(paymentMethodsMap)
          .filter(([_, value]) => value > 0)
          .map(([name, value]) => ({
            name,
            value: parseFloat(value.toFixed(0)),
          }));
        if (paymentMethodsArray.length === 0) {
          setPaymentMethods([
            { name: "Cash", value: 0 },
            { name: "Cheque", value: 0 },
            { name: "Credit", value: 0 },
          ]);
        } else {
          setPaymentMethods(paymentMethodsArray);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const stats = [
    { label: "Total Revenue", value: `RS ${totalRevenue.toLocaleString()}`, change: "+12.5%", trend: "up", icon: DollarSign },
    { label: "Products Sold", value: totalProductsSold.toLocaleString(), change: "+8.2%", trend: "up", icon: Package },
    { label: "Total Orders", value: totalOrders.toLocaleString(), change: "-2.4%", trend: "down", icon: ShoppingCart },
    { label: "Active Customers", value: activeCustomers.toLocaleString(), change: "+15.3%", trend: "up", icon: Users },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Real-time insights into your business performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-success" : "text-destructive"}`}>
                {stat.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="stat-card bg-yellow-50 border-yellow-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-yellow-700 font-medium">Low Stock Items</p>
          <p className="text-2xl font-bold text-yellow-900">{lowStockItems}</p>
        </div>

        <div className="stat-card bg-red-50 border-red-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-red-700 font-medium">Outstanding Credit</p>
          <p className="text-2xl font-bold text-red-900">RS {outstandingCredit.toLocaleString()}</p>
        </div>

        <div className="stat-card bg-blue-50 border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-blue-700 font-medium">Inventory Value</p>
          <p className="text-2xl font-bold text-blue-900">RS {inventoryValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales Trend */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 p-6">
          <h3 className="font-semibold text-foreground mb-4">Monthly Sales vs Profit Trend</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlySalesData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174, 62%, 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(174, 62%, 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 88%)" />
              <XAxis dataKey="month" stroke="hsl(200, 15%, 45%)" fontSize={12} />
              <YAxis stroke="hsl(200, 15%, 45%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(210, 20%, 88%)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="hsl(174, 62%, 40%)"
                fillOpacity={1}
                fill="url(#colorSales)"
                name="Sales"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="hsl(120, 100%, 40%)"
                fillOpacity={0.1}
                fill="hsl(120, 100%, 40%)"
                name="Profit"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <h3 className="font-semibold text-foreground mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(210, 20%, 88%)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {paymentMethods.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[index] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium text-foreground">RS {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Sold */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border/50 p-6">
          <h3 className="font-semibold text-foreground mb-4">Top Products Sold</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 88%)" />
              <XAxis type="number" stroke="hsl(200, 15%, 45%)" fontSize={12} />
              <YAxis dataKey="name" type="category" width={150} stroke="hsl(200, 15%, 45%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(210, 20%, 88%)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="quantity" fill="hsl(174, 62%, 40%)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        
        {/* Product Category Distribution */}
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <h3 className="font-semibold text-foreground mb-4">Product Category Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryTrend} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 88%)" />
              <XAxis type="number" stroke="hsl(200, 15%, 45%)" fontSize={12} />
              <YAxis dataKey="name" type="category" width={120} stroke="hsl(200, 15%, 45%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(210, 20%, 88%)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="hsl(174, 62%, 40%)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Comparison Bar Chart */}
      <div className="bg-card rounded-xl border border-border/50 p-6">
        <h3 className="font-semibold text-foreground mb-4">Monthly Sales Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlySalesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 88%)" />
            <XAxis dataKey="month" stroke="hsl(200, 15%, 45%)" fontSize={12} />
            <YAxis stroke="hsl(200, 15%, 45%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(210, 20%, 88%)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="sales" fill="hsl(174, 62%, 40%)" name="Sales Revenue" radius={[8, 8, 0, 0]} />
            <Bar dataKey="purchases" fill="hsl(280, 50%, 60%)" name="Purchases" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <h3 className="font-semibold text-foreground mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border/30">
              <span className="text-muted-foreground">Avg Order Value</span>
              <span className="font-bold text-foreground">RS {totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : 0}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border/30">
              <span className="text-muted-foreground">Total Orders</span>
              <span className="font-bold text-foreground">{totalOrders}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border/30">
              <span className="text-muted-foreground">Avg Items per Order</span>
              <span className="font-bold text-foreground">{totalOrders > 0 ? Math.round(totalProductsSold / totalOrders) : 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Customer Base</span>
              <span className="font-bold text-foreground">{activeCustomers}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 p-6">
          <h3 className="font-semibold text-foreground mb-4">Inventory Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border/30">
              <span className="text-muted-foreground">Total Products</span>
              <span className="font-bold text-foreground">
                {totalQuantity.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border/30">
              <span className="text-muted-foreground">Low Stock Alerts</span>
              <span className={`font-bold ${lowStockItems > 0 ? "text-yellow-600" : "text-success"}`}>{lowStockItems}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border/30">
              <span className="text-muted-foreground">Inventory Value</span>
              <span className="font-bold text-foreground">RS {inventoryValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Receivables (Credit)</span>
              <span className={`font-bold ${outstandingCredit > 0 ? "text-red-600" : "text-success"}`}>RS {outstandingCredit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
