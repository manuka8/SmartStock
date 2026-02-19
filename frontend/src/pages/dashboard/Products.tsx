import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

const categories = [
  "Dairy",
  "Bakery",
  "Beverages",
  "Produce",
  "Meat",
  "Frozen",
  "Snacks",
];
const units = [
  "Piece",
  "Kg",
  "Milliliter",
  "Liter",
  "Pack",
  "Box",
  "Dozen",
];

interface ItemMaster {
  id: number;
  item_code: string;
  item_name: string;
  category?: string;
  brand?: string;
  unit: string;
  unit_size?: number;
  buying_price: number;
  selling_price_1: number;
  selling_price_2?: number;
  selling_price_3?: number;
  tax_rate?: number;
  barcode?: string;
  image_url?: string;
  is_expirable?: boolean;
  shelf_life_days?: number;
  status?: string;
  current_quantity?: number;
  reorder_level?: number;
  supplier_id?: number;
}

interface Supplier {
  id: number;
  supplier_name: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "In Stock":
      return "bg-success/10 text-success";
    case "Low Stock":
      return "bg-warning/10 text-warning";
    case "Critical":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function Products() {
  const { toast } = useToast();
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [supplierSelectOpen, setSupplierSelectOpen] = useState(false);
  const [formData, setFormData] = useState({
    item_code: "",
    item_name: "",
    category: "",
    brand: "",
    supplier_id: "",
    unit: "",
    unit_size: "",
    buying_price: "",
    selling_price_1: "",
    selling_price_2: "",
    selling_price_3: "",
    tax_rate: "",
    barcode: "",
    image_url: "",
    is_expirable: false,
    shelf_life_days: "",
    reorder_level: "",
    status: "ACTIVE",
  });

  // Fetch items and suppliers on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [itemsResponse, suppliersResponse] = await Promise.all([
        apiFetch("/api/itemMaster/getAllItems", { method: "GET" }),
        apiFetch("/api/suppliers/getAllSuppliers", { method: "GET" }),
      ]);

      if (!itemsResponse.ok || !suppliersResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const itemsData = await itemsResponse.json();
      const suppliersData = await suppliersResponse.json();

      setItems(itemsData.items || []);
      setSuppliers(suppliersData.suppliers || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load products and suppliers",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = items.filter((product) =>
    product.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        item_code: formData.item_code,
        item_name: formData.item_name,
        category: formData.category || null,
        brand: formData.brand || null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        unit: formData.unit,
        unit_size: formData.unit_size ? parseFloat(formData.unit_size) : null,
        buying_price: parseFloat(formData.buying_price),
        selling_price_1: parseFloat(formData.selling_price_1),
        selling_price_2: formData.selling_price_2
          ? parseFloat(formData.selling_price_2)
          : null,
        selling_price_3: formData.selling_price_3
          ? parseFloat(formData.selling_price_3)
          : null,
        tax_rate: formData.tax_rate ? parseFloat(formData.tax_rate) : 0,
        barcode: formData.barcode || null,
        image_url: formData.image_url || null,
        is_expirable: formData.is_expirable,
        shelf_life_days: formData.shelf_life_days
          ? parseInt(formData.shelf_life_days)
          : null,
        reorder_level: formData.reorder_level ? parseInt(formData.reorder_level) : null,
        status: formData.status,
      };

      const url = editingId
        ? `/api/itemMaster/updateItem/${editingId}`
        : "/api/itemMaster/addItem";
      const method = editingId ? "PUT" : "POST";

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save item");
      }

      toast({
        title: "Success",
        description: editingId
          ? "Product updated successfully"
          : "Product added successfully",
      });

      setIsDialogOpen(false);
      setEditingId(null);
      setFormData({
        item_code: "",
        item_name: "",
        category: "",
        brand: "",
        supplier_id: "",
        unit: "",
        unit_size: "",
        buying_price: "",
        selling_price_1: "",
        selling_price_2: "",
        selling_price_3: "",
        tax_rate: "",
        barcode: "",
        image_url: "",
        is_expirable: false,
        shelf_life_days: "",
        reorder_level: "",
        status: "ACTIVE",
      });

      // Refresh the items list
      await fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save product",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: ItemMaster) => {
    setEditingId(product.id);
    setFormData({
      item_code: product.item_code || "",
      item_name: product.item_name,
      category: product.category || "",
      brand: product.brand || "",
      supplier_id: product.supplier_id?.toString() || "",
      unit: product.unit || "",
      unit_size: product.unit_size?.toString() || "",
      buying_price: product.buying_price.toString(),
      selling_price_1: product.selling_price_1.toString(),
      selling_price_2: product.selling_price_2?.toString() || "",
      selling_price_3: product.selling_price_3?.toString() || "",
      tax_rate: product.tax_rate?.toString() || "",
      barcode: product.barcode || "",
      image_url: product.image_url || "",
      is_expirable: product.is_expirable || false,
      shelf_life_days: product.shelf_life_days?.toString() || "",
      reorder_level: product.reorder_level?.toString() || "",
      status: product.status || "ACTIVE",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const response = await apiFetch(`/api/itemMaster/deleteItem/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete item");
      }

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      await fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete product",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setFormData({
                item_code: "",
                item_name: "",
                category: "",
                brand: "",
                supplier_id: "",
                unit: "",
                unit_size: "",
                buying_price: "",
                selling_price_1: "",
                selling_price_2: "",
                selling_price_3: "",
                tax_rate: "",
                barcode: "",
                image_url: "",
                is_expirable: false,
                shelf_life_days: "",
                reorder_level: "",
                status: "ACTIVE",
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item_code">Item Code *</Label>
                  <Input
                    id="item_code"
                    placeholder="PRD001"
                    value={formData.item_code}
                    onChange={(e) =>
                      handleInputChange("item_code", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item_name">Item Name *</Label>
                  <Input
                    id="item_name"
                    placeholder="Product name"
                    value={formData.item_name}
                    onChange={(e) =>
                      handleInputChange("item_name", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="Brand name"
                    value={formData.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Supplier</Label>
                  <Popover open={supplierSelectOpen} onOpenChange={setSupplierSelectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={supplierSelectOpen}
                        className="w-full justify-between"
                      >
                        {formData.supplier_id
                          ? suppliers.find(s => s.id.toString() === formData.supplier_id)?.supplier_name || "Select supplier..."
                          : "Select supplier..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput placeholder="Search suppliers..." />
                        <CommandList>
                          <CommandEmpty>No suppliers found.</CommandEmpty>
                          <CommandGroup>
                            {suppliers
                              .sort((a, b) => a.supplier_name.localeCompare(b.supplier_name))
                              .map((supplier) => (
                                <CommandItem
                                  key={supplier.id}
                                  value={supplier.supplier_name}
                                  onSelect={() => {
                                    handleInputChange("supplier_id", supplier.id.toString());
                                    setSupplierSelectOpen(false);
                                  }}
                                >
                                  {supplier.supplier_name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleInputChange("unit", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_size">Unit Size</Label>
                  <Input
                    id="unit_size"
                    type="number"
                    step="0.01"
                    placeholder="Size in selected unit"
                    value={formData.unit_size}
                    onChange={(e) =>
                      handleInputChange("unit_size", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buying_price">Buying Price *</Label>
                  <Input
                    id="buying_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.buying_price}
                    onChange={(e) =>
                      handleInputChange("buying_price", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selling_price_1">Selling Price 1 *</Label>
                  <Input
                    id="selling_price_1"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.selling_price_1}
                    onChange={(e) =>
                      handleInputChange("selling_price_1", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selling_price_2">Selling Price 2</Label>
                  <Input
                    id="selling_price_2"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.selling_price_2}
                    onChange={(e) =>
                      handleInputChange("selling_price_2", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selling_price_3">Selling Price 3</Label>
                  <Input
                    id="selling_price_3"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.selling_price_3}
                    onChange={(e) =>
                      handleInputChange("selling_price_3", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.tax_rate}
                    onChange={(e) =>
                      handleInputChange("tax_rate", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    placeholder="Product barcode"
                    value={formData.barcode}
                    onChange={(e) =>
                      handleInputChange("barcode", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={(e) =>
                      handleInputChange("image_url", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder_level">Reorder Level</Label>
                  <Input
                    id="reorder_level"
                    type="number"
                    placeholder="10"
                    value={formData.reorder_level}
                    onChange={(e) =>
                      handleInputChange("reorder_level", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label
                    htmlFor="is_expirable"
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      id="is_expirable"
                      checked={formData.is_expirable}
                      onChange={(e) =>
                        handleInputChange(
                          "is_expirable",
                          e.target.checked ? "true" : "false"
                        )
                      }
                      className="rounded"
                    />
                    Is Expirable
                  </Label>
                </div>
                {formData.is_expirable && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="shelf_life_days">Shelf Life (Days)</Label>
                    <Input
                      id="shelf_life_days"
                      type="number"
                      placeholder="Days"
                      value={formData.shelf_life_days}
                      onChange={(e) =>
                        handleInputChange("shelf_life_days", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? editingId
                      ? "Updating..."
                      : "Adding..."
                    : editingId
                    ? "Update Product"
                    : "Add Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border border-border/50 p-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Item Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Unit Size</TableHead>
              <TableHead>Current Quantity</TableHead>
              <TableHead>Buying Price</TableHead>
              <TableHead>Selling Price 1</TableHead>
              <TableHead>Selling Price 2</TableHead>
              <TableHead>Selling Price 3</TableHead>
              <TableHead>Tax Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading products...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-muted-foreground"
                >
                  No products found. Add your first product to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    {product.item_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.item_code}
                  </TableCell>
                  <TableCell>{product.category || "-"}</TableCell>
                  <TableCell>{product.brand || "-"}</TableCell>
                  <TableCell>
                    {Number(product.unit_size ? product.unit_size : "-")}{product.unit}
                  </TableCell>
                  <TableCell>{product.current_quantity ?? 0}</TableCell>
                  <TableCell>
                    RS: {Number(product.buying_price).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    RS: {Number(product.selling_price_1).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    RS: {Number(product.selling_price_2).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    RS: {Number(product.selling_price_3).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {product.tax_rate ? `${product.tax_rate}%` : "0%"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEdit(product)}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(product.id)}
                          className="gap-2 text-destructive cursor-pointer"
                          disabled={isDeleting === product.id}
                        >
                          <Trash2 className="w-4 h-4" />
                          {isDeleting === product.id ? "Deleting..." : "Remove"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
