import { useEffect, useState } from "react";
import { Package, AlertTriangle, TrendingUp, DollarSign, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export function StatsCards() {
  const [stats, setStats] = useState([
    {
      label: "Total Products",
      value: "0",
      change: "+0%",
      changeType: "positive",
      icon: Package,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Low Stock Items",
      value: "0",
      change: "-0%",
      changeType: "negative",
      icon: AlertTriangle,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
    {
      label: "Stock Value",
      value: "RS 0",
      change: "+0%",
      changeType: "positive",
      icon: DollarSign,
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      label: "Monthly Sales",
      value: "RS 0",
      change: "+0%",
      changeType: "positive",
      icon: TrendingUp,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Total Credit Payments",
      value: "RS 0",
      change: "+0%",
      changeType: "positive",
      icon: CreditCard,
      iconBg: "bg-blue/10",
      iconColor: "text-blue-600",
    },
    {
      label: "Outstanding Credit Balance",
      value: "RS 0",
      change: "+0%",
      changeType: "negative",
      icon: AlertTriangle,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch inventory data
        const inventoryRes = await apiFetch("/api/inventoryManagement/getAllInventory", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const inventoryData = await inventoryRes.json();

        // Fetch invoices for total sales and monthly sales
        const invoicesRes = await apiFetch("/api/invoices/getAllInvoices", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const invoicesData = await invoicesRes.json();

        // Fetch low stock alerts
        const lowStockRes = await apiFetch("/api/inventoryManagement/getLowStockAlerts", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const lowStockData = await lowStockRes.json();

        // Fetch all credit payments
        const creditPaymentsRes = await apiFetch("/api/customers/getAllCreditPayments", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const creditPaymentsData = await creditPaymentsRes.json();

        // Fetch customers for outstanding balance
        const customersRes = await apiFetch("/api/customers/getAllCustomers", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const customersData = await customersRes.json();

        // Calculate stats
        let totalProducts = 0;
        let stockValue = 0;
        
        if (inventoryData.inventory && Array.isArray(inventoryData.inventory)) {
          totalProducts = inventoryData.inventory.length;
          stockValue = inventoryData.inventory.reduce((sum, item) => {
            const itemValue = (item.current_quantity || 0) * (item.buying_price || 0);
            return sum + itemValue;
          }, 0);
        }

        const lowStockCount = lowStockData.alerts ? lowStockData.alerts.length : 0;

        let monthlySales = 0;
        if (invoicesData.invoices && Array.isArray(invoicesData.invoices)) {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          monthlySales = invoicesData.invoices
            .filter((inv) => {
              const invDate = new Date(inv.created_at);
              return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
            })
            .reduce((sum, inv) => sum + (parseFloat(inv.subtotal) || 0), 0);
        }

        let totalCreditPayments = 0;
        if (creditPaymentsData.payments && Array.isArray(creditPaymentsData.payments)) {
          totalCreditPayments = creditPaymentsData.payments.reduce((sum, payment) => {
            return sum + (parseFloat(payment.amount) || 0);
          }, 0);
        }

        let totalOutstandingBalance = 0;
        if (customersData.customers && Array.isArray(customersData.customers)) {
          totalOutstandingBalance = customersData.customers.reduce((sum, customer) => {
            return sum + (parseFloat(customer.outstanding_balance) || 0);
          }, 0);
        }

        // Update stats
        setStats([
          {
            label: "Total Products",
            value: totalProducts.toLocaleString(),
            change: "+12%",
            changeType: "positive",
            icon: Package,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
          },
          {
            label: "Low Stock Items",
            value: lowStockCount.toString(),
            change: "-5%",
            changeType: "negative",
            icon: AlertTriangle,
            iconBg: "bg-warning/10",
            iconColor: "text-warning",
          },
          {
            label: "Stock Value",
            value: `RS ${stockValue.toLocaleString()}`,
            change: "+8.2%",
            changeType: "positive",
            icon: DollarSign,
            iconBg: "bg-success/10",
            iconColor: "text-success",
          },
          {
            label: "Monthly Sales",
            value: `RS ${monthlySales.toLocaleString()}`,
            change: "+15.3%",
            changeType: "positive",
            icon: TrendingUp,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
          },
          {
            label: "Outstanding Credit Balance",
            value: `RS ${totalOutstandingBalance.toLocaleString()}`,
            change: "-5.2%",
            changeType: "negative",
            icon: AlertTriangle,
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
          },
          {
            label: "Total Credit Payments",
            value: `RS ${totalCreditPayments.toLocaleString()}`,
            change: "+10.5%",
            changeType: "positive",
            icon: CreditCard,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
          },
        ]);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);
  return (
    <Carousel opts={{ align: "start" }} plugins={[Autoplay({ delay: 4000 })]} className="w-full">
      <CarouselContent className="-ml-1">
        {stats.map((stat, index) => (
          <CarouselItem key={stat.label} className="pl-1 md:basis-full lg:basis-1/3">
            <div
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    stat.iconBg
                  )}
                >
                  <stat.icon className={cn("w-6 h-6", stat.iconColor)} />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    stat.changeType === "positive"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-lg font-bold text-foreground whitespace-nowrap">{stat.value}</p>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-4" />
      <CarouselNext className="-right-4" />
    </Carousel>
  );
}

