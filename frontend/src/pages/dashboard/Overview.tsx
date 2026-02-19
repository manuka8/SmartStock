import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UserProfile } from "@/components/dashboard/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { VehicleRoutesMap } from "@/components/dashboard/VehicleRoutesMap";

export default function Overview() {
  const { user } = useAuth();
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Section */}
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Welcome back, {user?.first_name}! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your store today.
            </p>
          </div>
          {/* Stats */}
          <StatsCards />
          {/* Vehicle Routes Map - Full Width */}
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <VehicleRoutesMap />
          </div>
          <TopProducts />
          <LowStockAlerts />
          
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <UserProfile />
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
