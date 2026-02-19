import { useState, useEffect } from "react";
import { AlertTriangle, Bell, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface AlertItem {
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

const getSeverityStyle = (current: number, reorder: number, status?: string) => {
  if (status === 'NO_INVENTORY') {
    return "bg-blue/10 text-blue border-blue/20";
  }
  const ratio = current / reorder;
  return ratio <= 0.2
    ? "bg-destructive/10 text-destructive border-destructive/20"
    : "bg-warning/10 text-warning border-warning/20";
};

const getSeverity = (current: number, reorder: number, status?: string) => {
  if (status === 'NO_INVENTORY') {
    return "setup";
  }
  const ratio = current / reorder;
  return ratio <= 0.2 ? "critical" : "warning";
};

export default function Alerts() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch alerts on component mount
  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch("/api/inventoryManagement/getLowStockAlerts", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load low stock alerts",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const criticalCount = alerts.filter((a) => getSeverity(a.current_quantity, a.reorder_level, a.status) === "critical").length;
  const warningCount = alerts.filter((a) => getSeverity(a.current_quantity, a.reorder_level, a.status) === "warning").length;
  const setupCount = alerts.filter((a) => getSeverity(a.current_quantity, a.reorder_level, a.status) === "setup").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Low Stock Alerts</h1>
          <p className="text-muted-foreground">Monitor and manage stock levels</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Bell className="w-4 h-4" />
          Configure Alerts
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="stat-card border-l-4 border-l-destructive">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical Alerts</p>
              <p className="text-2xl font-bold text-foreground">{criticalCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Warning Alerts</p>
              <p className="text-2xl font-bold text-foreground">{warningCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-l-blue">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Setup Required</p>
              <p className="text-2xl font-bold text-foreground">{setupCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-l-success">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Alerts</p>
              <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-card rounded-xl border border-border/50 p-5">
        <h3 className="font-semibold text-foreground mb-5">Active Alerts</h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No low stock alerts at this time.
            </div>
          ) : (
            alerts.map((alert) => {
              const severity = getSeverity(alert.current_quantity, alert.reorder_level, alert.status);
              const isSetupRequired = alert.status === 'NO_INVENTORY';

              return (
                <div
                  key={alert.id || alert.item_id}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${getSeverityStyle(alert.current_quantity, alert.reorder_level, alert.status)}`}
                >
                  <img
                    src={alert.image_url || "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=80&h=80&fit=crop"}
                    alt={alert.item_name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">{alert.item_name}</p>
                      <Badge variant="default" className="text-xs">
                        {Number(alert.unit_size)}{alert.unit}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {alert.category || "General"}
                      </Badge>
                      {isSetupRequired && (
                        <Badge variant="outline" className="text-xs bg-blue/10 text-blue">
                          Setup Required
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {isSetupRequired ? (
                        <span className="text-sm text-muted-foreground">
                          Inventory not configured
                        </span>
                      ) : (
                        <>
                          <Progress
                            value={(alert.current_quantity / alert.reorder_level) * 100}
                            className="h-2 flex-1 max-w-xs"
                          />
                          <span className="text-sm text-muted-foreground">
                            {alert.current_quantity} / {alert.reorder_level}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isSetupRequired ? (
                      <Button size="sm">Setup Inventory</Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm">
                          Dismiss
                        </Button>
                        <Button size="sm">Reorder</Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
