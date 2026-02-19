import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Truck, 
  Navigation, 
  Clock, 
  Package,
  ChevronRight,
  Circle,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VehicleRoute {
  id: string;
  vehicleName: string;
  driver: string;
  status: "in-transit" | "delivering" | "returning" | "idle";
  currentLocation: string;
  destination: string;
  progress: number;
  eta: string;
  stops: number;
  completedStops: number;
  itemsCount: number;
  coordinates: { x: number; y: number };
}

const mockRoutes: VehicleRoute[] = [
  {
    id: "V001",
    vehicleName: "Truck A",
    driver: "John Smith",
    status: "in-transit",
    currentLocation: "Downtown District",
    destination: "Fresh Mart - Main St",
    progress: 65,
    eta: "15 mins",
    stops: 5,
    completedStops: 3,
    itemsCount: 245,
    coordinates: { x: 35, y: 40 }
  },
  {
    id: "V002",
    vehicleName: "Van B",
    driver: "Sarah Johnson",
    status: "delivering",
    currentLocation: "Super Foods - Oak Ave",
    destination: "Super Foods - Oak Ave",
    progress: 100,
    eta: "At location",
    stops: 4,
    completedStops: 2,
    itemsCount: 180,
    coordinates: { x: 60, y: 25 }
  },
  {
    id: "V003",
    vehicleName: "Truck C",
    driver: "Mike Davis",
    status: "returning",
    currentLocation: "Highway 101",
    destination: "Warehouse",
    progress: 80,
    eta: "25 mins",
    stops: 6,
    completedStops: 6,
    itemsCount: 0,
    coordinates: { x: 75, y: 55 }
  },
  {
    id: "V004",
    vehicleName: "Van D",
    driver: "Emily Brown",
    status: "in-transit",
    currentLocation: "Industrial Zone",
    destination: "Market Plus - 5th St",
    progress: 30,
    eta: "35 mins",
    stops: 3,
    completedStops: 1,
    itemsCount: 120,
    coordinates: { x: 20, y: 65 }
  }
];

const statusConfig = {
  "in-transit": { color: "bg-primary", label: "In Transit", dotColor: "bg-primary" },
  "delivering": { color: "bg-success", label: "Delivering", dotColor: "bg-success" },
  "returning": { color: "bg-warning", label: "Returning", dotColor: "bg-warning" },
  "idle": { color: "bg-muted-foreground", label: "Idle", dotColor: "bg-muted-foreground" }
};

