// import { useState, useEffect } from "react";
// import { 
//   ArrowLeft, 
//   User, 
//   Mail, 
//   Phone, 
//   MapPin, 
//   Building2,
//   CreditCard,
//   DollarSign,
//   TrendingUp,
//   TrendingDown,
//   Calendar,
//   Package,
//   Eye,
//   Edit,
//   Trash2,
//   Plus,
//   Search,
//   Filter,
//   Download
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useToast } from "@/hooks/use-toast";
// import { apiFetch } from "@/lib/api";
// import { format } from "date-fns";

// interface Supplier {
//   id: number;
//   supplier_code?: string;
//   supplier_name: string;
//   contact_person?: string;
//   email?: string;
//   phone?: string;
//   address_line1?: string;
//   address_line2?: string;
//   city?: string;
//   district?: string;
//   postal_code?: string;
//   tax_number?: string;
//   status?: string;
//   created_at?: string;
// }

// interface Transaction {
//   id: number;
//   transaction_type: 'IN' | 'OUT';
//   amount: number;
//   description: string;
//   date: string;
//   reference_type?: string;
//   reference_id?: number;
// }

// interface SupplierStats {
//   total_purchases: number;
//   total_spent: number;
//   outstanding_balance: number;
//   total_transactions: number;
//   last_transaction_date?: string;
// }

// interface PurchaseOrder {
//   id: number;
//   order_number: string;
//   total_amount: number;
//   status: string;
//   created_at: string;
//   expected_delivery_date?: string;
// }

// const SupplierDetails = ({ supplierId, onBack }: { supplierId: number; onBack: () => void }) => {
//   const { toast } = useToast();
//   const [supplier, setSupplier] = useState<Supplier | null>(null);
//   const [stats, setStats] = useState<SupplierStats | null>(null);
//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("overview");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [transactionType, setTransactionType] = useState<string>("all");
//   const [isEditing, setIsEditing] = useState(false);
//   const [editForm, setEditForm] = useState<Supplier | null>(null);

//   useEffect(() => {
//     fetchSupplierDetails();
//   }, [supplierId]);

//   const fetchSupplierDetails = async () => {
//     try {
//       setIsLoading(true);
//       const [supplierResponse, statsResponse, transactionsResponse, ordersResponse] = await Promise.all([
//         apiFetch(`/api/suppliers/getSupplier/${supplierId}`),
//         apiFetch(`/api/suppliers/getSupplierStats/${supplierId}`),
//         apiFetch(`/api/suppliers/getSupplierTransactions/${supplierId}`),
//         apiFetch(`/api/suppliers/getSupplierPurchaseOrders/${supplierId}`)
//       ]);

//       if (!supplierResponse.ok || !statsResponse.ok || !transactionsResponse.ok || !ordersResponse.ok) {
//         throw new Error("Failed to fetch supplier details");
//       }

//       const supplierData = await supplierResponse.json();
//       const statsData = await statsResponse.json();
//       const transactionsData = await transactionsResponse.json();
//       const ordersData = await ordersResponse.json();

//       setSupplier(supplierData.supplier);
//       setStats(statsData.stats);
//       setTransactions(transactionsData.transactions || []);
//       setPurchaseOrders(ordersData.purchaseOrders || []);
//     } catch (error) {
//       console.error("Error fetching supplier details:", error);
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Failed to load supplier details",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleEditToggle = () => {
//     if (isEditing) {
//       setEditForm(null);
//     } else {
//       setEditForm(supplier);
//     }
//     setIsEditing(!isEditing);
//   };

//   const handleEditSave = async () => {
//     if (!editForm) return;

//     try {
//       const response = await apiFetch(`/api/suppliers/updateSupplier/${supplierId}`, {
//         method: "PUT",
//         body: JSON.stringify(editForm),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to update supplier");
//       }

//       toast({
//         title: "Success",
//         description: "Supplier updated successfully",
//       });

//       setSupplier(editForm);
//       setIsEditing(false);
//       setEditForm(null);
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Failed to update supplier",
//       });
//     }
//   };

//   const filteredTransactions = transactions.filter(transaction => {
//     const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          transaction.reference_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          transaction.id.toString().includes(searchTerm);
//     const matchesType = transactionType === "all" || transaction.transaction_type === transactionType;
//     return matchesSearch && matchesType;
//   });

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "USD",
//     }).format(amount);
//   };

