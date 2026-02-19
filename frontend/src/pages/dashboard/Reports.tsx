import React, { useState, useEffect } from "react";
import { Download, FileText, Calendar, Filter, Truck, ArrowUpDown, ChevronDown, ChevronUp, ShoppingCart, Search, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import SalesTable from "@/components/dashboard/SalesTable";
import VehicleSales from "./Sales";

interface TransferItem {
  quantity: number;
  item_name: string;
  item_code: string;
  unit: string;
  unit_size?: number;
}

interface Transfer {
  id: number;
  reference_number: string;
  transfer_type: string;
  transfer_date: string;
  vehicle_code: string;
  vehicle_number?: string;
  created_by_name: string;
  item_count: number;
  total_quantity: number;
  status: string;
  items: TransferItem[];
}

interface CustomerCreditData {
  id: number;
  customer_code: string;
  first_name: string;
  last_name: string;
  business_name: string;
  phone: string;
  outstanding_balance: number;
  credit_limit: number;
}

interface PaymentHistory {
  id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
}

const reportTypes = [
  { name: "Inventory Report", description: "Complete stock levels and valuations", icon: "📦" },
  { name: "Sales Report", description: "Revenue and transaction analysis", icon: "💰" },
  { name: "Low Stock Report", description: "Items below minimum levels", icon: "⚠️" },
  { name: "Supplier Report", description: "Vendor performance metrics", icon: "🚚" },
  { name: "Loading/Unloading Report", description: "Stock transfer movements", icon: "🚛" },
  { name: "Daily Sales Report", description: "Daily sales transactions", icon: "🛒" },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [transferType, setTransferType] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [salesExpandedRows, setSalesExpandedRows] = useState<Set<number>>(new Set());
  const [salesSearch, setSalesSearch] = useState("");
  const [transferSearch, setTransferSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerCreditData[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerExpandedRows, setCustomerExpandedRows] = useState<Set<number>>(new Set());
  const [customerHistories, setCustomerHistories] = useState<Map<number, PaymentHistory[]>>(new Map());
  const [customerHistoryLoading, setCustomerHistoryLoading] = useState<Set<number>>(new Set());

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange?.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
      if (transferType !== 'all') params.append('transfer_type', transferType);

      const response = await apiFetch(`/api/vehicleStockTransfers/getReports?${params}`);
      const data = await response.json();
      if (data.success) {
        setTransfers(data.transfers);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      setSalesLoading(true);
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange?.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));

      const response = await apiFetch(`/api/vehicleSales/getAllSales?${params}&limit=100`);
      const data = await response.json();
      if (data.success) {
        setSales(data.sales);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setCustomerLoading(true);
      const response = await apiFetch('/api/customers/credit-balances');
      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setCustomerLoading(false);
    }
  };

  const toggleRow = (transferId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(transferId)) {
      newExpanded.delete(transferId);
    } else {
      newExpanded.add(transferId);
    }
    setExpandedRows(newExpanded);
  };

  const toggleSalesRow = (saleId: number) => {
    const newExpanded = new Set(salesExpandedRows);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setSalesExpandedRows(newExpanded);
  };

  const toggleCustomerRow = async (customerId: number) => {
    const newExpanded = new Set(customerExpandedRows);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
      setCustomerExpandedRows(newExpanded);
    } else {
      newExpanded.add(customerId);
      setCustomerExpandedRows(newExpanded);
      // Fetch history if not already fetched
      if (!customerHistories.has(customerId)) {
        await fetchCustomerHistory(customerId);
      }
    }
  };

  const fetchCustomerHistory = async (customerId: number) => {
    setCustomerHistoryLoading(prev => new Set(prev).add(customerId));
    try {
      const response = await apiFetch(`/api/customers/credit-history/${customerId}`);
      const data = await response.json();
      if (data.success) {
        setCustomerHistories(prev => new Map(prev).set(customerId, data.history || []));
      }
    } catch (error) {
      console.error('Error fetching customer history:', error);
    } finally {
      setCustomerHistoryLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(customerId);
        return newSet;
      });
    }
  };

  const filteredSales = sales.filter((s) => {
    const q = salesSearch.toLowerCase();
    return (
      s.invoice_number?.toLowerCase().includes(q) ||
      s.customer_name?.toLowerCase().includes(q) ||
      s.vehicle_code?.toLowerCase().includes(q)
    );
  });

  const filteredTransfers = transfers.filter((t) => {
    const q = transferSearch.toLowerCase();
    return (
      t.reference_number?.toLowerCase().includes(q) ||
      t.vehicle_code?.toLowerCase().includes(q) ||
      t.created_by_name?.toLowerCase().includes(q)
    );
  });

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return (
      c.customer_code?.toLowerCase().includes(q) ||
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.business_name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  const downloadSalesCSV = async () => {
    // Ensure all sales have items loaded for buying cost calculation
    const salesWithItems = await Promise.all(filteredSales.map(async (s) => {
      if (s.items && s.items.length > 0) {
        return s;
      } else {
        try {
          const response = await apiFetch(`/api/vehicleSales/getSale/${s.id}`);
          const data = await response.json();
          if (data.success) {
            return { ...s, items: data.items || [] };
          }
        } catch (error) {
          console.error('Error fetching items for sale', s.id, error);
        }
        return s;
      }
    }));

    const headers = ["Invoice #", "Date", "Customer", "Vehicle", "Item Name", "Item Code", "Quantity", "Buying Price", "Unit Price", "Total", "Status"];
    const rows: any[] = [];
    salesWithItems.forEach(s => {
      if (s.items && s.items.length > 0) {
        s.items.forEach(item => {
          rows.push([
            s.invoice_number,
            format(new Date(s.sale_date), 'yyyy-MM-dd'),
            s.customer_name,
            s.vehicle_code,
            item.item_name,
            item.item_code,
            item.quantity,
            item.buying_price ? Number(item.buying_price).toFixed(2) : 'N/A',
            item.unit_price,
            (item.quantity * item.unit_price).toFixed(2),
            s.status
          ]);
        });
      } else {
        // If no items, add sale summary
        rows.push([
          s.invoice_number,
          format(new Date(s.sale_date), 'yyyy-MM-dd'),
          s.customer_name,
          s.vehicle_code,
          '',
          '',
          s.item_count || '',
          'N/A',
          '',
          s.total_amount,
          s.status
        ]);
      }
    });
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_${dateRange?.from && dateRange?.to ? `${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}` : 'All'}.csv`;
    link.click();
  };

  const downloadSalesTXT = async () => {
    // Ensure all sales have items loaded for buying cost calculation
    const salesWithItems = await Promise.all(filteredSales.map(async (s) => {
      if (s.items && s.items.length > 0) {
        return s;
      } else {
        try {
          const response = await apiFetch(`/api/vehicleSales/getSale/${s.id}`);
          const data = await response.json();
          if (data.success) {
            return { ...s, items: data.items || [] };
          }
        } catch (error) {
          console.error('Error fetching items for sale', s.id, error);
        }
        return s;
      }
    }));

    let content = `Sales Report\n${dateRange ? `From: ${format(dateRange.from!, 'yyyy-MM-dd')} To: ${format(dateRange.to!, 'yyyy-MM-dd')}\n` : 'All Sales\n'}\n`;
    salesWithItems.forEach(s => {
      content += `Invoice #: ${s.invoice_number}\n`;
      content += `Date: ${format(new Date(s.sale_date), 'yyyy-MM-dd')}\n`;
      content += `Customer: ${s.customer_name}\n`;
      content += `Vehicle: ${s.vehicle_code}\n`;
      content += `Status: ${s.status}\n`;
      content += `Total Amount: Rs. ${s.total_amount}\n`;
      if (s.items && s.items.length > 0) {
        content += `Products:\n`;
        s.items.forEach(item => {
          content += `  - ${item.item_name} (${item.item_code}): Qty ${item.quantity}, Buying Price: Rs. ${item.buying_price ? Number(item.buying_price).toFixed(2) : 'N/A'}, Unit Price: Rs. ${item.unit_price}, Total: Rs. ${(item.quantity * item.unit_price).toFixed(2)}\n`;
        });
      }
      content += '\n';
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_${dateRange?.from && dateRange?.to ? `${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}` : 'All'}.txt`;
    link.click();
  };

  const printSalesReport = async () => {
    // Ensure all sales have items loaded
    const salesWithItems = await Promise.all(filteredSales.map(async (s) => {
      if (s.items && s.items.length > 0) {
        return s;
      } else {
        try {
          const response = await apiFetch(`/api/vehicleSales/getSale/${s.id}`);
          const data = await response.json();
          if (data.success) {
            return { ...s, items: data.items || [] };
          }
        } catch (error) {
          console.error('Error fetching items for sale', s.id, error);
        }
        return s;
      }
    }));

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Detailed Sales Report</title>
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
            <h1>Detailed Sales Report</h1>
            <p>Report Period: ${dateRange ? `${format(dateRange.from!, 'yyyy-MM-dd')} to ${format(dateRange.to!, 'yyyy-MM-dd')}` : 'All Sales'} | Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
          </div>
          ${salesWithItems.map(s => `
            <div class="sale">
              <div class="sale-header">
                <span class="invoice-number">Invoice #${s.invoice_number}</span> |
                Date: ${format(new Date(s.sale_date), 'yyyy-MM-dd')} |
                Customer: ${s.customer_name} |
                Vehicle: ${s.vehicle_code} |
                Status: ${s.status} |
                Total Amount: Rs. ${Number(s.total_amount).toFixed(2)}
              </div>
              ${s.items && s.items.length > 0 ? `
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
                    ${s.items.map(item => `
                      <tr>
                        <td>${item.item_name}</td>
                        <td>${item.item_code}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td class="price-column">Rs. ${item.buying_price ? Number(item.buying_price).toFixed(2) : 'N/A'}</td>
                        <td class="price-column">Rs. ${Number(item.unit_price).toFixed(2)}</td>
                        <td class="price-column">Rs. ${(item.quantity * Number(item.unit_price)).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                    ${(() => {
                      const buyingTotal = s.items.reduce((sum, item) => sum + (item.buying_price ? Number(item.buying_price) * item.quantity : 0), 0);
                      return `
                        <tr class="total-row">
                          <td colspan="3" style="text-align: right; font-weight: bold;">Buying Cost Total: Rs. ${buyingTotal.toFixed(2)}</td>

                          <td colspan="3" style="text-align: right; font-weight: bold;">Sale Total: Rs. ${Number(s.total_amount).toFixed(2)}</td>
                        </tr>

                      `;
                    })()}
                  </tbody>
                </table>
              ` : '<div class="no-items">No item details available for this sale.</div>'}
            </div>
          `).join('')}
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

  useEffect(() => {
    if (activeTab === "loading") {
      fetchTransfers();
    } else if (activeTab === "sales") {
      fetchSales();
    } else if (activeTab === "credit") {
      fetchCustomers();
    }
  }, [activeTab, dateRange, transferType]);

  const downloadLoadingReport = () => {
    const headers = ["Reference #", "Type", "Date", "Vehicle", "Product", "Code", "Unit", "Quantity", "Status"];
    const rows: any[] = [];
    filteredTransfers.forEach(t => {
      if (t.items && t.items.length > 0) {
        t.items.forEach(item => {
          rows.push([
            t.reference_number,
            t.transfer_type === "OUT" ? "Loading" : "Unloading",
            format(new Date(t.transfer_date), 'yyyy-MM-dd'),
            t.vehicle_code,
            item.item_name,
            item.item_code,
            item.unit_size ? `${item.unit_size}${item.unit}` : item.unit,
            item.quantity,
            t.status
          ]);
        });
      } else {
        // If no items, add transfer summary
        rows.push([
          t.reference_number,
          t.transfer_type === "OUT" ? "Loading" : "Unloading",
          format(new Date(t.transfer_date), 'yyyy-MM-dd'),
          t.vehicle_code,
          '',
          '',
          '',
          t.total_quantity,
          t.status
        ]);
      }
    });
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Loading_Unloading_Report_${dateRange ? `${format(dateRange.from!, 'yyyy-MM-dd')}_to_${format(dateRange.to!, 'yyyy-MM-dd')}` : 'All'}.csv`;
    link.click();
  };

  const downloadCustomerCSV = () => {
    const headers = ["Customer Code", "First Name", "Last Name", "Business Name", "Phone", "Outstanding Balance", "Credit Limit"];
    const rows: any[] = [];
    filteredCustomers.forEach(c => {
      rows.push([
        c.customer_code,
        c.first_name,
        c.last_name,
        c.business_name,
        c.phone,
        Number(c.outstanding_balance).toFixed(2),
        Number(c.credit_limit).toFixed(2)
      ]);
    });
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Customer_Credit_Report.csv`;
    link.click();
  };

  const printCustomerReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Customer Credit Report</title>
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
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
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
            .price-column {
              text-align: right;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Customer Credit Report</h1>
            <p>Report Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Customer Code</th>
                <th>Name</th>
                <th>Business Name</th>
                <th>Phone</th>
                <th class="price-column">Outstanding Balance</th>
                <th class="price-column">Credit Limit</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCustomers.map(c => `
                <tr>
                  <td>${c.customer_code}</td>
                  <td>${c.first_name} ${c.last_name}</td>
                  <td>${c.business_name}</td>
                  <td>${c.phone}</td>
                  <td class="price-column">Rs. ${Number(c.outstanding_balance).toFixed(2)}</td>
                  <td class="price-column">Rs. ${Number(c.credit_limit).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
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

  const printLoadingReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Loading & Unloading Report</title>
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
            .transfer {
              margin-bottom: 30px;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .transfer-header {
              background-color: #f8f9fa;
              padding: 15px;
              border-bottom: 1px solid #e9ecef;
              font-weight: 600;
              font-size: 14px;
            }
            .transfer-header .reference-number {
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
            .no-items {
              padding: 20px;
              text-align: center;
              color: #666;
              font-style: italic;
            }
            .quantity-column {
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Loading & Unloading Report</h1>
            <p>Report Period: ${dateRange ? `${format(dateRange.from!, 'yyyy-MM-dd')} to ${format(dateRange.to!, 'yyyy-MM-dd')}` : 'All Transfers'} | Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
          </div>
          ${filteredTransfers.map(t => `
            <div class="transfer">
              <div class="transfer-header">
                <span class="reference-number">${t.reference_number}</span> |
                Type: ${t.transfer_type === "OUT" ? "Loading" : "Unloading"} |
                Date: ${format(new Date(t.transfer_date), 'yyyy-MM-dd')} |
                Vehicle: ${t.vehicle_code} |
                Status: ${t.status} |
                Total Items: ${t.item_count} |
                Total Quantity: ${t.total_quantity}
              </div>
              ${t.items && t.items.length > 0 ? `
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Code</th>
                      <th>Unit</th>
                      <th class="quantity-column">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${t.items.map(item => `
                      <tr>
                        <td>${item.item_name}</td>
                        <td>${item.item_code}</td>
                        <td>${item.unit_size ? `${item.unit_size}${item.unit}` : item.unit}</td>
                        <td class="quantity-column">${item.quantity}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<div class="no-items">No item details available for this transfer.</div>'}
            </div>
          `).join('')}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Generate and download business reports</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          onClick={() => setActiveTab("overview")}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
        >
          Overview
        </Button>
        <Button
          variant={activeTab === "sales" ? "default" : "ghost"}
          onClick={() => setActiveTab("sales")}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
        >
          Daily Sales
        </Button>
        <Button
          variant={activeTab === "loading" ? "default" : "ghost"}
          onClick={() => setActiveTab("loading")}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
        >
          Loading/Unloading
        </Button>
        <Button
          variant={activeTab === "credit" ? "default" : "ghost"}
          onClick={() => setActiveTab("credit")}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
        >
          Customer Credit
        </Button>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Quick Generate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTypes.map((type) => (
              <div
                key={type.name}
                className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
              >
                <span className="text-2xl mb-3 block">{type.icon}</span>
                <h3 className="font-medium text-foreground mb-1">{type.name}</h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>

          {/* Placeholder for other reports */}
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Detailed reporting features will be available soon.</p>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "sales" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Daily Sales Report
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-32 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Date Range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
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
                    <DropdownMenuItem onClick={() => downloadSalesCSV()}>
                      <FileText className="w-4 h-4 mr-2" />
                      CSV Export
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadSalesTXT()}>
                      <FileText className="w-4 h-4 mr-2" />
                      Text Export
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => printSalesReport()}>
                      <FileText className="w-4 h-4 mr-2" />
                      Print Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <SalesTable
                sales={filteredSales}
                loading={salesLoading}
                expandedRows={salesExpandedRows}
                onToggleRow={toggleSalesRow}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "loading" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Loading & Unloading Report
              </CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transfers..."
                    className="pl-9"
                    value={transferSearch}
                    onChange={(e) => setTransferSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="transfer-type">Type:</Label>
                  <Select value={transferType} onValueChange={setTransferType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="OUT">Loading</SelectItem>
                      <SelectItem value="RETURN">Unloading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-32 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Date Range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                <Button onClick={downloadLoadingReport} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button onClick={printLoadingReport} className="gap-2">
                  <FileText className="w-4 h-4" />
                  Print Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Reference #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        Loading transfers...
                      </TableCell>
                    </TableRow>
                  ) : filteredTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        No transfers found for the selected criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransfers.map((transfer) => (
                      <React.Fragment key={transfer.id}>
                        <TableRow>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(transfer.id)}
                              className="h-6 w-6 p-0"
                            >
                              {expandedRows.has(transfer.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{transfer.reference_number}</TableCell>
                          <TableCell>
                            <Badge variant={transfer.transfer_type === "OUT" ? "default" : "secondary"}>
                              {transfer.transfer_type === "OUT" ? "Loading" : "Unloading"}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(transfer.transfer_date), 'yyyy-MM-dd')}</TableCell>
                          <TableCell>{transfer.vehicle_code}</TableCell>
                          <TableCell className="text-right">{transfer.item_count}</TableCell>
                          <TableCell className="text-right">{transfer.total_quantity}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{transfer.status}</Badge>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(transfer.id) && transfer.items && transfer.items.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="p-0">
                              <div className="border rounded-lg overflow-hidden bg-black text-white p-4">
                                <div>
                                  <h4 className="text-sm font-semibold mb-2 text-primary">Transfer Items</h4>
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-white/10">
                                        <TableHead className="text-white w-[250px]">Product</TableHead>
                                        <TableHead className="text-white">Code</TableHead>
                                        <TableHead className="text-white">Unit</TableHead>
                                        <TableHead className="text-white text-right">Quantity</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {transfer.items.map((item, index) => (
                                        <TableRow key={index} className="border-b border-white/5 hover:bg-white/5">
                                          <TableCell className="font-medium text-white">{item.item_name}</TableCell>
                                          <TableCell className="text-white">{item.item_code}</TableCell>
                                          <TableCell className="text-white">{item.unit_size ? `${item.unit_size}${item.unit}` : item.unit}</TableCell>
                                          <TableCell className="text-right text-white">{item.quantity}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "credit" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Customer Credit Report
              </CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    className="pl-9"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-32 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Date Range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
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
                    <DropdownMenuItem onClick={() => downloadCustomerCSV()}>
                      <FileText className="w-4 h-4 mr-2" />
                      CSV Export
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => printCustomerReport()}>
                      <FileText className="w-4 h-4 mr-2" />
                      Print Report
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
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Customer Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Outstanding Balance</TableHead>
                    <TableHead className="text-right">Credit Limit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        Loading customers...
                      </TableCell>
                    </TableRow>
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No customers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <React.Fragment key={customer.id}>
                        <TableRow>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCustomerRow(customer.id)}
                              className="h-6 w-6 p-0"
                            >
                              {customerExpandedRows.has(customer.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{customer.customer_code}</TableCell>
                          <TableCell>{`${customer.first_name} ${customer.last_name}`}</TableCell>
                          <TableCell>{customer.business_name}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell className="text-right">Rs. {Number(customer.outstanding_balance).toFixed(2)}</TableCell>
                          <TableCell className="text-right">Rs. {Number(customer.credit_limit).toFixed(2)}</TableCell>
                        </TableRow>
                        {customerExpandedRows.has(customer.id) && (
                          <TableRow>
                            <TableCell colSpan={7} className="p-0">
                              <div className="border rounded-lg overflow-hidden bg-black text-white p-4">
                                <div>
                                  <h4 className="text-sm font-semibold mb-2 text-primary">Payment History</h4>
                                  {customerHistoryLoading.has(customer.id) ? (
                                    <p className="text-white">Loading payment history...</p>
                                  ) : (
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-white/10">
                                          <TableHead className="text-white">Date</TableHead>
                                          <TableHead className="text-white">Method</TableHead>
                                          <TableHead className="text-white">Reference</TableHead>
                                          <TableHead className="text-white text-right">Amount</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {customerHistories.get(customer.id)?.length ? (
                                          customerHistories.get(customer.id)!.map((payment) => (
                                            <TableRow key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                                              <TableCell className="text-white">{format(new Date(payment.payment_date), 'yyyy-MM-dd')}</TableCell>
                                              <TableCell className="text-white">{payment.payment_method}</TableCell>
                                              <TableCell className="text-white">{payment.reference_number}</TableCell>
                                              <TableCell className="text-right text-white">Rs. {Number(payment.amount).toFixed(2)}</TableCell>
                                            </TableRow>
                                          ))
                                        ) : (
                                          <TableRow>
                                            <TableCell colSpan={4} className="text-center text-white py-4">
                                              No payment history found.
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
