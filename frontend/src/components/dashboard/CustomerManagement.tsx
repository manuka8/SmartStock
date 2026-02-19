import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  MapPin,
  DollarSign,
  Edit,
  Trash2,
  UserPlus,
  UserCheck,
  UserX,
  Eye,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";

interface Customer {
  id: number;
  customer_code: string;
  customer_type: string;
  first_name: string;
  last_name: string;
  business_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  district: string;
  postal_code: string;
  tax_number?: string;
  credit_limit: number;
  outstanding_balance: number;
  credit_days: number;
  loyalty_points: number;
  total_purchases: number;
  status: string;
  notes?: string;
  created_at: string;
}

const customerTypes = [
  "REGISTERED",
  "WHOLESALE",
  "VIP",
] as const;
const customerStatuses = [
  "ACTIVE",
  "INACTIVE",
  "PENDING",
  "SUSPENDED",
] as const;

const CustomerManagement = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const [newCustomer, setNewCustomer] = useState({
    customer_code: "",
    customer_type: "REGISTERED",
    first_name: "",
    last_name: "",
    business_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    district: "",
    postal_code: "",
    tax_number: "",
    credit_limit: 0,
    credit_days: 0,
    loyalty_points: 0,
    total_purchases: 0,
    status: "ACTIVE",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    customer_code: "",
    customer_type: "",
    first_name: "",
    last_name: "",
    business_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    district: "",
    postal_code: "",
    tax_number: "",
    credit_limit: 0,
    outstanding_balance: 0,
    credit_days: 0,
    loyalty_points: 0,
    total_purchases: 0,
    status: "",
    notes: "",
  });

  const fetchCustomers = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/customers/getAllCustomers");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch customers");
      }
      setCustomers(data.customers || []);
    } catch (error) {
      toast({
        title: "Error loading customers",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const fullName = `${customer.first_name} ${customer.last_name}`.trim();
    const matchesSearch =
      customer.business_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customer_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === "all" || customer.customer_type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateCustomer = async (): Promise<void> => {
    try {
      setCreating(true);

      if (
        !newCustomer.first_name ||
        !newCustomer.last_name ||
        !newCustomer.email ||
        !newCustomer.phone ||
        !newCustomer.address_line1 ||
        !newCustomer.city ||
        !newCustomer.district ||
        !newCustomer.postal_code ||
        !newCustomer.customer_type
      ) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        ...newCustomer,
        credit_limit: Number(newCustomer.credit_limit),
        credit_days: Number(newCustomer.credit_days),
        loyalty_points: Number(newCustomer.loyalty_points),
        total_purchases: Number(newCustomer.total_purchases),
      };

      const response = await apiFetch("/api/customers/addCustomer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create customer");
      }

      toast({
        title: "Customer created",
        description: "The customer has been created successfully.",
      });

      setIsAddDialogOpen(false);
      setNewCustomer({
        customer_code: "",
        customer_type: "REGISTERED",
        first_name: "",
        last_name: "",
        business_name: "",
        email: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        district: "",
        postal_code: "",
        tax_number: "",
        credit_limit: 0,
        outstanding_balance: 0,
        credit_days: 0,
        loyalty_points: 0,
        total_purchases: 0,
        status: "ACTIVE",
        notes: "",
      });

      await fetchCustomers();
    } catch (error) {
      toast({
        title: "Error creating customer",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCustomer = async (): Promise<void> => {
    if (!editingCustomer) return;

    try {
      setUpdatingId(editingCustomer.id);
      const { outstanding_balance, ...formData } = editForm;
      const payload = {
        ...formData,
        credit_limit: Number(editForm.credit_limit),
        outstanding_balance: Number(editForm.outstanding_balance),
        credit_days: Number(editForm.credit_days),
        loyalty_points: Number(editForm.loyalty_points),
        total_purchases: Number(editForm.total_purchases),
      };

      const response = await apiFetch(
        `/api/customers/updateCustomer/${editingCustomer.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update customer");
      }

      toast({
        title: "Customer updated",
        description: "Customer details have been updated successfully.",
      });

      setIsEditDialogOpen(false);
      setEditingCustomer(null);
      setEditForm({
        customer_code: "",
        customer_type: "",
        first_name: "",
        last_name: "",
        business_name: "",
        email: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        district: "",
        postal_code: "",
        tax_number: "",
        credit_limit: 0,
        credit_days: 0,
        loyalty_points: 0,
        total_purchases: 0,
        status: "",
        notes: "",
      });

      await fetchCustomers();
    } catch (error) {
      toast({
        title: "Error updating customer",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteCustomer = async (customer: Customer): Promise<void> => {
    try {
      const fullName = `${customer.first_name} ${customer.last_name}`.trim();
      if (!window.confirm(`Delete customer ${fullName}?`)) return;
      setDeletingId(customer.id);
      const response = await apiFetch(
        `/api/customers/deleteCustomer/${customer.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete customer");
      }
      toast({
        title: "Customer deleted",
        description: "The customer has been removed.",
      });
      await fetchCustomers();
    } catch (error) {
      toast({
        title: "Error deleting customer",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      customer_code: customer.customer_code,
      customer_type: customer.customer_type,
      first_name: customer.first_name,
      last_name: customer.last_name,
      business_name: customer.business_name,
      email: customer.email,
      phone: customer.phone,
      address_line1: customer.address_line1,
      address_line2: customer.address_line2 || "",
      city: customer.city,
      district: customer.district,
      postal_code: customer.postal_code,
      tax_number: customer.tax_number || "",
      credit_limit: customer.credit_limit,
      outstanding_balance: customer.outstanding_balance,
      credit_days: customer.credit_days,
      loyalty_points: customer.loyalty_points,
      total_purchases: customer.total_purchases,
      status: customer.status,
      notes: customer.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (customer: Customer) => {
    setViewingCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("en-US").format(amount);
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case "VIP":
        return "bg-purple-100 text-purple-800";
      case "Corporate":
        return "bg-blue-100 text-blue-800";
      case "WHOLESALE":
        return "bg-green-100 text-green-800";
      case "REGISTERED":
      default:
        return "bg-orange-100 text-orange-800";
    }
  };

  const getCustomerStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Suspended":
        return "bg-red-100 text-red-800";
      case "Inactive":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = [
    {
      label: "Total Customers",
      value: customers.length,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Active",
      value: customers.filter((c) => c.status === "ACTIVE").length,
      icon: UserCheck,
      color: "text-success",
    },
    {
      label: "Credit Limit",
      value: customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0),
      icon: CreditCard,
      color: "text-warning",
      format: "currency",
    },
    {
      label: "Outstanding",
      value: customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0),
      icon: DollarSign,
      color: "text-destructive",
      format: "currency",
    },
    {
      label: "Total Purchases",
      value: customers.reduce((sum, c) => sum + (c.total_purchases || 0), 0),
      icon: DollarSign,
      color: "text-purple",
      format: "currency",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Customer Management
          </h1>
          <p className="text-muted-foreground">
            Manage your customers, track credit limits, and monitor outstanding
            balances
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4 px-4 overflow-y-scroll max-h-[80vh]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_code">Customer Code</Label>
                  <Input
                    id="customer_code"
                    placeholder="Enter customer code (optional)"
                    value={newCustomer.customer_code}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        customer_code: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    placeholder="Enter first name"
                    value={newCustomer.first_name}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    placeholder="Enter last name"
                    value={newCustomer.last_name}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  placeholder="Enter business name (optional)"
                  value={newCustomer.business_name}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      business_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line1">
                  Address Line 1 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address_line1"
                  placeholder="Enter address line 1"
                  value={newCustomer.address_line1}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      address_line1: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  placeholder="Enter address line 2 (optional)"
                  value={newCustomer.address_line2}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      address_line2: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={newCustomer.city}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">
                    District <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="district"
                    placeholder="Enter district"
                    value={newCustomer.district}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        district: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">
                    Postal Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="postal_code"
                    placeholder="Enter postal code"
                    value={newCustomer.postal_code}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        postal_code: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_number">Tax Number</Label>
                  <Input
                    id="tax_number"
                    placeholder="Enter tax number (optional)"
                    value={newCustomer.tax_number}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        tax_number: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_type">
                    Customer Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newCustomer.customer_type}
                    onValueChange={(value) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        customer_type: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credit_limit">
                    Credit Limit <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    placeholder="0.00"
                    value={newCustomer.credit_limit}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        credit_limit: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outstanding_balance">Outstanding Balance</Label>
                  <Input
                    id="outstanding_balance"
                    type="number"
                    placeholder="0.00"
                    value={newCustomer.outstanding_balance}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        outstanding_balance: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_days">Credit Days</Label>
                  <Input
                    id="credit_days"
                    type="number"
                    placeholder="0"
                    value={newCustomer.credit_days}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        credit_days: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newCustomer.status}
                    onValueChange={(value) =>
                      setNewCustomer((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loyalty_points">Loyalty Points</Label>
                  <Input
                    id="loyalty_points"
                    type="number"
                    placeholder="0"
                    value={newCustomer.loyalty_points}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        loyalty_points: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_purchases">Total Purchases</Label>
                  <Input
                    id="total_purchases"
                    type="number"
                    placeholder="0.00"
                    value={newCustomer.total_purchases}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        total_purchases: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this customer"
                  value={newCustomer.notes}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={handleCreateCustomer} disabled={creating}>
                  {creating ? "Creating..." : "Create Customer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4 px-4 overflow-y-scroll max-h-[80vh]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_customer_code">Customer Code</Label>
                  <Input
                    id="edit_customer_code"
                    placeholder="Enter customer code"
                    value={editForm.customer_code}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        customer_code: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_first_name"
                    placeholder="Enter first name"
                    value={editForm.first_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_last_name"
                    placeholder="Enter last name"
                    value={editForm.last_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_business_name">Business Name</Label>
                <Input
                  id="edit_business_name"
                  placeholder="Enter business name"
                  value={editForm.business_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      business_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_email"
                    type="email"
                    placeholder="Enter email address"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_phone">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_phone"
                    placeholder="Enter phone number"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_address_line1">
                  Address Line 1 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_address_line1"
                  placeholder="Enter address line 1"
                  value={editForm.address_line1}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      address_line1: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_address_line2">Address Line 2</Label>
                <Input
                  id="edit_address_line2"
                  placeholder="Enter address line 2"
                  value={editForm.address_line2}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      address_line2: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_city"
                    placeholder="Enter city"
                    value={editForm.city}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_district">
                    District <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_district"
                    placeholder="Enter district"
                    value={editForm.district}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        district: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_postal_code">
                    Postal Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_postal_code"
                    placeholder="Enter postal code"
                    value={editForm.postal_code}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        postal_code: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_tax_number">Tax Number</Label>
                  <Input
                    id="edit_tax_number"
                    placeholder="Enter tax number"
                    value={editForm.tax_number}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        tax_number: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_customer_type">
                    Customer Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={editForm.customer_type}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, customer_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_credit_limit">
                    Credit Limit <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_credit_limit"
                    type="number"
                    placeholder="0.00"
                    value={editForm.credit_limit}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        credit_limit: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_outstanding_balance">Outstanding Balance</Label>
                  <Input
                    id="edit_outstanding_balance"
                    type="number"
                    placeholder="0.00"
                    value={editForm.outstanding_balance}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        outstanding_balance: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_credit_days">Credit Days</Label>
                  <Input
                    id="edit_credit_days"
                    type="number"
                    placeholder="0"
                    value={editForm.credit_days}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        credit_days: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status">
                    Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_loyalty_points">Loyalty Points</Label>
                  <Input
                    id="edit_loyalty_points"
                    type="number"
                    placeholder="0"
                    value={editForm.loyalty_points}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        loyalty_points: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_total_purchases">Total Purchases</Label>
                  <Input
                    id="edit_total_purchases"
                    type="number"
                    placeholder="0.00"
                    value={editForm.total_purchases}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        total_purchases: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  placeholder="Additional notes about this customer"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={handleUpdateCustomer}
                  disabled={creating || !editingCustomer}
                >
                  {creating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Customer Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {viewingCustomer && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={undefined} />
                      <AvatarFallback>
                        {`${viewingCustomer.first_name?.[0] || ""}${
                          viewingCustomer.last_name?.[0] || ""
                        }`
                          .trim()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {viewingCustomer.first_name} {viewingCustomer.last_name}
                      </h3>
                      {viewingCustomer.business_name && (
                        <p className="text-muted-foreground">
                          {viewingCustomer.business_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Email
                      </Label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{viewingCustomer.email}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Phone
                      </Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{viewingCustomer.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Address
                    </Label>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{viewingCustomer.address_line1}</p>
                        {viewingCustomer.address_line2 && (
                          <p>{viewingCustomer.address_line2}</p>
                        )}
                        <p>
                          {viewingCustomer.city}, {viewingCustomer.district}{" "}
                          {viewingCustomer.postal_code}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Customer Type
                      </Label>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCustomerTypeColor(
                          viewingCustomer.customer_type
                        )}`}
                      >
                        <Building2 className="w-3 h-3 mr-2" />
                        {viewingCustomer.customer_type}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Status
                      </Label>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCustomerStatusColor(
                          viewingCustomer.status
                        )}`}
                      >
                        {viewingCustomer.status === "ACTIVE" ? (
                          <UserCheck className="w-3 h-3 mr-2" />
                        ) : (
                          <UserX className="w-3 h-3 mr-2" />
                        )}
                        {viewingCustomer.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Credit Limit
                      </Label>
                      <div className="text-lg font-semibold">
                        {formatCurrency(viewingCustomer.credit_limit)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Outstanding Balance
                      </Label>
                      <div
                        className={`text-lg font-semibold ${
                          viewingCustomer.outstanding_balance > 0
                            ? "text-destructive"
                            : "text-success"
                        }`}
                      >
                        {formatCurrency(viewingCustomer.outstanding_balance)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Loyalty Points
                      </Label>
                      <div className="text-lg font-semibold">
                        {formatNumber(viewingCustomer.loyalty_points)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Total Purchases
                      </Label>
                      <div className="text-lg font-semibold">
                        {formatCurrency(viewingCustomer.total_purchases)}
                      </div>
                    </div>
                  </div>

                  {viewingCustomer.notes && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Notes
                      </Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{viewingCustomer.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Customer Code:</span>{" "}
                      {viewingCustomer.customer_code}
                    </div>
                    <div>
                      <span className="font-medium">Credit Days:</span>{" "}
                      {viewingCustomer.credit_days}
                    </div>
                    {viewingCustomer.tax_number && (
                      <div>
                        <span className="font-medium">Tax Number:</span>{" "}
                        {viewingCustomer.tax_number}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(
                        viewingCustomer.created_at
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
                  {stat.format === "currency"
                    ? formatCurrency(stat.value as number)
                    : stat.format === "number"
                    ? formatNumber(stat.value as number)
                    : stat.value}
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
            placeholder="Search customers by name, contact, email, or phone..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {customerTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {customerStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Customers Table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Contact
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                  Credit
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Balance
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Purchases
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Loyalty Points
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Notes
                </th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-sm text-muted-foreground"
                  >
                    Loading customers...
                  </td>
                </tr>
              )}
              {!loading && filteredCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-sm text-muted-foreground"
                  >
                    No customers found.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={undefined} />
                          <AvatarFallback>
                            {`${customer.first_name?.[0] || ""}${
                              customer.last_name?.[0] || ""
                            }`
                              .trim()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {customer.first_name} {customer.last_name}
                          </p>
                          {customer.business_name && (
                            <p className="text-xs text-muted-foreground">
                              {customer.business_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getCustomerTypeColor(
                          customer.customer_type
                        )}`}
                      >
                        <Building2 className="w-3 h-3" />
                        {customer.customer_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getCustomerStatusColor(
                          customer.status
                        )}`}
                      >
                        {customer.status === "Active" ? (
                          <UserCheck className="w-3 h-3" />
                        ) : (
                          <UserX className="w-3 h-3" />
                        )}
                        {customer.status}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="text-sm font-medium text-foreground">
                        {formatCurrency(customer.credit_limit)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div
                        className={`text-sm font-medium ${
                          customer.outstanding_balance > 0
                            ? "text-destructive"
                            : "text-success"
                        }`}
                      >
                        {formatCurrency(customer.outstanding_balance)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div
                        className={`text-sm font-medium ${
                          customer.total_purchases > 0
                            ? "text-destructive"
                            : "text-success"
                        }`}
                      >
                        {formatCurrency(customer.total_purchases)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div
                        className={`text-sm font-medium ${
                          customer.loyalty_points > 0
                            ? "text-destructive"
                            : "text-success"
                        }`}
                      >
                        {formatCurrency(customer.loyalty_points)}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {/* <Phone className="w-3.5 h-3.5" /> */}
                          {customer.notes}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => openViewDialog(customer)}
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-destructive"
                            onClick={() => handleDeleteCustomer(customer)}
                            disabled={deletingId === customer.id}
                          >
                            <Trash2 className="w-4 h-4" />
                            {deletingId === customer.id
                              ? "Removing..."
                              : "Remove"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
