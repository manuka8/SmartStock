import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Truck,
  Bike,
  MoreHorizontal,
  X,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Check,
  ChevronsUpDown,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { error } from "console";
import { set } from "date-fns";
import { json } from "stream/consumers";

type VehicleType = "VAN" | "BIKE" | "TRUCK";
type VehicleStatus = "ACTIVE" | "INACTIVE";

interface Driver {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  license_number: string;
  phone: string;
  status: string;
}

interface Vehicle {
  id: number;
  vehicle_code: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  status: VehicleStatus;
}

interface VehicleInventoryItem {
  item_id: number;
  item_name: string;
  item_code: string;
  unit: string;
  unit_size?: number;
  quantity: number;
}

const Vehicles = () => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [vehicleItems, setVehicleItems] = useState<Record<number, VehicleInventoryItem[]>>({});
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [newVehicle, setNewVehicle] = useState({
    vehicle_code: "",
    vehicle_number: "",
    vehicle_type: "VAN" as VehicleType,
    driver_id: "",
    status: "ACTIVE" as VehicleStatus,
  });
  const [driverOpen, setDriverOpen] = useState(false);

  // Fetch all vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch("/api/vehicles/getAllVehicles");
      const data = await response.json();

      if (response.ok) {
        setVehicles(data.vehicles || []);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to load vehicles",
        });
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load vehicles",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch vehicle inventory (items loaded on each vehicle)
  const fetchVehicleInventory = useCallback(async () => {
    try {
      const response = await apiFetch("/api/vehicleStockTransfers/vehicle-inventory");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load vehicle inventory");
      }

      const map: Record<number, VehicleInventoryItem[]> = {};
      (data.data?.vehicles || []).forEach((v: {
        vehicle_id: number;
        items: VehicleInventoryItem[];
      }) => {
        map[v.vehicle_id] = v.items || [];
      });
      setVehicleItems(map);
    } catch (err) {
      console.error("Error fetching vehicle inventory:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to load vehicle inventory",
      });
    }
  }, [toast]);

  // Fetch all drivers (employees)
  const fetchDrivers = useCallback(async () => {
    try {
      const response = await apiFetch("/api/employees/getAllEmployees");
      const data = await response.json();

      if (response.ok) {
        setDrivers(data.employees || []);
      } else {
        console.error("Failed to load drivers");
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  }, []);

  // Fetch vehicles, drivers, and vehicle inventory on mount
  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
    fetchVehicleInventory();
  }, [fetchVehicles, fetchDrivers, fetchVehicleInventory]);

  // Add a vehicle
  const handleAddVehicle = async () => {
    try {
      const response = await apiFetch("/api/vehicles/createVehicle", {
        method: "POST",
        body: JSON.stringify({ ...newVehicle, ownership_type: "OWN" }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Vehicle added successfully",
        });
        setIsDialogOpen(false);
        setSelectedVehicle(null);
        setNewVehicle({
          vehicle_code: "",
          vehicle_number: "",
          vehicle_type: "VAN",
          driver_id: "",
          status: "ACTIVE",
        });
        fetchVehicles();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create vehicle",
          variant: "destructive",
        });
      }
    } catch (error) {
        toast({
        title: "Error",
        description: "Failed to create vehicle",
        variant: "destructive",
      });
    }
  };

  // Edit a vehicle
  const handleEditVehicle = async () => {
    if (!selectedVehicle) return;
    try {
      const response = await apiFetch(`/api/vehicles/updateVehicle/${selectedVehicle.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...newVehicle, ownership_type: "OWN" }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Vehicle updated successfully",
        });
        setIsDialogOpen(false);
        setSelectedVehicle(null);
        setNewVehicle({
          vehicle_code: "",
          vehicle_number: "",
          vehicle_type: "VAN",
          driver_id: "",
          status: "ACTIVE",
        });
        fetchVehicles();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update vehicle",
          variant: "destructive",
        });
      }
    } catch (error) {
        toast({
        title: "Error",
        description: "Failed to update vehicle",
        variant: "destructive",
      });
    }
  };

  // Delete a vehicle
  const handleDelete = async () => {
    if (!selectedVehicle) return;
    try {
      const response = await apiFetch(`/api/vehicles/deleteVehicle/${selectedVehicle.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Vehicle deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setSelectedVehicle(null);
        fetchVehicles();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete vehicle",
          variant: "destructive",
        });
      }
    } catch (error) {
        toast({
        title: "Error",
        description: "Failed to delete vehicle",
        variant: "destructive",
      });
    }
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setNewVehicle({
      vehicle_code: vehicle.vehicle_code,
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      driver_id: vehicle.driver_id,
      status: vehicle.status,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };

  // Handle form submit
  const handleSubmit = () => {
    if (selectedVehicle) {
      handleEditVehicle();
    } else {
      handleAddVehicle();
    }
  };

  const toggleExpand = (id: number) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.vehicle_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.vehicle_number
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      vehicle.driver_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedDrivers = [...drivers].sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
  );

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case "BIKE":
        return <Bike className="w-4 h-4" />;
      case "TRUCK":
      case "VAN":
      default:
        return <Truck className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
          <p className="text-muted-foreground">
            Manage your fleet and assign drivers
          </p>
        </div>
        <Button onClick={() => { setIsDialogOpen(true); setSelectedVehicle(null); setNewVehicle({ vehicle_code: "", vehicle_number: "", vehicle_type: "VAN" as VehicleType, driver_id: "", status: "ACTIVE" as VehicleStatus }); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Vehicle Code</TableHead>
              <TableHead>Vehicle Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.map((vehicle) => {
              const items: VehicleInventoryItem[] = vehicleItems[vehicle.id] || [];
              const distinctItems = items.length;
              const totalUnits = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

              return (
                <>
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpand(vehicle.id)}
                        className="h-8 w-8"
                      >
                        {expanded.has(vehicle.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {vehicle.vehicle_code}
                    </TableCell>
                    <TableCell>{vehicle.vehicle_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getVehicleIcon(vehicle.vehicle_type)}
                        {vehicle.vehicle_type}
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.driver_name}</TableCell>
                    <TableCell>{vehicle.driver_phone}</TableCell>
                    <TableCell className="text-right">{distinctItems}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {totalUnits}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          vehicle.status === "ACTIVE" ? "default" : "secondary"
                        }
                      >
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(vehicle)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenDelete(vehicle)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expanded.has(vehicle.id) && (
                    <TableRow>
                      <TableCell colSpan={10} className="p-0">
                        <div className=" text-white">
                          {/* <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                            <Package className="w-4 h-4" />
                            Vehicle Stock
                          </div> */}
                          {items.length === 0 ? (
                            <div className="text-sm text-white">
                              No products loaded on this vehicle.
                            </div>
                          ) : (
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-[#454647] hover:bg-[#454647]">
                                    <TableHead className="w-[240px] text-white">Product</TableHead>
                                    <TableHead className="text-white">Code</TableHead>
                                    <TableHead className="text-white">Unit</TableHead>
                                    <TableHead className="text-right text-white">Quantity</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody className="bg-black">
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
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
            {filteredVehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No vehicles found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedVehicle ? "Edit Vehicle" : "Add New Vehicle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle_code">Vehicle Code *</Label>
              <Input
                id="vehicle_code"
                placeholder="e.g., VH-005"
                value={newVehicle.vehicle_code}
                onChange={(e) =>
                  setNewVehicle({ ...newVehicle, vehicle_code: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle_number">Vehicle Number</Label>
              <Input
                id="vehicle_number"
                placeholder="e.g., ABC-1234"
                value={newVehicle.vehicle_number}
                onChange={(e) =>
                  setNewVehicle({ ...newVehicle, vehicle_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type</Label>
              <Select
                value={newVehicle.vehicle_type}
                onValueChange={(value: VehicleType) =>
                  setNewVehicle({ ...newVehicle, vehicle_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VAN">Van</SelectItem>
                  <SelectItem value="BIKE">Bike</SelectItem>
                  <SelectItem value="TRUCK">Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver">Driver *</Label>
              <Popover open={driverOpen} onOpenChange={setDriverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={driverOpen}
                    className="w-full justify-between"
                  >
                    {newVehicle.driver_id
                      ? `${sortedDrivers.find((driver) => driver.id === newVehicle.driver_id)?.first_name} ${sortedDrivers.find((driver) => driver.id === newVehicle.driver_id)?.last_name} - ${sortedDrivers.find((driver) => driver.id === newVehicle.driver_id)?.phone}`
                      : "Select driver..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search driver..." />
                    <CommandEmpty>No driver found.</CommandEmpty>
                    <CommandGroup>
                      {sortedDrivers.map((driver) => (
                        <CommandItem
                          key={driver.id}
                          value={`${driver.first_name} ${driver.last_name} - ${driver.phone}`}
                          onSelect={() => {
                            setNewVehicle({ ...newVehicle, driver_id: driver.id });
                            setDriverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              newVehicle.driver_id === driver.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {`${driver.first_name} ${driver.last_name} - ${driver.phone}`}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newVehicle.status}
                onValueChange={(value: VehicleStatus) =>
                  setNewVehicle({ ...newVehicle, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {selectedVehicle ? "Update" : "Add"} Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete vehicle "
              {selectedVehicle?.vehicle_code}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vehicles;
