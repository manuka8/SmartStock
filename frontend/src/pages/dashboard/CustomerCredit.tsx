import { useState, useEffect } from "react";
import {
  Search,
  DollarSign,
  History,
  User,
  CreditCard,
  Building2,
  Banknote,
  ArrowUpRight,
  ChevronRight,
  Scale,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface CustomerCreditData {
  id: number;
  customer_code: string;
  first_name: string;
  last_name: string;
  business_name: string;
  phone: string;
  outstanding_balance: number;
  credit_limit: number;
}

interface PaymentHistory {
  id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
}

const CustomerCredit = () => {
  const [customers, setCustomers] = useState<CustomerCreditData[]>([]);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCreditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    method: "CASH",
    reference: "",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/customers/credit-balances");
      const data = await response.json();
      if (data.success) setCustomers(data.customers);
    } catch (error) {
      toast.error("Failed to load credit balances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenPayment = (customer: CustomerCreditData) => {
    setSelectedCustomer(customer);
    setPaymentForm({
      amount: customer.outstanding_balance.toString(),
      date: format(new Date(), "yyyy-MM-dd"),
      method: "CASH",
      reference: "",
      notes: "",
    });
    setIsPaymentDialogOpen(true);
  };

  const handleOpenHistory = async (customer: CustomerCreditData) => {
    setSelectedCustomer(customer);
    try {
      const response = await apiFetch(`/api/customers/credit-history/${customer.id}`);
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
        setIsHistoryDialogOpen(true);
      }
    } catch (error) {
      toast.error("Failed to load payment history");
    }
  };

  const submitPayment = async () => {
    if (!selectedCustomer || !paymentForm.amount || !paymentForm.date) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const response = await apiFetch("/api/customers/credit-payment", {
        method: "POST",
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          amount: parseFloat(paymentForm.amount),
          payment_date: paymentForm.date,
          payment_method: paymentForm.method,
          reference_number: paymentForm.reference,
          notes: paymentForm.notes,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Payment recorded successfully");
        fetchData();
        setIsPaymentDialogOpen(false);
      }
    } catch (error) {
      toast.error("Payment failed");
    }
  };

  const filteredCustomers = customers.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customer_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCredit = customers.reduce((acc, c) => acc + Number(c.outstanding_balance), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Credit Management</h1>
          <p className="text-muted-foreground">Track and collect outstanding balances from customers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-amber-50/50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-amber-600">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">Rs. {totalCredit.toLocaleString()}</div>
            <p className="text-xs text-amber-600/70 mt-1">{customers.length} Customers with balance</p>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50/50 border-blue-100">
           <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-blue-600">Credit Collection</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Scale className="w-10 h-10 text-blue-500 opacity-20" />
            <div className="text-xs text-blue-700 italic">Manage your receivables efficiently to maintain healthy cash flow.</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex w-full items-center justify-end">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Customer</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold">{customer.first_name} {customer.last_name}</span>
                    <span className="text-xs text-muted-foreground">{customer.business_name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{customer.customer_code}</TableCell>
                <TableCell>
                  {Number(customer.outstanding_balance) >= Number(customer.credit_limit) ? (
                    <Badge variant="destructive">Limit Exceeded</Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Active Debt</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">Rs. {Number(customer.credit_limit).toLocaleString()}</TableCell>
                <TableCell className="text-right font-bold text-rose-600">Rs. {Number(customer.outstanding_balance).toLocaleString()}</TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => handleOpenHistory(customer)}>
                    <History className="w-3 h-3" /> History
                  </Button>
                  <Button size="sm" className="gap-2 bg-emerald-600" onClick={() => handleOpenPayment(customer)}>
                    <DollarSign className="w-3 h-3" /> Pay
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No customers with credit found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <DollarSign className="w-5 h-5 text-emerald-600" />
               Record Credit Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg border">
               <div className="text-xs text-muted-foreground">Customer</div>
               <div className="font-bold">{selectedCustomer?.first_name} {selectedCustomer?.last_name}</div>
               <div className="text-xs text-rose-600 font-bold mt-1">Due: Rs. {selectedCustomer?.outstanding_balance.toLocaleString()}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (LKR) *</Label>
                <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Payment Date *</Label>
                <Input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm({...paymentForm, method: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input placeholder="Receipt #, Cheque #" value={paymentForm.reference} onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Payment for invoice..." value={paymentForm.notes} onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600" onClick={submitPayment}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <History className="w-5 h-5 text-blue-600" />
               Credit Payment History
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
               <div className="text-sm font-semibold">{selectedCustomer?.first_name} {selectedCustomer?.last_name}</div>
               <div className="text-xs text-muted-foreground">{selectedCustomer?.business_name}</div>
            </div>
            <div className="border rounded-lg overflow-hidden">
               <Table>
                 <TableHeader>
                   <TableRow className="bg-muted/30">
                     <TableHead>Date</TableHead>
                     <TableHead>Method</TableHead>
                     <TableHead>Reference</TableHead>
                     <TableHead className="text-right">Amount</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {history.map(h => (
                     <TableRow key={h.id}>
                       <TableCell className="text-xs">{format(new Date(h.payment_date), "MMM dd, yyyy")}</TableCell>
                       <TableCell className="text-xs text-muted-foreground font-medium">{h.payment_method}</TableCell>
                       <TableCell className="text-xs">{h.reference_number || "-"}</TableCell>
                       <TableCell className="text-right font-bold text-emerald-600">Rs. {Number(h.amount).toLocaleString()}</TableCell>
                     </TableRow>
                   ))}
                   {history.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No payment history found</TableCell>
                     </TableRow>
                   )}
                 </TableBody>
               </Table>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHistoryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerCredit;
