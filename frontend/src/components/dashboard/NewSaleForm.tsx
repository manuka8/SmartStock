import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  X,
  Minus,
  Plus,
  User,
  MapPin,
  Phone,
  RotateCcw,
  Gift,
  Truck,
  ChevronsUpDown,
  Check,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";

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

interface VehicleRecord {
  vehicle_id: number;
  vehicle_code: string;
  vehicle_number?: string;
  vehicle_type: string;
  vehicle_status: string;
  driver_name?: string;
  items: VehicleInventoryItem[];
}

interface SaleItem {
  item_id: number;
  item_name: string;
  item_code: string;
  unit: string;
  unit_size?: number;
  quantity: number;
  unit_price: number;
  available_quantity: number;
  selling_price_1?: string;
  selling_price_2?: string;
  selling_price_3?: string;
  selectedPriceType?: string;
}

interface ReturnItem {
  item_id: number;
  item_name: string;
  item_code: string;
  unit: string;
  unit_size?: number;
  quantity: number;
  unit_price: number;
  return_type: "MARKET" | "EXPIRED";
  reason?: string;
  selling_price_1?: string;
  selling_price_2?: string;
  selling_price_3?: string;
}

interface FreeItem {
  item_id: number;
  item_name: string;
  item_code: string;
  unit: string;
  unit_size?: number;
  quantity: number;
  available_quantity: number;
}

interface Customer {
  id: number;
  name: string;
  address_line1?: string;
  phone?: string;
  price_type?: string;
}

interface NewSaleFormProps {
  vehicles: VehicleRecord[];
  customers: Customer[];
  selectedVehicle: VehicleRecord | null;
  onVehicleSelect: (vehicleId: string) => void;
  onSubmit: (data: {
    saleItems: SaleItem[];
    returnItems: ReturnItem[];
    freeItems: FreeItem[];
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    customerCreditLimit: string;
    customerOutstandingBalance: string;
    customerLoyaltyPoints?: string;
    notes: string;
    cashAmount: string;
    chequeAmount: string;
    creditAmount: string;
    saleDate: string;
    customerId?: number;
  }) => void;
  submitting: boolean;
  editMode?: boolean;
  initialData?: {
    saleItems: SaleItem[];
    returnItems: ReturnItem[];
    freeItems: FreeItem[];
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    customerCreditLimit: string;
    customerOutstandingBalance: string;
    customerLoyaltyPoints?: string;
    notes: string;
    cashAmount: string;
    chequeAmount: string;
    creditAmount: string;
    saleDate: string;
    customerId?: number;
  };
}

