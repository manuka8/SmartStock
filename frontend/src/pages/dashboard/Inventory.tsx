import { useState, useEffect } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Truck,
  Upload,
  Download,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
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

interface ItemMaster {
  id: number;
  item_code: string;
  item_name: string;
  category?: string;
  unit: string;
  buying_price: number;
  selling_price_1: number;
  selling_price_2?: number;
  selling_price_3?: number;
}

interface Transaction {
  id: number;
  item_id: number;
  item_name: string;
  item_code: string;
  transaction_type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string;
  reference_id?: number;
  batch_number?: string;
  expiry_date?: string;
  note?: string;
  performed_by_name?: string;
  created_at: string;
}

interface Vehicle {
  id: number;
  vehicle_code: string;
  vehicle_number: string;
  vehicle_type: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  status: string;
}

interface VehicleRecord {
  vehicle_id: number;
  vehicle_code: string;
  vehicle_number?: string;
  vehicle_type: string;
  vehicle_status: string;
  driver_name?: string;
  items: VehicleInventoryItem[];
}

interface VehicleInventoryItem {
  item_id: number;
  item_name: string;
  item_code: string;
  unit: string;
  unit_size?: number;
  quantity: number;
  selling_price_1?: string;
  selling_price_2?: string;
  selling_price_3?: string;
}

interface TransferItem {
  item_id: string;
  quantity: string;
}

interface InventoryRecord {
  id: number;
  item_id: number;
  current_quantity: number;
  item_name: string;
  item_code: string;
}

const referenceTypes = ["PURCHASE", "SALE", "TRANSFER", "DAMAGE", "MANUAL"];

