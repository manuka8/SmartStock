import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface SaleItem {
  item_id: number;
  item_name: string;
  item_code: string;
  unit: string;
  unit_size?: number;
  quantity: number;
  unit_price: number;
  buying_price?: number;
}

interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string;
  vehicle_code: string;
  total_amount: number;
  sale_date: string;
  status: string;
  item_count?: number;
  items?: SaleItem[];
}

interface SalesTableProps {
  sales: Sale[];
  loading?: boolean;
  expandedRows?: Set<number>;
  onToggleRow?: (saleId: number) => void;
}

const SalesTable: React.FC<SalesTableProps> = ({
  sales,
  loading = false,
  expandedRows = new Set(),
  onToggleRow
}) => {
  if (loading) {
    return (
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
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
              Loading sales...
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  if (sales.length === 0) {
    return (
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
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
              No sales found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">
            Paid
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="border-amber-500/40 text-amber-500">
            Pending
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-emerald-500 border-emerald-500/40 text-white">
            Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="border-destructive/40 text-destructive">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground">
            {status}
          </Badge>
        );
    }
  };

  return (
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <React.Fragment key={sale.id}>
            <TableRow className="border-border/50 hover:bg-muted/50">
              <TableCell>
                {onToggleRow && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleRow(sale.id)}
                    className="h-6 w-6 p-0"
                  >
                    {expandedRows.has(sale.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </TableCell>
              <TableCell className="font-medium">{sale.invoice_number}</TableCell>
              <TableCell>{format(new Date(sale.sale_date), 'yyyy-MM-dd')}</TableCell>
              <TableCell>{sale.customer_name}</TableCell>
              <TableCell>{sale.vehicle_code}</TableCell>
              <TableCell className="text-right">{sale.item_count || (sale.items ? sale.items.length : 0)}</TableCell>
              <TableCell className="text-right">Rs. {Number(sale.total_amount).toFixed(2)}</TableCell>
              <TableCell>{getStatusBadge(sale.status)}</TableCell>
            </TableRow>
            {expandedRows.has(sale.id) && sale.items && sale.items.length > 0 && (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <div className="border rounded-lg overflow-hidden bg-black text-white p-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-primary">Sale Items</h4>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-white/10">
                            <TableHead className="text-white w-[250px]">Product</TableHead>
                            <TableHead className="text-white">Code</TableHead>
                            <TableHead className="text-white">Unit</TableHead>
                            <TableHead className="text-white text-right">Quantity</TableHead>
                            <TableHead className="text-white text-right">Unit Price</TableHead>
                            <TableHead className="text-white text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sale.items.map((item, index) => (
                            <TableRow key={item.item_id || index} className="border-b border-white/5 hover:bg-white/5">
                              <TableCell className="font-medium text-white">{item.item_name}</TableCell>
                              <TableCell className="text-white">{item.item_code}</TableCell>
                              <TableCell className="text-white">{item.unit_size}{item.unit}</TableCell>
                              <TableCell className="text-right text-white">{item.quantity}</TableCell>
                              <TableCell className="text-right text-white">Rs. {Number(item.unit_price).toFixed(2)}</TableCell>
                              <TableCell className="text-right font-medium text-white">
                                Rs. {(item.quantity * Number(item.unit_price)).toFixed(2)}
                              </TableCell>
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
        ))}
      </TableBody>
    </Table>
  );
};

export default SalesTable;