//   if (isLoading) {
//     return (
//       <div className="space-y-6">
//         <div className="flex items-center gap-4">
//           <Button variant="ghost" onClick={onBack} className="gap-2">
//             <ArrowLeft className="w-4 h-4" />
//             Back
//           </Button>
//           <div>
//             <h1 className="text-2xl font-bold">Loading Supplier...</h1>
//             <p className="text-muted-foreground">Please wait while we load the supplier details.</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!supplier) {
//     return (
//       <div className="space-y-6">
//         <div className="flex items-center gap-4">
//           <Button variant="ghost" onClick={onBack} className="gap-2">
//             <ArrowLeft className="w-4 h-4" />
//             Back
//           </Button>
//           <div>
//             <h1 className="text-2xl font-bold">Supplier Not Found</h1>
//             <p className="text-muted-foreground">The supplier you're looking for doesn't exist.</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <Button variant="ghost" onClick={onBack} className="gap-2">
//             <ArrowLeft className="w-4 h-4" />
//             Back
//           </Button>
//           <div>
//             <h1 className="text-2xl font-bold text-foreground">{supplier.supplier_name}</h1>
//             <p className="text-muted-foreground">
//               {supplier.supplier_code ? `Code: ${supplier.supplier_code} • ` : ""}
//               {supplier.contact_person ? `Contact: ${supplier.contact_person} • ` : ""}
//               {supplier.email}
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center gap-3">
//           <Button variant="outline" className="gap-2">
//             <Download className="w-4 h-4" />
//             Export Report
//           </Button>
//           <Button 
//             variant={isEditing ? "secondary" : "default"} 
//             onClick={handleEditToggle}
//             className="gap-2"
//           >
//             <Edit className="w-4 h-4" />
//             {isEditing ? "Cancel Edit" : "Edit Supplier"}
//           </Button>
//         </div>
//       </div>

//       {/* Supplier Info Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
//             <Package className="w-4 h-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats?.total_purchases || 0}</div>
//             <p className="text-xs text-muted-foreground">Purchase orders created</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
//             <DollarSign className="w-4 h-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{formatCurrency(stats?.total_spent || 0)}</div>
//             <p className="text-xs text-muted-foreground">All-time spending</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
//             <CreditCard className="w-4 h-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className={`text-2xl font-bold ${stats?.outstanding_balance && stats.outstanding_balance > 0 ? 'text-destructive' : 'text-success'}`}>
//               {formatCurrency(stats?.outstanding_balance || 0)}
//             </div>
//             <p className="text-xs text-muted-foreground">Current balance</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
//             <TrendingUp className="w-4 h-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats?.total_transactions || 0}</div>
//             <p className="text-xs text-muted-foreground">Financial transactions</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Tabs */}
//       <Tabs value={activeTab} onValueChange={setActiveTab}>
//         <TabsList className="grid w-full grid-cols-4">
//           <TabsTrigger value="overview">Overview</TabsTrigger>
//           <TabsTrigger value="transactions">Transactions</TabsTrigger>
//           <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
//           <TabsTrigger value="analytics">Analytics</TabsTrigger>
//         </TabsList>

//         {/* Overview Tab */}
//         <TabsContent value="overview" className="space-y-6">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Supplier Details */}
//             <Card className="lg:col-span-2">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-3">
//                   <User className="w-5 h-5" />
//                   Supplier Information
//                 </CardTitle>
//                 <CardDescription>Basic details and contact information</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 {isEditing ? (
//                   <div className="space-y-4">
//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="space-y-2">
//                         <Label htmlFor="supplier_name">Supplier Name</Label>
//                         <Input
//                           id="supplier_name"
//                           value={editForm?.supplier_name || ""}
//                           onChange={(e) => setEditForm({ ...editForm!, supplier_name: e.target.value })}
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="contact_person">Contact Person</Label>
//                         <Input
//                           id="contact_person"
//                           value={editForm?.contact_person || ""}
//                           onChange={(e) => setEditForm({ ...editForm!, contact_person: e.target.value })}
//                         />
//                       </div>
//                     </div>
                    
//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="space-y-2">
//                         <Label htmlFor="email">Email</Label>
//                         <Input
//                           id="email"
//                           type="email"
//                           value={editForm?.email || ""}
//                           onChange={(e) => setEditForm({ ...editForm!, email: e.target.value })}
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="phone">Phone</Label>
//                         <Input
//                           id="phone"
//                           value={editForm?.phone || ""}
//                           onChange={(e) => setEditForm({ ...editForm!, phone: e.target.value })}
//                         />
//                       </div>
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="address_line1">Address</Label>
//                       <Input
//                         id="address_line1"
//                         value={editForm?.address_line1 || ""}
//                         onChange={(e) => setEditForm({ ...editForm!, address_line1: e.target.value })}
//                       />
//                     </div>

