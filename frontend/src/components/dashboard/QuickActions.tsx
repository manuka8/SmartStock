import { Plus, Upload, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  {
    icon: Plus,
    label: "Add Product",
    description: "Add new items to inventory",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Upload,
    label: "Stock In",
    description: "Record incoming stock",
    color: "bg-success/10 text-success",
  },
  {
    icon: Download,
    label: "Stock Out",
    description: "Record sales or transfers",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: FileText,
    label: "Generate Report",
    description: "Create inventory reports",
    color: "bg-secondary text-secondary-foreground",
  },
];

export function QuickActions() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5">
      <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Button
            key={action.label}
            variant="ghost"
            className="h-auto flex flex-col items-center gap-2 p-4 bg-background hover:bg-accent animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}
            >
              <action.icon className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {action.description}
              </p>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
