import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { adminLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await adminLogin(formData.email, formData.password);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in to the admin panel.",
      });

      navigate("/dashboard");
    } catch (error) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Login failed",
        description:
          error instanceof Error ? error.message : "Invalid email or password",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-sidebar-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-sidebar-primary/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sidebar-accent/30 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-card rounded-2xl shadow-2xl p-8 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sidebar mb-4">
              <Shield className="w-8 h-8 text-sidebar-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
            <p className="text-muted-foreground mt-2">
              Restricted access for authorized personnel only
            </p>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20 mb-6">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
            <p className="text-xs text-warning">
              This is a secure area. All login attempts are monitored and
              logged.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@stockflow.com"
                  className="pl-10 h-12"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-12"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="xl"
              className="w-full bg-sidebar hover:bg-sidebar-accent text-sidebar-foreground"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Access Admin Panel"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Not an admin?{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Go to Store Login
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-xs text-sidebar-foreground/50 mt-6">
          © 2025 StockFlow Admin Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