//                     <div className="grid grid-cols-3 gap-4">
//                       <div className="space-y-2">
//                         <Label htmlFor="city">City</Label>
//                         <Input
//                           id="city"
//                           value={editForm?.city || ""}
//                           onChange={(e) => setEditForm({ ...editForm!, city: e.target.value })}
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="district">District</Label>
//                         <Input
//                           id="district"
//                           value={editForm?.district || ""}
//                           onChange={(e) => setEditForm({ ...editForm!, district: e.target.value })}
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="postal_code">Postal Code</Label>
//                         <Input
//                           id="postal_code"
//                           value={editForm?.postal_code || ""}
//                           onChange={(e) => setEditForm({ ...editForm!, postal_code: e.target.value })}
//                         />
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="space-y-2">
//                         <Label htmlFor="tax_number">Tax Number</Label>
//                         <Input
//                           id="tax_number"
//                           value={editForm?.tax_number || ""}
//                           onChange={(e) => setEditForm({ ...editForm!, tax_number: e.target.value })}
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="status">Status</Label>
//                         <Select
//                           value={editForm?.status || "ACTIVE"}
//                           onValueChange={(value) => setEditForm({ ...editForm!, status: value })}
//                         >
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select status" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="ACTIVE">Active</SelectItem>
//                             <SelectItem value="INACTIVE">Inactive</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>

//                     <div className="flex gap-3">
//                       <Button onClick={handleEditSave} className="gap-2">
//                         <Edit className="w-4 h-4" />
//                         Save Changes
//                       </Button>
//                       <Button variant="outline" onClick={handleEditToggle}>
//                         Cancel
//                       </Button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="space-y-4">
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <Label className="text-sm text-muted-foreground">Supplier Name</Label>
//                         <p className="font-medium">{supplier.supplier_name}</p>
//                       </div>
//                       <div>
//                         <Label className="text-sm text-muted-foreground">Contact Person</Label>
//                         <p className="font-medium">{supplier.contact_person || 'N/A'}</p>
//                       </div>
//                     </div>
                    
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <Label className="text-sm text-muted-foreground">Email</Label>
//                         <p className="font-medium">{supplier.email || 'N/A'}</p>
//                       </div>
//                       <div>
//                         <Label className="text-sm text-muted-foreground">Phone</Label>
//                         <p className="font-medium">{supplier.phone || 'N/A'}</p>
//                       </div>
//                     </div>

//                     <div>
//                       <Label className="text-sm text-muted-foreground">Address</Label>
//                       <p className="font-medium">
//                         {supplier.address_line1 && `${supplier.address_line1}, `}
//                         {supplier.address_line2 && `${supplier.address_line2}, `}
//                         {supplier.city && `${supplier.city}, `}
//                         {supplier.district && `${supplier.district} `}
//                         {supplier.postal_code}
//                       </p>
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <Label className="text-sm text-muted-foreground">Tax Number</Label>
//                         <p className="font-medium">{supplier.tax_number || 'N/A'}</p>
//                       </div>
//                       <div>
//                         <Label className="text-sm text-muted-foreground">Status</Label>
//                         <Badge 
//                           className={(supplier.status === "ACTIVE" || supplier.status === "Active") ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}
//                         >
//                           {supplier.status || 'ACTIVE'}
//                         </Badge>
//                       </div>
//                     </div>

//                     <div>
//                       <Label className="text-sm text-muted-foreground">Supplier Since</Label>
//                       <p className="font-medium">{supplier.created_at ? format(new Date(supplier.created_at), 'MMM dd, yyyy') : 'N/A'}</p>
//                     </div>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>

//             {/* Quick Stats */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Supplier Summary</CardTitle>
//                 <CardDescription>Key metrics and information</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">Total Orders</span>
//                     <span className="font-medium">{stats?.total_purchases || 0}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">Total Spent</span>
//                     <span className="font-medium">{formatCurrency(stats?.total_spent || 0)}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">Outstanding</span>
//                     <span className={`font-medium ${stats?.outstanding_balance && stats.outstanding_balance > 0 ? 'text-destructive' : 'text-success'}`}>
//                       {formatCurrency(stats?.outstanding_balance || 0)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">Transactions</span>
//                     <span className="font-medium">{stats?.total_transactions || 0}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">Last Activity</span>
//                     <span className="font-medium">{stats?.last_transaction_date ? format(new Date(stats.last_transaction_date), 'MMM dd, yyyy') : 'N/A'}</span>
//                   </div>
//                 </div>
                
//                 <div className="pt-4 border-t">
//                   <h4 className="font-medium mb-2">Payment Terms</h4>
//                   <p className="text-sm text-muted-foreground">Net 30 days</p>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>

