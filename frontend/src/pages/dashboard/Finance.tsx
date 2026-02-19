import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building2,
  Banknote,
  Lock,
  Unlock,
  History,
  AlertCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface FinanceRecord {
  id: number;
  transaction_date: string;
  amount: number | string;
  type: "INCOME" | "EXPENSE";
  category: string;
  source?: string;
  payment_method: string;
  reference_number: string;
  notes: string;
  created_at: string;
}

interface CashRegistry {
  id: number;
  date: string;
  opening_balance: number;
  closing_balance: number;
  actual_cash: number;
  difference: number;
  status: "OPEN" | "CLOSED";
  notes: string;
}

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

const Finance = () => {
  const [activeTab, setActiveTab] = useState("ALL");
  const [transactions, setTransactions] = useState<FinanceRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [cashStatus, setCashStatus] = useState<"OPEN" | "CLOSED" | "NONE">("NONE");
  const [currentRegistry, setCurrentRegistry] = useState<CashRegistry | null>(null);
  const [cashHistory, setCashHistory] = useState<CashRegistry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog States
  const [isTransDialogOpen, setIsTransDialogOpen] = useState(false);
  const [isOpenCashDialogOpen, setIsOpenCashDialogOpen] = useState(false);
  const [isCloseCashDialogOpen, setIsCloseCashDialogOpen] = useState(false);

  const [transFormData, setTransFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    amount: "",
    type: "INCOME",
    category: "",
    source: "",
    payment_method: "CASH",
    reference_number: "",
    notes: "",
  });

  const [cashFormData, setCashFormData] = useState({
    opening_balance: "",
    actual_cash: "",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transRes, summaryRes, cashStatusRes, cashHistoryRes] = await Promise.all([
        apiFetch("/api/finance/transactions"),
        apiFetch("/api/finance/summary"),
        apiFetch("/api/finance/cash-status"),
        apiFetch("/api/finance/cash-history"),
      ]);

      const transData = await transRes.json();
      const summaryData = await summaryRes.json();
      const cashStatusData = await cashStatusRes.json();
      const cashHistoryData = await cashHistoryRes.json();

      if (transData.success) setTransactions(transData.transactions);
      if (summaryRes.ok) setSummary(summaryData);
      if (cashStatusData.success) {
        setCashStatus(cashStatusData.status);
        setCurrentRegistry(cashStatusData.registry || null);
      }
      if (cashHistoryData.success) setCashHistory(cashHistoryData.history);
    } catch (error) {
      console.error("Error fetching finance data:", error);
      toast.error("Error fetching finance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddTrans = (type: string = "INCOME") => {
    setTransFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      amount: "",
      type: type,
      category: "",
      source: "",
      payment_method: "CASH",
      reference_number: "",
      notes: "",
    });
    setIsTransDialogOpen(true);
  };

  const handleTransSubmit = async () => {
    if (!transFormData.date || !transFormData.amount || !transFormData.payment_method || !transFormData.type) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await apiFetch(`/api/finance/transaction`, {
        method: "POST",
        body: JSON.stringify({
          transaction_date: transFormData.date,
          amount: parseFloat(transFormData.amount),
          type: transFormData.type,
          category: transFormData.category,
          source: transFormData.source,
          payment_method: transFormData.payment_method,
          reference_number: transFormData.reference_number,
          notes: transFormData.notes,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Transaction added successfully`);
        fetchData();
        setIsTransDialogOpen(false);
      } else {
        toast.error(`Failed to add transaction`);
      }
    } catch (error) {
      console.error("Error submitting transaction:", error);
      toast.error("Error submitting transaction");
    }
  };

  const handleOpenCash = async () => {
    try {
      const response = await apiFetch("/api/finance/open-cash", {
        method: "POST",
        body: JSON.stringify({
          opening_balance: parseFloat(cashFormData.opening_balance || "0"),
          notes: cashFormData.notes
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Cash registry opened");
        fetchData();
        setIsOpenCashDialogOpen(false);
      }
    } catch (error) {
      toast.error("Failed to open cash registry");
    }
  };

  const handleCloseCash = async () => {
    try {
      const response = await apiFetch("/api/finance/close-cash", {
        method: "POST",
        body: JSON.stringify({
          actual_cash: parseFloat(cashFormData.actual_cash || "0"),
          notes: cashFormData.notes
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Cash registry closed. Difference: Rs. ${data.difference}`);
        fetchData();
        setIsCloseCashDialogOpen(false);
      }
    } catch (error) {
      toast.error("Failed to close cash registry");
    }
  };

  const handleDeleteTrans = async (id: number) => {
    try {
      const response = await apiFetch(`/api/finance/transaction/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Transaction deleted");
        fetchData();
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const filteredTrans = transactions.filter((item) => {
    const matchesTab = activeTab === "ALL" || item.type === activeTab;
    const matchesSearch = (item.category?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (item.notes?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (item.reference_number?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (item.source?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finance & Cash</h1>
          <p className="text-muted-foreground">Manage transactions and daily cash balance</p>
        </div>
        <div className="flex gap-2">
          {cashStatus === "OPEN" ? (
             <Button variant="outline" className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => setIsCloseCashDialogOpen(true)}>
                <Lock className="w-4 h-4" /> Close Cash
             </Button>
          ) : (
             <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => setIsOpenCashDialogOpen(true)}>
                <Unlock className="w-4 h-4" /> Open Cash
             </Button>
          )}
          <Button onClick={() => handleOpenAddTrans("INCOME")} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <TrendingUp className="w-4 h-4" /> Add Income
          </Button>
          <Button onClick={() => handleOpenAddTrans("EXPENSE")} variant="destructive" className="gap-2">
            <TrendingDown className="w-4 h-4" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-emerald-600">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-700">Rs. {summary.totalIncome.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-rose-50/50 border-rose-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-rose-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-rose-700">Rs. {summary.totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-blue-600">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-700">Rs. {summary.balance.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className={`${cashStatus === 'OPEN' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-xs font-semibold uppercase ${cashStatus === 'OPEN' ? 'text-emerald-600' : 'text-rose-600'}`}>
              Cash Register
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className={`text-lg font-bold ${cashStatus === 'OPEN' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {cashStatus}
            </div>
            {cashStatus === 'OPEN' && (
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                Opened {format(new Date(currentRegistry?.date || new Date()), "HH:mm")}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="cash-registry">Cash Registry</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex bg-muted/50 p-1 rounded-lg">
                <Button variant={activeTab === 'ALL' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('ALL')}>All</Button>
                <Button variant={activeTab === 'INCOME' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('INCOME')}>Income</Button>
                <Button variant={activeTab === 'EXPENSE' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('EXPENSE')}>Expense</Button>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
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
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrans.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(record.transaction_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={record.type === 'INCOME' ? 'outline' : 'destructive'} className={record.type === 'INCOME' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : ''}>
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{record.category}</div>
                      <div className="text-[10px] text-muted-foreground italic">{record.notes}</div>
                    </TableCell>
                    <TableCell className="text-xs">{record.payment_method}</TableCell>
                    <TableCell className={`text-right font-bold text-sm ${record.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                       Rs. {Number(record.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-rose-600" onClick={() => handleDeleteTrans(record.id)}>
                          <Trash2 className="w-4 h-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="cash-registry">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                 <Card>
                    <CardHeader>
                       <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <History className="w-4 h-4" /> Cash Registry Actions
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {cashStatus !== 'OPEN' ? (
                         <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-center space-y-3">
                            <Unlock className="w-8 h-8 text-emerald-500 mx-auto" />
                            <h3 className="font-bold text-emerald-800">Ready to Open?</h3>
                            <p className="text-xs text-emerald-600">Start your shift by recording the opening balance in the cash drawer.</p>
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsOpenCashDialogOpen(true)}>Open Registry</Button>
                         </div>
                       ) : (
                         <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 text-center space-y-3">
                            <Lock className="w-8 h-8 text-amber-500 mx-auto" />
                            <h3 className="font-bold text-amber-800">Registry is Open</h3>
                            <p className="text-xs text-amber-600">The shift is active. Close the registry to reconcile today's cash sales.</p>
                            <Button variant="outline" className="w-full border-amber-200 text-amber-700 hover:bg-amber-100" onClick={() => setIsCloseCashDialogOpen(true)}>Close Registry</Button>
                         </div>
                       )}
                    </CardContent>
                 </Card>

                 {currentRegistry && cashStatus === 'OPEN' && (
                    <Card className="border-emerald-200">
                        <CardHeader>
                           <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Active Shift Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Opening Balance</span>
                              <span className="font-bold">Rs. {currentRegistry.opening_balance.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between text-sm border-t pt-2">
                              <span className="text-muted-foreground font-semibold">Today's Transactions</span>
                              <span className="text-emerald-600 font-bold">Active...</span>
                           </div>
                        </CardContent>
                    </Card>
                 )}
              </div>

              <div className="md:col-span-2">
                 <div className="rounded-xl border bg-card overflow-hidden">
                    <Table>
                       <TableHeader>
                          <TableRow className="bg-muted/30">
                             <TableHead>Date</TableHead>
                             <TableHead>Opening</TableHead>
                             <TableHead>Closing</TableHead>
                             <TableHead>Actual</TableHead>
                             <TableHead>Diff</TableHead>
                             <TableHead>Status</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {cashHistory.map((h) => (
                             <TableRow key={h.id}>
                                <TableCell className="text-xs font-semibold">{format(new Date(h.date), "MMM dd, yyyy")}</TableCell>
                                <TableCell className="text-xs">Rs. {Number(h.opening_balance).toLocaleString()}</TableCell>
                                <TableCell className="text-xs">Rs. {Number(h.closing_balance).toLocaleString()}</TableCell>
                                <TableCell className="text-xs font-bold">Rs. {Number(h.actual_cash).toLocaleString()}</TableCell>
                                <TableCell className="text-xs">
                                   <span className={h.difference < 0 ? 'text-rose-600 font-bold' : h.difference > 0 ? 'text-emerald-600 font-bold' : 'text-muted-foreground'}>
                                      {h.difference > 0 ? '+' : ''}{h.difference.toLocaleString()}
                                   </span>
                                </TableCell>
                                <TableCell>
                                   <Badge variant={h.status === 'OPEN' ? 'secondary' : 'default'} className="text-[10px] uppercase">
                                      {h.status}
                                   </Badge>
                                </TableCell>
                             </TableRow>
                          ))}
                          {cashHistory.length === 0 && (
                            <TableRow>
                               <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No history available</TableCell>
                            </TableRow>
                          )}
                       </TableBody>
                    </Table>
                 </div>
              </div>
           </div>
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <Dialog open={isTransDialogOpen} onOpenChange={setIsTransDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {transFormData.type === "INCOME" ? "Income" : "Expense"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={transFormData.type} onValueChange={(v) => setTransFormData({ ...transFormData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={transFormData.date} onChange={(e) => setTransFormData({ ...transFormData, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" placeholder="0.00" value={transFormData.amount} onChange={(e) => setTransFormData({ ...transFormData, amount: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input placeholder="General" value={transFormData.category} onChange={(e) => setTransFormData({ ...transFormData, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={transFormData.payment_method} onValueChange={(v) => setTransFormData({ ...transFormData, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsTransDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTransSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open Cash Dialog */}
      <Dialog open={isOpenCashDialogOpen} onOpenChange={setIsOpenCashDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600"><Unlock className="w-5 h-5" /> Open Registry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label>Opening Balance (LKR) *</Label>
                <Input type="number" className="text-lg font-bold" placeholder="0.00" value={cashFormData.opening_balance} onChange={(e) => setCashFormData({ ...cashFormData, opening_balance: e.target.value })} />
             </div>
             <div className="space-y-2">
                <Label>Notes</Label>
                <Input placeholder="Morning shift..." value={cashFormData.notes} onChange={(e) => setCashFormData({ ...cashFormData, notes: e.target.value })} />
             </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="w-full" onClick={() => setIsOpenCashDialogOpen(false)}>Cancel</Button>
            <Button className="w-full bg-emerald-600" onClick={handleOpenCash}>Open Day</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Cash Dialog */}
      <Dialog open={isCloseCashDialogOpen} onOpenChange={setIsCloseCashDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600"><Lock className="w-5 h-5" /> Close Registry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2 p-3 bg-muted rounded-lg border text-center">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Expected Balance</div>
                <div className="text-lg font-extrabold text-foreground">Calculating...</div>
                <p className="text-[10px] text-muted-foreground italic">Based on today's cash transactions</p>
             </div>
             <div className="space-y-2">
                <Label>Actual Cash Counted *</Label>
                <Input type="number" className="text-lg font-bold border-rose-200 focus-visible:ring-rose-200" placeholder="0.00" value={cashFormData.actual_cash} onChange={(e) => setCashFormData({ ...cashFormData, actual_cash: e.target.value })} />
             </div>
          </div>
          <DialogFooter className="flex-col gap-2">
            <Button className="w-full bg-rose-600" onClick={handleCloseCash}>Close & Reconcile</Button>
            <Button variant="ghost" className="w-full" onClick={() => setIsCloseCashDialogOpen(false)}>Back</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Finance;
