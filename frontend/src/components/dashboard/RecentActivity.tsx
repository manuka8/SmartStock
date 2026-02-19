import { Package, ArrowDownLeft, ArrowUpRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "stock_in",
    product: "Organic Milk 1L",
    quantity: 150,
    time: "2 min ago",
    icon: ArrowDownLeft,
  },
  {
    id: 2,
    type: "stock_out",
    product: "Whole Grain Bread",
    quantity: 45,
    time: "15 min ago",
    icon: ArrowUpRight,
  },
  {
    id: 3,
    type: "low_stock",
    product: "Fresh Eggs (12 pack)",
    quantity: 8,
    time: "1 hour ago",
    icon: AlertCircle,
  },
  {
    id: 4,
    type: "stock_in",
    product: "Premium Butter 250g",
    quantity: 200,
    time: "2 hours ago",
    icon: ArrowDownLeft,
  },
  {
    id: 5,
    type: "stock_out",
    product: "Orange Juice 2L",
    quantity: 32,
    time: "3 hours ago",
    icon: ArrowUpRight,
  },
];

const typeStyles = {
  stock_in: {
    bg: "bg-success/10",
    color: "text-success",
    label: "Stock In",
  },
  stock_out: {
    bg: "bg-primary/10",
    color: "text-primary",
    label: "Stock Out",
  },
  low_stock: {
    bg: "bg-warning/10",
    color: "text-warning",
    label: "Low Stock",
  },
};

export function RecentActivity() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const style = typeStyles[activity.type as keyof typeof typeStyles];
          return (
            <div
              key={activity.id}
              className="flex items-center gap-4 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  style.bg
                )}
              >
                <activity.icon className={cn("w-5 h-5", style.color)} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.product}
                </p>
                <p className="text-xs text-muted-foreground">
                  {style.label} • {activity.quantity} units
                </p>
              </div>

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
