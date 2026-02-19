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

interface TeamUser {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone?: string;
  store_name?: string | null;
  is_active: boolean;
  created_at?: string;
  center_name?: string;
}

const teamRoles = ["owner", "employee"] as const;

const TeamManagement = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [team, setTeam] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newMember, setNewMember] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    role: "employee",
    password: "",
    is_active: true,
  });

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/auth/team");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch team members");
      }
      setTeam(data.teamMembers || []);
    } catch (error: any) {
      toast({
        title: "Error loading team",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const filteredTeam = team.filter((user) => {
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const matchesSearch =
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateMember = async () => {
    try {
      setCreating(true);

      if (
        !newMember.first_name ||
        !newMember.last_name ||
        !newMember.email ||
        !newMember.password ||
        !newMember.role
      ) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        username: newMember.username || newMember.email.split("@")[0],
        email: newMember.email,
        password: newMember.password,
        role: newMember.role,
        first_name: newMember.first_name,
        last_name: newMember.last_name,
        phone: newMember.phone || undefined,
      };

      const response = await apiFetch("/api/auth/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add team member");
      }

      toast({
        title: "Team member added",
        description: "The team member has been created successfully.",
      });

      setIsAddDialogOpen(false);
      setNewMember({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        phone: "",
        role: "employee",
        password: "",
        is_active: true,
      });

      await fetchTeam();
    } catch (error: any) {
      toast({
        title: "Error adding team member",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMember = async (user: TeamUser) => {
    try {
      // There is no dedicated delete route for /team; fall back to admin delete
      if (!window.confirm(`Delete team member ${user.username || user.email}?`))
        return;
      setDeletingId(user.id);
      const response = await apiFetch(`/api/auth/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete team member");
      }
      toast({
        title: "Team member deleted",
        description: "The team member has been removed.",
      });
      await fetchTeam();
    } catch (error: any) {
      toast({
        title: "Error deleting team member",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const stats = [
    { label: "Total Team", value: team.length, icon: Users, color: "text-primary" },
    { label: "Owners", value: team.filter((m) => m.role === "owner").length, icon: Shield, color: "text-warning" },
    { label: "Employees", value: team.filter((m) => m.role === "employee").length, icon: UserCheck, color: "text-success" },
    { label: "Inactive", value: team.filter((m) => !m.is_active).length, icon: UserX, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground">
            Manage owners and employees in your medical center
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Enter first name"
                    value={newMember.first_name}
                    onChange={(e) =>
                      setNewMember((prev) => ({ ...prev, first_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Enter last name"
                    value={newMember.last_name}
                    onChange={(e) =>
                      setNewMember((prev) => ({ ...prev, last_name: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  placeholder="Enter username (optional)"
                  value={newMember.username}
                  onChange={(e) =>
                    setNewMember((prev) => ({ ...prev, username: e.target.value }))
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
                    value={newMember.email}
                    onChange={(e) =>
                      setNewMember((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    placeholder="Enter phone number"
                    value={newMember.phone}
                    onChange={(e) =>
                      setNewMember((prev) => ({ ...prev, phone: e.target.value }))
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
                  value={newMember.password}
                  onChange={(e) =>
                    setNewMember((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Role <span className="text-destructive">*</span>
                </label>
                <Select
                  value={newMember.role}
                  onValueChange={(value) =>
                    setNewMember((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role === "owner" ? "Owner" : "Employee"}
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
                  checked={newMember.is_active}
                  onCheckedChange={(checked) =>
                    setNewMember((prev) => ({ ...prev, is_active: checked }))
                  }
                />
              </div>

              <Button
                onClick={handleCreateMember}
                className="w-full"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Member"}
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
            {teamRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Team Table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Member
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Contact
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Role
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                  Medical Center
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
                    Loading team...
                  </td>
                </tr>
              )}
              {!loading && filteredTeam.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-sm text-muted-foreground"
                  >
                    No team members found.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredTeam.map((user, index) => (
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
                        {user.center_name || "—"}
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
                            className="gap-2 text-destructive"
                            onClick={() => handleDeleteMember(user)}
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

export default TeamManagement;