//         {/* Transactions Tab */}
//         <TabsContent value="transactions" className="space-y-6">
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search transactions..."
//                 className="pl-10"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//             <Select value={transactionType} onValueChange={setTransactionType}>
//               <SelectTrigger className="w-48">
//                 <SelectValue placeholder="Filter by type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Types</SelectItem>
//                 <SelectItem value="IN">Purchases</SelectItem>
//                 <SelectItem value="OUT">Payments</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="bg-card rounded-lg border">
//             <div className="px-6 py-4 border-b">
//               <h3 className="font-semibold">Transaction History</h3>
//               <p className="text-sm text-muted-foreground">All financial transactions with this supplier</p>
//             </div>
//             <div className="divide-y">
//               {filteredTransactions.length === 0 ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   No transactions found
//                 </div>
//               ) : (
//                 filteredTransactions.map((transaction) => (
//                   <div key={transaction.id} className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
//                     <div>
//                       <div className="font-medium">{transaction.description}</div>
//                       <div className="text-sm text-muted-foreground">
//                         #{transaction.id} • {transaction.reference_type || 'Transaction'}
//                       </div>
//                     </div>
//                     <div className="md:col-span-2">
//                       <div className="text-sm text-muted-foreground">Date</div>
//                       <div className="font-medium">{format(new Date(transaction.date), 'MMM dd, yyyy')}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-muted-foreground">Type</div>
//                       <Badge variant="secondary">
//                         {transaction.transaction_type === 'IN' ? 'Purchase' : 'Payment'}
//                       </Badge>
//                     </div>
//                     <div className="text-right">
//                       <div className="font-semibold">
//                         {transaction.transaction_type === 'IN' ? '-' : '+'} {formatCurrency(transaction.amount)}
//                       </div>
//                       <div className="text-sm text-muted-foreground">Balance</div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </TabsContent>

//         {/* Purchase Orders Tab */}
//         <TabsContent value="orders" className="space-y-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="font-semibold">Purchase Orders</h3>
//               <p className="text-sm text-muted-foreground">Purchase orders created for this supplier</p>
//             </div>
//             <Button className="gap-2">
//               <Plus className="w-4 h-4" />
//               New Order
//             </Button>
//           </div>

//           <div className="bg-card rounded-lg border">
//             <div className="divide-y">
//               {purchaseOrders.length === 0 ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   No purchase orders found
//                 </div>
//               ) : (
//                 purchaseOrders.map((order) => (
//                   <div key={order.id} className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
//                     <div>
//                       <div className="font-medium">{order.order_number}</div>
//                       <div className="text-sm text-muted-foreground">Order #{order.id}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-muted-foreground">Amount</div>
//                       <div className="font-semibold">{formatCurrency(order.total_amount)}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-muted-foreground">Status</div>
//                       <Badge 
//                         className={order.status === 'COMPLETED' ? "bg-success/10 text-success" : 
//                                   order.status === 'PENDING' ? "bg-warning/10 text-warning" :
//                                   order.status === 'CANCELLED' ? "bg-destructive/10 text-destructive" :
//                                   "bg-muted text-muted-foreground"}
//                       >
//                         {order.status}
//                       </Badge>
//                     </div>
//                     <div>
//                       <div className="text-sm text-muted-foreground">Order Date</div>
//                       <div className="font-medium">{format(new Date(order.created_at), 'MMM dd, yyyy')}</div>
//                     </div>
//                     <div className="text-right">
//                       <div className="text-sm text-muted-foreground">Delivery</div>
//                       <div className="font-medium">
//                         {order.expected_delivery_date ? format(new Date(order.expected_delivery_date), 'MMM dd, yyyy') : 'N/A'}
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </TabsContent>

//         {/* Analytics Tab */}
//         <TabsContent value="analytics" className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-3">
//                   <TrendingUp className="w-5 h-5" />
//                   Spending Trend
//                 </CardTitle>
//                 <CardDescription>Last 6 months</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">This Month</span>
//                     <span className="font-medium">{formatCurrency((stats?.total_spent || 0) / 6)}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">Average per Order</span>
//                     <span className="font-medium">{formatCurrency((stats?.total_spent || 0) / (stats?.total_purchases || 1))}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">Payment Efficiency</span>
//                     <span className="font-medium">85%</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-3">
//                   <Calendar className="w-5 h-5" />
//                   Activity Summary
//                 </CardTitle>
//                 <CardDescription>Recent activity</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">Last Purchase</span>
//                     <span className="font-medium">{stats?.last_transaction_date ? format(new Date(stats.last_transaction_date), 'MMM dd, yyyy') : 'N/A'}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">Avg. Response Time</span>
//                     <span className="font-medium">2.5 days</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">On-time Delivery</span>
//                     <span className="font-medium">92%</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-3">
//                   <Building2 className="w-5 h-5" />
//                   Supplier Health
//                 </CardTitle>
//                 <CardDescription>Performance metrics</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">Quality Score</span>
//                     <span className="font-medium">4.2/5</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">Reliability</span>
//                     <span className="font-medium">94%</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">Communication</span>
//                     <span className="font-medium">Excellent</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };

// export default SupplierDetails;

































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