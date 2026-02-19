import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Phone, Mail, MapPin, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import SupplierDetails from "@/components/dashboard/SupplierDetails";

interface Supplier {
  id: number;
  supplier_code?: string;
  supplier_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  tax_number?: string;
  status?: string;
}

export default function Suppliers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    supplier_code: "",
    supplier_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    district: "",
    postal_code: "",
    tax_number: "",
    status: "ACTIVE",
  });

  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch("/api/suppliers/getAllSuppliers", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch suppliers");
      }

      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load suppliers",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.supplier_name.trim()) {
        throw new Error("Supplier name is required");
      }

      const payload = {
        supplier_code: formData.supplier_code.trim() || null,
        supplier_name: formData.supplier_name.trim(),
        contact_person: formData.contact_person.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address_line1: formData.address_line1.trim() || null,
        address_line2: formData.address_line2.trim() || null,
        city: formData.city.trim() || null,
        district: formData.district.trim() || null,
        postal_code: formData.postal_code.trim() || null,
        tax_number: formData.tax_number.trim() || null,
        status: formData.status,
      };

      const url = editingId
        ? `/api/suppliers/updateSupplier/${editingId}`
        : "/api/suppliers/addSupplier";
      const method = editingId ? "PUT" : "POST";

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${editingId ? 'update' : 'add'} supplier`);
      }

      toast({
        title: "Success",
        description: `Supplier ${editingId ? 'updated' : 'added'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingId(null);
      setFormData({
        supplier_code: "",
        supplier_name: "",
        contact_person: "",
        email: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        district: "",
        postal_code: "",
        tax_number: "",
        status: "ACTIVE",
      });

      await fetchSuppliers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add supplier",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setFormData({
      supplier_code: supplier.supplier_code || "",
      supplier_name: supplier.supplier_name,
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address_line1: supplier.address_line1 || "",
      address_line2: supplier.address_line2 || "",
      city: supplier.city || "",
      district: supplier.district || "",
      postal_code: supplier.postal_code || "",
      tax_number: supplier.tax_number || "",
      status: supplier.status || "ACTIVE",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const response = await apiFetch(`/api/suppliers/deleteSupplier/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete supplier");
      }

      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });

      await fetchSuppliers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete supplier",
      });
    } finally {
      setIsDeleting(null);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground">Manage your supplier relationships</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setFormData({
                supplier_code: "",
                supplier_name: "",
                contact_person: "",
                email: "",
                phone: "",
                address_line1: "",
                address_line2: "",
                city: "",
                district: "",
                postal_code: "",
                tax_number: "",
                status: "ACTIVE",
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_code">Supplier Code</Label>
                  <Input
                    id="supplier_code"
                    placeholder="SUP001"
                    value={formData.supplier_code}
                    onChange={(e) => handleInputChange("supplier_code", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_name">Supplier Name *</Label>
                  <Input
                    id="supplier_name"
                    placeholder="Supplier name"
                    value={formData.supplier_name}
                    onChange={(e) => handleInputChange("supplier_name", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    placeholder="Contact person name"
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange("contact_person", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="supplier@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_number">Tax Number</Label>
                  <Input
                    id="tax_number"
                    placeholder="Tax registration number"
                    value={formData.tax_number}
                    onChange={(e) => handleInputChange("tax_number", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  placeholder="Street address"
                  value={formData.address_line1}
                  onChange={(e) => handleInputChange("address_line1", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  placeholder="Apartment, suite, etc."
                  value={formData.address_line2}
                  onChange={(e) => handleInputChange("address_line2", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    placeholder="District/State"
                    value={formData.district}
                    onChange={(e) => handleInputChange("district", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    placeholder="12345"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange("postal_code", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
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

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? (editingId ? "Updating..." : "Adding...")
                    : (editingId ? "Update Supplier" : "Add Supplier")
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Supplier Details View */}
      {selectedSupplierId && (
        <SupplierDetails 
          supplierId={selectedSupplierId} 
          onBack={() => setSelectedSupplierId(null)} 
        />
      )}

      {/* Suppliers Grid */}
      {!selectedSupplierId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Loading suppliers...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No suppliers found. Add your first supplier to get started.
            </div>
          ) : (
            filteredSuppliers.map((supplier) => {
              return (
                <div key={supplier.id} className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{supplier.supplier_name}</h3>
                      <p className="text-sm text-muted-foreground">{supplier.contact_person || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={(supplier.status === "ACTIVE" || supplier.status === "Active") ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}
                      >
                        {supplier.status || 'ACTIVE'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(supplier)}
                            className="gap-2 cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(supplier.id)}
                            className="gap-2 text-destructive cursor-pointer"
                            disabled={isDeleting === supplier.id}
                          >
                            <Trash2 className="w-4 h-4" />
                            {isDeleting === supplier.id ? "Deleting..." : "Remove"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{supplier.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{supplier.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{`${supplier.city || ''} ${supplier.district || ''}`.trim() || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">0 products</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSupplierId(supplier.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
