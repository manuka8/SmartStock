import { useNavigate } from "react-router-dom";
import { Package, ArrowRight, CheckCircle2, BarChart3, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track your inventory levels, sales trends, and stock movements in real-time.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade security with 99.9% uptime guarantee for your peace of mind.",
  },
  {
    icon: Zap,
    title: "Fast & Efficient",
    description: "Streamlined workflows that save hours of manual work every week.",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-foreground">StockFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/register")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
            <Zap className="w-4 h-4" />
            Trusted by 500+ supermarkets
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            Smart Stock Management for{" "}
            <span className="text-primary">Modern Supermarkets</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "200ms" }}>
            Take control of your inventory with real-time tracking, automated alerts, and powerful analytics. Start your 14-day free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Button size="xl" onClick={() => navigate("/register")} className="gap-2">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="xl" onClick={() => navigate("/login")}>
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything you need to manage stock
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed specifically for supermarket inventory management.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card rounded-2xl p-6 border border-border/50 hover:shadow-lg transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-sidebar rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sidebar-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sidebar-primary/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-sidebar-foreground mb-4">
                Ready to transform your inventory management?
              </h2>
              <p className="text-sidebar-foreground/70 mb-8 max-w-xl mx-auto">
                Join hundreds of supermarkets already using StockFlow to save time, reduce waste, and increase profits.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
                {["No credit card required", "14-day free trial", "Cancel anytime"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-sidebar-primary" />
                    <span className="text-sidebar-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="premium"
                size="xl"
                onClick={() => navigate("/register")}
                className="gap-2"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">StockFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 StockFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
