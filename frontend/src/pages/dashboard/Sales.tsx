import React, { useEffect, useState, useRef } from "react";
import {
  Truck,
  Search,
  Plus,
  ShoppingCart,
  Package,
  X,
  Minus,
  User,
  MapPin,
  Phone,
  Receipt,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronsUpDown,
  Printer,
  Download,
  FileText,
  DownloadIcon,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, isWithinInterval } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import NewSaleForm from "@/components/dashboard/NewSaleForm";

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
  buying_price?: number;
}

interface Customer {
  id: number;
  name: string;
  address_line1?: string;
  phone?: string;
  price_type?: string;
}

interface Sale {
  id: number;
  invoice_number: string;
  vehicle_id: number;
  vehicle_code: string;
  vehicle_number?: string;
  item_count?: number;
  customer_name: string;
  customer_address?: string;
  customer_phone?: string;
  total_amount: number;
  subtotal?: number;
  cash?: number;
  cheque?: number;
  credit?: number;
  notes?: string;
  status: string;
  created_at: string;
  sale_date: string;
  items: SaleItem[];
  returnedItems?: any[];
  freeItems?: any[];
}

// Sale Items Expansion Component
const SaleItemsExpansion = ({
  items,
  returnedItems = [],
  freeItems = [],
  grandTotal,
}: {
  items: SaleItem[];
  returnedItems?: any[];
  freeItems?: any[];
  grandTotal?: number;
}) => {
  const salesTotal = items.reduce(
    (sum, item) => sum + item.quantity * Number(item.unit_price),
    0
  );
  const returnsTotal = returnedItems.reduce(
    (sum, item) => sum + item.quantity * Number(item.unit_price),
    0
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-black text-white p-4 space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2 text-primary">Sale Items</h4>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-white/10">
              <TableHead className="text-white w-[250px]">Product</TableHead>
              <TableHead className="text-white">Code</TableHead>
              <TableHead className="text-white">Unit</TableHead>
              <TableHead className="text-white text-right">Quantity</TableHead>
              <TableHead className="text-white text-right">
                Unit Price
              </TableHead>
              <TableHead className="text-white text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow
                key={item.item_id || index}
                className="border-b border-white/5 hover:bg-white/5"
              >
                <TableCell className="font-medium text-white">
                  {item.item_name}
                </TableCell>
                <TableCell>{item.item_code}</TableCell>
                <TableCell>
                  {item.unit_size}
                  {item.unit}
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  Rs. {Number(item.unit_price).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  Rs. {(item.quantity * Number(item.unit_price)).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {returnedItems.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-rose-400">
            Returned Items
          </h4>
          <Table>
            <TableHeader>
              <TableRow className="bg-rose-500/10 hover:bg-rose-500/10 border-b border-white/10">
                <TableHead className="text-rose-400">Product</TableHead>
                <TableHead className="text-rose-400">Type</TableHead>
                <TableHead className="text-rose-400 text-right">
                  Quantity
                </TableHead>
                <TableHead className="text-rose-400 text-right">
                  Unit Price
                </TableHead>
                <TableHead className="text-rose-400 text-right">
                  Deduction
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnedItems.map((item, index) => (
                <TableRow
                  key={index}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <TableCell className="text-white">{item.item_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 border-rose-500/50 text-rose-400"
                    >
                      {item.return_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-rose-300">
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    Rs. {Number(item.unit_price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-rose-400">
                    - Rs. {(item.quantity * Number(item.unit_price)).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {freeItems.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-emerald-400">
            Free Items
          </h4>
          <Table>
            <TableHeader>
              <TableRow className="bg-emerald-500/10 hover:bg-emerald-500/10 border-b border-white/10">
                <TableHead className="text-emerald-400">Product</TableHead>
                <TableHead className="text-emerald-400 text-right">
                  Quantity
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {freeItems.map((item, index) => (
                <TableRow
                  key={index}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <TableCell className="text-white">{item.item_name}</TableCell>
                  <TableCell className="text-right text-emerald-300">
                    {item.quantity} {item.unit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col items-end pt-2 border-t border-white/10 gap-1">
        <div className="text-xs text-muted-foreground flex gap-4">
          <span>Subtotal: Rs. {salesTotal.toFixed(2)}</span>
          {returnsTotal > 0 && (
            <span>Returns: - Rs. {returnsTotal.toFixed(2)}</span>
          )}
        </div>
        <div className="text-lg font-bold text-white flex items-center gap-3">
          <span>Actual Total:</span>
          <span className="text-emerald-500">
            Rs. {Number(grandTotal || salesTotal - returnsTotal).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function VehicleSales() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesSearch, setSalesSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [cashManuallyEdited, setCashManuallyEdited] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [customerFilterOpen, setCustomerFilterOpen] = useState(false);
  const pageSize = 30;
  const previousTotal = useRef(0);

  // Sale dialog state
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(
    null
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [freeItems, setFreeItems] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [chequeAmount, setChequeAmount] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [defaultPriceType, setDefaultPriceType] =
    useState<string>("selling_price_1");
  const [saleDate, setSaleDate] = useState(() =>
    new Date().toLocaleDateString("en-CA")
  );
  const [submitting, setSubmitting] = useState(false);

  // Edit sale state
  const [editMode, setEditMode] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  // View detail state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  // Item selection for adding
  const [itemSelectOpen, setItemSelectOpen] = useState(false);
  const [customerSelectOpen, setCustomerSelectOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);

  const fetchVehicles = async (): Promise<VehicleRecord[]> => {
    try {
      setLoading(true);
      const response = await apiFetch(
        "/api/vehicleStockTransfers/vehicle-inventory"
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load vehicles");
      }

      setVehicles(data.data?.vehicles || []);
      return data.data?.vehicles || [];
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await apiFetch("/api/customers/getAllCustomers");
      const data = await response.json();

      if (response.ok && data.success) {
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchSales = async (
    page = currentPage,
    customerName = customerFilter
  ) => {
    try {
      setSalesLoading(true);
      let url = `/api/vehicleSales/getAllSales?page=${page}&limit=${pageSize}`;
      if (customerName !== "all") {
        url += `&customer_name=${encodeURIComponent(customerName)}`;
      }
      const response = await apiFetch(url);
      const data = await response.json();

      if (response.ok && data.success) {
        setSales(data.sales || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setCurrentPage(data.pagination.page);
          setTotalSales(data.pagination.total);
        }
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setSalesLoading(false);
    }
  };

  // Fetch all sales for printing (without pagination)
  const fetchAllSalesForPrint = async () => {
    try {
      let url = `/api/vehicleSales/getAllSalesForPrint`;
      if (dateRange?.from && dateRange?.to) {
        url += `?start_date=${dateRange.from.toLocaleDateString(
          "en-CA"
        )}&end_date=${dateRange.to.toLocaleDateString("en-CA")}`;
      }
      if (customerFilter !== "all") {
        url += url.includes("?") ? "&" : "?";
        url += `customer_name=${encodeURIComponent(customerFilter)}`;
      }
      const response = await apiFetch(url);
      const data = await response.json();

      if (response.ok && data.success) {
        return data.sales || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching all sales for print:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchSales(1);
  }, []);

  // Fetch vehicles when sale dialog opens
  useEffect(() => {
    if (saleDialogOpen && !editMode) {
      fetchVehicles();
    }
  }, [saleDialogOpen, editMode]);

  const toggleRow = async (sale: Sale) => {
    const newExpanded = new Set(expandedRows);
    const isExpanding = !newExpanded.has(sale.id);

    if (isExpanding) {
      // If sale doesn't have items loaded, fetch them
      if (!sale.items || sale.items.length === 0) {
        try {
          const response = await apiFetch(
            `/api/vehicleSales/getSale/${sale.id}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.sale) {
              // Update the sale in the list with items
              setSales((prevSales) =>
                prevSales.map((s) =>
                  s.id === sale.id
                    ? {
                        ...s,
                        items: data.items || [],
                        returnedItems: data.returnItems || [],
                        freeItems: data.freeItems || [],
                      }
                    : s
                )
              );
            }
          }
        } catch (error) {
          console.error("Error fetching sale items:", error);
        }
      }
      newExpanded.add(sale.id);
    } else {
      newExpanded.delete(sale.id);
    }
    setExpandedRows(newExpanded);
  };

  const resetSaleForm = () => {
    setSelectedVehicle(null);
    setSelectedVehicleId("");
    setSaleItems([]);
    setReturnItems([]);
    setFreeItems([]);
    setSelectedCustomer("");
    setCustomerName("");
    setCustomerAddress("");
    setCustomerPhone("");
    setNotes("");
    setCashAmount("");
    setChequeAmount("");
    setCreditAmount("");
    setDefaultPriceType("selling_price_1");
    setSaleDate(new Date().toLocaleDateString("en-CA"));
    setEditMode(false);
    setEditingSale(null);
    setCashManuallyEdited(false);
    previousTotal.current = 0;
  };

  const handleOpenEditDialog = async (sale: Sale) => {
    setEditMode(true);
    setSaleDialogOpen(true);

    // Ensure vehicles are loaded
    let vehicleList = vehicles;
    if (vehicleList.length === 0) {
      vehicleList = await fetchVehicles();
    }

    const vehicle = vehicleList.find((v) => v.vehicle_id === sale.vehicle_id);
    if (!vehicle) return;

    setSelectedVehicle(vehicle);
    setSelectedVehicleId(vehicle.vehicle_id.toString());

    try {
      const response = await apiFetch(`/api/vehicleSales/getSale/${sale.id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load sale details");
      }

      const fullSale = {
        ...sale,
        ...data.sale,
        items: data.items,
      } as Sale;

      setEditingSale(fullSale);

      // Customer
      setCustomerName(fullSale.customer_name);
      setCustomerAddress(fullSale.customer_address || "");
      setCustomerPhone(fullSale.customer_phone || "");
      setNotes(fullSale.notes || "");

      // Payment amounts
      setCashAmount(fullSale.cash?.toString() || "");
      setChequeAmount(fullSale.cheque?.toString() || "");
      setCreditAmount(fullSale.credit?.toString() || "0");
      setSaleDate(
        fullSale.sale_date
          ? new Date(fullSale.sale_date).toLocaleDateString("en-CA")
          : new Date().toLocaleDateString("en-CA")
      );

      const matchingCustomer = customers.find(
        (c) => c.name === fullSale.customer_name
      );
      setSelectedCustomer(
        matchingCustomer ? matchingCustomer.id.toString() : "new"
      );

      // Populate items correctly from API
      const populatedItems: SaleItem[] = (data.items || []).map(
        (item: {
          item_id: number;
          item_name: string;
          item_code: string;
          unit: string;
          unit_size?: number;
          quantity: number;
          unit_price: number | string;
        }) => {
          const vehicleItem = vehicle.items.find(
            (v) => v.item_id === item.item_id
          );

          const unitPrice =
            typeof item.unit_price === "number"
              ? item.unit_price
              : parseFloat(item.unit_price || "0");

          let selectedPriceType = "custom";
          if (unitPrice === parseFloat(vehicleItem?.selling_price_1 || "0")) {
            selectedPriceType = "selling_price_1";
          } else if (
            unitPrice === parseFloat(vehicleItem?.selling_price_2 || "0")
          ) {
            selectedPriceType = "selling_price_2";
          } else if (
            unitPrice === parseFloat(vehicleItem?.selling_price_3 || "0")
          ) {
            selectedPriceType = "selling_price_3";
          }

          return {
            item_id: item.item_id,
            item_name: item.item_name,
            item_code: item.item_code,
            unit: item.unit,
            unit_size: item.unit_size,
            quantity: item.quantity,
            unit_price: unitPrice,
            available_quantity: item.quantity + (vehicleItem?.quantity || 0),
            selling_price_1: vehicleItem?.selling_price_1,
            selling_price_2: vehicleItem?.selling_price_2,
            selling_price_3: vehicleItem?.selling_price_3,
            selectedPriceType: selectedPriceType,
          };
        }
      );

      setSaleItems(populatedItems);

      // Populate return items correctly from API
      const populatedReturnItems = (data.returnItems || []).map(
        (item: any) => ({
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          unit: item.unit,
          unit_size: item.unit_size,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price || "0"),
          return_type: item.return_type || "MARKET",
        })
      );
      setReturnItems(populatedReturnItems);

      // Populate free items correctly from API
      const populatedFreeItems = (data.freeItems || []).map((item: any) => {
        const vehicleItem = vehicle.items.find(
          (v) => v.item_id === item.item_id
        );
        return {
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          unit: item.unit,
          unit_size: item.unit_size,
          quantity: item.quantity,
          available_quantity: item.quantity + (vehicleItem?.quantity || 0),
        };
      });
      setFreeItems(populatedFreeItems);
    } catch (error) {
      console.error("Error loading sale for edit:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load sale details",
        variant: "destructive",
      });
      setSaleDialogOpen(false);
      resetSaleForm();
    }
  };

  const handleViewSale = async (sale: Sale) => {
    try {
      const response = await apiFetch(`/api/vehicleSales/getSale/${sale.id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load sale details");
      }

      const fullSale = {
        ...sale,
        ...data.sale,
        items: data.items,
        returnedItems: data.returnItems,
        freeItems: data.freeItems,
      } as Sale;

      setViewingSale(fullSale);
      setViewDialogOpen(true);
    } catch (error) {
      console.error("Error loading sale for view:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load sale details",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    if (!viewingSale) return;

    const win = window.open("", "_blank");
    if (!win) {
      alert("Please allow pop-ups to print/save as PDF.");
      return;
    }

    const netTotal = Number(viewingSale.total_amount || 0);
    const returnsTotal = (viewingSale.returnedItems || []).reduce(
      (sum, item) => sum + item.quantity * Number(item.unit_price),
      0
    );
    const originalSale = netTotal + returnsTotal;

    const htmlContent = `
      <html>
        <head>
          <title>Sale ${viewingSale.invoice_number}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .invoice-title { font-size: 24px; font-weight: bold; color: #1a1a1a; }
            .meta-info { text-align: right; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 14px; text-transform: uppercase; color: #666; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
            th { text-align: left; background-color: #f8f9fa; padding: 10px; font-weight: 600; border-bottom: 1px solid #ddd; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .text-right { text-align: right; }
            .totals { margin-top: 30px; border-top: 2px solid #eee; padding-top: 20px; }
            .total-row { display: flex; justify-content: flex-end; margin-bottom: 8px; }
            .total-label { width: 150px; text-align: right; margin-right: 20px; color: #666; }
            .total-value { width: 100px; text-align: right; font-weight: 600; }
            .grand-total { font-size: 18px; font-weight: bold; color: #000; margin-top: 10px; border-top: 1px solid #000; padding-top: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="invoice-title">SALE RECEIPT</div>
              <div style="margin-top: 5px; color: #666;">#${
                viewingSale.invoice_number
              }</div>
            </div>
            <div class="meta-info">
              <div><strong>Date:</strong> ${format(
                new Date(viewingSale.sale_date),
                "dd MMM yyyy"
              )}</div>
              <div><strong>Vehicle:</strong> ${viewingSale.vehicle_code}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Customer Details</div>
            <div style="font-weight: 600; font-size: 16px;">${
              viewingSale.customer_name || "Guest Customer"
            }</div>
            <div>${viewingSale.customer_address || ""}</div>
            <div>${viewingSale.customer_phone || ""}</div>
          </div>

          <div class="section">
            <div class="section-title">Items</div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(viewingSale.items || [])
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.item_name}</td>
                    <td class="text-right">${item.quantity} ${item.unit}</td>
                    <td class="text-right">Rs. ${Number(
                      item.unit_price
                    ).toFixed(2)}</td>
                    <td class="text-right">Rs. ${(
                      item.quantity * Number(item.unit_price)
                    ).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          ${
            (viewingSale.freeItems || []).length > 0
              ? `
            <div class="section">
              <div class="section-title" style="color: #059669; border-color: #a7f3d0;">Free Items</div>
              <table>
                <thead>
                  <tr>
                    <th style="color: #059669;">Product</th>
                    <th class="text-right" style="color: #059669;">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  ${viewingSale.freeItems
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.item_name}</td>
                      <td class="text-right">${item.quantity} ${item.unit}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
              : ""
          }

          ${
            (viewingSale.returnedItems || []).length > 0
              ? `
            <div class="section">
              <div class="section-title" style="color: #dc2626; border-color: #fca5a5;">Returned Items</div>
              <table>
                <thead>
                  <tr>
                    <th style="color: #dc2626;">Product</th>
                    <th class="text-right" style="color: #dc2626;">Qty</th>
                    <th class="text-right" style="color: #dc2626;">Price</th>
                    <th class="text-right" style="color: #dc2626;">Deduction</th>
                  </tr>
                </thead>
                <tbody>
                  ${viewingSale.returnedItems
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.item_name}</td>
                      <td class="text-right">${item.quantity} ${item.unit}</td>
                      <td class="text-right">Rs. ${Number(
                        item.unit_price
                      ).toFixed(2)}</td>
                      <td class="text-right">- Rs. ${(
                        item.quantity * Number(item.unit_price)
                      ).toFixed(2)}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
              : ""
          }

          <div class="totals">
            <div class="total-row">
              <span class="total-label">Original Sale:</span>
              <span class="total-value">Rs. ${originalSale.toFixed(2)}</span>
            </div>
            ${
              returnsTotal > 0
                ? `
              <div class="total-row" style="color: #dc2626;">
                <span class="total-label">Returns Deduction:</span>
                <span class="total-value">- Rs. ${returnsTotal.toFixed(
                  2
                )}</span>
              </div>
            `
                : ""
            }
            <div class="total-row grand-total">
              <span class="total-label">Net Total:</span>
              <span class="total-value">Rs. ${netTotal.toFixed(2)}</span>
            </div>
            
            <div style="margin-top: 20px; text-align: right; font-size: 12px; color: #666;">
              Payment: Cash (Rs. ${Number(viewingSale.cash || 0).toFixed(
                2
              )}) / Cheque (Rs. ${Number(viewingSale.cheque || 0).toFixed(
      2
    )}) / Credit (Rs. ${Number(viewingSale.credit || 0).toFixed(2)})
            </div>
          </div>
          
          ${
            viewingSale.notes
              ? `<div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-size: 12px; color: #666;"><strong>Notes:</strong> ${viewingSale.notes}</div>`
              : ""
          }
        </body>
      </html>
    `;

    win.document.write(htmlContent);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  };

  const downloadCSV = () => {
    if (!viewingSale) return;
    const netTotal = Number(viewingSale.total_amount || 0);
    const returnsTotal = (viewingSale.returnedItems || []).reduce(
      (sum, item) => sum + item.quantity * Number(item.unit_price),
      0
    );
    const originalSale = netTotal + returnsTotal;

    const headers = [
      "Item Type",
      "Product",
      "Quantity",
      "Unit",
      "Price",
      "Total",
    ];
    const rows = [
      ...(viewingSale.items || []).map((i) => [
        "Sale",
        i.item_name,
        i.quantity,
        i.unit,
        Number(i.unit_price).toFixed(2),
        (i.quantity * Number(i.unit_price)).toFixed(2),
      ]),
      ...(viewingSale.freeItems || []).map((i) => [
        "Free",
        i.item_name,
        i.quantity,
        i.unit,
        "0.00",
        "0.00",
      ]),
      ...(viewingSale.returnedItems || []).map((i) => [
        "Return",
        i.item_name,
        i.quantity,
        i.unit,
        Number(i.unit_price).toFixed(2),
        "-" + (i.quantity * Number(i.unit_price)).toFixed(2),
      ]),
    ];

    const csvContent = [
      `SALE RECEIPT,${viewingSale.invoice_number}`,
      `DATE,${format(new Date(viewingSale.sale_date), "yyyy-MM-dd")}`,
      `CUSTOMER,${viewingSale.customer_name || "Guest"}`,
      "",
      headers.join(","),
      ...rows.map((r) => r.join(",")),
      "",
      `Original Sale,,,Rs. ${originalSale.toFixed(2)}`,
      `Returns,,,Rs. -${returnsTotal.toFixed(2)}`,
      `Net Total,,,Rs. ${netTotal.toFixed(2)}`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sale_${viewingSale.invoice_number}.csv`;
    link.click();
  };

  const downloadTXT = () => {
    if (!viewingSale) return;
    const netTotal = Number(viewingSale.total_amount || 0);
    const returnsTotal = (viewingSale.returnedItems || []).reduce(
      (sum, item) => sum + item.quantity * Number(item.unit_price),
      0
    );
    const originalSale = netTotal + returnsTotal;

    let txt = `========================================\n`;
    txt += `              SALE RECEIPT              \n`;
    txt += `========================================\n`;
    txt += `Invoice #: ${viewingSale.invoice_number}\n`;
    txt += `Date:     ${format(
      new Date(viewingSale.sale_date),
      "dd MMM yyyy"
    )}\n`;
    txt += `Customer: ${viewingSale.customer_name || "Guest"}\n`;
    txt += `Vehicle:  ${viewingSale.vehicle_code}\n`;
    txt += `----------------------------------------\n`;
    txt += `ITEMS\n`;
    viewingSale.items?.forEach((i) => {
      txt += `${i.item_name.padEnd(20)} ${i.quantity} ${i.unit} x ${Number(
        i.unit_price
      ).toFixed(2)} = ${(i.quantity * Number(i.unit_price)).toFixed(2)}\n`;
    });
    if ((viewingSale.freeItems || []).length > 0) {
      txt += `\nFREE ITEMS\n`;
      viewingSale.freeItems?.forEach((i) => {
        txt += `${i.item_name.padEnd(20)} ${i.quantity} ${i.unit}\n`;
      });
    }
    if ((viewingSale.returnedItems || []).length > 0) {
      txt += `\nRETURNED ITEMS\n`;
      viewingSale.returnedItems?.forEach((i) => {
        txt += `${i.item_name.padEnd(20)} ${i.quantity} ${i.unit} x ${Number(
          i.unit_price
        ).toFixed(2)} = -${(i.quantity * Number(i.unit_price)).toFixed(2)}\n`;
      });
    }
    txt += `----------------------------------------\n`;
    txt += `Original Sale: ${originalSale.toFixed(2).padStart(10)}\n`;
    txt += `Returns:      -${returnsTotal.toFixed(2).padStart(10)}\n`;
    txt += `NET TOTAL:     ${netTotal.toFixed(2).padStart(10)}\n`;
    txt += `========================================\n`;

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sale_${viewingSale.invoice_number}.txt`;
    link.click();
  };

  const handleOpenDeleteDialog = (sale: Sale) => {
    setDeletingSale(sale);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      setSubmitting(true);

      const saleData = {
        vehicle_id: editMode
          ? editingSale?.vehicle_id
          : parseInt(selectedVehicleId),
        sale_date: formData.saleDate,
        payment_method: "CASH",
        customer_id: formData.customerId || null,
        customer_name: formData.customerName,
        customer_address: formData.customerAddress || null,
        customer_phone: formData.customerPhone || null,
        notes: formData.notes,
        cash_amount: formData.cashAmount,
        cheque_amount: formData.chequeAmount,
        credit_amount: formData.creditAmount,
        items: formData.saleItems.map((si: any) => ({
          item_id: si.item_id,
          quantity: si.quantity,
          unit_price: si.unit_price,
          discount_percent: 0,
          tax_percent: 0,
        })),
        return_items: formData.returnItems.map((ri: any) => ({
          item_id: ri.item_id,
          return_type: ri.return_type,
          quantity: ri.quantity,
          unit_price: ri.unit_price,
        })),
        free_items: formData.freeItems.map((fi: any) => ({
          item_id: fi.item_id,
          quantity: fi.quantity,
        })),
      };

      const response = await apiFetch(
        editMode && editingSale
          ? `/api/vehicleSales/updateSale/${editingSale.id}`
          : "/api/vehicleSales/createSale",
        {
          method: editMode ? "PUT" : "POST",
          body: JSON.stringify(saleData),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save sale");
      }

      toast({
        title: editMode ? "Sale Updated" : "Sale Recorded",
        description: editMode
          ? `Invoice #${data.invoiceNumber} updated successfully.`
          : `Invoice #${data.invoiceNumber} created successfully.`,
      });

      setSaleDialogOpen(false);
      resetSaleForm();
      fetchVehicles();
      fetchSales(editMode ? currentPage : 1);
    } catch (error) {
      console.error("Error saving sale:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save sale",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSale = async () => {
    if (!deletingSale) return;

    try {
      setDeleting(true);
      const response = await apiFetch(`/api/vehicle-sales/${deletingSale.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete sale");
      }

      toast({
        title: "Sale Deleted",
        description: `Invoice #${deletingSale.invoice_number} has been deleted.`,
      });

      setDeleteDialogOpen(false);
      setDeletingSale(null);
      fetchVehicles();
      fetchSales(currentPage);
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete sale",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    const q = salesSearch.toLowerCase();
    const searchMatch =
      s.invoice_number?.toLowerCase().includes(q) ||
      s.customer_name?.toLowerCase().includes(q) ||
      s.vehicle_code?.toLowerCase().includes(q);

    let dateMatch = true;
    if (dateRange?.from && dateRange?.to) {
      const saleDate = new Date(s.sale_date);
      dateMatch = isWithinInterval(saleDate, {
        start: dateRange.from,
        end: dateRange.to,
      });
    }

    // Customer filter is now mostly handled by the backend,
    // but check it here too in case current sales list isn't updated yet
    const customerMatch =
      customerFilter === "all" || s.customer_name === customerFilter;

    return searchMatch && dateMatch && customerMatch;
  });

  const downloadFilteredCSV = async () => {
    // Fetch ALL sales for the selected date range
    const allSales = await fetchAllSalesForPrint();
    if (allSales.length === 0) {
      toast({
        title: "No Sales Found",
        description: "No sales found for the selected date range.",
        variant: "default",
      });
      return;
    }

    const headers = [
      "Invoice #",
      "Date",
      "Customer",
      "Vehicle",
      "Item Name",
      "Item Code",
      "Quantity",
      "Buying Price",
      "Unit Price",
      "Total",
      "Status",
    ];

    const rows: any[] = [];

    // Fetch items for each sale to ensure we have complete data
    const salesWithItems = await Promise.all(
      allSales.map(async (s) => {
        if (s.items && s.items.length > 0) {
          return s;
        } else {
          try {
            const response = await apiFetch(
              `/api/vehicleSales/getSale/${s.id}`
            );
            const data = await response.json();
            if (data.success) {
              return { ...s, items: data.items || [] };
            }
          } catch (error) {
            console.error("Error fetching items for sale", s.id, error);
          }
          return s;
        }
      })
    );

    salesWithItems.forEach((s) => {
      if (s.items && s.items.length > 0) {
        s.items.forEach((item) => {
          rows.push([
            s.invoice_number,
            format(new Date(s.sale_date), "yyyy-MM-dd"),
            s.customer_name,
            s.vehicle_code,
            item.item_name,
            item.item_code,
            item.quantity,
            item.buying_price ? Number(item.buying_price).toFixed(2) : "N/A",
            item.unit_price,
            (item.quantity * item.unit_price).toFixed(2),
            s.status,
          ]);
        });
      } else {
        // If no items, add sale summary
        rows.push([
          s.invoice_number,
          format(new Date(s.sale_date), "yyyy-MM-dd"),
          s.customer_name,
          s.vehicle_code,
          "",
          "",
          s.item_count || "",
          "N/A",
          "",
          s.total_amount,
          s.status,
        ]);
      }
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_${
      dateRange
        ? `${format(dateRange.from!, "yyyy-MM-dd")}_to_${format(
            dateRange.to!,
            "yyyy-MM-dd"
          )}`
        : "All"
    }.csv`;
    link.click();
  };

  const downloadFilteredTXT = async () => {
    // Fetch ALL sales for the selected date range
    const allSales = await fetchAllSalesForPrint();
    if (allSales.length === 0) {
      toast({
        title: "No Sales Found",
        description: "No sales found for the selected date range.",
        variant: "default",
      });
      return;
    }
  
    let content = `Sales Report\n${dateRange ? `From: ${format(dateRange.from!, "yyyy-MM-dd")} To: ${format(dateRange.to!, "yyyy-MM-dd")}\n` : "All Sales\n"}\n`;
    
    // Fetch items for each sale
    const salesWithItems = await Promise.all(
      allSales.map(async (s) => {
        if (s.items && s.items.length > 0) {
          return s;
        } else {
          try {
            const response = await apiFetch(
              `/api/vehicleSales/getSale/${s.id}`,
            );
            const data = await response.json();
            if (data.success) {
              return { ...s, items: data.items || [] };
            }
          } catch (error) {
            console.error("Error fetching items for sale", s.id, error);
          }
          return s;
        }
      }),
    );
  
    salesWithItems.forEach((s) => {
      content += `Invoice #: ${s.invoice_number}\n`;
      content += `Date: ${format(new Date(s.sale_date), "yyyy-MM-dd")}\n`;
      content += `Customer: ${s.customer_name}\n`;
      content += `Vehicle: ${s.vehicle_code}\n`;
      content += `Status: ${s.status}\n`;
      content += `Total Amount: Rs. ${s.total_amount}\n`;
      if (s.items && s.items.length > 0) {
        content += `Products:\n`;
        s.items.forEach((item) => {
          content += `  - ${item.item_name} (${item.item_code}): Qty ${item.quantity}, Buying Price: Rs. ${item.buying_price ? Number(item.buying_price).toFixed(2) : "N/A"}, Unit Price: Rs. ${item.unit_price}, Total: Rs. ${(item.quantity * item.unit_price).toFixed(2)}\n`;
        });
      }
      content += "\n";
    });
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_${dateRange ? `${format(dateRange.from!, "yyyy-MM-dd")}_to_${format(dateRange.to!, "yyyy-MM-dd")}` : "All"}.txt`;
    link.click();
  };

  const downloadFilteredSummaryCSV = async () => {
    // Fetch ALL sales for the selected date range
    const allSales = await fetchAllSalesForPrint();
    if (allSales.length === 0) {
      toast({
        title: "No Sales Found",
        description: "No sales found for the selected date range.",
        variant: "default",
      });
      return;
    }
  
    const headers = [
      "Invoice #",
      "Date",
      "Customer",
      "Vehicle",
      "Cash",
      "Cheque",
      "Credit",
      "Buying Cost Total",
      "Sale Total Amount",
      "Status",
    ];
    
    // Ensure all sales have items loaded for buying cost calculation
    const salesWithItems = await Promise.all(
      allSales.map(async (s) => {
        if (s.items && s.items.length > 0) {
          return s;
        } else {
          try {
            const response = await apiFetch(
              `/api/vehicleSales/getSale/${s.id}`,
            );
            const data = await response.json();
            if (data.success) {
              return { ...s, items: data.items || [] };
            }
          } catch (error) {
            console.error("Error fetching items for sale", s.id, error);
          }
          return s;
        }
      }),
    );
  
    const rows = salesWithItems.map((s) => {
      const buyingTotal = s.items
        ? s.items.reduce(
            (sum, item) =>
              sum +
              (item.buying_price
                ? Number(item.buying_price) * item.quantity
                : 0),
            0,
          )
        : 0;
      return [
        s.invoice_number,
        format(new Date(s.sale_date), "yyyy-MM-dd"),
        s.customer_name,
        s.vehicle_code,
        s.cash ? `Rs. ${Number(s.cash).toFixed(2)}` : "",
        s.cheque ? `Rs. ${Number(s.cheque).toFixed(2)}` : "",
        s.credit ? `Rs. ${Number(s.credit).toFixed(2)}` : "",
        `Rs. ${buyingTotal.toFixed(2)}`,
        `Rs. ${Number(s.total_amount).toFixed(2)}`,
        s.status,
      ];
    });
    
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_Summary_${dateRange ? `${format(dateRange.from!, "yyyy-MM-dd")}_to_${format(dateRange.to!, "yyyy-MM-dd")}` : "All"}.csv`;
    link.click();
  };

  const downloadFilteredSummaryTXT = async () => {
    // Fetch ALL sales for the selected date range
    const allSales = await fetchAllSalesForPrint();
    if (allSales.length === 0) {
      toast({
        title: "No Sales Found",
        description: "No sales found for the selected date range.",
        variant: "default",
      });
      return;
    }
  
    // Ensure all sales have items loaded for buying cost calculation
    const salesWithItems = await Promise.all(
      allSales.map(async (s) => {
        if (s.items && s.items.length > 0) {
          return s;
        } else {
          try {
            const response = await apiFetch(
              `/api/vehicleSales/getSale/${s.id}`,
            );
            const data = await response.json();
            if (data.success) {
              return { ...s, items: data.items || [] };
            }
          } catch (error) {
            console.error("Error fetching items for sale", s.id, error);
          }
          return s;
        }
      }),
    );
  
    let content = `Sales Summary Report\n${dateRange ? `From: ${format(dateRange.from!, "yyyy-MM-dd")} To: ${format(dateRange.to!, "yyyy-MM-dd")}\n` : "All Sales\n"}\n`;
    salesWithItems.forEach((s) => {
      const buyingTotal = s.items
        ? s.items.reduce(
            (sum, item) =>
              sum +
              (item.buying_price
                ? Number(item.buying_price) * item.quantity
                : 0),
            0,
          )
        : 0;
      content += `Invoice #${s.invoice_number} | Date: ${format(new Date(s.sale_date), "yyyy-MM-dd")} | Customer: ${s.customer_name} | Vehicle: ${s.vehicle_code} | Cash: ${s.cash ? `Rs. ${Number(s.cash).toFixed(2)}` : ""} | Cheque: ${s.cheque ? `Rs. ${Number(s.cheque).toFixed(2)}` : ""} | Credit: ${s.credit ? `Rs. ${Number(s.credit).toFixed(2)}` : ""} | Buying Cost Total: Rs. ${buyingTotal.toFixed(2)} | Sale Total Amount: Rs. ${Number(s.total_amount).toFixed(2)} | Status: ${s.status}\n`;
    });
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_Summary_${dateRange ? `${format(dateRange.from!, "yyyy-MM-dd")}_to_${format(dateRange.to!, "yyyy-MM-dd")}` : "All"}.txt`;
    link.click();
  };

  const printFilteredSales = async () => {
    // Fetch ALL sales for the selected date range (without pagination)
    const allSales = await fetchAllSalesForPrint();
    if (allSales.length === 0) {
      toast({
        title: "No Sales Found",
        description: "No sales found for the selected date range.",
        variant: "default",
      });
      return;
    }

    // Ensure all sales have items loaded
    const salesWithItems = await Promise.all(
      allSales.map(async (s) => {
        if (s.items && s.items.length > 0) {
          return s;
        } else {
          try {
            const response = await apiFetch(
              `/api/vehicleSales/getSale/${s.id}`
            );
            const data = await response.json();
            if (data.success) {
              return {
                ...s,
                items: data.items || [],
                returnedItems: data.returnItems || [],
                freeItems: data.freeItems || [],
              };
            }
          } catch (error) {
            console.error("Error fetching items for sale", s.id, error);
          }
          return s;
        }
      })
    );

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #fff;
              margin: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #007bff;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #007bff;
              font-size: 28px;
              margin: 0;
            }
            .header p {
              font-size: 14px;
              color: #666;
              margin: 5px 0 0 0;
            }
            .sale {
              margin-bottom: 30px;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .sale-header {
              background-color: #f8f9fa;
              padding: 15px;
              border-bottom: 1px solid #e9ecef;
              font-weight: 600;
              font-size: 14px;
            }
            .sale-header .invoice-number {
              color: #007bff;
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 0;
            }
            th {
              background-color: #007bff;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
            }
            td {
              padding: 10px 8px;
              border-bottom: 1px solid #e9ecef;
              font-size: 13px;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .total-row {
              background-color: #e3f2fd !important;
              font-weight: bold;
            }
            .no-items {
              padding: 20px;
              text-align: center;
              color: #666;
              font-style: italic;
            }
            .price-column {
              text-align: right;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sales Report</h1>
            <p>Report Period: ${
              dateRange
                ? `${format(dateRange.from!, "yyyy-MM-dd")} to ${format(
                    dateRange.to!,
                    "yyyy-MM-dd"
                  )}`
                : "All Sales"
            } | Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm")}</p>
          </div>
          ${salesWithItems
            .map(
              (s) => `
            <div class="sale">
              <div class="sale-header">
                <span class="invoice-number">Invoice #${
                  s.invoice_number
                }</span> |
                Date: ${format(new Date(s.sale_date), "yyyy-MM-dd")} |
                Customer: ${s.customer_name} |
                Vehicle: ${s.vehicle_code} |
                Status: ${s.status} |
                Total Amount: Rs. ${Number(s.total_amount).toFixed(2)}
              </div>
              ${
                s.items && s.items.length > 0
                  ? `
                <table>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Item Code</th>
                      <th style="text-align: center;">Quantity</th>
                      <th class="price-column">Buying Price</th>
                      <th class="price-column">Unit Price</th>
                      <th class="price-column">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${s.items
                      .map(
                        (item) => `
                      <tr>
                        <td>${item.item_name}</td>
                        <td>${item.item_code}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td class="price-column">Rs. ${
                          item.buying_price
                            ? Number(item.buying_price).toFixed(2)
                            : "N/A"
                        }</td>
                        <td class="price-column">Rs. ${Number(
                          item.unit_price
                        ).toFixed(2)}</td>
                        <td class="price-column">Rs. ${(
                          item.quantity * Number(item.unit_price)
                        ).toFixed(2)}</td>
                      </tr>
                    `
                      )
                      .join("")}
                    ${(() => {
                      const buyingTotal = s.items.reduce(
                        (sum, item) =>
                          sum +
                          (item.buying_price
                            ? Number(item.buying_price) * item.quantity
                            : 0),
                        0
                      );
                      return `
                        <tr class="total-row">
                          <td colspan="4" style="text-align: right; font-weight: bold;">Buying Cost Total: Rs. ${buyingTotal.toFixed(
                            2
                          )}</td>

                          <td colspan="4" style="text-align: right; font-weight: bold;">Sale Total: Rs. ${Number(
                            s.total_amount
                          ).toFixed(2)}</td>
                        </tr>
                        
                      `;
                    })()}
                  </tbody>
                </table>
              `
                  : '<div class="no-items">No item details available for this sale.</div>'
              }
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `;

    setTimeout(() => {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }, 100);
  };

  const printSummarySales = async () => {
    // Fetch ALL sales for the selected date range (without pagination)
    const allSales = await fetchAllSalesForPrint();
    if (allSales.length === 0) {
      toast({
        title: "No Sales Found",
        description: "No sales found for the selected date range.",
        variant: "default",
      });
      return;
    }

    // Ensure all sales have items loaded for buying cost calculation
    const salesWithItems = await Promise.all(
      allSales.map(async (s) => {
        if (s.items && s.items.length > 0) {
          return s;
        } else {
          try {
            const response = await apiFetch(
              `/api/vehicleSales/getSale/${s.id}`
            );
            const data = await response.json();
            if (data.success) {
              return {
                ...s,
                items: data.items || [],
                returnedItems: data.returnItems || [],
                freeItems: data.freeItems || [],
              };
            }
          } catch (error) {
            console.error("Error fetching items for sale", s.id, error);
          }
          return s;
        }
      })
    );

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Summary Sales Report</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #fff;
              margin: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #007bff;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #007bff;
              font-size: 28px;
              margin: 0;
            }
            .header p {
              font-size: 14px;
              color: #666;
              margin: 5px 0 0 0;
            }
            .summary-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .summary-table th {
              background-color: #007bff;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
            }
            .summary-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #e9ecef;
              font-size: 13px;
            }
            .summary-table tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .price-column {
              text-align: right;
            }
            .totals {
  margin-top: 30px;
  max-width: 420px;
  margin-left: auto;
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #e0e0e0;
}

.totals h3 {
  margin: 0 0 15px 0;
  text-align: center;
  color: #007bff;
  font-size: 18px;
}

.totals-table {
  width: 100%;
  border-collapse: collapse;
}

.totals-table td {
  padding: 8px 0;
  font-size: 14px;
}

.totals-table td.label {
  color: #555;
}

.totals-table td.value {
  text-align: right;
  font-weight: 600;
}

.totals-table tr.separator td {
  border-top: 2px dashed #ccc;
  padding-top: 10px;
}

.totals-table tr.profit td {
  border-top: 2px solid #007bff;
  padding-top: 12px;
  font-size: 15px;
}

.totals-table tr.profit .label {
  color: #007bff;
  font-weight: 700;
}

.totals-table tr.profit .value {
  color: #28a745;
  font-weight: 700;
}


          </style>
        </head>
        <body>
          <div class="header">
            <h1>Summary Sales Report</h1>
            <p>Report Period: ${
              dateRange
                ? `${format(dateRange.from!, "yyyy-MM-dd")} to ${format(
                    dateRange.to!,
                    "yyyy-MM-dd"
                  )}`
                : "All Sales"
            } | Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm")}</p>
          </div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th class="price-column">Buying Cost</th>
                <th class="price-column">Sale Total</th>
                <th class="price-column">Cash</th>
                <th class="price-column">Cheque</th>
                <th class="price-column">Credit</th>
                <th class="price-column">Profit Margin %</th>
              </tr>
            </thead>
            <tbody>
              ${salesWithItems
                .map((s) => {
                  const buyingTotal = s.items
                    ? s.items.reduce(
                        (sum, item) =>
                          sum +
                          (item.buying_price
                            ? Number(item.buying_price) * item.quantity
                            : 0),
                        0
                      )
                    : 0;
                  const netProfit = Number(s.total_amount) - buyingTotal;
                  const profitMarginPercent =
                    Number(s.total_amount) > 0
                      ? ((netProfit / Number(s.total_amount)) * 100).toFixed(2)
                      : 0;
                  return `
                  <tr>
                    <td>${s.invoice_number}</td>
                    <td>${format(new Date(s.sale_date), "yyyy-MM-dd")}</td>
                    <td>${s.customer_name}</td>
                    <td class="price-column">Rs. ${buyingTotal.toFixed(2)}</td>
                    <td class="price-column">Rs. ${Number(
                      s.total_amount
                    ).toFixed(2)}</td>
                    <td class="price-column">${
                      s.cash ? `Rs. ${Number(s.cash).toFixed(2)}` : "-"
                    }</td>
                    <td class="price-column">${
                      s.cheque ? `Rs. ${Number(s.cheque).toFixed(2)}` : "-"
                    }</td>
                    <td class="price-column">${
                      s.credit ? `Rs. ${Number(s.credit).toFixed(2)}` : "-"
                    }</td>
                    <td class="price-column">${profitMarginPercent}%</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
          <div class="totals">
  <h3>Totals Summary</h3>
  <table class="totals-table">
    ${(() => {
      const totalCash = salesWithItems.reduce(
        (sum, s) => sum + (s.cash ? Number(s.cash) : 0),
        0
      );
      const totalCheque = salesWithItems.reduce(
        (sum, s) => sum + (s.cheque ? Number(s.cheque) : 0),
        0
      );
      const totalCredit = salesWithItems.reduce(
        (sum, s) => sum + (s.credit ? Number(s.credit) : 0),
        0
      );
      const totalBuying = salesWithItems.reduce(
        (sum, s) =>
          sum +
          (s.items
            ? s.items.reduce(
                (subSum, item) =>
                  subSum +
                  (item.buying_price
                    ? Number(item.buying_price) * item.quantity
                    : 0),
                0
              )
            : 0),
        0
      );
      const totalSales = salesWithItems.reduce(
        (sum, s) => sum + Number(s.total_amount),
        0
      );
      const netProfit = totalSales - totalBuying;
      const totalProfitMarginPercent =
        totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) : 0;

      return `
  <tr>
    <td class="label">Total Buying Cost</td>
    <td class="value">Rs. ${totalBuying.toFixed(2)}</td>
  </tr>
  <tr>
    <td class="label">Total Sales</td>
    <td class="value">Rs. ${totalSales.toFixed(2)}</td>
  </tr>

  <tr class="separator">
    <td class="label">Total Cash</td>
    <td class="value">Rs. ${totalCash.toFixed(2)}</td>
  </tr>
  <tr>
    <td class="label">Total Cheque</td>
    <td class="value">Rs. ${totalCheque.toFixed(2)}</td>
  </tr>
  <tr>
    <td class="label">Total Credit</td>
    <td class="value">Rs. ${totalCredit.toFixed(2)}</td>
  </tr>

  <tr class="profit">
    <td class="label">Net Profit</td>
    <td class="value">Rs. ${netProfit.toFixed(2)}</td>
  </tr>
  <tr class="profit">
    <td class="label">Total Profit Margin %</td>
    <td class="value">${totalProfitMarginPercent}%</td>
  </tr>
      `;
    })()}
  </table>
</div>

        </body>
      </html>
    `;

    setTimeout(() => {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }, 100);
  };

  const sortedVehicles = [
    ...vehicles.filter((v) => v.items && v.items.length > 0),
  ].sort((a, b) => a.vehicle_code.localeCompare(b.vehicle_code));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/40 text-emerald-500"
          >
            Paid
          </Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-500"
          >
            Pending
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500 border-emerald-500/40 text-white"
          >
            Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="border-destructive/40 text-destructive"
          >
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-muted-foreground/40 text-muted-foreground"
          >
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Sales
          </h1>
          <p className="text-muted-foreground">
            Record sales from vehicle inventory and generate invoices.
          </p>
        </div>
        <div>
          <Button onClick={() => setSaleDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Vehicles with Stock
              </p>
              <p className="text-2xl font-bold">
                {vehicles.filter((v) => v.items && v.items.length > 0).length}
              </p>
            </div>
            <Truck className="w-8 h-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">
                {vehicles.reduce((sum, v) => sum + (v.items?.length || 0), 0)}
              </p>
            </div>
            <Package className="w-8 h-8 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Units</p>
              <p className="text-2xl font-bold">
                {vehicles.reduce(
                  (sum, v) =>
                    sum + (v.items?.reduce((s, i) => s + i.quantity, 0) || 0),
                  0
                )}
              </p>
            </div>
            <Receipt className="w-8 h-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">{totalSales}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-amber-500" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm w-full">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Recent Sales
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search sales..."
                  className="pl-9"
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                />
              </div>

              <Popover
                open={customerFilterOpen}
                onOpenChange={setCustomerFilterOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-[200px] justify-between gap-2 overflow-hidden",
                      customerFilter !== "all" &&
                        "bg-primary/10 border-primary/20"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {customerFilter === "all"
                          ? "All Customers"
                          : customers.find((c) => c.name === customerFilter)
                              ?.name || customerFilter}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setCustomerFilter("all");
                            setCustomerFilterOpen(false);
                            fetchSales(1, "all");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              customerFilter === "all"
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          All Customers
                        </CommandItem>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            onSelect={() => {
                              setCustomerFilter(customer.name);
                              setCustomerFilterOpen(false);
                              fetchSales(1, customer.name);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                customerFilter === customer.name
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {customer.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`gap-2 ${
                      dateRange?.from ? "bg-primary/10 border-primary/20" : ""
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    {dateRange?.from ? (
                      <span className="text-xs">
                        {dateRange.from.toLocaleDateString()} -{" "}
                        {dateRange.to?.toLocaleDateString() ||
                          dateRange.from.toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Date Range
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-10 p-0">
                    <Download className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => downloadFilteredSummaryCSV()}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Summary CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadFilteredSummaryTXT()}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Summary Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadFilteredCSV()}>
                    <FileText className="w-4 h-4 mr-2" />
                    Detailed CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadFilteredTXT()}>
                    <FileText className="w-4 h-4 mr-2" />
                    Detailed Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => printSummarySales()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Summary
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => printFilteredSales()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Detailed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Loading sales...
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No sales found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <React.Fragment key={sale.id}>
                      <TableRow className="border-border/40 hover:bg-muted/30">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleRow(sale)}
                          >
                            {expandedRows.has(sale.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {sale.invoice_number}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(sale.sale_date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {sale.customer_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{sale.vehicle_code}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.item_count ?? sale.items?.length ?? 0}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          Rs. {Number(sale.total_amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleViewSale(sale)}
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenEditDialog(sale)}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleOpenDeleteDialog(sale)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(sale.id) &&
                        sale.items &&
                        sale.items.length > 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="p-0 border-b border-border/50"
                            >
                              <SaleItemsExpansion
                                items={sale.items}
                                returnedItems={sale.returnedItems}
                                freeItems={sale.freeItems}
                                grandTotal={sale.total_amount}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-sm text-muted-foreground">
                Showing page <span className="font-medium">{currentPage}</span>{" "}
                of <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSales(currentPage - 1)}
                  disabled={currentPage === 1 || salesLoading}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)]
                    .map((_, i) => {
                      const pageNum = i + 1;
                      // Show first, last, and pages around current
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
                            onClick={() => fetchSales(pageNum)}
                            disabled={salesLoading}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      } else if (Math.abs(pageNum - currentPage) === 2) {
                        return (
                          <span
                            key={pageNum}
                            className="px-1 text-muted-foreground"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    })
                    .filter(Boolean)
                    .reduce((acc: any[], curr, i, arr) => {
                      // Remove duplicate ellipses
                      if (curr?.type === "span" && arr[i - 1]?.type === "span")
                        return acc;
                      return [...acc, curr];
                    }, [])}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSales(currentPage + 1)}
                  disabled={currentPage === totalPages || salesLoading}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Sale Dialog */}
      <Dialog
        open={saleDialogOpen}
        onOpenChange={(open) => {
          setSaleDialogOpen(open);
          if (!open) resetSaleForm();
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              {editMode
                ? `Edit Sale - ${editingSale?.invoice_number}`
                : "New Sale"}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? "Update the sale details below."
                : "Select a vehicle, add items from inventory, and enter customer details."}
            </DialogDescription>
          </DialogHeader>

          <NewSaleForm
            vehicles={vehicles}
            customers={customers}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={(id) => {
              setSelectedVehicleId(id);
              const v = vehicles.find((x) => x.vehicle_id.toString() === id);
              setSelectedVehicle(v || null);
            }}
            onSubmit={handleFormSubmit}
            submitting={submitting}
            editMode={editMode}
            initialData={
              editMode && editingSale
                ? {
                    saleItems: saleItems,
                    returnItems: returnItems,
                    freeItems: freeItems,
                    customerName: customerName,
                    customerAddress: customerAddress,
                    customerPhone: customerPhone,
                    notes: notes,
                    cashAmount: cashAmount,
                    chequeAmount: chequeAmount,
                    creditAmount: creditAmount,
                    saleDate: saleDate,
                    customerId:
                      selectedCustomer && selectedCustomer !== "new"
                        ? parseInt(selectedCustomer)
                        : undefined,
                  }
                : undefined
            }
          />
        </DialogContent>
      </Dialog>

      {/* View Sale Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Sale Details - {viewingSale?.invoice_number}
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-end gap-2 my-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Print / PDF
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={downloadCSV}>
                  CSV Format
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadTXT}>
                  Text Notes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {viewingSale && (
            <div className="space-y-6">
              {/* Customer & Date Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Customer
                  </p>
                  <p className="font-semibold text-lg">
                    {viewingSale.customer_name || "Guest Customer"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {viewingSale.customer_phone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {viewingSale.customer_address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    Date
                  </p>
                  <p className="font-medium">
                    {format(new Date(viewingSale.sale_date), "dd MMMM yyyy")}
                  </p>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Status
                    </p>
                    {getStatusBadge(viewingSale.status)}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mt-2">
                    Vehicle
                  </p>
                  <p className="font-medium">
                    {viewingSale.vehicle_code}{" "}
                    {viewingSale.vehicle_number &&
                      `(${viewingSale.vehicle_number})`}
                  </p>
                </div>
              </div>

              {/* Sale Items Table */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  Items
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {viewingSale.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="px-4 py-2 font-medium">
                            {item.item_name}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-right">
                            Rs. {Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            Rs.{" "}
                            {(item.quantity * Number(item.unit_price)).toFixed(
                              2
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Free Items Table */}
              {viewingSale.freeItems && viewingSale.freeItems.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                    Free Items
                  </h3>
                  <div className="border border-green-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[#a0f2be]">
                        <tr>
                          <th className="px-4 py-2 text-left text-green-700">
                            Product
                          </th>
                          <th className="px-4 py-2 text-right text-green-700">
                            Qty
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-100">
                        {viewingSale.freeItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-green-50/50">
                            <td className="px-4 py-2 font-medium">
                              {item.item_name}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.quantity} {item.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Returned Items Table */}
              {viewingSale.returnedItems &&
                viewingSale.returnedItems.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                      Returned Items
                    </h3>
                    <div className="border border-destructive/20 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-destructive/10">
                          <tr>
                            <th className="px-4 py-2 text-left text-destructive">
                              Product
                            </th>
                            <th className="px-4 py-2 text-right text-destructive">
                              Qty
                            </th>
                            <th className="px-4 py-2 text-right text-destructive">
                              Price
                            </th>
                            <th className="px-4 py-2 text-right text-destructive">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-destructive/10">
                          {viewingSale.returnedItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-destructive/5">
                              <td className="px-4 py-2 font-medium">
                                {item.item_name}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="px-4 py-2 text-right">
                                Rs. {Number(item.unit_price).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-right font-medium text-destructive">
                                - Rs.{" "}
                                {(
                                  item.quantity * Number(item.unit_price)
                                ).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Payment & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Payment Method</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-3 bg-muted/20 rounded-md border border-border/50">
                      <p className="text-muted-foreground text-xs">Cash</p>
                      <p className="font-semibold">
                        Rs. {Number(viewingSale.cash || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-md border border-border/50">
                      <p className="text-muted-foreground text-xs">Cheque</p>
                      <p className="font-semibold">
                        Rs. {Number(viewingSale.cheque || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-md border border-border/50 col-span-2">
                      <p className="text-muted-foreground text-xs">Credit</p>
                      <p className="font-semibold">
                        Rs. {Number(viewingSale.credit || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Original Sale Amount:
                    </span>
                    <span className="font-medium">
                      Rs.{" "}
                      {(
                        Number(viewingSale.total_amount || 0) +
                        (viewingSale.returnedItems || []).reduce(
                          (sum, item) =>
                            sum + item.quantity * Number(item.unit_price),
                          0
                        )
                      ).toFixed(2)}
                    </span>
                  </div>
                  {(viewingSale.returnedItems || []).length > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>Returns Deduction:</span>
                      <span>
                        - Rs.{" "}
                        {(viewingSale.returnedItems || [])
                          .reduce(
                            (sum, item) =>
                              sum + item.quantity * Number(item.unit_price),
                            0
                          )
                          .toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-primary/20">
                    <span>Net Total:</span>
                    <span className="text-primary text-xl">
                      Rs. {Number(viewingSale.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {viewingSale.notes && (
                <div className="bg-muted/30 p-3 rounded-md">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Notes
                  </p>
                  <p className="text-sm">{viewingSale.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice #
              {deletingSale?.invoice_number}? This action cannot be undone and
              will restore the sold items back to vehicle inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSale}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
