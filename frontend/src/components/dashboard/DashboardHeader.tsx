import { Bell, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

export function DashboardHeader() {
  const { user } = useAuth();
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Dashboard</span>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">Overview</span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="w-64 pl-10 bg-background"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <Avatar className="w-9 h-9">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-foreground">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
