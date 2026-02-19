import React, { useEffect, useState } from "react";
import {
  Truck,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface VehicleInventoryItem {
  item_id: number;
  item_name: string;
  item_code: string;
  unit: string;
  unit_size?: number;
  quantity: number;
}

interface VehicleInventoryRecord {
  vehicle_id: number;
  vehicle_code: string;
  vehicle_number?: string;
  vehicle_type: string;
  vehicle_status: string;
  driver_name?: string;
  items: VehicleInventoryItem[];
}

const VehicleItemsExpansion = ({ items }: { items: VehicleInventoryItem[] }) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No stock items on this vehicle.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-black text-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#454647] hover:bg-[#454647]">
            <TableHead className="w-[260px] text-white">Product</TableHead>
            <TableHead className="text-white">Code</TableHead>
            <TableHead className="text-white">Unit</TableHead>
            <TableHead className="text-right text-white">Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.item_id}>
              <TableCell className="font-medium">{item.item_name}</TableCell>
              <TableCell>{item.item_code}</TableCell>
              <TableCell>{Number(item.unit_size)}{item.unit}</TableCell>
              <TableCell className="text-right font-semibold">
                {item.quantity}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default function VehicleInventory() {
  const { toast } = useToast();
  const [records, setRecords] = useState<VehicleInventoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const fetchVehicleInventory = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/vehicleStockTransfers/vehicle-inventory");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load vehicle inventory");
      }

      setRecords(data.data?.vehicles || []);
    } catch (error) {
      console.error("Error fetching vehicle inventory:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load vehicle inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleInventory();
  }, []);

  const toggleRow = (vehicleId: number) => {
    const next = new Set(expanded);
    if (next.has(vehicleId)) {
      next.delete(vehicleId);
    } else {
      next.add(vehicleId);
    }
    setExpanded(next);
  };

  const filteredRecords = records.filter((rec) => {
    const q = search.toLowerCase();
    return (
      rec.vehicle_code.toLowerCase().includes(q) ||
      (rec.vehicle_number || "").toLowerCase().includes(q) ||
      (rec.driver_name || "").toLowerCase().includes(q)
    );
  });

  const totalVehicles = records.length;
  const totalLines = records.reduce(
    (sum, v) => sum + (v.items ? v.items.length : 0),
    0
  );
  const totalUnits = records.reduce(
    (sum, v) =>
      sum +
      (v.items
        ? v.items.reduce((s, i) => s + (i.quantity || 0), 0)
        : 0),
    0
  );

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            Vehicle Inventory
          </h1>
          <p className="text-muted-foreground">
            View stock currently loaded on each vehicle with expandable details.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vehicles</p>
              <p className="text-2xl font-bold">{totalVehicles}</p>
            </div>
            <Truck className="w-8 h-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Distinct Items</p>
              <p className="text-2xl font-bold">{totalLines}</p>
            </div>
            <Package className="w-8 h-8 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Units</p>
              <p className="text-2xl font-bold">{totalUnits}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm w-full">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Vehicle Inventory Records
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by vehicle or driver..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-[50px]" />
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Distinct Items</TableHead>
                  <TableHead className="text-right">Total Units</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Loading vehicle inventory...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No vehicle inventory records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((rec) => {
                    const distinctItems = rec.items ? rec.items.length : 0;
                    const units =
                      rec.items?.reduce(
                        (s, i) => s + (i.quantity || 0),
                        0
                      ) || 0;

                    return (
                      <React.Fragment key={rec.vehicle_id}>
                        <TableRow className="border-border/40 hover:bg-muted/30">
                          <TableCell>
                            <button
                              type="button"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border/60 bg-background hover:bg-muted transition-colors"
                              onClick={() => toggleRow(rec.vehicle_id)}
                            >
                              {expanded.has(rec.vehicle_id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="font-medium flex items-center gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            {rec.vehicle_code}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {rec.vehicle_number || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {rec.driver_name || "Unassigned"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{rec.vehicle_type}</TableCell>
                          <TableCell className="text-right">
                            {distinctItems}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {units}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                rec.vehicle_status === "ACTIVE"
                                  ? "border-emerald-500/40 text-emerald-500"
                                  : "border-muted-foreground/40 text-muted-foreground"
                              }
                            >
                              {rec.vehicle_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {expanded.has(rec.vehicle_id) && (
                          <TableRow>
                            <TableCell colSpan={8} className="p-0">
                              <VehicleItemsExpansion items={rec.items || []} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





