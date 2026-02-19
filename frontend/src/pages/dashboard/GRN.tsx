import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Calendar,
  Hash,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Printer,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Percent,
  Receipt,
  DollarSign,
  X,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface GRNItem {
  id?: number;
  item_id: number;
  item_name?: string;
  item_code?: string;
  quantity: number;
  buying_price: number;
  discount_percent: number;
  tax_percent: number;
  batch_number?: string;
  expiry_date?: string;
  line_total?: number;
}

interface GRN {
  id: number;
  grn_number: string;
  invoice_number?: string;
  supplier_id: number;
  supplier_name?: string;
  supplier_code?: string;
  invoice_date?: string;
  due_date?: string;
  received_date: string;
  source?: string;
  warehouse?: string;
  status: "DRAFT" | "RECEIVED" | "CANCELLED";
  total_items: number;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  notes?: string;
  created_by_name?: string;
  items: GRNItem[];
}

interface Supplier {
  id: number;
  supplier_name: string;
  supplier_code?: string;
}

interface Item {
  id: number;
  item_name: string;
  item_code: string;
  unit: string;
  buying_price: number;
  selling_price_1: number;
  tax_rate: number;
}

// Product Details Expansion Component
const ProductDetailsExpansion = ({ items }: { items: GRNItem[] }) => {
  const validItems = items.filter((item) => item && typeof item === "object");

  return (
    <div className="border rounded-lg overflow-hidden bg-black text-white">
      <div className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-white w-[250px]">Product</TableHead>
              <TableHead className="text-white">Code</TableHead>
              <TableHead className="text-white text-right">Quantity</TableHead>
              <TableHead className="text-white text-right">
                Buying Price
              </TableHead>
              <TableHead className="text-white text-right">
                Discount %
              </TableHead>
              <TableHead className="text-white text-right">Tax %</TableHead>
              <TableHead className="text-white text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validItems.map((item, index) => {
              const buyingPrice = item.buying_price || 0;
              const lineTotal = item.quantity * buyingPrice;
              const discountAmount =
                (lineTotal * (item.discount_percent || 0)) / 100;
              const taxableAmount = lineTotal - discountAmount;
              const taxAmount = (taxableAmount * (item.tax_percent || 0)) / 100;
              const calculatedAmount = taxableAmount + taxAmount;

              return (
                <TableRow key={item.id || index}>
                  <TableCell className="font-medium">
                    {item.item_name || "N/A"}
                  </TableCell>
                  <TableCell>{item.item_code || "N/A"}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="w-3 h-3" />
                      {buyingPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Percent className="w-3 h-3" />
                      {item.discount_percent || 0}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Receipt className="w-3 h-3" />
                      {item.tax_percent || 0}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="w-3 h-3" />
                      {calculatedAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={6} className="text-right font-semibold">
                Grand Total:
              </TableCell>
              <TableCell className="text-right font-bold text-green-500">
                <Badge variant="default" className="ml-2 p-2">
                  <DollarSign className="w-4 h-4" />
                  {validItems
                    .reduce((sum, item) => {
                      const buyingPrice = item.buying_price || 0;
                      const lineTotal = item.quantity * buyingPrice;
                      const discountAmount =
                        (lineTotal * (item.discount_percent || 0)) / 100;
                      const taxableAmount = lineTotal - discountAmount;
                      const taxAmount =
                        (taxableAmount * (item.tax_percent || 0)) / 100;
                      return sum + taxableAmount + taxAmount;
                    }, 0)
                    .toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default function GRN() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [grns, setGrns] = useState<GRN[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
  const [editingGRN, setEditingGRN] = useState<GRN | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState({
    total_grns: 0,
    draft_count: 0,
    received_count: 0,
    cancelled_count: 0,
    total_value: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGRNs, setTotalGRNs] = useState(0);
  const pageSize = 30;

  const [openComboboxes, setOpenComboboxes] = useState<{
    [key: number]: boolean;
  }>({});
  const [supplierSelectOpen, setSupplierSelectOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    supplier_id: "",
    invoice_number: "",
    invoice_date: "",
    due_date: "",
    received_date: new Date().toISOString().split("T")[0],
    source: "",
    warehouse: "",
    notes: "",
    items: [] as GRNItem[],
  });

  // Fetch GRNs
  const fetchGRNs = useCallback(
    async (page = currentPage) => {
      try {
        setLoading(true);
        const statusParam = statusFilter !== "all" ? statusFilter : "";
        const response = await apiFetch(
          `/api/grn/getAll?page=${page}&limit=${pageSize}${
            statusParam ? `&status=${statusParam}` : ""
          }`
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Failed to fetch GRNs" }));
          throw new Error(
            errorData.error || `HTTP ${response.status}: Failed to fetch GRNs`
          );
        }

        const data = await response.json();
        if (data.success && data.data) {
          setGrns(data.data.grns || []);
          if (data.data.pagination) {
            setTotalPages(data.data.pagination.pages);
            setCurrentPage(data.data.pagination.page);
            setTotalGRNs(data.data.pagination.total);
          }
        } else {
          throw new Error(data.error || "Failed to fetch GRNs");
        }
      } catch (error) {
        console.error("Error fetching GRNs:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to load GRNs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, toast]
  );

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const response = await apiFetch("/api/suppliers/getAllSuppliers");
      if (!response.ok) {
        console.error("Failed to fetch suppliers:", response.status);
        return;
      }
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  // Fetch items
  const fetchItems = async () => {
    try {
      const response = await apiFetch("/api/itemMaster/getAllItems");
      if (!response.ok) {
        console.error("Failed to fetch items:", response.status);
        return;
      }
      const data = await response.json();
      if (data.success && data.items) {
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await apiFetch("/api/grn/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchGRNs(1);
    fetchSuppliers();
    fetchItems();
    fetchStats();
  }, [fetchGRNs]);

  const toggleRow = async (grn: GRN) => {
    const newExpanded = new Set(expandedRows);
    const isExpanding = !newExpanded.has(grn.id);

    if (isExpanding) {
      // If GRN doesn't have items loaded, fetch them
      if (!grn.items || grn.items.length === 0) {
        try {
          const response = await apiFetch(`/api/grn/getSingle/${grn.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              // Update the GRN in the list with items
              setGrns((prevGrns) =>
                prevGrns.map((g) =>
                  g.id === grn.id ? { ...g, items: data.data.items || [] } : g
                )
              );
            }
          }
        } catch (error) {
          console.error("Error fetching GRN items:", error);
        }
      }
      newExpanded.add(grn.id);
    } else {
      newExpanded.delete(grn.id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            Received
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Draft
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredGRNs = grns.filter((grn) => {
    const matchesSearch =
      grn.grn_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (grn.invoice_number || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (grn.supplier_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || grn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Add item to form
  const addItem = () => {
    // Find next available product
    const selectedIds = formData.items.map((i) => i.item_id);
    const nextAvailable = items.find((itm) => !selectedIds.includes(itm.id));

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          item_id: nextAvailable ? nextAvailable.id : 0,
          item_name: nextAvailable ? nextAvailable.item_name : "",
          item_code: nextAvailable ? nextAvailable.item_code : "",
          quantity: 1,
          buying_price: nextAvailable ? nextAvailable.buying_price : 0,
          discount_percent: 0,
          tax_percent: nextAvailable ? nextAvailable.tax_rate : 0,
          line_total: nextAvailable ? nextAvailable.buying_price : 0,
        },
      ],
    });
  };

  // Remove item from form
  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  // Update item in form
  const updateItem = (
    index: number,
    field: keyof GRNItem,
    value: string | number
  ) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "item_id" && typeof value === "number" && value > 0) {
      const selectedItem = items.find((itm) => itm.id === value);
      if (selectedItem) {
        newItems[index].buying_price = selectedItem.buying_price;
        newItems[index].tax_percent = selectedItem.tax_rate;
        newItems[index].item_name = selectedItem.item_name;
        newItems[index].item_code = selectedItem.item_code;
      }
    }

    // Calculate line total
    const item = newItems[index];
    const lineTotal = item.quantity * item.buying_price;
    const discountAmount = (lineTotal * (item.discount_percent || 0)) / 100;
    const taxableAmount = lineTotal - discountAmount;
    const taxAmount = (taxableAmount * (item.tax_percent || 0)) / 100;
    newItems[index].line_total = taxableAmount + taxAmount;

    setFormData({ ...formData, items: newItems });
  };

  /* Update handleCreateGRN to optionally confirm immediately */
  const handleCreateGRN = async (confirmImmediately = false) => {
    if (!formData.supplier_id || formData.items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier and add at least one item",
        variant: "destructive",
      });
      return;
    }

    // Validate that all items have a valid product selected
    const invalidItems = formData.items.filter(
      (item) => !item.item_id || item.item_id === 0
    );
    if (invalidItems.length > 0) {
      toast({
        title: "Validation Error",
        description:
          "Products can't be empty. Please select a valid product for all items",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const payload = {
        supplier_id: parseInt(formData.supplier_id),
        invoice_number: formData.invoice_number || null,
        invoice_date: formData.invoice_date || null,
        due_date: formData.due_date || null,
        received_date: formData.received_date,
        source: formData.source || null,
        warehouse: formData.warehouse || null,
        notes: formData.notes || null,
        items: formData.items.map((item) => ({
          item_id: item.item_id,
          quantity: item.quantity,
          buying_price: item.buying_price,
          discount_percent: item.discount_percent || 0,
          tax_percent: item.tax_percent || 0,
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || null,
        })),
      };

      const response = await apiFetch("/api/grn/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        if (confirmImmediately) {
          await handleConfirmGRN(data.data.grn_id);
        } else {
          toast({
            title: "Success",
            description: "GRN created successfully as DRAFT",
          });
        }
        setIsCreateDialogOpen(false);
        resetForm();
        fetchGRNs(1);
        fetchStats();
      } else {
        throw new Error(data.error || "Failed to create GRN");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create GRN",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Confirm GRN
  const handleConfirmGRN = async (id: number) => {
    try {
      const response = await apiFetch(`/api/grn/confirm/${id}`, {
        method: "PUT",
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "GRN confirmed and inventory updated",
        });
        fetchGRNs(currentPage);
        fetchStats();
        if (selectedGRN?.id === id) {
          setIsViewDialogOpen(false);
        }
      } else {
        throw new Error(data.error || "Failed to confirm GRN");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to confirm GRN",
        variant: "destructive",
      });
    }
  };

  // Cancel GRN
  const handleCancelGRN = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this GRN?")) return;

    try {
      const response = await apiFetch(`/api/grn/cancel/${id}`, {
        method: "PUT",
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "GRN cancelled successfully",
        });
        fetchGRNs(currentPage);
        fetchStats();
      } else {
        throw new Error(data.error || "Failed to cancel GRN");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to cancel GRN",
        variant: "destructive",
      });
    }
  };

  // Delete GRN
  const handleDeleteGRN = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this GRN?")) return;

    try {
      const response = await apiFetch(`/api/grn/delete/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "GRN deleted successfully",
        });
        fetchGRNs(currentPage);
        fetchStats();
      } else {
        throw new Error(data.error || "Failed to delete GRN");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete GRN",
        variant: "destructive",
      });
    }
  };

  // View GRN details
  const handleViewGRN = async (id: number) => {
    try {
      const response = await apiFetch(`/api/grn/getSingle/${id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedGRN(data.data);
        setIsViewDialogOpen(true);
      } else {
        throw new Error(data.error || "Failed to fetch GRN details");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load GRN details",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const handleEditGRN = async (id: number) => {
    try {
      const response = await apiFetch(`/api/grn/getSingle/${id}`);
      const data = await response.json();
      if (data.success) {
        const grn = data.data;
        setEditingGRN(grn);
        // Helper function to format date for input field (YYYY-MM-DD)
        const formatDateForInput = (
          dateString: string | null | undefined
        ): string => {
          if (!dateString) return "";
          try {
            // Handle ISO date strings (e.g., "2025-12-09T18:30:00.000Z")
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";
            return date.toISOString().split("T")[0];
          } catch {
            return "";
          }
        };

        // Populate form with GRN data
        setFormData({
          supplier_id: grn.supplier_id ? grn.supplier_id.toString() : "",
          invoice_number: grn.invoice_number || "",
          invoice_date: formatDateForInput(grn.invoice_date),
          due_date: formatDateForInput(grn.due_date),
          received_date:
            formatDateForInput(grn.received_date) ||
            new Date().toISOString().split("T")[0],
          source: grn.source || "",
          warehouse: grn.warehouse || "",
          notes: grn.notes || "",
          items:
            grn.items && Array.isArray(grn.items)
              ? grn.items.map((item: GRNItem) => ({
                  id: item.id,
                  item_id: item.item_id,
                  item_name: item.item_name || "",
                  item_code: item.item_code || "",
                  quantity: item.quantity,
                  buying_price: item.buying_price,
                  discount_percent: item.discount_percent || 0,
                  tax_percent: item.tax_percent || 0,
                  batch_number: item.batch_number || "",
                  expiry_date: formatDateForInput(item.expiry_date),
                }))
              : [],
        });
        setIsEditDialogOpen(true);
      } else {
        throw new Error(data.error || "Failed to fetch GRN details");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load GRN for editing",
        variant: "destructive",
      });
    }
  };

  /* Update handleUpdateGRN to optionally confirm immediately */
  const handleUpdateGRN = async (confirmImmediately = false) => {
    if (!editingGRN) return;

    if (!formData.supplier_id || formData.items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier and add at least one item",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const payload = {
        supplier_id: parseInt(formData.supplier_id),
        invoice_number: formData.invoice_number || null,
        invoice_date: formData.invoice_date || null,
        due_date: formData.due_date || null,
        received_date: formData.received_date,
        source: formData.source || null,
        warehouse: formData.warehouse || null,
        notes: formData.notes || null,
        items: formData.items.map((item) => ({
          item_id: item.item_id,
          quantity: item.quantity,
          buying_price: item.buying_price,
          discount_percent: item.discount_percent || 0,
          tax_percent: item.tax_percent || 0,
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || null,
        })),
      };

      const response = await apiFetch(`/api/grn/update/${editingGRN.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        if (confirmImmediately) {
          await handleConfirmGRN(editingGRN.id);
        } else {
          toast({
            title: "Success",
            description: "GRN updated successfully",
          });
        }
        setIsEditDialogOpen(false);
        setEditingGRN(null);
        resetForm();
        fetchGRNs(currentPage);
        fetchStats();
      } else {
        throw new Error(data.error || "Failed to update GRN");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update GRN",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      supplier_id: "",
      invoice_number: "",
      invoice_date: "",
      due_date: "",
      received_date: new Date().toISOString().split("T")[0],
      source: "",
      warehouse: "",
      notes: "",
      items: [],
    });
  };

  const summaryStats = [
    {
      label: "Total GRNs",
      value: (stats.total_grns ?? 0).toString(),
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Draft",
      value: (stats.draft_count ?? 0).toString(),
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Received",
      value: (stats.received_count ?? 0).toString(),
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Total Value",
      value: `$${(stats.total_value ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: Package,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Goods Received Notes
          </h1>
          <p className="text-muted-foreground">
            Manage and track all incoming goods receipts
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="w-4 h-4" />
              Create New GRN
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New GRN</DialogTitle>
              <DialogDescription>
                Create a new Goods Received Note for incoming inventory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 p-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">Invoice Number</Label>
                  <Input
                    id="invoice_number"
                    placeholder="Enter invoice number"
                    value={formData.invoice_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoice_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">
                    Supplier <span className="text-destructive">*</span>
                  </Label>
                  <Popover
                    open={supplierSelectOpen}
                    onOpenChange={setSupplierSelectOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={supplierSelectOpen}
                        className="w-full justify-between"
                      >
                        {formData.supplier_id
                          ? suppliers.find(
                              (s) => s.id.toString() === formData.supplier_id
                            )?.supplier_name || "Select supplier..."
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
                              .sort((a, b) =>
                                a.supplier_name.localeCompare(b.supplier_name)
                              )
                              .map((supplier) => (
                                <CommandItem
                                  key={supplier.id}
                                  value={supplier.supplier_name}
                                  onSelect={() => {
                                    setFormData({
                                      ...formData,
                                      supplier_id: supplier.id.toString(),
                                    });
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
                <div className="space-y-2">
                  <Label htmlFor="invoice_date">Invoice Date</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) =>
                      setFormData({ ...formData, invoice_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="received_date">
                    Received Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="received_date"
                    type="date"
                    value={formData.received_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        received_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    placeholder="Enter source"
                    value={formData.source}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse</Label>
                  <Input
                    id="warehouse"
                    placeholder="Enter warehouse"
                    value={formData.warehouse}
                    onChange={(e) =>
                      setFormData({ ...formData, warehouse: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Product Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Product Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={addItem}
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Product</TableHead>
                        <TableHead className="w-[100px]">Quantity</TableHead>
                        <TableHead className="w-[120px]">
                          Buying Price
                        </TableHead>
                        <TableHead className="w-[100px]">Discount %</TableHead>
                        <TableHead className="w-[100px]">Tax %</TableHead>
                        <TableHead className="w-[120px]">Amount</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center text-muted-foreground py-8"
                          >
                            No items added. Click "Add Item" to start.
                          </TableCell>
                        </TableRow>
                      ) : (
                        // Reverse the array to show newest items first
                        formData.items
                          .slice() // Create a shallow copy to avoid mutating original
                          .reverse() // Reverse to show newest first
                          .map((item, displayIndex) => {
                            // Calculate the original index (from the end)
                            const originalIndex =
                              formData.items.length - 1 - displayIndex;
                            const calculatedAmount =
                              (item.quantity || 0) *
                              (item.buying_price || 0) *
                              (1 - (item.discount_percent || 0) / 100) *
                              (1 + (item.tax_percent || 0) / 100);

                            return (
                              <TableRow key={originalIndex}>
                                <TableCell>
                                  <Popover
                                    open={
                                      openComboboxes[originalIndex] || false
                                    }
                                    onOpenChange={(o) =>
                                      setOpenComboboxes((prev) => ({
                                        ...prev,
                                        [originalIndex]: o,
                                      }))
                                    }
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={
                                          openComboboxes[originalIndex] || false
                                        }
                                        className="w-full justify-between"
                                      >
                                        {item.item_name
                                          ? `${item.item_name} (${item.item_code})`
                                          : "Select product"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                      <Command>
                                        <CommandInput placeholder="Search product..." />
                                        <CommandEmpty>
                                          No product found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {items
                                            .filter(
                                              (itm) =>
                                                !formData.items.some(
                                                  (selectedItem, idx) =>
                                                    idx !== originalIndex &&
                                                    selectedItem.item_id ===
                                                      itm.id
                                                ) || itm.id === item.item_id
                                            )
                                            .map((itm) => (
                                              <CommandItem
                                                key={itm.id}
                                                value={`${itm.item_name} ${itm.item_code}`}
                                                onSelect={() => {
                                                  updateItem(
                                                    originalIndex,
                                                    "item_id",
                                                    itm.id
                                                  );
                                                  setOpenComboboxes((prev) => ({
                                                    ...prev,
                                                    [originalIndex]: false,
                                                  }));
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    item.item_id === itm.id
                                                      ? "opacity-100"
                                                      : "opacity-0"
                                                  )}
                                                />
                                                {itm.item_name} ({itm.item_code}
                                                )
                                              </CommandItem>
                                            ))}
                                        </CommandGroup>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateItem(
                                        originalIndex,
                                        "quantity",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.buying_price}
                                    onChange={(e) =>
                                      updateItem(
                                        originalIndex,
                                        "buying_price",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={item.discount_percent}
                                    onChange={(e) =>
                                      updateItem(
                                        originalIndex,
                                        "discount_percent",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={item.tax_percent}
                                    onChange={(e) =>
                                      updateItem(
                                        originalIndex,
                                        "tax_percent",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    readOnly
                                    value={calculatedAmount.toFixed(2)}
                                    className="bg-muted"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(originalIndex)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleCreateGRN(false)}
                disabled={creating}
              >
                {creating ? "Saving..." : "Save as Draft"}
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleCreateGRN(true)}
                disabled={creating}
              >
                {creating ? "Processing..." : "Create & Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit GRN Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit GRN</DialogTitle>
              <DialogDescription>
                Edit Goods Received Note details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 p-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_invoice_number">Invoice Number</Label>
                  <Input
                    id="edit_invoice_number"
                    placeholder="Enter invoice number"
                    value={formData.invoice_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoice_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_supplier">
                    Supplier <span className="text-destructive">*</span>
                  </Label>
                  <Popover
                    open={supplierSelectOpen}
                    onOpenChange={setSupplierSelectOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={supplierSelectOpen}
                        className="w-full justify-between"
                      >
                        {formData.supplier_id
                          ? suppliers.find(
                              (s) => s.id.toString() === formData.supplier_id
                            )?.supplier_name || "Select supplier..."
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
                              .sort((a, b) =>
                                a.supplier_name.localeCompare(b.supplier_name)
                              )
                              .map((supplier) => (
                                <CommandItem
                                  key={supplier.id}
                                  value={supplier.supplier_name}
                                  onSelect={() => {
                                    setFormData({
                                      ...formData,
                                      supplier_id: supplier.id.toString(),
                                    });
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
                <div className="space-y-2">
                  <Label htmlFor="edit_invoice_date">Invoice Date</Label>
                  <Input
                    id="edit_invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) =>
                      setFormData({ ...formData, invoice_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_due_date">Due Date</Label>
                  <Input
                    id="edit_due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_received_date">
                    Received Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_received_date"
                    type="date"
                    value={formData.received_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        received_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_source">Source</Label>
                  <Input
                    id="edit_source"
                    placeholder="Enter source"
                    value={formData.source}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_warehouse">Warehouse</Label>
                  <Input
                    id="edit_warehouse"
                    placeholder="Enter warehouse"
                    value={formData.warehouse}
                    onChange={(e) =>
                      setFormData({ ...formData, warehouse: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Product Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Product Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={addItem}
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Product</TableHead>
                        <TableHead className="w-[100px]">Quantity</TableHead>
                        <TableHead className="w-[120px]">
                          Buying Price
                        </TableHead>
                        <TableHead className="w-[100px]">Discount %</TableHead>
                        <TableHead className="w-[100px]">Tax %</TableHead>
                        <TableHead className="w-[120px]">Amount</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground"
                          >
                            No items added. Click "Add Product" to add items.
                          </TableCell>
                        </TableRow>
                      ) : (
                        formData.items.map((item, index) => {
                          const lineTotal = item.quantity * item.buying_price;
                          const discountAmount =
                            (lineTotal * (item.discount_percent || 0)) / 100;
                          const taxableAmount = lineTotal - discountAmount;
                          const taxAmount =
                            (taxableAmount * (item.tax_percent || 0)) / 100;
                          const calculatedAmount = taxableAmount + taxAmount;

                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <Popover
                                  open={openComboboxes[index] || false}
                                  onOpenChange={(o) =>
                                    setOpenComboboxes((prev) => ({
                                      ...prev,
                                      [index]: o,
                                    }))
                                  }
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={
                                        openComboboxes[index] || false
                                      }
                                      className="w-full justify-between"
                                    >
                                      {item.item_name
                                        ? `${item.item_name} (${item.item_code})`
                                        : "Select product"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput placeholder="Search product..." />
                                      <CommandEmpty>
                                        No product found.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {items
                                          .filter(
                                            (itm) =>
                                              !formData.items.some(
                                                (selectedItem) =>
                                                  selectedItem.item_id ===
                                                  itm.id
                                              ) || itm.id === item.item_id
                                          )
                                          .map((itm) => (
                                            <CommandItem
                                              key={itm.id}
                                              value={`${itm.item_name} ${itm.item_code}`}
                                              onSelect={() => {
                                                updateItem(
                                                  index,
                                                  "item_id",
                                                  itm.id
                                                );
                                                setOpenComboboxes((prev) => ({
                                                  ...prev,
                                                  [index]: false,
                                                }));
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  item.item_id === itm.id
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                              />
                                              {itm.item_name} ({itm.item_code})
                                            </CommandItem>
                                          ))}
                                      </CommandGroup>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "quantity",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.buying_price}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "buying_price",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={item.discount_percent}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "discount_percent",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={item.tax_percent}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "tax_percent",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  readOnly
                                  value={calculatedAmount.toFixed(2)}
                                  className="bg-muted"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  placeholder="Add any additional notes..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingGRN(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleUpdateGRN(false)}
                disabled={creating || !editingGRN}
              >
                {creating ? "Updating..." : "Update Draft"}
              </Button>
              {editingGRN?.status === "DRAFT" && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleUpdateGRN(true)}
                  disabled={creating || !editingGRN}
                >
                  {creating ? "Processing..." : "Update & Confirm"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <Card
            key={stat.label}
            className="border-border/50 bg-card/50 backdrop-blur-sm"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by GRN number, invoice number, or supplier..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="RECEIVED">Received</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRN Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            GRN Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold w-[50px]"></TableHead>
                  <TableHead className="font-semibold">GRN Number</TableHead>
                  <TableHead className="font-semibold">
                    Invoice Number
                  </TableHead>
                  <TableHead className="font-semibold">Supplier</TableHead>
                  <TableHead className="font-semibold">Received Date</TableHead>
                  <TableHead className="font-semibold">Items</TableHead>
                  <TableHead className="font-semibold text-right">
                    Total Value
                  </TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Warehouse</TableHead>
                  <TableHead className="font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center p-6">
                      Loading GRNs...
                    </TableCell>
                  </TableRow>
                ) : filteredGRNs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center p-6 text-muted-foreground"
                    >
                      No GRNs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGRNs.map((grn) => (
                    <React.Fragment key={grn.id}>
                      <TableRow className="border-border/30 hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleRow(grn)}
                          >
                            {expandedRows.has(grn.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-muted-foreground" />
                            {grn.grn_number}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {grn.invoice_number || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {grn.supplier_name || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(grn.received_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{grn.total_items} items</TableCell>
                        <TableCell className="text-right font-semibold">
                          $
                          {grn.grand_total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(grn.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {grn.warehouse || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleViewGRN(grn.id)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {(grn.status === "DRAFT" ||
                                grn.status === "RECEIVED") && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleEditGRN(grn.id)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit GRN
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {grn.status === "DRAFT" && (
                                <>
                                  <DropdownMenuItem
                                    className="text-emerald-500"
                                    onClick={() => handleConfirmGRN(grn.id)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Confirm
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => handleCancelGRN(grn.id)}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(grn.status === "DRAFT" ||
                                grn.status === "CANCELLED") && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteGRN(grn.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(grn.id) &&
                        grn.items &&
                        grn.items.length > 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={10}
                              className="p-0 border-b border-border/50"
                            >
                              <ProductDetailsExpansion items={grn.items} />
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
            <div className="flex items-center justify-between mt-4 px-2 pb-4">
              <div className="text-sm text-muted-foreground">
                Showing page <span className="font-medium">{currentPage}</span>{" "}
                of <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchGRNs(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)]
                    .map((_, i) => {
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
                            onClick={() => fetchGRNs(pageNum)}
                            disabled={loading}
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
                      if (curr?.type === "span" && arr[i - 1]?.type === "span")
                        return acc;
                      return [...acc, curr];
                    }, [])}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchGRNs(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
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

      {/* View GRN Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedGRN && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">
                      {selectedGRN.grn_number}
                    </DialogTitle>
                    <DialogDescription>
                      Goods Received Note Details
                    </DialogDescription>
                  </div>
                  {getStatusBadge(selectedGRN.status)}
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* GRN Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">
                      Invoice Number
                    </p>
                    <p className="font-semibold">
                      {selectedGRN.invoice_number || "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Supplier</p>
                    <p className="font-semibold">
                      {selectedGRN.supplier_name || "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">
                      Received Date
                    </p>
                    <p className="font-semibold">
                      {new Date(selectedGRN.received_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Created By</p>
                    <p className="font-semibold">
                      {selectedGRN.created_by_name || "—"}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                {selectedGRN.items && selectedGRN.items.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      Received Items with Pricing Details
                    </h4>
                    <ProductDetailsExpansion items={selectedGRN.items} />
                  </div>
                )}

                {/* Invoice Summary */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Notes</h4>
                    <div className="p-4 rounded-lg bg-muted/30 border">
                      <p className="text-sm text-muted-foreground">
                        {selectedGRN.notes || "No notes available"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Invoice Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>
                          $
                          {selectedGRN.subtotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="text-emerald-500">
                          -$
                          {selectedGRN.discount_total.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax:</span>
                        <span>
                          $
                          {selectedGRN.tax_total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Grand Total:</span>
                        <span className="text-primary">
                          $
                          {selectedGRN.grand_total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" className="gap-2">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
                {selectedGRN.status === "DRAFT" && (
                  <Button
                    className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => handleConfirmGRN(selectedGRN.id)}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm GRN
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