export default function NewSaleForm({
  vehicles,
  customers,
  selectedVehicle,
  onVehicleSelect,
  onSubmit,
  submitting,
  editMode = false,
  initialData,
}: NewSaleFormProps) {
  const [activeTab, setActiveTab] = useState("sales");

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCreditLimit, setCustomerCreditLimit] = useState("");
  const [customerOutstandingBalance, setCustomerOutstandingBalance] =
    useState("");
  const [customerLoyaltyPoints, setCustomerLoyaltyPoints] = useState("");
  const [customerSelectOpen, setCustomerSelectOpen] = useState(false);

  // Items state
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [freeItems, setFreeItems] = useState<FreeItem[]>([]);

  // Payment state
  const [cashAmount, setCashAmount] = useState("");
  const [chequeAmount, setChequeAmount] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saleDate, setSaleDate] = useState(() =>
    new Date().toLocaleDateString("en-CA"),
  );
  const [cashManuallyEdited, setCashManuallyEdited] = useState(false);

  // Item selection
  const [itemSelectOpen, setItemSelectOpen] = useState(false);
  const [returnItemSelectOpen, setReturnItemSelectOpen] = useState(false);
  const [freeItemSelectOpen, setFreeItemSelectOpen] = useState(false);
  const [vehicleSelectOpen, setVehicleSelectOpen] = useState(false);

  // Default price type based on customer
  const [defaultPriceType, setDefaultPriceType] = useState("selling_price_1");

  // Initialize with initial data if provided
  useEffect(() => {
    if (initialData) {
      setSaleItems(initialData.saleItems || []);
      setReturnItems(initialData.returnItems || []);
      setFreeItems(initialData.freeItems || []);
      setCustomerName(initialData.customerName || "");
      setCustomerAddress(initialData.customerAddress || "");
      setCustomerPhone(initialData.customerPhone || "");
      setCustomerCreditLimit(initialData.customerCreditLimit || "");
      setCustomerOutstandingBalance(
        initialData.customerOutstandingBalance || "",
      );
      setCustomerLoyaltyPoints(initialData.customerLoyaltyPoints || "");
      setNotes(initialData.notes || "");
      setCashAmount(initialData.cashAmount || "");
      setChequeAmount(initialData.chequeAmount || "");
      setCreditAmount(initialData.creditAmount || "");
      setSaleDate(
        initialData.saleDate || new Date().toLocaleDateString("en-CA"),
      );
      if (initialData.customerId) {
        setSelectedCustomer(initialData.customerId.toString());
      }
      setCashManuallyEdited(true);
    }
  }, [initialData]);

  // Auto-calculate payment amounts
  useEffect(() => {
    const total = calculateGrandTotal();
    const cheque = parseFloat(chequeAmount || "0");
    const cash = parseFloat(cashAmount || "0");

    if (!cashManuallyEdited) {
      // If cash is not manually edited, it should cover the remaining amount after cheque
      // Credit receives 0
      const remainingForCash = Math.max(0, total - cheque);
      const newCashStr = remainingForCash.toFixed(2);

      // Only update if value matches to avoid loop/redundant updates
      // Note: We compare formatted string
      if (cashAmount !== newCashStr) {
        setCashAmount(newCashStr);
      }
      if (creditAmount !== "0.00") {
        setCreditAmount("0.00");
      }
    } else {
      // If cash IS manually edited, credit takes the remaining amount
      const credit = Math.max(0, total - cash - cheque);
      const newCreditStr = credit.toFixed(2);
      if (creditAmount !== newCreditStr) {
        setCreditAmount(newCreditStr);
      }
    }
  }, [
    saleItems,
    returnItems,
    freeItems,
    cashAmount,
    chequeAmount,
    cashManuallyEdited,
  ]);

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomer(customerId);
    let newPriceType = "selling_price_1";

    if (customerId === "new") {
      setCustomerName("");
      setCustomerAddress("");
      setCustomerPhone("");
      setCustomerCreditLimit("");
      setCustomerOutstandingBalance("");
      setCustomerLoyaltyPoints("");
    } else {
      const customer = customers.find((c) => c.id.toString() === customerId);
      if (customer) {
        setCustomerName(customer.name);
        setCustomerAddress(customer.address_line1 || "");
        setCustomerPhone(customer.phone || "");
        setCustomerCreditLimit(customer.credit_limit || "");
        setCustomerOutstandingBalance(customer.outstanding_balance || "");
        setCustomerLoyaltyPoints(customer.loyalty_points || "");
        newPriceType = customer.price_type || "selling_price_1";
      }
    }
    setDefaultPriceType(newPriceType);

    // Update existing sale items prices
    setSaleItems(
      saleItems.map((item) => {
        let newPrice = parseFloat(item.selling_price_1 || "0");
        if (newPriceType === "selling_price_2") {
          newPrice = parseFloat(item.selling_price_2 || "0");
        } else if (newPriceType === "selling_price_3") {
          newPrice = parseFloat(item.selling_price_3 || "0");
        }
        return {
          ...item,
          unit_price: newPrice,
          selectedPriceType: newPriceType,
        };
      }),
    );

    // Update existing return items prices
    setReturnItems(
      returnItems.map((item) => {
        let newPrice = parseFloat(item.selling_price_1 || "0");
        if (newPriceType === "selling_price_2") {
          newPrice = parseFloat(item.selling_price_2 || "0");
        } else if (newPriceType === "selling_price_3") {
          newPrice = parseFloat(item.selling_price_3 || "0");
        }
        return { ...item, unit_price: newPrice };
      }),
    );
    setCustomerSelectOpen(false);
  };

  // Sale Items handlers
  const handleAddSaleItem = (item: VehicleInventoryItem) => {
    if (saleItems.some((si) => si.item_id === item.item_id)) return;

    let unitPrice = parseFloat(item.selling_price_1 || "0");
    if (defaultPriceType === "selling_price_2") {
      unitPrice = parseFloat(item.selling_price_2 || "0");
    } else if (defaultPriceType === "selling_price_3") {
      unitPrice = parseFloat(item.selling_price_3 || "0");
    }

    setSaleItems([
      ...saleItems,
      {
        item_id: item.item_id,
        item_name: item.item_name,
        item_code: item.item_code,
        unit: item.unit,
        unit_size: item.unit_size,
        quantity: 1,
        unit_price: unitPrice,
        available_quantity: item.quantity,
        selling_price_1: item.selling_price_1,
        selling_price_2: item.selling_price_2,
        selling_price_3: item.selling_price_3,
        selectedPriceType: defaultPriceType,
      },
    ]);
    setItemSelectOpen(false);
  };

  const handleRemoveSaleItem = (itemId: number) => {
    setSaleItems(saleItems.filter((si) => si.item_id !== itemId));
  };

  const handleSaleQuantityChange = (itemId: number, newQty: number) => {
    setSaleItems(
      saleItems.map((si) => {
        if (si.item_id === itemId) {
          const qty = Math.max(1, Math.min(newQty, si.available_quantity));
          return { ...si, quantity: qty };
        }
        return si;
      }),
    );
  };

  const handleSalePriceSelect = (itemId: number, priceType: string) => {
    setSaleItems(
      saleItems.map((si) => {
        if (si.item_id === itemId) {
          let newPrice = si.unit_price;
          if (priceType === "selling_price_1") {
            newPrice = parseFloat(si.selling_price_1 || "0");
          } else if (priceType === "selling_price_2") {
            newPrice = parseFloat(si.selling_price_2 || "0");
          } else if (priceType === "selling_price_3") {
            newPrice = parseFloat(si.selling_price_3 || "0");
          }
          return { ...si, unit_price: newPrice, selectedPriceType: priceType };
        }
        return si;
      }),
    );
  };

  // Return Items handlers
  const handleAddReturnItem = (item: VehicleInventoryItem) => {
    if (returnItems.some((ri) => ri.item_id === item.item_id)) return;

    setReturnItems([
      ...returnItems,
      {
        item_id: item.item_id,
        item_name: item.item_name,
        item_code: item.item_code,
        unit: item.unit,
        unit_size: item.unit_size,
        quantity: 1,
        unit_price:
          defaultPriceType === "selling_price_2"
            ? parseFloat(item.selling_price_2 || "0")
            : defaultPriceType === "selling_price_3"
              ? parseFloat(item.selling_price_3 || "0")
              : parseFloat(item.selling_price_1 || "0"),
        return_type: "MARKET",
        selling_price_1: item.selling_price_1,
        selling_price_2: item.selling_price_2,
        selling_price_3: item.selling_price_3,
      },
    ]);
    setReturnItemSelectOpen(false);
  };

  const handleRemoveReturnItem = (itemId: number) => {
    setReturnItems(returnItems.filter((ri) => ri.item_id !== itemId));
  };

  const handleReturnQuantityChange = (itemId: number, newQty: number) => {
    setReturnItems(
      returnItems.map((ri) => {
        if (ri.item_id === itemId) {
          return { ...ri, quantity: Math.max(1, newQty) };
        }
        return ri;
      }),
    );
  };

  const handleReturnTypeChange = (
    itemId: number,
    returnType: "MARKET" | "EXPIRED",
  ) => {
    setReturnItems(
      returnItems.map((ri) => {
        if (ri.item_id === itemId) {
          return { ...ri, return_type: returnType };
        }
        return ri;
      }),
    );
  };

  // Free Items handlers
  const handleAddFreeItem = (item: VehicleInventoryItem) => {
    if (freeItems.some((fi) => fi.item_id === item.item_id)) return;

    setFreeItems([
      ...freeItems,
      {
        item_id: item.item_id,
        item_name: item.item_name,
        item_code: item.item_code,
        unit: item.unit,
        unit_size: item.unit_size,
        quantity: 1,
        available_quantity: item.quantity,
      },
    ]);
    setFreeItemSelectOpen(false);
  };

  const handleRemoveFreeItem = (itemId: number) => {
    setFreeItems(freeItems.filter((fi) => fi.item_id !== itemId));
  };

  const handleFreeQuantityChange = (itemId: number, newQty: number) => {
    setFreeItems(
      freeItems.map((fi) => {
        if (fi.item_id === itemId) {
          const qty = Math.max(1, Math.min(newQty, fi.available_quantity));
          return { ...fi, quantity: qty };
        }
        return fi;
      }),
    );
  };

  // Calculations
  const calculateSalesTotal = () => {
    return saleItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
  };

  const calculateReturnsTotal = () => {
    return returnItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
  };

  const calculateGrandTotal = () => {
    return calculateSalesTotal() - calculateReturnsTotal();
  };

  const handleSubmit = () => {
    onSubmit({
      saleItems,
      returnItems,
      freeItems,
      customerName,
      customerAddress,
      customerPhone,
      customerCreditLimit,
      customerOutstandingBalance,
      customerLoyaltyPoints,
      notes,
      cashAmount,
      chequeAmount,
      creditAmount,
      saleDate,
      customerId:
        selectedCustomer && selectedCustomer !== "new"
          ? parseInt(selectedCustomer)
          : undefined,
    });
  };

  const sortedVehicles = [...vehicles]
    .filter((v) => v.items && v.items.length > 0)
    .sort((a, b) => a.vehicle_code.localeCompare(b.vehicle_code));

  const availableItems = selectedVehicle?.items || [];

  const selectedCustomerObj = customers.find(
    (c) => c.id.toString() === selectedCustomer,
  );

  return (
    <div className="space-y-6">
      {/* Vehicle & Customer Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sale Date */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Sale Date *
          </Label>
          <Input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
          />
        </div>

        {/* Vehicle Selection */}
        {!editMode && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Select Vehicle *
            </Label>
            <Popover
              open={vehicleSelectOpen}
              onOpenChange={setVehicleSelectOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between overflow-hidden text-ellipsis"
                >
                  {selectedVehicle
                    ? `${selectedVehicle.vehicle_code} - ${selectedVehicle.driver_name || "No Driver"}`
                    : "Select vehicle..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search vehicles..." />
                  <CommandList>
                    <CommandEmpty>No vehicles found.</CommandEmpty>
                    <CommandGroup>
                      {sortedVehicles.map((vehicle) => (
                        <CommandItem
                          key={vehicle.vehicle_id}
                          value={vehicle.vehicle_code}
                          onSelect={() => {
                            onVehicleSelect(vehicle.vehicle_id.toString());
                            setVehicleSelectOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedVehicle?.vehicle_id === vehicle.vehicle_id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{vehicle.vehicle_code}</span>
                            <span className="text-xs text-muted-foreground">
                              {vehicle.driver_name || "No Driver"} •{" "}
                              {vehicle.items?.length || 0} items
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Customer Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Customer *
          </Label>
          <Popover
            open={customerSelectOpen}
            onOpenChange={setCustomerSelectOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between overflow-hidden text-ellipsis"
              >
                {selectedCustomerObj
                  ? `${selectedCustomerObj.name} - ${selectedCustomerObj.address_line1 || "No Address"}`
                  : "Select customer..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search customers..." />
                <CommandList>
                  <CommandEmpty>No customers found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="new"
                      onSelect={() => handleCustomerSelect("new")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Customer
                    </CommandItem>
                    {customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.name}
                        onSelect={() =>
                          handleCustomerSelect(customer.id.toString())
                        }
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCustomer === customer.id.toString()
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{customer.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {customer.address_line1 || "No Address"}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Customer Details */}
      {(selectedCustomer === "new" || customerName) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Customer Name *
            </Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Address
            </Label>
            <Input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Enter address"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              Phone
            </Label>
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Credit Limit
            </Label>
            <Input
              value={customerCreditLimit}
              onChange={(e) => setCustomerCreditLimit(e.target.value)}
              placeholder="Enter credit limit"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Outstanding Balance
            </Label>
            <Input
              value={customerOutstandingBalance}
              onChange={(e) => setCustomerOutstandingBalance(e.target.value)}
              placeholder="Enter outstanding balance"
            />
          </div>
          {/* <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Gift className="w-3 h-3" />
              Loyalty Points
            </Label>
            <Input
              value={customerLoyaltyPoints}
              onChange={(e) => setCustomerLoyaltyPoints(e.target.value)}
              placeholder="Enter loyalty points"
            />
          </div> */}
        </div>
      )}

      {/* Three Section Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Sales</span>
            {saleItems.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {saleItems.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="returns" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Returns</span>
            {returnItems.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {returnItems.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="free" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Free</span>
            {freeItems.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {freeItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Sale Items
            </h3>
            <Popover open={itemSelectOpen} onOpenChange={setItemSelectOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" disabled={!selectedVehicle}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search items..." />
                  <CommandList>
                    <CommandEmpty>No items available.</CommandEmpty>
                    <CommandGroup heading="Available Items">
                      {availableItems
                        .filter(
                          (item) =>
                            !saleItems.some(
                              (si) => si.item_id === item.item_id,
                            ),
                        )
                        .map((item) => (
                          <CommandItem
                            key={item.item_id}
                            value={item.item_name}
                            onSelect={() => handleAddSaleItem(item)}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            <div className="flex flex-col flex-1">
                              <span>{item.item_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.item_code} • {item.quantity} available
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {saleItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                <p>No sale items added yet</p>
                <p className="text-sm">
                  Click "Add Item" to start adding products
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Product</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Price Type</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleItems.map((item) => (
                    <TableRow key={item.item_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.item_code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.unit_size}
                        {item.unit}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="w-7 h-7"
                            onClick={() =>
                              handleSaleQuantityChange(
                                item.item_id,
                                item.quantity - 1,
                              )
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleSaleQuantityChange(
                                item.item_id,
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-14 h-7 text-center text-sm"
                            min={1}
                            max={item.available_quantity}
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="w-7 h-7"
                            onClick={() =>
                              handleSaleQuantityChange(
                                item.item_id,
                                item.quantity + 1,
                              )
                            }
                            disabled={item.quantity >= item.available_quantity}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-1">
                          / {item.available_quantity}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.selectedPriceType}
                          onValueChange={(val) =>
                            handleSalePriceSelect(item.item_id, val)
                          }
                        >
                          <SelectTrigger className="w-24 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="selling_price_1">
                              Price 1
                            </SelectItem>
                            <SelectItem value="selling_price_2">
                              Price 2
                            </SelectItem>
                            <SelectItem value="selling_price_3">
                              Price 3
                            </SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => {
                            setSaleItems(
                              saleItems.map((si) =>
                                si.item_id === item.item_id
                                  ? {
                                      ...si,
                                      unit_price:
                                        parseFloat(e.target.value) || 0,
                                      selectedPriceType: "custom",
                                    }
                                  : si,
                              ),
                            );
                          }}
                          className="w-24 h-7 text-right text-sm ml-auto"
                          min={0}
                          step={0.01}
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Rs. {(item.quantity * item.unit_price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 text-destructive"
                          onClick={() => handleRemoveSaleItem(item.item_id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-primary/5">
                    <TableCell colSpan={5} className="text-right font-semibold">
                      Sales Total:
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg text-primary">
                      Rs. {calculateSalesTotal().toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Returns Tab */}
        <TabsContent value="returns" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              Sales Returns
              <span className="text-sm font-normal text-muted-foreground">
                (Deducted from total)
              </span>
            </h3>
            <Popover
              open={returnItemSelectOpen}
              onOpenChange={setReturnItemSelectOpen}
            >
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" disabled={!selectedVehicle}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Return
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search items..." />
                  <CommandList>
                    <CommandEmpty>No items available.</CommandEmpty>
                    <CommandGroup heading="Available Items">
                      {availableItems
                        .filter(
                          (item) =>
                            !returnItems.some(
                              (ri) => ri.item_id === item.item_id,
                            ),
                        )
                        .map((item) => (
                          <CommandItem
                            key={item.item_id}
                            value={item.item_name}
                            onSelect={() => handleAddReturnItem(item)}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            <div className="flex flex-col flex-1">
                              <span>{item.item_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.item_code}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {returnItems.length === 0 ? (
            <Card className="border-dashed border-amber-500/30">
              <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <RotateCcw className="w-12 h-12 mb-2 opacity-50" />
                <p>No return items added</p>
                <p className="text-sm">
                  Add returned products that should be deducted from the sale
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="border border-amber-500/30 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-amber-500/10">
                    <TableHead>Product</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Return Type</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Deduction</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnItems.map((item) => (
                    <TableRow key={item.item_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.item_code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.unit_size}
                        {item.unit}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="w-7 h-7"
                            onClick={() =>
                              handleReturnQuantityChange(
                                item.item_id,
                                item.quantity - 1,
                              )
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleReturnQuantityChange(
                                item.item_id,
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-14 h-7 text-center text-sm"
                            min={1}
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="w-7 h-7"
                            onClick={() =>
                              handleReturnQuantityChange(
                                item.item_id,
                                item.quantity + 1,
                              )
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.return_type}
                          onValueChange={(val: "MARKET" | "EXPIRED") =>
                            handleReturnTypeChange(item.item_id, val)
                          }
                        >
                          <SelectTrigger className="w-24 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MARKET">Market</SelectItem>
                            <SelectItem value="EXPIRED">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => {
                            setReturnItems(
                              returnItems.map((ri) =>
                                ri.item_id === item.item_id
                                  ? {
                                      ...ri,
                                      unit_price:
                                        parseFloat(e.target.value) || 0,
                                    }
                                  : ri,
                              ),
                            );
                          }}
                          className="w-24 h-7 text-right text-sm ml-auto"
                          min={0}
                          step={0.01}
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold text-amber-600">
                        - Rs. {(item.quantity * item.unit_price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 text-destructive"
                          onClick={() => handleRemoveReturnItem(item.item_id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-amber-500/10">
                    <TableCell colSpan={5} className="text-right font-semibold">
                      Returns Total:
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg text-amber-600">
                      - Rs. {calculateReturnsTotal().toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Free Products Tab */}
        <TabsContent value="free" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-500" />
              Free Products
              <span className="text-sm font-normal text-muted-foreground">
                (No charge, reduces vehicle stock)
              </span>
            </h3>
            <Popover
              open={freeItemSelectOpen}
              onOpenChange={setFreeItemSelectOpen}
            >
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" disabled={!selectedVehicle}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Free Item
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search items..." />
                  <CommandList>
                    <CommandEmpty>No items available.</CommandEmpty>
                    <CommandGroup heading="Available Items">
                      {availableItems
                        .filter(
                          (item) =>
                            !freeItems.some(
                              (fi) => fi.item_id === item.item_id,
                            ),
                        )
                        .map((item) => (
                          <CommandItem
                            key={item.item_id}
                            value={item.item_name}
                            onSelect={() => handleAddFreeItem(item)}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            <div className="flex flex-col flex-1">
                              <span>{item.item_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.item_code} • {item.quantity} available
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {freeItems.length === 0 ? (
            <Card className="border-dashed border-emerald-500/30">
              <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Gift className="w-12 h-12 mb-2 opacity-50" />
                <p>No free products added</p>
                <p className="text-sm">
                  Add promotional or sample products given at no charge
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="border border-emerald-500/30 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-500/10">
                    <TableHead>Product</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {freeItems.map((item) => (
                    <TableRow key={item.item_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.item_code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.unit_size}
                        {item.unit}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="w-7 h-7"
                            onClick={() =>
                              handleFreeQuantityChange(
                                item.item_id,
                                item.quantity - 1,
                              )
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleFreeQuantityChange(
                                item.item_id,
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-14 h-7 text-center text-sm"
                            min={1}
                            max={item.available_quantity}
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="w-7 h-7"
                            onClick={() =>
                              handleFreeQuantityChange(
                                item.item_id,
                                item.quantity + 1,
                              )
                            }
                            disabled={item.quantity >= item.available_quantity}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-1">
                          / {item.available_quantity}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        >
                          FREE
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 text-destructive"
                          onClick={() => handleRemoveFreeItem(item.item_id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-emerald-500/10">
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Total Free Items:
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      {freeItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                      units
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Summary & Payment */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Totals Summary */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sales Total:</span>
                  <span className="font-medium">
                    Rs. {calculateSalesTotal().toFixed(2)}
                  </span>
                </div>
                {returnItems.length > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Returns Deduction:</span>
                    <span className="font-medium">
                      - Rs. {calculateReturnsTotal().toFixed(2)}
                    </span>
                  </div>
                )}
                {freeItems.length > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Free Items:</span>
                    <span className="font-medium">
                      {freeItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                      units
                    </span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Grand Total:</span>
                  <span className="text-primary">
                    Rs. {calculateGrandTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Payment</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cash</Label>
                  <Input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => {
                      setCashAmount(e.target.value);
                      setCashManuallyEdited(true);
                    }}
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cheque</Label>
                  <Input
                    type="number"
                    value={chequeAmount}
                    onChange={(e) => setChequeAmount(e.target.value)}
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Credit</Label>
                  <Input
                    type="number"
                    value={creditAmount}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4 space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for this sale..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSubmit}
          disabled={
            submitting ||
            !customerName.trim() ||
            (saleItems.length === 0 &&
              returnItems.length === 0 &&
              freeItems.length === 0)
          }
          size="lg"
          className="min-w-[200px]"
        >
          {submitting
            ? "Processing..."
            : editMode
              ? "Update Sale"
              : "Record Sale & Create Invoice"}
        </Button>
      </div>
    </div>
  );
}
