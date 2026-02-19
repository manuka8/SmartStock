import { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  AlertTriangle,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Boxes,
  Rocket,
  Bell,
  HelpCircle,
  Moon,
  User,
  Menu,
  Users,
  ClipboardList,
  Car,
  ShoppingCart,
  ArrowLeftRight,
  UserCheck,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Package, label: "Products", path: "/dashboard/products" },
  { icon: Boxes, label: "Inventory", path: "/dashboard/inventory" },
  { icon: ClipboardList, label: "Good received", path: "/dashboard/grn" },
  {
    icon: Car,
    label: "Vehicle Inventory",
    path: "/dashboard/vehicle-inventory",
  },
  {
    icon: ShoppingCart,
    label: "Daily Sales",
    path: "/dashboard/vehicle-sales",
  },
  { icon: AlertTriangle, label: "Low Stock Alerts", path: "/dashboard/alerts" },
];

const managementItems = [
  // { icon: Wallet, label: "Finance", path: "/dashboard/finance" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  { icon: Users, label: "Managements", path: "/dashboard/team" },
];

const quickActions = [
  { icon: Bell, label: "Notifications", path: "/dashboard/notifications" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help", path: "/dashboard/help" },
  { icon: Moon, label: "Theme", action: "theme" },
];

export function DashboardSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [mainOpen, setMainOpen] = useState(true);
  const [managementOpen, setManagementOpen] = useState(true);
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [agencyName, setAgencyName] = useState('Smart Store');

  const isActive = (path: string) => location.pathname === path;

  // Fetch agency details on mount
  useEffect(() => {
    const fetchAgencyName = async () => {
      if (user?.agency_id) {
        try {
          const response = await apiFetch(`/api/agencies/getAgency/${user.agency_id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await response.json();
          if (response.ok && data.agency?.agency_name) {
            // Get first word of agency name
            const firstWord = data.agency.agency_name.split(' ')[0];
            setAgencyName(`${firstWord} Store`);
          }
        } catch (error) {
          console.error('Error fetching agency name:', error);
          setAgencyName('Smart Store');
        }
      } else {
        setAgencyName('Smart Store');
      }
    };

    fetchAgencyName();
  }, [user]);

  // Keyboard shortcut handler for Ctrl+Arrow keys
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCollapsed(true);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCollapsed(false);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <TooltipProvider>
      <aside className="flex min-h-screen">
        {/* Icon Strip */}
        <div className="w-16 bg-sidebar-accent flex flex-col items-center py-4 border-r border-sidebar-border">
          {/* Logo Icon */}
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center mb-6">
            <Package className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>

          {/* Quick Action Icons */}
          <div className="flex-1 flex flex-col items-center gap-2">
            {quickActions.map((item) => (
              <NavLink
                key={item.label}
                to={item.action ? "#" : item.path}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground transition-colors",
                  isActive(item.path) && "bg-sidebar-muted text-sidebar-primary"
                )}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
              </NavLink>
            ))}
          </div>

          {/* Bottom Icons */}
          <div className="flex flex-col items-center gap-2 mt-auto">
            <NavLink
              to="/dashboard/profile"
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground transition-colors",
                isActive("/dashboard/profile") &&
                  "bg-sidebar-muted text-sidebar-primary"
              )}
              title="Profile"
            >
              <User className="w-5 h-5" />
            </NavLink>
            <NavLink
              to="/login"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </NavLink>
          </div>
        </div>

        {/* Expand Button when collapsed */}
        {collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(false)}
                className="absolute left-16 top-1/2 -translate-y-1/2 z-10 w-6 h-12 rounded-r-lg bg-sidebar border border-l-0 border-sidebar-border text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground transition-all duration-300"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expand Sidebar</p>
              <p className="text-xs text-muted-foreground">Ctrl + →</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Main Sidebar */}
        <div
          className={cn(
            "bg-sidebar flex flex-col rounded-tr-2xl rounded-br-2xl border-r border-sidebar-border transition-all duration-300 ease-in-out overflow-hidden",
            collapsed ? "w-0 opacity-0" : "w-56 opacity-100"
          )}
        >
          {/* Logo */}
          <div className="p-5 border-b border-sidebar-border flex items-center justify-between min-w-[14rem]">
            <div>
              <h1 className="font-semibold text-sidebar-foreground">
                {agencyName}
              </h1>
              <p className="text-xs text-sidebar-foreground/60">
                Stock Management
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(true)}
                  className="w-8 h-8 rounded-lg text-sidebar-foreground/60 bg-sidebar-muted hover:text-black transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Collapse Sidebar</p>
                <p className="text-xs text-muted-foreground">Ctrl + ←</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto min-w-[14rem]">
            {/* Main Section */}
            <div className="space-y-1">
              <button
                onClick={() => setMainOpen(!mainOpen)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider hover:text-sidebar-foreground/70 transition-colors"
              >
                <span>Main Menu</span>
                {mainOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {mainOpen && (
                <div className="space-y-1 animate-fade-in">
                  {mainNavItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "sidebar-item",
                        isActive(item.path) && "sidebar-item-active"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* Management Section */}
            <div className="space-y-1">
              <button
                onClick={() => setManagementOpen(!managementOpen)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider hover:text-sidebar-foreground/70 transition-colors"
              >
                <span>Management</span>
                {managementOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {managementOpen && (
                <div className="space-y-1 animate-fade-in">
                  {managementItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "sidebar-item",
                        isActive(item.path) && "sidebar-item-active"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Premium Card */}
          <div className="p-4 min-w-[14rem]">
            <div className="rounded-xl p-4 bg-gradient-to-br from-sidebar-accent to-sidebar-muted relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Rocket className="w-16 h-16 text-sidebar-primary/20" />
              </div>
              <h3 className="font-semibold text-sidebar-foreground mb-1">
                Upgrade Plan
              </h3>
              <p className="text-xs text-sidebar-foreground/70 mb-3">
                Get more features with our premium plan.
              </p>
              <Button variant="premium" size="sm" className="w-full">
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}