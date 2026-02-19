import { useState, useEffect } from "react";
import { TrendingUp, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export function TopProducts() {
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const res = await apiFetch("/api/inventoryManagement/getTopSellingProducts");
        const data = await res.json();
        if (data.success) {
          const products = data.products.map((product, index) => ({
            id: product.item_id,
            name: product.item_name,
            sold: product.total_sold,
            revenue: `RS ${parseFloat(product.total_revenue).toFixed(2)}`,
            growth: "", // No growth data
            image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=80&h=80&fit=crop", // Placeholder
          }));
          setTopProducts(products);
        }
      } catch (error) {
        console.error("Error fetching top products:", error);
      }
    };

    fetchTopProducts();
  }, []);
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Top Selling Products</h3>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="space-y-4">
        {topProducts.map((product, index) => (
          <div
            key={product.id}
            className="flex items-center gap-4 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              {index + 1}
            </div>

            <img
              src={product.image}
              alt={product.name}
              className="w-12 h-12 rounded-lg object-cover"
            />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {product.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {product.sold} units sold
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {product.revenue}
              </p>
              {product.growth && (
                <p className="text-xs text-success">{product.growth}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
