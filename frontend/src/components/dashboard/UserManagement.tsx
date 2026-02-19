import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Trash2,
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
import { apiFetch } from "@/lib/api";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone?: string;
  agency_id?: number | null;
  store_name?: string | null;
  is_active: boolean;
  created_at?: string;
  agency_name?: string;
}

interface Agency {
  id: number;
  agency_name: string;
}

const roles = ["super_admin", "owner", "employee"] as const;

const UserManagement = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    agency_id: "",
    store_name: "",
    is_active: true,
  });
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    store_name: "",
    agency_id: "",
    is_active: true,
  });

  const fetchUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/auth/users");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }
      setUsers(data.users || []);
    } catch (error) {
      toast({
        title: "Error loading users",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await apiFetch("/api/agencies/getAllAgencies");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch agencies");
      }
      setAgencies(data.agencies || []);
    } catch (error) {
      // Agencies are optional for this view
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAgencies();
  }, []);

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const matchesSearch =
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async (): Promise<void> => {
    try {
      setCreating(true);

      if (
        !newUser.first_name ||
        !newUser.last_name ||
        !newUser.email ||
        !newUser.password ||
        !newUser.role
      ) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        username: newUser.username || newUser.email.split("@")[0],
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        phone: newUser.phone || undefined,
        // Extra fields (store_name, agency_id, is_active) are safe to send;
        // backend will ignore unknown ones for now.
        store_name: newUser.store_name || undefined,
        agency_id: newUser.agency_id || undefined,
        is_active: newUser.is_active,
      };

      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      toast({
        title: "User created",
        description: "The user account has been created successfully.",
      });

      setIsAddDialogOpen(false);
      setNewUser({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        phone: "",
        role: "",
        password: "",
        store_name: "",
        agency_id: "",
        is_active: true,
      });

      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error creating user",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user: User): Promise<void> => {
    try {
      setTogglingId(user.id);
      const response = await apiFetch(`/api/auth/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update user");
      }
      toast({
        title: "User updated",
        description: `User has been ${!user.is_active ? "activated" : "deactivated"}.`,
      });
      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error updating user",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteUser = async (user: User): Promise<void> => {
    try {
      if (!window.confirm(`Delete user ${user.username || user.email}?`)) return;
      setDeletingId(user.id);
      const response = await apiFetch(`/api/auth/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }
      toast({
        title: "User deleted",
        description: "The user account has been removed.",
      });
      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error deleting user",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "",
      password: "",
      agency_id: user.agency_id ? String(user.agency_id) : "",
      store_name: user.store_name || "",
      is_active: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (): Promise<void> => {
    if (!editingUser) return;

    try {
      setCreating(true);
      const payload: {
        first_name: string;
        last_name: string;
        username?: string;
        role?: string;
        store_name?: string;
        email: string;
        phone: string;
        agency_id?: string;
        is_active: boolean;
        password?: string;
      } = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        username: editForm.username || undefined,
        role: editForm.role || undefined,
        store_name: editForm.store_name || undefined,
        email: editForm.email,
        phone: editForm.phone,
        agency_id: editForm.agency_id || undefined,
        is_active: editForm.is_active,
      };

      // Only send password if actually changed
      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }

      const response = await apiFetch(`/api/auth/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      toast({
        title: "User updated",
        description: "User details have been updated successfully.",
      });

      setIsEditDialogOpen(false);
      setEditingUser(null);
      setEditForm({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        phone: "",
        role: "",
        password: "",
        agency_id: "",
        store_name: "",
        is_active: true,
      });

      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error updating user",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "text-primary" },
    { label: "Active", value: users.filter((m) => m.is_active).length, icon: UserCheck, color: "text-success" },
    { label: "Inactive", value: users.filter((m) => !m.is_active).length, icon: UserX, color: "text-muted-foreground" },
    { label: "Admins", value: users.filter((m) => m.role === "super_admin").length, icon: Shield, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">
            Create user accounts and assign them to agencies
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Enter first name"
                    value={newUser.first_name}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, first_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Enter last name"
                    value={newUser.last_name}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, last_name: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  placeholder="Enter username (optional)"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, username: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    placeholder="Enter phone number"
                    value={newUser.phone}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Password <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Role <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role === "super_admin" ? "Super Admin" : role === "owner" ? "Owner" : "Employee"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Name</label>
                  <Input
                    placeholder="e.g., Cardiology"
                    value={newUser.store_name}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        store_name: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Not required for employees
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Agency <span className="text-destructive">*</span>
                </label>
                <Select
                  value={newUser.agency_id}
                  onValueChange={(value) =>
                    setNewUser((prev) => ({ ...prev, agency_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agency..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={String(agency.id)}>
                        {agency.agency_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Active Account</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive users cannot log in
                  </p>
                </div>
                <Switch
                  checked={newUser.is_active}
                  onCheckedChange={(checked) =>
                    setNewUser((prev) => ({ ...prev, is_active: checked }))
                  }
                />
              </div>

              <Button
                onClick={handleCreateUser}
                className="w-full"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Enter first name"
                    value={editForm.first_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, first_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Enter last name"
                    value={editForm.last_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, last_name: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  placeholder="Enter username (optional)"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    placeholder="Enter phone number"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Role <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role === "super_admin"
                            ? "Super Admin"
                            : role === "owner"
                            ? "Owner"
                            : "Employee"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Name</label>
                  <Input
                    placeholder="e.g., Cardiology"
                    value={editForm.store_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        store_name: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Not required for employees
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Agency</label>
                <Select
                  value={editForm.agency_id}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, agency_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agency..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={String(agency.id)}>
                        {agency.agency_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Active Account</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive users cannot log in
                  </p>
                </div>
                <Switch
                  checked={editForm.is_active}
                  onCheckedChange={(checked) =>
                    setEditForm((prev) => ({ ...prev, is_active: checked }))
                  }
                />
              </div>

              <Button
                onClick={handleUpdateUser}
                className="w-full"
                disabled={creating || !editingUser}
              >
                {creating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
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
            placeholder="Search team members..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  User
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Contact
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Role
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                  Agency
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
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-sm text-muted-foreground"
                  >
                    Loading users...
                  </td>
                </tr>
              )}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-sm text-muted-foreground"
                  >
                    No users found.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={undefined} />
                        <AvatarFallback>
                          {`${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}` ||
                            user.username?.[0] ||
                            user.email?.[0] ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {user.phone || "-"}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      <Shield className="w-3 h-3" />
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className="text-sm text-foreground">
                      {user.agency_name || "—"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
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
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => handleToggleActive(user)}
                          disabled={togglingId === user.id}
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive"
                          onClick={() => handleDeleteUser(user)}
                          disabled={deletingId === user.id}
                        >
                          <Trash2 className="w-4 h-4" />
                          {deletingId === user.id ? "Removing..." : "Remove"}
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

export default UserManagement;