export function VehicleRoutesMap() {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const activeVehicles = mockRoutes.filter(r => r.status !== "idle").length;
  const totalDeliveries = mockRoutes.reduce((acc, r) => acc + r.completedStops, 0);
  const totalStops = mockRoutes.reduce((acc, r) => acc + r.stops, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Live Vehicle Routes
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time tracking of delivery vehicles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-muted-foreground">{activeVehicles} Active</span>
              </div>
              <div className="text-muted-foreground">
                {totalDeliveries}/{totalStops} Stops
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Map Area */}
          <div className="lg:col-span-2 relative bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/20 h-[320px] overflow-hidden">
            {/* Grid Pattern Overlay */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />
            
            {/* Decorative Roads */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Main roads */}
              <path 
                d="M 0 50 Q 30 50 50 30 T 100 40" 
                fill="none" 
                stroke="hsl(var(--border))" 
                strokeWidth="0.8"
                strokeDasharray="2 1"
              />
              <path 
                d="M 10 0 Q 20 40 40 50 T 50 100" 
                fill="none" 
                stroke="hsl(var(--border))" 
                strokeWidth="0.8"
                strokeDasharray="2 1"
              />
              <path 
                d="M 60 0 Q 70 30 80 50 T 90 100" 
                fill="none" 
                stroke="hsl(var(--border))" 
                strokeWidth="0.8"
                strokeDasharray="2 1"
              />
              <path 
                d="M 0 75 Q 40 70 60 80 T 100 70" 
                fill="none" 
                stroke="hsl(var(--border))" 
                strokeWidth="0.8"
                strokeDasharray="2 1"
              />
              
              {/* Route paths for vehicles */}
              {mockRoutes.map((route, index) => (
                <path 
                  key={route.id}
                  d={`M ${10 + index * 5} ${85 - index * 10} Q ${route.coordinates.x - 10} ${route.coordinates.y + 20} ${route.coordinates.x} ${route.coordinates.y}`}
                  fill="none" 
                  stroke={`hsl(var(--primary) / ${selectedVehicle === route.id ? 0.8 : 0.3})`}
                  strokeWidth={selectedVehicle === route.id ? "1" : "0.5"}
                  strokeDasharray={selectedVehicle === route.id ? "none" : "3 2"}
                  className="transition-all duration-300"
                />
              ))}
            </svg>

            {/* Location markers */}
            <div className="absolute bottom-6 left-6 flex items-center gap-1.5">
              <div className="w-3 h-3 bg-sidebar rounded-sm flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              </div>
              <span className="text-xs font-medium text-foreground">Warehouse</span>
            </div>

            {/* Destination markers */}
            {[
              { x: 45, y: 30, name: "Fresh Mart" },
              { x: 70, y: 20, name: "Super Foods" },
              { x: 85, y: 45, name: "Market Plus" },
              { x: 25, y: 55, name: "Grocery Hub" },
            ].map((dest, i) => (
              <div 
                key={i}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${dest.x}%`, top: `${dest.y}%` }}
              >
                <div className="relative">
                  <MapPin className="h-4 w-4 text-muted-foreground/60" />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap border">
                    {dest.name}
                  </div>
                </div>
              </div>
            ))}

            {/* Vehicle markers */}
            {mockRoutes.map((route) => (
              <div
                key={route.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                  selectedVehicle === route.id ? "scale-125 z-20" : "z-10 hover:scale-110"
                }`}
                style={{ left: `${route.coordinates.x}%`, top: `${route.coordinates.y}%` }}
                onClick={() => setSelectedVehicle(selectedVehicle === route.id ? null : route.id)}
              >
                <div className={`relative`}>
                  {/* Pulse animation for active vehicles */}
                  {route.status !== "idle" && (
                    <div className={`absolute inset-0 ${statusConfig[route.status].dotColor} rounded-full animate-ping opacity-30`} 
                         style={{ width: '32px', height: '32px', top: '-4px', left: '-4px' }} />
                  )}
                  <div className={`w-6 h-6 rounded-full ${statusConfig[route.status].color} flex items-center justify-center shadow-lg border-2 border-background`}>
                    <Truck className="h-3 w-3 text-primary-foreground" />
                  </div>
                  {/* Vehicle label */}
                  <div className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap transition-opacity ${
                    selectedVehicle === route.id ? "opacity-100" : "opacity-0"
                  }`}>
                    {route.vehicleName}
                  </div>
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm rounded-lg p-2.5 shadow-sm border">
              <div className="flex flex-col gap-1.5 text-xs">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                    <span className="text-muted-foreground">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vehicle List */}
          <div className="border-l bg-card/50">
            <div className="p-3 border-b bg-muted/30">
              <h4 className="font-medium text-sm">Active Vehicles</h4>
            </div>
            <div className="divide-y max-h-[268px] overflow-y-auto">
              {mockRoutes.map((route) => (
                <div 
                  key={route.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedVehicle === route.id 
                      ? "bg-primary/5 border-l-2 border-l-primary" 
                      : "hover:bg-muted/30"
                  }`}
                  onClick={() => setSelectedVehicle(selectedVehicle === route.id ? null : route.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusConfig[route.status].dotColor}`} />
                      <span className="font-medium text-sm">{route.vehicleName}</span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        route.status === "delivering" ? "bg-success/10 text-success" :
                        route.status === "in-transit" ? "bg-primary/10 text-primary" :
                        route.status === "returning" ? "bg-warning/10 text-warning" :
                        ""
                      }`}
                    >
                      {statusConfig[route.status].label}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{route.currentLocation}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{route.eta}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3 w-3" />
                        <span>{route.itemsCount} items</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-muted-foreground">
                          {route.completedStops}/{route.stops} stops
                        </span>
                        <span className="font-medium text-foreground">{route.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            route.status === "delivering" ? "bg-success" :
                            route.status === "returning" ? "bg-warning" :
                            "bg-primary"
                          }`}
                          style={{ width: `${route.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