export default function Inventory() {
  const { toast } = useToast();
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const pageSize = 30;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStockOutDialogOpen, setIsStockOutDialogOpen] = useState(false);
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false);
  const [isUnloadingDialogOpen, setIsUnloadingDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [loadingVehicleSelectOpen, setLoadingVehicleSelectOpen] =
    useState(false);
  const [unloadingVehicleSelectOpen, setUnloadingVehicleSelectOpen] =
    useState(false);
  const [stockInItemSelectOpen, setStockInItemSelectOpen] = useState(false);
  const [stockOutItemSelectOpen, setStockOutItemSelectOpen] = useState(false);
  const [formData, setFormData] = useState({
    items: [
      {
        item_id: "",
        quantity: "",
        unit_cost: "",
        price_type: "selling_price_1",
      },
    ],
    reference_type: "",
    reference_id: "",
    batch_number: "",
    expiry_date: "",
    note: "",
  });
  const [loadingFormData, setLoadingFormData] = useState({
    vehicle_id: "",
    transfer_date: new Date().toISOString().split("T")[0],
    items: [{ item_id: "", quantity: "" }] as TransferItem[],
    notes: "",
  });
  const [unloadingFormData, setUnloadingFormData] = useState({
    vehicle_id: "",
    transfer_date: new Date().toISOString().split("T")[0],
    items: [{ item_id: "", quantity: "" }] as TransferItem[],
    notes: "",
  });

  useEffect(() => {
    fetchData();
    fetchTransactions(1);
  }, []);

  const fetchTransactions = async (page = currentPage) => {
    try {
      setIsLoading(true);
      const response = await apiFetch(
        `/api/inventoryTransactions/getAllTransactions?page=${page}&limit=${pageSize}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      setTransactions(data.transactions || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(data.pagination.page);
        setTotalTransactions(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transactions",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [
        itemsResponse,
        allVehiclesResponse,
        vehicleInventoryResponse,
        inventoryResponse,
      ] = await Promise.all([
        apiFetch("/api/itemMaster/getAllItems", { method: "GET" }),
        apiFetch("/api/vehicles/getAllVehicles", {
          method: "GET",
        }),
        apiFetch("/api/vehicleStockTransfers/vehicle-inventory", {
          method: "GET",
        }),
        apiFetch("/api/inventoryManagement/getAllInventory", {
          method: "GET",
        }),
      ]);

      if (
        !itemsResponse.ok ||
        !allVehiclesResponse.ok ||
        !vehicleInventoryResponse.ok ||
        !inventoryResponse.ok
      ) {
        throw new Error("Failed to fetch data");
      }

      const itemsData = await itemsResponse.json();
      const allVehiclesData = await allVehiclesResponse.json();
      const vehicleInventoryData = await vehicleInventoryResponse.json();
      const inventoryJson = await inventoryResponse.json();

      setItems(itemsData.items || []);
      setAllVehicles(allVehiclesData.vehicles || []);
      setVehicles(vehicleInventoryData.data?.vehicles || []);
      setInventoryData(inventoryJson.inventory || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load inventory data",
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    // Find next available product
    const selectedItemIds = formData.items.map((i) => i.item_id);
    const sortedItems = [...items].sort((a, b) =>
      a.item_name.localeCompare(b.item_name),
    );
    const nextAvailable = sortedItems.find(
      (itm) => !selectedItemIds.includes(itm.id.toString()),
    );

    setFormData((prev) => ({
      ...prev,
      items: [
        {
          item_id: nextAvailable ? nextAvailable.id.toString() : "",
          quantity: "1",
          unit_cost: nextAvailable ? nextAvailable.buying_price.toString() : "",
          price_type: "selling_price_1",
        },
        ...prev.items, // Spread existing items after the new one
      ],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };

          // Auto-populate unit price when item or price type changes
          if (field === "item_id" || field === "price_type") {
            const selectedItem = items.find(
              (itm) =>
                itm.id.toString() ===
                (field === "item_id" ? value : item.item_id),
            );
            if (selectedItem) {
              const priceType =
                field === "price_type"
                  ? value
                  : item.price_type || "selling_price_1";
              let unitPrice = "";
              if (priceType === "buying_price") {
                unitPrice = selectedItem.buying_price?.toString() || "";
              } else if (priceType === "selling_price_1") {
                unitPrice = selectedItem.selling_price_1?.toString() || "";
              } else if (priceType === "selling_price_2") {
                unitPrice = selectedItem.selling_price_2?.toString() || "";
              } else if (priceType === "selling_price_3") {
                unitPrice = selectedItem.selling_price_3?.toString() || "";
              } else if (priceType === "custom") {
                unitPrice = item.unit_cost || "";
              }
              updatedItem.unit_cost = unitPrice;
            }
          }

          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent,
    transType: "IN" | "OUT" | "ADJUSTMENT" | "RETURN",
  ) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validItems = formData.items.filter(
        (item) => item.item_id && item.quantity && parseInt(item.quantity) > 0,
      );

      if (validItems.length === 0) {
        throw new Error("At least one valid item with quantity is required");
      }

      // Create transactions for each item
      const transactionPromises = validItems.map(async (item) => {
        const payload = {
          item_id: parseInt(item.item_id),
          transaction_type: transType,
          quantity: parseInt(item.quantity),
          unit_cost: item.unit_cost ? parseFloat(item.unit_cost) : null,
          reference_type:
            formData.reference_type && formData.reference_type.trim()
              ? formData.reference_type
              : null,
          reference_id: formData.reference_id
            ? parseInt(formData.reference_id)
            : null,
          batch_number:
            formData.batch_number && formData.batch_number.trim()
              ? formData.batch_number
              : null,
          expiry_date: formData.expiry_date ? formData.expiry_date : null,
          note: formData.note && formData.note.trim() ? formData.note : null,
        };

        const response = await apiFetch(
          "/api/inventoryTransactions/createTransaction",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.error ||
              `Failed to create transaction for item ${item.item_id}`,
          );
        }

        return response;
      });

      await Promise.all(transactionPromises);

      // Create invoice for stock out transactions
      let invoiceCreated = false;
      if (transType === "OUT") {
        try {
          const totalAmount = validItems.reduce((sum, item) => {
            const unitPrice = item.unit_cost ? parseFloat(item.unit_cost) : 0;
            const quantity = item.quantity ? parseFloat(item.quantity) : 0;
            return sum + unitPrice * quantity;
          }, 0);

          const invoicePayload = {
            invoice_type: "STOCK_OUT",
            customer_name: "Stock Out Transaction",
            customer_address: "",
            customer_phone: "",
            subtotal: totalAmount,
            grand_total: totalAmount,
            payment_status: "PAID",
            amount_paid: totalAmount,
            amount_due: 0,
            date: new Date().toISOString().split("T")[0],
            notes: formData.note || "Stock out transaction",
          };

          const invoiceResponse = await apiFetch(
            "/api/invoices/createInvoice",
            {
              method: "POST",
              body: JSON.stringify(invoicePayload),
            },
          );

          if (invoiceResponse.ok) {
            invoiceCreated = true;
          }
        } catch (error) {
          console.error("Failed to create invoice:", error);
          // Don't fail the whole transaction if invoice creation fails
        }
      }

      toast({
        title: "Success",
        description: `${validItems.length} ${transType} transaction(s) created successfully${invoiceCreated ? " with invoice" : ""}`,
      });

      // Close the appropriate dialog
      if (transType === "IN") {
        setIsDialogOpen(false);
      } else if (transType === "OUT") {
        setIsStockOutDialogOpen(false);
      }

      setFormData({
        items: [
          {
            item_id: "",
            quantity: "",
            unit_cost: "",
            price_type: "selling_price_1",
          },
        ],
        reference_type: "",
        reference_id: "",
        batch_number: "",
        expiry_date: "",
        note: "",
      });

      await fetchTransactions(currentPage);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create transaction",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const response = await apiFetch(
        `/api/inventoryTransactions/deleteTransaction/${id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete transaction");
      }

      toast({
        title: "Success",
        description: "Transaction deleted and inventory reversed",
      });

      await fetchTransactions(currentPage);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete transaction",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleLoadingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!loadingFormData.vehicle_id || !loadingFormData.transfer_date) {
        throw new Error("Vehicle and transfer date are required");
      }

      const validItems = loadingFormData.items.filter(
        (item) => item.item_id && item.quantity && parseInt(item.quantity) > 0,
      );

      if (validItems.length === 0) {
        throw new Error("At least one valid item is required");
      }

      const payload = {
        vehicle_id: parseInt(loadingFormData.vehicle_id),
        transfer_date: loadingFormData.transfer_date,
        items: validItems.map((item) => ({
          item_id: parseInt(item.item_id),
          quantity: parseInt(item.quantity),
        })),
        notes: loadingFormData.notes || null,
      };

      const response = await apiFetch("/api/vehicleStockTransfers/loading", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load stock to vehicle");
      }

      toast({
        title: "Success",
        description: "Stock loaded to vehicle successfully",
      });

      setIsLoadingDialogOpen(false);
      setLoadingFormData({
        vehicle_id: "",
        transfer_date: new Date().toISOString().split("T")[0],
        items: [{ item_id: "", quantity: "" }],
        notes: "",
      });

      await fetchTransactions(currentPage);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load stock to vehicle",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnloadingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!unloadingFormData.vehicle_id || !unloadingFormData.transfer_date) {
        throw new Error("Vehicle and transfer date are required");
      }

      const validItems = unloadingFormData.items.filter(
        (item) => item.item_id && item.quantity && parseInt(item.quantity) > 0,
      );

      if (validItems.length === 0) {
        throw new Error("At least one valid item is required");
      }

      const payload = {
        vehicle_id: parseInt(unloadingFormData.vehicle_id),
        transfer_date: unloadingFormData.transfer_date,
        items: validItems.map((item) => ({
          item_id: parseInt(item.item_id),
          quantity: parseInt(item.quantity),
        })),
        notes: unloadingFormData.notes || null,
      };

      const response = await apiFetch("/api/vehicleStockTransfers/unloading", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unload stock from vehicle");
      }

      toast({
        title: "Success",
        description: "Stock unloaded from vehicle successfully",
      });

      setIsUnloadingDialogOpen(false);
      setUnloadingFormData({
        vehicle_id: "",
        transfer_date: new Date().toISOString().split("T")[0],
        items: [{ item_id: "", quantity: "" }],
        notes: "",
      });

      await fetchTransactions(currentPage);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to unload stock from vehicle",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLoadingItem = () => {
    // Find next available item that is in stock and not already in loadingFormData.items
    const selectedItemIds = loadingFormData.items.map((i) => i.item_id);
    const sortedItems = [...items].sort((a, b) =>
      a.item_name.localeCompare(b.item_name),
    );
    const nextAvailable = sortedItems.find(
      (itm) => !selectedItemIds.includes(itm.id.toString()),
    );

    let availableQty = "0";
    if (nextAvailable) {
      const stockItem = inventoryData.find(
        (inv) => inv.item_id === nextAvailable.id,
      );
      availableQty = (stockItem?.current_quantity || 0).toString();
    }

    // Add new item at the beginning
    setLoadingFormData((prev) => ({
      ...prev,
      items: [
        {
          item_id: nextAvailable ? nextAvailable.id.toString() : "",
          quantity: availableQty,
        },
        ...prev.items,
      ],
    }));
    
  };

  const removeLoadingItem = (index: number) => {
    setLoadingFormData({
      ...loadingFormData,
      items: loadingFormData.items.filter((_, i) => i !== index),
    });
  };

  const updateLoadingItem = (
    index: number,
    field: keyof TransferItem,
    value: string,
  ) => {
    const newItems = [...loadingFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setLoadingFormData({ ...loadingFormData, items: newItems });
  };

  const updateUnloadingItem = (
    index: number,
    field: keyof TransferItem,
    value: string,
  ) => {
    const newItems = [...unloadingFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setUnloadingFormData({ ...unloadingFormData, items: newItems });
  };

  const filteredTransactions = transactions.filter((transaction) =>
    (transaction.item_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const statsData = {
    stockIn: transactions
      .filter((t) => t.transaction_type === "IN")
      .reduce((sum, t) => sum + t.quantity, 0),
    stockOut: transactions
      .filter((t) => t.transaction_type === "OUT")
      .reduce((sum, t) => sum + t.quantity, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Track stock movements and adjustments
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog
            open={isLoadingDialogOpen}
            onOpenChange={(open) => {
              setIsLoadingDialogOpen(open);
              if (!open) {
                setLoadingFormData({
                  vehicle_id: "",
                  transfer_date: new Date().toISOString().split("T")[0],
                  items: [{ item_id: "", quantity: "" }],
                  notes: "",
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Loading
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Load Stock to Vehicle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLoadingSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loading_vehicle">Select Vehicle *</Label>
                    <Popover
                      open={loadingVehicleSelectOpen}
                      onOpenChange={setLoadingVehicleSelectOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={loadingVehicleSelectOpen}
                          className="w-full justify-between"
                        >
                          {loadingFormData.vehicle_id
                            ? allVehicles.find(
                                (v) =>
                                  v.id.toString() ===
                                  loadingFormData.vehicle_id,
                              )?.vehicle_code +
                                (allVehicles.find(
                                  (v) =>
                                    v.id.toString() ===
                                    loadingFormData.vehicle_id,
                                )?.vehicle_number
                                  ? ` (${
                                      allVehicles.find(
                                        (v) =>
                                          v.id.toString() ===
                                          loadingFormData.vehicle_id,
                                      )?.vehicle_number
                                    })`
                                  : "") || "Select a vehicle..."
                            : "Select a vehicle..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <Command>
                          <CommandInput placeholder="Search vehicles..." />
                          <CommandList>
                            <CommandEmpty>No vehicles found.</CommandEmpty>
                            <CommandGroup>
                              {allVehicles
                                .sort((a, b) =>
                                  a.vehicle_code.localeCompare(b.vehicle_code),
                                )
                                .map((vehicle) => (
                                  <CommandItem
                                    key={vehicle.id}
                                    value={
                                      vehicle.vehicle_code +
                                      " " +
                                      (vehicle.vehicle_number || "")
                                    }
                                    onSelect={() => {
                                      setLoadingFormData({
                                        ...loadingFormData,
                                        vehicle_id: vehicle.id.toString(),
                                      });
                                      setLoadingVehicleSelectOpen(false);
                                    }}
                                  >
                                    {vehicle.vehicle_code}{" "}
                                    {vehicle.vehicle_number
                                      ? `(${vehicle.vehicle_number})`
                                      : ""}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loading_date">Transfer Date *</Label>
                    <Input
                      id="loading_date"
                      type="date"
                      value={loadingFormData.transfer_date}
                      onChange={(e) =>
                        setLoadingFormData({
                          ...loadingFormData,
                          transfer_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Items *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLoadingItem}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {loadingFormData.items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Item</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                              >
                                {item.item_id
                                  ? items.find(
                                      (i) => i.id.toString() === item.item_id,
                                    )?.item_name +
                                      " (" +
                                      items.find(
                                        (i) => i.id.toString() === item.item_id,
                                      )?.item_code +
                                      ")" || "Select item"
                                  : "Select item"}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                              <Command>
                                <CommandInput placeholder="Search items..." />
                                <CommandList>
                                  <CommandEmpty>No items found.</CommandEmpty>
                                  <CommandGroup>
                                    {items
                                      .filter((itm) =>
                                        loadingFormData.items.every(
                                          (row, rIndex) =>
                                            rIndex === index ||
                                            row.item_id !== itm.id.toString(),
                                        ),
                                      )
                                      .sort((a, b) => {
                                        const currentItemId = loadingFormData.items[index]?.item_id;
                                      
                                        // 1️⃣ Currently selected item (for this row) goes first
                                        if (a.id.toString() === currentItemId) return -1;
                                        if (b.id.toString() === currentItemId) return 1;
                                      
                                        // 2️⃣ Other selected items in the form come next
                                        const aIsSelected = loadingFormData.items.some(
                                          (row) => row.item_id === a.id.toString()
                                        );
                                      
                                        const bIsSelected = loadingFormData.items.some(
                                          (row) => row.item_id === b.id.toString()
                                        );
                                      
                                        if (aIsSelected && !bIsSelected) return -1;
                                        if (!aIsSelected && bIsSelected) return 1;
                                      
                                        // 3️⃣ Remaining items sorted alphabetically
                                        return a.item_name.localeCompare(b.item_name);
                                      })
                                      
                                      .map((itm) => (
                                        <CommandItem
                                          key={itm.id}
                                          value={
                                            itm.item_name + " " + itm.item_code
                                          }
                                          onSelect={() => {
                                            const stockItem =
                                              inventoryData.find(
                                                (inv) => inv.item_id === itm.id,
                                              );
                                            const availableQty =
                                              stockItem?.current_quantity || 0;

                                            const newItems = [
                                              ...loadingFormData.items,
                                            ];
                                            newItems[index] = {
                                              ...newItems[index],
                                              item_id: itm.id.toString(),
                                              quantity: availableQty.toString(),
                                            };
                                            setLoadingFormData({
                                              ...loadingFormData,
                                              items: newItems,
                                            });
                                          }}
                                        >
                                          {itm.item_name} ({itm.item_code})
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="w-32 space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLoadingItem(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                            min="1"
                          />
                        </div>
                        {loadingFormData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLoadingItem(index)}
                            className="mb-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loading_notes">Notes</Label>
                  <Input
                    id="loading_notes"
                    placeholder="Add any notes..."
                    value={loadingFormData.notes}
                    onChange={(e) =>
                      setLoadingFormData({
                        ...loadingFormData,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsLoadingDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Load Stock"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isUnloadingDialogOpen}
            onOpenChange={(open) => {
              setIsUnloadingDialogOpen(open);
              if (!open) {
                setUnloadingFormData({
                  vehicle_id: "",
                  transfer_date: new Date().toISOString().split("T")[0],
                  items: [],
                  notes: "",
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Unloading
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Unload Stock from Vehicle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUnloadingSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unloading_vehicle">Select Vehicle *</Label>
                    <Popover
                      open={unloadingVehicleSelectOpen}
                      onOpenChange={setUnloadingVehicleSelectOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={unloadingVehicleSelectOpen}
                          className="w-full justify-between"
                        >
                          {unloadingFormData.vehicle_id
                            ? vehicles.find(
                                (v) =>
                                  v.vehicle_id.toString() ===
                                  unloadingFormData.vehicle_id,
                              )?.vehicle_code +
                                (vehicles.find(
                                  (v) =>
                                    v.vehicle_id.toString() ===
                                    unloadingFormData.vehicle_id,
                                )?.vehicle_number
                                  ? ` (${
                                      vehicles.find(
                                        (v) =>
                                          v.vehicle_id.toString() ===
                                          unloadingFormData.vehicle_id,
                                      )?.vehicle_number
                                    })`
                                  : "") || "Select a vehicle..."
                            : "Select a vehicle..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <Command>
                          <CommandInput placeholder="Search vehicles..." />
                          <CommandList>
                            <CommandEmpty>No vehicles found.</CommandEmpty>
                            <CommandGroup>
                              {vehicles
                                .sort((a, b) =>
                                  a.vehicle_code.localeCompare(b.vehicle_code),
                                )
                                .map((vehicle) => (
                                  <CommandItem
                                    key={vehicle.vehicle_id}
                                    value={
                                      vehicle.vehicle_code +
                                      " " +
                                      (vehicle.vehicle_number || "")
                                    }
                                    onSelect={() => {
                                      const selectedVehicle = vehicles.find(
                                        (v) =>
                                          v.vehicle_id === vehicle.vehicle_id,
                                      );
                                      setUnloadingFormData({
                                        ...unloadingFormData,
                                        vehicle_id:
                                          vehicle.vehicle_id.toString(),
                                        items:
                                          selectedVehicle?.items.map(
                                            (item) => ({
                                              item_id: item.item_id.toString(),
                                              quantity:
                                                item.quantity.toString(),
                                            }),
                                          ) || [],
                                      });
                                      setUnloadingVehicleSelectOpen(false);
                                    }}
                                  >
                                    {vehicle.vehicle_code}{" "}
                                    {vehicle.vehicle_number
                                      ? `(${vehicle.vehicle_number})`
                                      : ""}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unloading_date">Transfer Date *</Label>
                    <Input
                      id="unloading_date"
                      type="date"
                      value={unloadingFormData.transfer_date}
                      onChange={(e) =>
                        setUnloadingFormData({
                          ...unloadingFormData,
                          transfer_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Items to Unload *</Label>
                  {(() => {
                    const selectedUnloadingVehicle = vehicles.find(
                      (v) =>
                        v.vehicle_id.toString() ===
                        unloadingFormData.vehicle_id,
                    );
                    if (
                      !selectedUnloadingVehicle ||
                      selectedUnloadingVehicle.items.length === 0
                    ) {
                      return (
                        <div className="text-center py-6 text-muted-foreground border rounded-lg">
                          {unloadingFormData.vehicle_id
                            ? "No items in this vehicle."
                            : "Select a vehicle to view available items."}
                        </div>
                      );
                    }
                    return (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead>Item Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right">
                                  Available Qty
                                </TableHead>
                                <TableHead className="text-right">
                                  Unload Qty
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedUnloadingVehicle.items.map(
                                (vehicleItem, index) => (
                                  <TableRow key={vehicleItem.item_id}>
                                    <TableCell className="font-medium">
                                      {vehicleItem.item_name}
                                    </TableCell>
                                    <TableCell>
                                      {vehicleItem.item_code}
                                    </TableCell>
                                    <TableCell>{vehicleItem.unit}</TableCell>
                                    <TableCell className="text-right">
                                      {vehicleItem.quantity}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={
                                          unloadingFormData.items[index]
                                            ?.quantity || "0"
                                        }
                                        onChange={(e) =>
                                          updateUnloadingItem(
                                            index,
                                            "quantity",
                                            e.target.value,
                                          )
                                        }
                                        min="0"
                                        max={vehicleItem.quantity}
                                        className="w-20 text-right"
                                      />
                                    </TableCell>
                                  </TableRow>
                                ),
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unloading_notes">Notes</Label>
                  <Input
                    id="unloading_notes"
                    placeholder="Add any notes..."
                    value={unloadingFormData.notes}
                    onChange={(e) =>
                      setUnloadingFormData({
                        ...unloadingFormData,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUnloadingDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Unload Stock"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setFormData({
                  items: [
                    {
                      item_id: "",
                      quantity: "",
                      unit_cost: "",
                      price_type: "selling_price_1",
                    },
                  ],
                  reference_type: "",
                  reference_id: "",
                  batch_number: "",
                  expiry_date: "",
                  note: "",
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowDownLeft className="w-4 h-4" />
                Stock In
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Stock In Transaction</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => handleSubmit(e, "IN")}
                className="space-y-4 mt-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Items *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="min-w-48">Product</TableHead>
                            <TableHead className="w-16">Unit</TableHead>
                            <TableHead className="w-20 text-center">
                              Qty
                            </TableHead>
                            <TableHead className="w-24 text-right">
                              Unit Cost
                            </TableHead>
                            <TableHead className="w-24 text-right">
                              Total
                            </TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.items.map((item, index) => {
                            const selectedItem = items.find(
                              (i) => i.id.toString() === item.item_id,
                            );
                            const unitCost = item.unit_cost
                              ? parseFloat(item.unit_cost)
                              : 0;
                            const quantity = item.quantity
                              ? parseFloat(item.quantity)
                              : 0;
                            const total = unitCost * quantity;

                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between"
                                      >
                                        {item.item_id
                                          ? selectedItem?.item_name +
                                              " (" +
                                              selectedItem?.item_code +
                                              ")" || "Select item"
                                          : "Select item"}
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                      <Command>
                                        <CommandInput placeholder="Search items..." />
                                        <CommandList>
                                          <CommandEmpty>
                                            No items found.
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {items
                                              .filter((itm) =>
                                                formData.items.every(
                                                  (row, rIndex) =>
                                                    rIndex === index ||
                                                    row.item_id !==
                                                      itm.id.toString(),
                                                ),
                                              )
                                              .sort((a, b) => {
                                                const aIsInCurrentForm =
                                                  formData.items.some(
                                                    (item) =>
                                                      item.item_id ===
                                                      a.id.toString(),
                                                  );
                                                const bIsInCurrentForm =
                                                  formData.items.some(
                                                    (item) =>
                                                      item.item_id ===
                                                      b.id.toString(),
                                                  );

                                                if (
                                                  aIsInCurrentForm &&
                                                  !bIsInCurrentForm
                                                )
                                                  return -1;
                                                if (
                                                  !aIsInCurrentForm &&
                                                  bIsInCurrentForm
                                                )
                                                  return 1;

                                                return a.item_name.localeCompare(
                                                  b.item_name,
                                                );
                                              })
                                              .map((itm) => (
                                                <CommandItem
                                                  key={itm.id}
                                                  value={
                                                    itm.item_name +
                                                    " " +
                                                    itm.item_code
                                                  }
                                                  onSelect={() => {
                                                    updateItem(
                                                      index,
                                                      "item_id",
                                                      itm.id.toString(),
                                                    );
                                                  }}
                                                >
                                                  {itm.item_name} (
                                                  {itm.item_code})
                                                </CommandItem>
                                              ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </TableCell>
                                <TableCell>
                                  {selectedItem?.unit || "-"}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateItem(
                                        index,
                                        "quantity",
                                        e.target.value,
                                      )
                                    }
                                    min="1"
                                    className="w-16 text-center mx-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={item.unit_cost}
                                    onChange={(e) =>
                                      updateItem(
                                        index,
                                        "unit_cost",
                                        e.target.value,
                                      )
                                    }
                                    className="w-24 text-right"
                                  />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  Rs. {total.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {formData.items.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeItem(index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="flex justify-end">
                  <div className="bg-muted/50 rounded-lg p-4 min-w-48">
                    <div className="text-sm text-muted-foreground mb-1">
                      Total Amount
                    </div>
                    <div className="text-xl font-bold">
                      Rs.{" "}
                      {formData.items
                        .reduce((sum, item) => {
                          const unitPrice = item.unit_cost
                            ? parseFloat(item.unit_cost)
                            : 0;
                          const quantity = item.quantity
                            ? parseFloat(item.quantity)
                            : 0;
                          return sum + unitPrice * quantity;
                        }, 0)
                        .toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference_type">Reference Type</Label>
                    <Select
                      value={formData.reference_type}
                      onValueChange={(value) =>
                        handleInputChange("reference_type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {referenceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch_number">Batch Number</Label>
                    <Input
                      id="batch_number"
                      placeholder="Batch #"
                      value={formData.batch_number}
                      onChange={(e) =>
                        handleInputChange("batch_number", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) =>
                        handleInputChange("expiry_date", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note</Label>
                  <Input
                    id="note"
                    placeholder="Add any notes..."
                    value={formData.note}
                    onChange={(e) => handleInputChange("note", e.target.value)}
                  />
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
                    {isSubmitting ? "Processing..." : "Stock In"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isStockOutDialogOpen}
            onOpenChange={(open) => {
              setIsStockOutDialogOpen(open);
              if (!open) {
                setFormData({
                  items: [
                    {
                      item_id: "",
                      quantity: "",
                      unit_cost: "",
                      price_type: "selling_price_1",
                    },
                  ],
                  reference_type: "",
                  reference_id: "",
                  batch_number: "",
                  expiry_date: "",
                  note: "",
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Stock Out
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Stock Out Transaction</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => handleSubmit(e, "OUT")}
                className="space-y-4 mt-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Items *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="min-w-48">Product</TableHead>
                            <TableHead className="w-16">Unit</TableHead>
                            <TableHead className="w-20 text-center">
                              Qty
                            </TableHead>
                            <TableHead className="w-24">Type</TableHead>
                            <TableHead className="w-24 text-right">
                              Unit Price
                            </TableHead>
                            <TableHead className="w-24 text-right">
                              Total
                            </TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.items.map((item, index) => {
                            const selectedItem = items.find(
                              (i) => i.id.toString() === item.item_id,
                            );
                            const unitPrice = item.unit_cost
                              ? parseFloat(item.unit_cost)
                              : 0;
                            const quantity = item.quantity
                              ? parseFloat(item.quantity)
                              : 0;
                            const total = unitPrice * quantity;

                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between"
                                      >
                                        {item.item_id
                                          ? selectedItem?.item_name +
                                              " (" +
                                              selectedItem?.item_code +
                                              ")" || "Select item"
                                          : "Select item"}
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                      <Command>
                                        <CommandInput placeholder="Search items..." />
                                        <CommandList>
                                          <CommandEmpty>
                                            No items found.
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {items
                                              .filter((itm) =>
                                                formData.items.every(
                                                  (row, rIndex) =>
                                                    rIndex === index ||
                                                    row.item_id !==
                                                      itm.id.toString(),
                                                ),
                                              )
                                              .sort((a, b) => {
                                                const aIsInCurrentForm =
                                                  formData.items.some(
                                                    (item) =>
                                                      item.item_id ===
                                                      a.id.toString(),
                                                  );
                                                const bIsInCurrentForm =
                                                  formData.items.some(
                                                    (item) =>
                                                      item.item_id ===
                                                      b.id.toString(),
                                                  );

                                                if (
                                                  aIsInCurrentForm &&
                                                  !bIsInCurrentForm
                                                )
                                                  return -1;
                                                if (
                                                  !aIsInCurrentForm &&
                                                  bIsInCurrentForm
                                                )
                                                  return 1;

                                                return a.item_name.localeCompare(
                                                  b.item_name,
                                                );
                                              })
                                              .map((itm) => (
                                                <CommandItem
                                                  key={itm.id}
                                                  value={
                                                    itm.item_name +
                                                    " " +
                                                    itm.item_code
                                                  }
                                                  onSelect={() => {
                                                    updateItem(
                                                      index,
                                                      "item_id",
                                                      itm.id.toString(),
                                                    );
                                                  }}
                                                >
                                                  {itm.item_name} (
                                                  {itm.item_code})
                                                </CommandItem>
                                              ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </TableCell>
                                <TableCell>
                                  {selectedItem?.unit || "-"}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateItem(
                                        index,
                                        "quantity",
                                        e.target.value,
                                      )
                                    }
                                    min="1"
                                    className="w-16 text-center mx-auto"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={item.price_type}
                                    onValueChange={(value) =>
                                      updateItem(index, "price_type", value)
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="buying_price">
                                        Cost
                                      </SelectItem>
                                      <SelectItem value="selling_price_1">
                                        Selling 1
                                      </SelectItem>
                                      <SelectItem value="selling_price_2">
                                        Selling 2
                                      </SelectItem>
                                      <SelectItem value="selling_price_3">
                                        Selling 3
                                      </SelectItem>
                                      <SelectItem value="custom">
                                        Custom
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={item.unit_cost}
                                    onChange={(e) =>
                                      updateItem(
                                        index,
                                        "unit_cost",
                                        e.target.value,
                                      )
                                    }
                                    className="w-24 text-right"
                                  />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  Rs. {total.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {formData.items.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeItem(index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference_type_out">Reference Type</Label>
                    <Select
                      value={formData.reference_type}
                      onValueChange={(value) =>
                        handleInputChange("reference_type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {referenceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note_out">Note</Label>
                  <Input
                    id="note_out"
                    placeholder="Add any notes..."
                    value={formData.note}
                    onChange={(e) => handleInputChange("note", e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsStockOutDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Stock Out"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock In (Total)</p>
              <p className="text-xl font-bold text-foreground">
                +{statsData.stockIn} units
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock Out (Total)</p>
              <p className="text-xl font-bold text-foreground">
                -{statsData.stockOut} units
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Package className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Change</p>
              <p
                className={`text-xl font-bold ${
                  statsData.stockIn - statsData.stockOut >= 0
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {statsData.stockIn - statsData.stockOut >= 0 ? "+" : ""}
                {statsData.stockIn - statsData.stockOut} units
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="bg-card rounded-xl border border-border/50 p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground">Recent Transactions</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Cost/Unit</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reference Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  No transactions found. Create a stock movement to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.item_name || "Unknown Item (Deleted)"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        transaction.transaction_type === "IN"
                          ? "bg-success/10 text-success"
                          : transaction.transaction_type === "OUT"
                            ? "bg-primary/10 text-primary"
                            : "bg-warning/10 text-warning"
                      }
                      variant="secondary"
                    >
                      {transaction.transaction_type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={
                      transaction.transaction_type === "IN" ||
                      transaction.transaction_type === "ADJUSTMENT"
                        ? "text-success"
                        : "text-primary"
                    }
                  >
                    {transaction.transaction_type === "OUT" ||
                    transaction.transaction_type === "RETURN"
                      ? "-"
                      : "+"}
                    {transaction.quantity}
                  </TableCell>
                  <TableCell>
                    {transaction.unit_cost
                      ? `RS: ${Number(transaction.unit_cost).toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {transaction.total_cost
                      ? `RS: ${Number(transaction.total_cost).toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{transaction.reference_type}</TableCell>
                  <TableCell>
                    {transaction.performed_by_name || "System"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {transaction.note || "-"}
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
                          onClick={() => handleDelete(transaction.id)}
                          className="gap-2 text-destructive cursor-pointer"
                          disabled={isDeleting === transaction.id}
                        >
                          <Trash2 className="w-4 h-4" />
                          {isDeleting === transaction.id
                            ? "Deleting..."
                            : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="text-sm text-muted-foreground">
              Showing page <span className="font-medium">{currentPage}</span> of{" "}
              <span className="font-medium">{totalPages}</span> (
              {totalTransactions} total transactions)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTransactions(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - currentPage) <= 1
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => fetchTransactions(pageNum)}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </Button>
                    );
                  } else if (Math.abs(pageNum - currentPage) === 2) {
                    return (
                      <span
                        key={pageNum}
                        className="px-2 text-muted-foreground"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTransactions(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}