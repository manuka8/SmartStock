import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Clock,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Supplier {
  id: number;
  supplier_code?: string;
  supplier_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  tax_number?: string;
  status?: string;
  created_at?: string;
}

interface Transaction {
  id: number;
  date: string;
  invoice_number: string;
  items: number;
  amount: number;
  status: string;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export default function SupplierDetails() {
  const navigate = useNavigate();

  // Dummy supplier data
  const supplier: Supplier = {
    id: 1,
    supplier_code: "SUP-001",
    supplier_name: "ABC Electronics Ltd.",
    contact_person: "John Smith",
    email: "john.smith@abcelectronics.com",
    phone: "+94 77 123 4567",
    address_line1: "No. 45, Industrial Zone",
    address_line2: "Katunayake",
    city: "Negombo",
    district: "Gampaha",
    postal_code: "11450",
    tax_number: "TAX-123456789",
    status: "ACTIVE",
    created_at: "2023-03-15T10:30:00Z",
  };

  // Dummy analytics data
  const analytics = {
    totalPurchases: 156420,
    totalOrders: 234,
    avgOrderValue: 668.46,
    outstandingBalance: 12500,
    lastOrderDate: "2024-01-15",
    paymentTerms: "Net 30",
    monthlyGrowth: 12.5,
    onTimeDelivery: 94,
  };

  const recentTransactions: Transaction[] = [
    { id: 1, date: "2024-01-15", invoice_number: "INV-2024-001", items: 15, amount: 2450.00, status: "Paid" },
    { id: 2, date: "2024-01-10", invoice_number: "INV-2024-002", items: 8, amount: 1890.50, status: "Pending" },
    { id: 3, date: "2024-01-05", invoice_number: "INV-2024-003", items: 22, amount: 4200.00, status: "Paid" },
    { id: 4, date: "2023-12-28", invoice_number: "INV-2023-156", items: 12, amount: 3100.75, status: "Paid" },
    { id: 5, date: "2023-12-20", invoice_number: "INV-2023-155", items: 5, amount: 980.25, status: "Overdue" },
  ];

  const topProducts: TopProduct[] = [
    { name: "Premium Widget A", quantity: 450, revenue: 22500 },
    { name: "Standard Component B", quantity: 380, revenue: 19000 },
    { name: "Deluxe Part C", quantity: 290, revenue: 17400 },
    { name: "Basic Item D", quantity: 520, revenue: 15600 },
    { name: "Pro Assembly E", quantity: 180, revenue: 14400 },
  ];

  const monthlyData = [
    { month: "Aug", amount: 12400 },
    { month: "Sep", amount: 15200 },
    { month: "Oct", amount: 14800 },
    { month: "Nov", amount: 18500 },
    { month: "Dec", amount: 16900 },
    { month: "Jan", amount: 19200 },
  ];


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-success/10 text-success border-success/20";
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "overdue":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const maxAmount = Math.max(...monthlyData.map(d => d.amount));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/suppliers")}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{supplier.supplier_name}</h1>
            <Badge
              variant="outline"
              className={
                supplier.status === "ACTIVE" || supplier.status === "Active"
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-muted text-muted-foreground"
              }
            >
              {supplier.status || "ACTIVE"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {supplier.supplier_code && `Code: ${supplier.supplier_code} • `}
            Supplier since {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : "N/A"}
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Supplier
        </Button>
      </div>

      {/* Profile & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-primary" />
              Supplier Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{supplier.contact_person || "N/A"}</p>
                <p className="text-sm text-muted-foreground">Contact Person</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{supplier.email || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">Email</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{supplier.phone || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">Phone</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {[supplier.address_line1, supplier.address_line2, supplier.city, supplier.district, supplier.postal_code]
                      .filter(Boolean)
                      .join(", ") || "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">Address</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{supplier.tax_number || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">Tax Number</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <DollarSign className="w-8 h-8 text-primary" />
                <div className="flex items-center gap-1 text-success text-xs font-medium">
                  <TrendingUp className="w-3 h-3" />
                  {analytics.monthlyGrowth}%
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">
                ${analytics.totalPurchases.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Purchases</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <ShoppingCart className="w-8 h-8 text-blue-500" />
              <p className="text-2xl font-bold text-foreground mt-2">{analytics.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <BarChart3 className="w-8 h-8 text-amber-500" />
              <p className="text-2xl font-bold text-foreground mt-2">
                ${analytics.avgOrderValue.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Avg. Order Value</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="pt-5">
              <Clock className="w-8 h-8 text-destructive" />
              <p className="text-2xl font-bold text-foreground mt-2">
                ${analytics.outstandingBalance.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">On-Time Delivery</span>
                <span className="text-sm font-medium text-foreground">{analytics.onTimeDelivery}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all"
                  style={{ width: `${analytics.onTimeDelivery}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <Calendar className="w-6 h-6 text-muted-foreground mb-1" />
              <p className="text-sm font-medium text-foreground">{analytics.lastOrderDate}</p>
              <p className="text-xs text-muted-foreground">Last Order</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <FileText className="w-6 h-6 text-muted-foreground mb-1" />
              <p className="text-sm font-medium text-foreground">{analytics.paymentTerms}</p>
              <p className="text-xs text-muted-foreground">Payment Terms</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{transaction.date}</TableCell>
                      <TableCell>{transaction.invoice_number}</TableCell>
                      <TableCell className="text-center">{transaction.items}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-center mt-4">
                <Button variant="outline" size="sm">
                  View All Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Purchased Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.quantity} units purchased</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">${product.revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purchase Trends (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-64">
                {monthlyData.map((data) => (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-primary/80 rounded-t-lg transition-all hover:bg-primary relative group"
                      style={{ height: `${(data.amount / maxAmount) * 200}px` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ${data.amount.toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{data.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">+{analytics.monthlyGrowth}%</span> vs last period
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{analytics.totalOrders}</span> total orders
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}