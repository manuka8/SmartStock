import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
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
import { toast } from "sonner";

type EmployeeStatus = "ACTIVE" | "INACTIVE";
type EmployeeType =
  | "STAFF" // Default / general worker
  | "STORE_MANAGER"
  | "ASSISTANT_MANAGER"
  | "CASHIER"
  | "SALES_ASSISTANT"
  | "INVENTORY_OFFICER"
  | "WAREHOUSE_STAFF"
  | "PURCHASING_OFFICER"
  | "DRIVER"
  | "DRIVER_HELPER"
  | "ACCOUNTANT"
  | "CLEANER"
  | "SECURITY"
  | "IT_OPERATOR";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  employee_type: EmployeeType;
  license_number: string;
  phone: string;
  status: EmployeeStatus;
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [formData, setFormData] = useState({
    employee_code: "",
    first_name: "",
    last_name: "",
    employee_type: "STAFF" as EmployeeType,
    license_number: "",
    phone: "",
    status: "ACTIVE" as EmployeeStatus,
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/employees/getAllEmployees");
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
      } else {
        toast.error("Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Error fetching employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.employee_code
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      `${employee.first_name} ${employee.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      employee.phone.includes(searchQuery)
  );

  const handleOpenAdd = () => {
    setSelectedEmployee(null);
    setFormData({
      employee_code: "",
      first_name: "",
      last_name: "",
      employee_type: "STAFF",
      license_number: "",
      phone: "",
      status: "ACTIVE",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      employee_code: employee.employee_code,
      first_name: employee.first_name,
      last_name: employee.last_name,
      employee_type: employee.employee_type,
      license_number: employee.license_number,
      phone: employee.phone,
      status: employee.status,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !formData.employee_code ||
      !formData.first_name ||
      !formData.last_name ||
      !formData.employee_type ||
      !formData.phone
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (selectedEmployee) {
        const response = await apiFetch(
          `/api/employees/updateEmployee/${selectedEmployee.id}`,
          {
            method: "PUT",
            body: JSON.stringify(formData),
          }
        );
        const data = await response.json();
        if (data.success) {
          toast.success("Employee updated successfully");
          fetchEmployees();
        } else {
          toast.error("Failed to update employee");
        }
      } else {
        const response = await apiFetch("/api/employees/createEmployee", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (data.success) {
          toast.success("Employee added successfully");
          fetchEmployees();
        } else {
          toast.error("Failed to add employee");
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting employee:", error);
      toast.error("Error submitting employee");
    }
  };

  const handleDelete = async () => {
    if (selectedEmployee) {
      try {
        const response = await apiFetch(
          `/api/employees/deleteEmployee/${selectedEmployee.id}`,
          {
            method: "DELETE",
          }
        );
        const data = await response.json();
        if (data.success) {
          toast.success("Employee deleted successfully");
          fetchEmployees();
        } else {
          toast.error("Failed to delete employee");
        }
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast.error("Error deleting employee");
      }
    }
    setIsDeleteDialogOpen(false);
  };

  const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default">Active</Badge>;
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (employee_type: EmployeeType) => {
  switch (employee_type) {
    case "STAFF":
      return <Badge variant="default">Staff</Badge>;

    case "STORE_MANAGER":
      return <Badge variant="secondary">Store Manager</Badge>;

    case "ASSISTANT_MANAGER":
      return <Badge variant="secondary">Assistant Manager</Badge>;

    case "CASHIER":
      return <Badge variant="outline">Cashier</Badge>;

    case "SALES_ASSISTANT":
      return <Badge variant="outline">Sales Assistant</Badge>;

    case "INVENTORY_OFFICER":
      return <Badge variant="outline">Inventory Officer</Badge>;

    case "WAREHOUSE_STAFF":
      return <Badge variant="outline">Warehouse Staff</Badge>;

    case "PURCHASING_OFFICER":
      return <Badge variant="secondary">Purchasing Officer</Badge>;

    case "DRIVER":
      return <Badge variant="destructive">Driver</Badge>;

    case "DRIVER_HELPER":
      return <Badge variant="destructive">Driver Helper</Badge>;

    case "ACCOUNTANT":
      return <Badge variant="secondary">Accountant</Badge>;

    case "CLEANER":
      return <Badge variant="outline">Cleaner</Badge>;

    case "SECURITY":
      return <Badge variant="outline">Security</Badge>;

    case "IT_OPERATOR":
      return <Badge variant="secondary">IT Operator</Badge>;

    default:
      return <Badge variant="secondary">{employee_type}</Badge>;
  }
};


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground">
            Manage Employee information and licenses
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Employees..."
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
              <TableHead>Employee Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Employee Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">
                  {employee.employee_code}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{`${employee.first_name} ${employee.last_name}`}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getTypeBadge(employee.employee_type)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Phone className="w-3 h-3" />
                    {employee.phone}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{employee.license_number}</span>
                </TableCell>
                <TableCell>{getStatusBadge(employee.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleOpenEdit(employee)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenDelete(employee)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredEmployees.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No Employees found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_code">Employee Code *</Label>
                <Input
                  id="employee_code"
                  placeholder="e.g., EMP-001"
                  value={formData.employee_code}
                  onChange={(e) =>
                    setFormData({ ...formData, employee_code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  placeholder="e.g., John"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  placeholder="e.g., Doe"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_type">Employee Type</Label>
                <Select
                  value={formData.employee_type}
                  onValueChange={(value: EmployeeType) =>
                    setFormData({ ...formData, employee_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="STORE_MANAGER">Store Manager</SelectItem>
                    <SelectItem value="ASSISTANT_MANAGER">
                      Assistant Manager
                    </SelectItem>
                    <SelectItem value="CASHIER">Cashier</SelectItem>
                    <SelectItem value="SALES_ASSISTANT">
                      Sales Assistant
                    </SelectItem>
                    <SelectItem value="INVENTORY_OFFICER">
                      Inventory Officer
                    </SelectItem>
                    <SelectItem value="WAREHOUSE_STAFF">
                      Warehouse Staff
                    </SelectItem>
                    <SelectItem value="PURCHASING_OFFICER">
                      Purchasing Officer
                    </SelectItem>
                    <SelectItem value="DRIVER">Driver</SelectItem>
                    <SelectItem value="DRIVER_HELPER">Driver Helper</SelectItem>
                    <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                    <SelectItem value="CLEANER">Cleaner</SelectItem>
                    <SelectItem value="SECURITY">Security</SelectItem>
                    <SelectItem value="IT_OPERATOR">IT Operator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="e.g., +1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_number">ID Number</Label>
                <Input
                  id="license_number"
                  placeholder="e.g., DL-12345678"
                  value={formData.license_number}
                  onChange={(e) =>
                    setFormData({ ...formData, license_number: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: EmployeeStatus) =>
                    setFormData({ ...formData, status: value })
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {selectedEmployee ? "Update" : "Add"} Employee
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
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete employee "
              {selectedEmployee
                ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                : ""}
              "? This action cannot be undone.
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

export default Employees;
