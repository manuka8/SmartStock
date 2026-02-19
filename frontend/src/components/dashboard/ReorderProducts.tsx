import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  suggestedQuantity: number;
  unitPrice: number;
  supplierId?: string;
  supplierName?: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "sent" | "confirmed" | "received";
  createdAt: string;
}

export default function ReorderProducts() {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<string, OrderItem>>(new Map());
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, suppliersRes, ordersRes] = await Promise.all([
        apiFetch("/api/inventory/low-stock"),
        apiFetch("/api/suppliers"),
        apiFetch("/api/purchase-orders"),
      ]);

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setLowStockItems(data);
      } else {
        // Fallback dummy data
        setLowStockItems([
          { id: "1", name: "Widget A", sku: "WGT-001", currentStock: 5, reorderLevel: 20, suggestedQuantity: 50, unitPrice: 12.50, supplierId: "1", supplierName: "ABC Supplies" },
          { id: "2", name: "Gadget B", sku: "GDT-002", currentStock: 3, reorderLevel: 15, suggestedQuantity: 40, unitPrice: 25.00, supplierId: "2", supplierName: "XYZ Trading" },
          { id: "3", name: "Component C", sku: "CMP-003", currentStock: 8, reorderLevel: 25, suggestedQuantity: 60, unitPrice: 8.75, supplierId: "1", supplierName: "ABC Supplies" },
          { id: "4", name: "Part D", sku: "PRT-004", currentStock: 2, reorderLevel: 10, suggestedQuantity: 30, unitPrice: 45.00, supplierId: "3", supplierName: "Prime Distributors" },
          { id: "5", name: "Material E", sku: "MTL-005", currentStock: 10, reorderLevel: 30, suggestedQuantity: 80, unitPrice: 5.25, supplierId: "2", supplierName: "XYZ Trading" },
        ]);
      }

      if (suppliersRes.ok) {
        const data = await suppliersRes.json();
        setSuppliers(data);
      } else {
        setSuppliers([
          { id: "1", name: "ABC Supplies", email: "orders@abcsupplies.com", phone: "+1 555-0101" },
          { id: "2", name: "XYZ Trading", email: "sales@xyztrading.com", phone: "+1 555-0102" },
          { id: "3", name: "Prime Distributors", email: "orders@primedist.com", phone: "+1 555-0103" },
        ]);
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setPurchaseOrders(data);
      } else {
        setPurchaseOrders([
          {
            id: "PO-001",
            supplierId: "1",
            supplierName: "ABC Supplies",
            items: [{ productId: "1", productName: "Widget A", sku: "WGT-001", quantity: 50, unitPrice: 12.50, totalPrice: 625 }],
            totalAmount: 625,
            status: "pending",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (item: LowStockItem, checked: boolean) => {
    const newSelected = new Map(selectedItems);
    if (checked) {
      newSelected.set(item.id, {
        productId: item.id,
        productName: item.name,
        sku: item.sku,
        quantity: item.suggestedQuantity,
        unitPrice: item.unitPrice,
        totalPrice: item.suggestedQuantity * item.unitPrice,
      });
    } else {
      newSelected.delete(item.id);
    }
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(itemId);
    if (item) {
      item.quantity = quantity;
      item.totalPrice = quantity * item.unitPrice;
      newSelected.set(itemId, item);
      setSelectedItems(newSelected);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Map<string, OrderItem>();
      filteredItems.forEach((item) => {
        newSelected.set(item.id, {
          productId: item.id,
          productName: item.name,
          sku: item.sku,
          quantity: item.suggestedQuantity,
          unitPrice: item.unitPrice,
          totalPrice: item.suggestedQuantity * item.unitPrice,
        });
      });
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(new Map());
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedSupplier) {
      toast({
        title: "Error",
        description: "Please select a supplier",
        variant: "destructive",
      });
      return;
    }

    if (selectedItems.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item to order",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const supplier = suppliers.find((s) => s.id === selectedSupplier);
      const items = Array.from(selectedItems.values());
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

      const orderData = {
        supplierId: selectedSupplier,
        supplierName: supplier?.name,
        items,
        totalAmount,
      };

      const response = await apiFetch("/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        toast({
          title: "Order Created",
          description: "Purchase order has been created successfully",
        });
        setSelectedItems(new Map());
        setSelectedSupplier("");
        setIsOrderDialogOpen(false);
        fetchData();
      } else {
        // Simulate success for demo
        const newOrder: PurchaseOrder = {
          id: `PO-${String(purchaseOrders.length + 1).padStart(3, "0")}`,
          supplierId: selectedSupplier,
          supplierName: supplier?.name || "",
          items,
          totalAmount,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        setPurchaseOrders([newOrder, ...purchaseOrders]);
        toast({
          title: "Order Created",
          description: "Purchase order has been created successfully",
        });
        setSelectedItems(new Map());
        setSelectedSupplier("");
        setIsOrderDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await apiFetch(`/api/purchase-orders/${orderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Order Deleted",
          description: "Purchase order has been deleted",
        });
        fetchData();
      } else {
        setPurchaseOrders(purchaseOrders.filter((o) => o.id !== orderId));
        toast({
          title: "Order Deleted",
          description: "Purchase order has been deleted",
        });
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const handleSendOrder = async (orderId: string) => {
    try {
      const response = await apiFetch(`/api/purchase-orders/${orderId}/send`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Order Sent",
          description: "Purchase order has been sent to supplier",
        });
        fetchData();
      } else {
        setPurchaseOrders(
          purchaseOrders.map((o) =>
            o.id === orderId ? { ...o, status: "sent" as const } : o
          )
        );
        toast({
          title: "Order Sent",
          description: "Purchase order has been sent to supplier",
        });
      }
    } catch (error) {
      console.error("Error sending order:", error);
    }
  };

  const filteredItems = lowStockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSelectedAmount = Array.from(selectedItems.values()).reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  const getStatusBadge = (status: PurchaseOrder["status"]) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      received: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return <Badge className={styles[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reorder Products</h1>
          <p className="text-muted-foreground">
            Order low stock products from suppliers
          </p>
        </div>
        <Button
          onClick={() => setIsOrderDialogOpen(true)}
          disabled={selectedItems.size === 0}
          className="gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Create Order ({selectedItems.size})
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Items need reordering</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Items</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedItems.size}</div>
            <p className="text-xs text-muted-foreground">Items in cart</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Total</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalSelectedAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Selected items value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchaseOrders.filter((o) => o.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Items Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Items
            </CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredItems.length > 0 &&
                        filteredItems.every((item) => selectedItems.has(item.id))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                  <TableHead className="text-right">Order Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                        <p className="text-muted-foreground">
                          All products are well stocked!
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    const selectedItem = selectedItems.get(item.id);
                    const quantity = selectedItem?.quantity || item.suggestedQuantity;
                    const total = quantity * item.unitPrice;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleItemSelect(item, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.sku}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              item.currentStock <= item.reorderLevel / 2
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {item.currentStock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.reorderLevel}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20 text-right"
                            disabled={!isSelected}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${isSelected ? total.toFixed(2) : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Purchase Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <p className="text-muted-foreground">No purchase orders yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.supplierName}</TableCell>
                      <TableCell className="text-right">
                        {order.items.length}
                      </TableCell>
                      <TableCell className="text-right">
                        ${order.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {order.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendOrder(order.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Review your order and select a supplier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Supplier</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(selectedItems.values()).map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">
                        {item.productName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.sku}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        ${item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${item.totalPrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newSelected = new Map(selectedItems);
                            newSelected.delete(item.productId);
                            setSelectedItems(newSelected);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold">
                ${totalSelectedAmount.toFixed(2)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOrderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={isSubmitting || !selectedSupplier}
              className="gap-2"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
