import { useState, useEffect } from "react";
import {
  Building,
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
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
import { apiFetch } from "@/lib/api";

const AgencyManagement = () => {
  const { toast } = useToast();
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [newAgency, setNewAgency] = useState({
    agency_name: "",
    registration_number: "",
    email: "",
    phone_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    district: "",
    postal_code: "",
    owner_name: "",
    status: "active",
    logo_url: "",
  });

  // Fetch agencies from API
  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/agencies/getAllAgencies');
      const data = await response.json();
      
      if (response.ok) {
        setAgencies(data.agencies || []);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch agencies",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch agencies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const filteredAgencies = agencies.filter((agency) => {
    const matchesSearch =
      agency.agency_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || agency.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Add agency
  const handleAddAgency = async () => {
    try {
      const response = await apiFetch('/api/agencies/createAgency', {
        method: 'POST',
        body: JSON.stringify(newAgency),
      });
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Agency created successfully",
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        });
        setIsAddDialogOpen(false);
        setNewAgency({
          agency_name: "",
          registration_number: "",
          email: "",
          phone_number: "",
          address_line1: "",
          address_line2: "",
          city: "",
          district: "",
          postal_code: "",
          owner_name: "",
          status: "active",
          logo_url: "",
        });
        fetchAgencies();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create agency",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create agency",
        variant: "destructive",
      });
    }
  };

  // Update agency
  const handleUpdateAgency = async () => {
    try {
      const response = await apiFetch(`/api/agencies/updateAgency/${editingAgency.id}`, {
        method: 'PUT',
        body: JSON.stringify(newAgency),
      });
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Agency updated successfully",
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        });
        setIsEditing(false);
        setEditingAgency(null);
        setNewAgency({
          agency_name: "",
          registration_number: "",
          email: "",
          phone_number: "",
          address_line1: "",
          address_line2: "",
          city: "",
          district: "",
          postal_code: "",
          owner_name: "",
          status: "active",
          logo_url: "",
        });
        fetchAgencies();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update agency",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update agency",
        variant: "destructive",
      });
    }
  };

  // Delete agency
  const handleDeleteAgency = async (agencyId) => {
    try {
      const response = await apiFetch(`/api/agencies/deleteAgency/${agencyId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Agency deleted successfully",
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        });
        fetchAgencies();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete agency",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agency",
        variant: "destructive",
      });
    }
  };

  // Update agency status
  const handleUpdateStatus = async (agencyId, status) => {
    try {
      const response = await apiFetch(`/api/agencies/updateAgencyStatus/${agencyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Status updated successfully",
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        });
        fetchAgencies();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (agency) => {
    setEditingAgency(agency);
    setNewAgency({
      agency_name: agency.agency_name,
      registration_number: agency.registration_number,
      email: agency.email,
      phone_number: agency.phone_number,
      address_line1: agency.address_line1,
      address_line2: agency.address_line2,
      city: agency.city,
      district: agency.district,
      postal_code: agency.postal_code,
      owner_name: agency.owner_name,
      status: agency.status,
      logo_url: agency.logo_url,
    });
    setIsEditing(true);
  };

  const stats = [
    { label: "Total Agencies", value: agencies.length, icon: Building, color: "text-primary" },
    { label: "Active", value: agencies.filter((a) => a.status === "active").length, icon: UserCheck, color: "text-success" },
    { label: "Inactive", value: agencies.filter((a) => a.status === "inactive").length, icon: UserX, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agency Management</h1>
          <p className="text-muted-foreground">Manage medical agencies and their information</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4" />
                Add Agency
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Agency</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Agency Name *</label>
                    <Input
                      placeholder="Enter agency name"
                      value={newAgency.agency_name}
                      onChange={(e) => setNewAgency({ ...newAgency, agency_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Registration Number *</label>
                    <Input
                      placeholder="Enter registration number"
                      value={newAgency.registration_number}
                      onChange={(e) => setNewAgency({ ...newAgency, registration_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newAgency.email}
                      onChange={(e) => setNewAgency({ ...newAgency, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number *</label>
                    <Input
                      placeholder="Enter phone number"
                      value={newAgency.phone_number}
                      onChange={(e) => setNewAgency({ ...newAgency, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address Line 1 *</label>
                    <Input
                      placeholder="Enter address line 1"
                      value={newAgency.address_line1}
                      onChange={(e) => setNewAgency({ ...newAgency, address_line1: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address Line 2</label>
                    <Input
                      placeholder="Enter address line 2"
                      value={newAgency.address_line2}
                      onChange={(e) => setNewAgency({ ...newAgency, address_line2: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City *</label>
                    <Input
                      placeholder="Enter city"
                      value={newAgency.city}
                      onChange={(e) => setNewAgency({ ...newAgency, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">District *</label>
                    <Input
                      placeholder="Enter district"
                      value={newAgency.district}
                      onChange={(e) => setNewAgency({ ...newAgency, district: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Postal Code *</label>
                    <Input
                      placeholder="Enter postal code"
                      value={newAgency.postal_code}
                      onChange={(e) => setNewAgency({ ...newAgency, postal_code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Owner Name *</label>
                    <Input
                      placeholder="Enter owner name"
                      value={newAgency.owner_name}
                      onChange={(e) => setNewAgency({ ...newAgency, owner_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={newAgency.status}
                      onValueChange={(value) => setNewAgency({ ...newAgency, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo URL</label>
                    <Input
                      placeholder="Enter logo URL"
                      value={newAgency.logo_url}
                      onChange={(e) => setNewAgency({ ...newAgency, logo_url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Button onClick={handleAddAgency} className="w-full">
                    Add Agency
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Agency</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Agency Name *</label>
                    <Input
                      placeholder="Enter agency name"
                      value={newAgency.agency_name}
                      onChange={(e) => setNewAgency({ ...newAgency, agency_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Registration Number *</label>
                    <Input
                      placeholder="Enter registration number"
                      value={newAgency.registration_number}
                      onChange={(e) => setNewAgency({ ...newAgency, registration_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newAgency.email}
                      onChange={(e) => setNewAgency({ ...newAgency, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number *</label>
                    <Input
                      placeholder="Enter phone number"
                      value={newAgency.phone_number}
                      onChange={(e) => setNewAgency({ ...newAgency, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address Line 1 *</label>
                    <Input
                      placeholder="Enter address line 1"
                      value={newAgency.address_line1}
                      onChange={(e) => setNewAgency({ ...newAgency, address_line1: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address Line 2</label>
                    <Input
                      placeholder="Enter address line 2"
                      value={newAgency.address_line2}
                      onChange={(e) => setNewAgency({ ...newAgency, address_line2: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City *</label>
                    <Input
                      placeholder="Enter city"
                      value={newAgency.city}
                      onChange={(e) => setNewAgency({ ...newAgency, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">District *</label>
                    <Input
                      placeholder="Enter district"
                      value={newAgency.district}
                      onChange={(e) => setNewAgency({ ...newAgency, district: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Postal Code *</label>
                    <Input
                      placeholder="Enter postal code"
                      value={newAgency.postal_code}
                      onChange={(e) => setNewAgency({ ...newAgency, postal_code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Owner Name *</label>
                    <Input
                      placeholder="Enter owner name"
                      value={newAgency.owner_name}
                      onChange={(e) => setNewAgency({ ...newAgency, owner_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={newAgency.status}
                      onValueChange={(value) => setNewAgency({ ...newAgency, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo URL</label>
                    <Input
                      placeholder="Enter logo URL"
                      value={newAgency.logo_url}
                      onChange={(e) => setNewAgency({ ...newAgency, logo_url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <Button onClick={handleUpdateAgency} className="flex-1">
                    Update Agency
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingAgency(null);
                      setNewAgency({
                        agency_name: "",
                        registration_number: "",
                        email: "",
                        phone_number: "",
                        address_line1: "",
                        address_line2: "",
                        city: "",
                        district: "",
                        postal_code: "",
                        owner_name: "",
                        status: "active",
                        logo_url: "",
                      });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
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
            placeholder="Search agencies..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agencies Table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading agencies...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Agency</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Registration</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Owner</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgencies.map((agency, index) => (
                    <tr
                      key={agency.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={agency.logo_url} />
                            <AvatarFallback>{agency.agency_name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{agency.agency_name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {agency.city}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3.5 h-3.5" />
                            {agency.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            {agency.phone_number}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium text-foreground">{agency.registration_number}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-sm text-foreground">{agency.owner_name}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            agency.status === "active"
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {agency.status === "active" ? "Active" : "Inactive"}
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
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => openEditDialog(agency)}
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => handleUpdateStatus(agency.id, agency.status === 'active' ? 'inactive' : 'active')}
                            >
                              {agency.status === 'active' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => handleDeleteAgency(agency.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredAgencies.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No agencies found
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AgencyManagement;