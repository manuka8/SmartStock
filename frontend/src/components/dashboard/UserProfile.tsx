import { useState, useEffect } from "react";
import { Award, Flame, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<Date[]>([]);
  const [data, setData] = useState<Record<string, {cash: number, cheque: number, credit: number, sales: number}>>({});
  const [totals, setTotals] = useState({cash: 0, cheque: 0, credit: 0, sales: 0});

  const formatK = (num: number) => num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num.toFixed(2);

  const fetchMonthlyData = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const startDate = `${currentMonth}-01`;
      const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
      const [invoicesRes, salesRes] = await Promise.all([
        apiFetch(`/api/invoices/getAllInvoices?created_by=${user.id}&start_date=${startDate}&end_date=${endDate}`),
        apiFetch(`/api/vehicleSales/getAllSales?start_date=${startDate}&end_date=${endDate}`)
      ]);
      if (!invoicesRes.ok || !salesRes.ok) return;
      const invoices = (await invoicesRes.json()).invoices || [];
      const sales = (await salesRes.json()).sales || [];
      const data: Record<string, {cash: number, cheque: number, credit: number, sales: number}> = {};
      invoices.forEach((inv: any) => {
        const date = new Date(inv.created_at).toDateString();
        if (!data[date]) data[date] = {cash: 0, cheque: 0, credit: 0, sales: 0};
        data[date].cash += parseFloat(inv.cash) || (inv.payment_method === 'CASH' ? parseFloat(inv.amount_paid) || 0 : 0);
        data[date].cheque += parseFloat(inv.cheque) || (inv.payment_method === 'CHEQUE' ? parseFloat(inv.amount_paid) || 0 : 0);
        data[date].credit += parseFloat(inv.credit) || (inv.payment_method === 'CREDIT' ? parseFloat(inv.amount_paid) || 0 : 0);
        // sales from invoices not used
      });
      sales.forEach((sale: any) => {
        const date = new Date(sale.sale_date).toDateString();
        if (!data[date]) data[date] = {cash: 0, cheque: 0, credit: 0, sales: 0};
        data[date].cash += parseFloat(sale.cash) || 0;
        data[date].cheque += parseFloat(sale.cheque) || 0;
        data[date].credit += parseFloat(sale.credit) || 0;
        data[date].sales += parseFloat(sale.total_amount) || 0;
      });
      setData(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchMonthlyData();
  }, [user?.id]);

  useEffect(() => {
    const totals = {cash: 0, cheque: 0, credit: 0, sales: 0};
    selected.forEach(date => {
      const key = date.toDateString();
      if (data[key]) {
        totals.cash += data[key].cash;
        totals.cheque += data[key].cheque;
        totals.credit += data[key].credit;
        totals.sales += data[key].sales;
      }
    });
    setTotals(totals);
  }, [selected, data]);

  return (
    <div className="bg-card rounded-xl border border-border/50 p-5">
      {/* User Info */}
      <div className="flex items-center gap-4 mb-5">
        <Avatar className="w-14 h-14">
          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-foreground">{user?.first_name} {user?.last_name}</h3>
          <p className="text-sm text-muted-foreground">{user?.role}</p>
          <div className="flex items-center gap-1 mt-1">
            <Award className="w-4 h-4 text-warning" />
            <span className="text-xs text-warning font-medium">Premium</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 mb-3">
        <h4 className="text-sm font-medium text-foreground">Days Activity</h4>
        <div className="text-center p-3 rounded-lg bg-background">
          <p className="text-lg font-bold text-foreground">RS: {totals.sales.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Sales</p>
        </div>
        {/* <div className="text-center p-3 rounded-lg bg-background">
          <p className="text-lg font-bold text-foreground">0.00</p>
          <p className="text-xs text-muted-foreground">Total Returns</p>
        </div> */}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="text-center p-2 rounded-lg bg-background">
          <p className="text-sm font-bold text-foreground">RS: {formatK(totals.cash)}</p>
          <p className="text-xs text-muted-foreground">Total Cash</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-background">
          <p className="text-sm font-bold text-foreground">RS: {formatK(totals.cheque)}</p>
          <p className="text-xs text-muted-foreground">Total Cheque</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-background">
          <p className="text-sm font-bold text-foreground">RS: {formatK(totals.credit)}</p>
          <p className="text-xs text-muted-foreground">Total Credit</p>
        </div>
      </div>

      {/* Monthly Activity */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-foreground">Monthly Activity</h4>
          <span className="text-xs text-muted-foreground">Jan 2026</span>
        </div>
        <Calendar mode="multiple" selected={selected} onSelect={setSelected} />
      </div>

      <Button 
       onClick={() => navigate("/dashboard/Settings")}
       variant="outline" 
       className="w-full">
        View Full Profile
      </Button>
    </div>
  );
}
