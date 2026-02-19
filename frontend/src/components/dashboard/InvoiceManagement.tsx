import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Loader2,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { format } from "date-fns";

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  total_returned_amount?: number;
  subtotal: number;
  grand_total: number;
  cash: number;
  cheque: number;
  credit: number;
  payment_status: string;
  sale_date?: string;
  created_at: string;
  invoice_type: string;
  vehicle_code?: string;
  customer_address?: string;
  customer_phone?: string;
  notes?: string;
  created_by_name?: string;
}

const InvoiceManagement = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    invoice_number: "",
    client_name: "",
    amount: "",
    cash: "",
    cheque: "",
    credit: "",
    sale_date: "",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice & { items?: any[], returnedItems?: any[] } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const pageSize = 30;

  const fetchInvoices = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await apiFetch(
        `/api/invoices/getAllInvoices?status=${statusFilter}&type=${typeFilter}&page=${page}&limit=${pageSize}`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setInvoices(data.invoices || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setCurrentPage(data.pagination.page);
          setTotalInvoices(data.pagination.total);
        }
      } else {
        throw new Error(data.error || "Failed to fetch invoices");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
  }, [statusFilter, typeFilter]);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (invoice.customer_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleAddInvoice = () => {
    toast({
      title: "Invoice added",
      description: `Invoice ${newInvoice.invoice_number} has been created.`,
    });
    setIsAddDialogOpen(false);
    setNewInvoice({
      invoice_number: "",
      client_name: "",
      amount: "",
      cash: "",
      cheque: "",
      credit: "",
      sale_date: "",
    });
  };

  const handleViewDetails = async (invoice: Invoice) => {
    try {
      const response = await apiFetch(`/api/invoices/getInvoice/${invoice.id}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setViewingInvoice({ ...data.invoice, items: data.items, returnedItems: data.returnedItems });
        setViewDialogOpen(true);
      } else {
        throw new Error(data.error || "Failed to fetch invoice details");
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    if (!viewingInvoice) return;

    // Use _blank and no specific features to avoid some popup blockers, or keep features but handle null
    const win = window.open("", "_blank", "height=800,width=800");
    
    if (!win) {
      alert("Please allow pop-ups to print/save as PDF.");
      return;
    }

    if (win) {
      const netTotal = Number(viewingInvoice.subtotal || 0);
      const returns = Number(viewingInvoice.total_returned_amount || 0);
      const originalSale = netTotal + returns;

      const htmlContent = `
        <html>
          <head>
            <title>Invoice ${viewingInvoice.invoice_number}</title>
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
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="invoice-title">INVOICE</div>
                <div style="margin-top: 5px; color: #666;">#${viewingInvoice.invoice_number}</div>
              </div>
              <div class="meta-info">
                <div><strong>Date:</strong> ${
                  viewingInvoice.created_at
                    ? format(new Date(viewingInvoice.created_at), "dd MMM yyyy")
                    : "N/A"
                }</div>
                <div><strong>Status:</strong> ${viewingInvoice.payment_status}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Bill To</div>
              <div style="font-weight: 600; font-size: 16px;">${viewingInvoice.customer_name || "Guest Customer"}</div>
              <div>${viewingInvoice.customer_address || ""}</div>
              <div>${viewingInvoice.customer_phone || ""}</div>
            </div>

            <div class="section">
              <div class="section-title">Items</div>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${(viewingInvoice.items || [])
                    .filter((item: any) => !item.is_free)
                    .map(
                      (item: any) => `
                    <tr>
                      <td>${item.item_name}</td>
                      <td class="text-right">${item.quantity} ${item.unit}</td>
                      <td class="text-right">${Number(item.unit_price).toFixed(2)}</td>
                      <td class="text-right">${(
                        Number(item.quantity) * Number(item.unit_price)
                      ).toFixed(2)}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            ${(viewingInvoice.items || []).some((item: any) => item.is_free) 
              ? `
              <div class="section">
                <div class="section-title">Free Items</div>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th class="text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(viewingInvoice.items || [])
                      .filter((item: any) => item.is_free)
                      .map(
                        (item: any) => `
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

            ${(viewingInvoice.returnedItems || []).length > 0
              ? `
              <div class="section">
                <div class="section-title" style="color: #dc2626; border-color: #fca5a5;">Returned Items</div>
                <table>
                  <thead>
                    <tr>
                      <th style="color: #dc2626;">Item</th>
                      <th class="text-right" style="color: #dc2626;">Quantity</th>
                      <th class="text-right" style="color: #dc2626;">Price</th>
                      <th class="text-right" style="color: #dc2626;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${viewingInvoice.returnedItems
                      .map(
                        (item: any) => `
                      <tr>
                        <td>${item.item_name}</td>
                        <td class="text-right">${item.quantity} ${item.unit}</td>
                        <td class="text-right">${Number(item.unit_price).toFixed(2)}</td>
                        <td class="text-right">-Rs. ${(
                          Number(item.quantity) * Number(item.unit_price)
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
                <span class="total-value">${originalSale.toFixed(2)}</span>
              </div>
              ${
                returns > 0
                  ? `
              <div class="total-row" style="color: #dc2626;">
                <span class="total-label">Less Returns:</span>
                <span class="total-value">-${returns.toFixed(2)}</span>
              </div>
              `
                  : ""
              }
              <div class="total-row grand-total">
                <span class="total-label">Net Total:</span>
                <span class="total-value">${netTotal.toFixed(2)}</span>
              </div>
              
              <div style="margin-top: 20px; text-align: right; font-size: 12px; color: #666;">
                 Payment: Cash (${Number(viewingInvoice.cash||0).toFixed(2)}) / Cheque (${Number(viewingInvoice.cheque||0).toFixed(2)}) / Credit (${Number(viewingInvoice.credit||0).toFixed(2)})
              </div>
            </div>
            
             ${viewingInvoice.notes ? `<div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-size: 12px; color: #666;"><strong>Notes:</strong> ${viewingInvoice.notes}</div>` : ''}
          </body>
        </html>
      `;
      
      win.document.write(htmlContent);
      win.document.close();
      
      // Delay to ensure rendering before print
      setTimeout(() => {
        win.focus();
        win.print();
        // Removed win.close() to allow user to see/debug, or if print dialog blocks close logic.
        // User can close the tab manually.
      }, 500);
    }
  };

  const downloadCSV = () => {
    if (!viewingInvoice || !viewingInvoice.items) return;

    const netTotal = Number(viewingInvoice.subtotal || 0);
    const returns = Number(viewingInvoice.total_returned_amount || 0);
    const originalSale = netTotal + returns;

    const headers = ["Item", "Quantity", "Unit", "Unit Price", "Line Total"];
    const rows = viewingInvoice.items.map((item: any) => [
      `"${item.item_name.replace(/"/g, '""')}"`, // Escape quotes
      item.quantity,
      item.unit,
      Number(item.unit_price).toFixed(2),
      (Number(item.quantity) * Number(item.unit_price)).toFixed(2),
    ]);

    const csvContent = [
      `INVOICE,${viewingInvoice.invoice_number}`,
      `DATE,${viewingInvoice.created_at ? format(new Date(viewingInvoice.created_at), "yyyy-MM-dd") : ""}`,
      `CUSTOMER,${viewingInvoice.customer_name || ""}`,
      "",
      headers.join(","),
      ...rows.map((r: any[]) => r.join(",")),
      "",
      `Original Amount,,,${originalSale.toFixed(2)}`,
      `Returns,,,${returns > 0 ? "-" + returns.toFixed(2) : "0.00"}`,
      `NET TOTAL,,,${netTotal.toFixed(2)}`
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Invoice_${viewingInvoice.invoice_number}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadTXT = () => {
     if (!viewingInvoice) return;
     
     const netTotal = Number(viewingInvoice.subtotal || 0);
     const returns = Number(viewingInvoice.total_returned_amount || 0);
     const originalSale = netTotal + returns;
     
     let txt = "";
     txt += `========================================\n`;
     txt += `               INVOICE                  \n`;
     txt += `========================================\n`;
     txt += `Invoice #: ${viewingInvoice.invoice_number}\n`;
     txt += `Date:     ${viewingInvoice.created_at ? format(new Date(viewingInvoice.created_at), "dd MMM yyyy") : "N/A"}\n`;
     txt += `Customer: ${viewingInvoice.customer_name || "N/A"}\n`;
     if(viewingInvoice.customer_phone) txt += `Phone:    ${viewingInvoice.customer_phone}\n`;
     txt += `----------------------------------------\n`;
     txt += `ITEMS\n`;
     txt += `----------------------------------------\n`;
     
     viewingInvoice.items?.forEach((item: any) => {
        const lineTotal = Number(item.quantity) * Number(item.unit_price);
        txt += `${item.item_name}\n`;
        txt += `  ${item.quantity} ${item.unit} x ${Number(item.unit_price).toFixed(2)} = ${lineTotal.toFixed(2)}\n`;
     });
     
     txt += `----------------------------------------\n`;
     txt += `Original Sale:   ${originalSale.toFixed(2).padStart(10)}\n`;
     if(returns > 0) {
     txt += `Less Returns:    -${returns.toFixed(2).padStart(10)}\n`;
     }
     txt += `NET TOTAL:       ${netTotal.toFixed(2).padStart(10)}\n`;
     txt += `========================================\n`;
     
     const blob = new Blob([txt], { type: "text/plain;charset=utf-8;" });
     const link = document.createElement("a");
     const url = URL.createObjectURL(blob);
     link.setAttribute("href", url);
     link.setAttribute("download", `Invoice_${viewingInvoice.invoice_number}.txt`);
     link.style.visibility = "hidden";
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const stats = [
    {
      label: "Total Invoices",
      value: invoices.length,
      icon: FileText,
      color: "text-primary",
    },
    {
      label: "Paid",
      value: invoices.filter((i) => i.payment_status === "PAID").length,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      label: "Pending",
      value: invoices.filter((i) => i.payment_status === "UNPAID").length,
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      label: "Partial",
      value: invoices.filter((i) => i.payment_status === "PARTIALLY_PAID")
        .length,
      icon: DollarSign,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Invoice Management
          </h1>
          <p className="text-muted-foreground">
            Manage invoices and track payments
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Invoice Number</label>
                  <Input
                    placeholder="Enter invoice number"
                    value={newInvoice.invoice_number}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        invoice_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client Name</label>
                  <Input
                    placeholder="Enter client name"
                    value={newInvoice.client_name}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        client_name: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={newInvoice.amount}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, amount: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cash</label>
                  <Input
                    type="number"
                    placeholder="Enter cash amount"
                    value={newInvoice.cash}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, cash: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cheque</label>
                  <Input
                    type="number"
                    placeholder="Enter cheque amount"
                    value={newInvoice.cheque}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, cheque: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Credit</label>
                  <Input
                    type="number"
                    placeholder="Enter credit amount"
                    value={newInvoice.credit}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, credit: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={newInvoice.sale_date}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, sale_date: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleAddInvoice} className="w-full">
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Invoice Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Invoice Details - {viewingInvoice?.invoice_number}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex justify-end gap-2 my-2">
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
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

            {viewingInvoice && (
              <div className="space-y-6">
                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customer</p>
                    <p className="font-semibold text-lg">{viewingInvoice.customer_name || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">{viewingInvoice.customer_phone}</p>
                    <p className="text-sm text-muted-foreground">{viewingInvoice.customer_address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {viewingInvoice.created_at
                        ? format(new Date(viewingInvoice.created_at), "dd MMMM yyyy")
                        : "N/A"}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground mt-2">Status</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        viewingInvoice.payment_status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : viewingInvoice.payment_status === "UNPAID"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {viewingInvoice.payment_status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Items Table */}
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
                        {(viewingInvoice.items || []).filter((i: any) => !i.is_free).map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="px-4 py-2 font-medium">{item.item_name}</td>
                            <td className="px-4 py-2 text-right">{item.quantity} {item.unit}</td>
                            <td className="px-4 py-2 text-right">
                              Rs. {Number(item.unit_price).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right font-medium">
                              Rs. {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        {(!viewingInvoice.items || viewingInvoice.items.filter((i: any) => !i.is_free).length === 0) && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">
                              No items found for this invoice.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Free Items Table */}
                {viewingInvoice.items?.some((i: any) => i.is_free) && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                      Free Items
                    </h3>
                    <div className="border border-green-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-[#a0f2be]">
                          <tr>
                            <th className="px-4 py-2 text-left text-green-700">Product</th>
                            <th className="px-4 py-2 text-right text-green-700">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-green-100">
                          {viewingInvoice.items.filter((i: any) => i.is_free).map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-green-50/50">
                              <td className="px-4 py-2 font-medium">{item.item_name}</td>
                              <td className="px-4 py-2 text-right">{item.quantity} {item.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Returned Items Table */}
                {viewingInvoice.returnedItems && viewingInvoice.returnedItems.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                      Returned Items
                    </h3>
                    <div className="border border-destructive/20 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-destructive/10">
                          <tr>
                            <th className="px-4 py-2 text-left text-destructive">Product</th>
                            <th className="px-4 py-2 text-right text-destructive">Qty</th>
                            <th className="px-4 py-2 text-right text-destructive">Price</th>
                            <th className="px-4 py-2 text-right text-destructive">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-destructive/10">
                          {viewingInvoice.returnedItems.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-destructive/5">
                              <td className="px-4 py-2 font-medium">{item.item_name}</td>
                              <td className="px-4 py-2 text-right">{item.quantity} {item.unit}</td>
                              <td className="px-4 py-2 text-right">
                                Rs. {Number(item.unit_price).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                - Rs. {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Payment Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <h3 className="font-semibold">Payment Method</h3>
                     <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-3 bg-muted/20 rounded-md border border-border/50">
                          <p className="text-muted-foreground text-xs">Cash</p>
                          <p className="font-semibold">Rs. {Number(viewingInvoice.cash || 0).toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-md border border-border/50">
                          <p className="text-muted-foreground text-xs">Cheque</p>
                          <p className="font-semibold">Rs. {Number(viewingInvoice.cheque || 0).toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-md border border-border/50 col-span-2">
                          <p className="text-muted-foreground text-xs">Credit</p>
                          <p className="font-semibold">Rs. {Number(viewingInvoice.credit || 0).toFixed(2)}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Original Sale Amount:</span>
                      <span className="font-medium">
                        Rs. {(Number(viewingInvoice.subtotal || 0) + Number(viewingInvoice.total_returned_amount || 0)).toFixed(2)}
                      </span>
                    </div>
                    {Number(viewingInvoice.total_returned_amount) > 0 && (
                      <div className="flex justify-between text-sm text-destructive">
                         <span>Returns Deduction:</span>
                         <span>- Rs. {Number(viewingInvoice.total_returned_amount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-primary/20">
                      <span>Net Total:</span>
                      <span className="text-primary text-xl">
                        Rs. {Number(viewingInvoice.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {viewingInvoice.notes && (
                  <div className="bg-muted/30 p-3 rounded-md">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{viewingInvoice.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl p-4 border border-border/50 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.label === "Total Invoices" ? totalInvoices : stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Partial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="VEHICLE_SALE">Sales</SelectItem>
            <SelectItem value="DIRECT_SALE">Direct Sales</SelectItem>
            <SelectItem value="SERVICE">Services</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Invoice
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Client
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Final Amount
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  {/* Returned */}
                  Returned Amount
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  {/* Amount */}
                  Sale Amount
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Cash Amount
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Cheque Amount
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Credit Amount
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                  Date
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-muted-foreground">
                        Loading invoices...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice, index) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {invoice.invoice_number}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(
                              new Date(invoice.created_at),
                              "dd MMM yyyy"
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-3.5 h-3.5" />
                        {invoice.customer_name || "N/A"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-foreground">
                        Rs. {Number(invoice.subtotal || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-foreground">
                        Rs.{" "}
                        {Number(invoice.total_returned_amount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-foreground">
                        Rs.{" "}
                        {(
                          Number(invoice.subtotal || 0) +
                          Number(invoice.total_returned_amount || 0)
                        ).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-foreground">
                        Rs. {Number(invoice.cash || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-foreground">
                        Rs. {Number(invoice.cheque || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-foreground">
                        Rs. {Number(invoice.credit || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-sm text-foreground">
                        {invoice.sale_date
                          ? format(new Date(invoice.sale_date), "dd MMM yyyy")
                          : "N/A"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          invoice.payment_status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : invoice.payment_status === "UNPAID"
                            ? "bg-yellow-100 text-yellow-800"
                            : invoice.payment_status === "PARTIALLY_PAID"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {invoice.payment_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleViewDetails(invoice)}>
                            <Edit className="w-4 h-4" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/10">
            <div className="text-sm text-muted-foreground">
              Showing page <span className="font-medium">{currentPage}</span> of{" "}
              <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchInvoices(currentPage - 1)}
                disabled={currentPage === 1 || loading}
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
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => fetchInvoices(pageNum)}
                        disabled={loading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  } else if (Math.abs(pageNum - currentPage) === 2) {
                    return (
                      <span key={pageNum} className="px-1 text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                  return null;
                }).filter(Boolean).reduce((acc: any[], curr, i, arr) => {
                  if (curr?.type === 'span' && arr[i-1]?.type === 'span') return acc;
                  return [...acc, curr];
                }, [])}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchInvoices(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
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
};

export default InvoiceManagement;
