import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface LowStockItem {
  id?: number;
  item_id: number;
  item_name: string;
  item_code: string;
  category?: string;
  unit: string;
  unit_size?: number;
  current_quantity: number;
  reorder_level: number;
  buying_price: number;
  selling_price_1: number;
  image_url?: string;
  status?: string;
}

export function LowStockAlerts() {
  const navigate = useNavigate();
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLowStockAlerts();
  }, []);

  const fetchLowStockAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch(
        "/api/inventoryManagement/getLowStockAlerts",
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch low stock alerts");
      }

      const data = await response.json();
      // Limit to first 4 items for the dashboard component
      setLowStockItems((data.alerts || []).slice(0, 4));
    } catch (error) {
      console.error("Error fetching low stock alerts:", error);
      setLowStockItems([]);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-foreground">Low Stock Alerts</h3>
          <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">
            {lowStockItems.length}
          </span>
        </div>
        <button
          onClick={() => navigate("/dashboard/alerts")}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Loading alerts...
          </div>
        ) : lowStockItems.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No low stock alerts
          </div>
        ) : (
          lowStockItems.map((item, index) => {
            const isSetupRequired = item.status === "NO_INVENTORY";
            return (
              <div
                key={item.id || item.item_id}
                className="flex items-center gap-4 p-3 rounded-lg bg-background/50 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <img
                  src={
                    item.image_url ||
                    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=80&h=80&fit=crop"
                  }
                  alt={item.item_name}
                  className="w-12 h-12 rounded-lg object-cover"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                    {item.item_name}
                  </p>
                  <Badge variant="default" className="text-xs">
                    {Number(item.unit_size)}
                    {item.unit}
                  </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isSetupRequired ? (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Setup required
                      </span>
                    ) : (
                      <>
                        <Progress
                          value={
                            (item.current_quantity / item.reorder_level) * 100
                          }
                          className="h-1.5 flex-1"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.current_quantity}/{item.reorder_level}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm">
                  {isSetupRequired ? "Setup" : "Reorder"}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
