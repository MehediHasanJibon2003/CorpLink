import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";
import {
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Loader2,
  Zap,
  Calendar,
  DollarSign,
  Building,
  Crown,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Billing() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payingId, setPayingId] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);

  const UI_THEMES = [
    {
      icon: Zap,
      color: "from-blue-500 to-blue-700",
      popular: false,
      defaultDescription: "Ideal for small teams and startups looking for basic structure.",
    },
    {
      icon: Building,
      color: "from-orange-500 to-orange-700",
      popular: true,
      defaultDescription: "Advanced controls and analytics for growing organizations.",
    },
    {
      icon: Crown,
      color: "from-purple-500 to-purple-700",
      popular: false,
      defaultDescription: "Custom solutions for multi-national corporations.",
    },
  ];

  useEffect(() => {
    if (!profile?.company_id) return;
    fetchBillingData();
  }, [profile]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      // Fetch active subscription for this company
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("corporate_id", profile.company_id)
        .eq("status", "active")
        .maybeSingle();

      setSubscription(subData);
      setPlan(subData?.subscription_plans || null);

      // Fetch invoices for this company
      const { data: invData } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("action", "Invoice Payment")
        .order("created_at", { ascending: false })
        .limit(20);

      setInvoices(invData || []);

      // Fetch subscription plans
      const { data: plansData } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (plansData) {
        const mergedTiers = plansData.map((p, idx) => {
          const theme = UI_THEMES[idx % UI_THEMES.length];
          return {
            id: p.id,
            name: p.name,
            price: p.price,
            description: p.description || theme.defaultDescription,
            features: p.features || [],
            icon: theme.icon,
            color: theme.color,
            popular: theme.popular,
          };
        });
        setAvailablePlans(mergedTiers);
      }
    } catch (err) {
      console.error("Billing fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // This will call our Stripe Edge Function in Step 2
  const handlePayNow = async (invoice) => {
    setPayingId(invoice.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          amount: invoice.amount, // amount in cents (ensure invoice.amount exists)
          currency: invoice.currency || "usd",
          productName: `Invoice ${invoice.id}`,
          invoice_id: invoice.id,
          company_id: profile?.company_id,
        },
      });
      if (error) {
        console.error("Edge function error:", error);
        alert("Failed to create checkout session");
        return;
      }
      // Redirect user to Stripe Checkout page
      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert("Unexpected error while creating checkout session");
    } finally {
      setPayingId(null);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "paid")
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" /> Paid
        </span>
      );
    if (status === "pending")
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-500/20">
          <Clock className="h-3 w-3" /> Pending
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/20">
        <AlertCircle className="h-3 w-3" /> Overdue
      </span>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              Loading Billing Data...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-10 md:mb-16">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">
          Billing &{" "}
          <span className="text-violet-600">Subscription</span>
        </h1>
        <p className="text-[11px] md:text-label font-black uppercase tracking-[0.3em] text-slate-400 mt-4 flex items-center gap-2">
          <span className="w-8 h-px bg-slate-200 dark:bg-white/10" />
          Manage your plan, invoices and payments
        </p>
      </div>

      <div className="space-y-10">
        {/* Current Plan Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-8 md:p-12 shadow-2xl border border-violet-500/20">
          {/* decorative blob */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em]">
                  Current Subscription
                </p>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
                {plan?.name || "No Active Plan"}
              </h2>
              {plan && (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <DollarSign className="h-4 w-4 text-violet-400" />
                    <span className="text-heading-2 font-black text-white">
                      ${plan.price}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      / month
                    </span>
                  </div>
                  {subscription?.renewal_date && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">
                        Renews:{" "}
                        {new Date(subscription.renewal_date).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {subscription ? "Active" : "No Subscription"}
              </span>
              {plan && (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                  {plan.max_employees || "Unlimited"} employees
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Available Plans
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Upgrade anytime
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full pt-8">
            {availablePlans.length === 0 ? (
              <div className="col-span-1 md:col-span-3 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
              </div>
            ) : (
              availablePlans.map((tier, idx) => {
                const Icon = tier.icon;
                const isActive = plan?.name?.toLowerCase() === tier.name.toLowerCase();

                return (
                  <motion.div
                    key={tier.name}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 }}
                    className={`relative bg-white dark:bg-white/5 border p-8 md:p-12 rounded-3xl md:rounded-[3rem] shadow-xl dark:backdrop-blur-2xl flex flex-col hover:border-slate-300 dark:hover:border-white/20 transition-all duration-500 ${tier.popular
                        ? "border-orange-500/50 ring-2 ring-orange-500 shadow-orange-500/10"
                        : isActive
                          ? "border-emerald-500/50 ring-2 ring-emerald-500 shadow-emerald-500/10"
                          : "border-slate-200 dark:border-white/10"
                      }`}
                  >
                    {isActive ? (
                      <div className="absolute -top-5 md:-top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 md:px-8 py-1.5 md:py-2 rounded-full text-label md:text-heading-3 font-black uppercase tracking-widest whitespace-nowrap shadow-lg">
                        Current Plan
                      </div>
                    ) : tier.popular && (
                      <div className="absolute -top-5 md:-top-6 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 md:px-8 py-1.5 md:py-2 rounded-full text-label md:text-heading-3 font-black uppercase tracking-widest whitespace-nowrap shadow-lg">
                        Most Popular
                      </div>
                    )}
                    <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl bg-gradient-to-br ${tier.color} w-fit mb-8 md:mb-10 shadow-xl`}>
                      <Icon className="h-8 w-8 md:h-10 md:w-10 text-white" />
                    </div>
                    <h3 className="text-heading-2 md:text-heading-1 font-black text-slate-900 dark:text-white mb-3 md:mb-4 tracking-tight">
                      {tier.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-4 md:mb-6 text-slate-900 dark:text-white">
                      <span className="text-4xl md:text-5xl font-black">${tier.price}</span>
                      <span className="text-body md:text-heading-2 text-slate-500 dark:text-slate-400 font-bold">/month</span>
                    </div>
                    <p className="text-body md:text-heading-2 text-slate-600 dark:text-slate-400 mb-8 md:mb-10 font-medium leading-relaxed">
                      {tier.description}
                    </p>
                    <div className="space-y-4 md:space-y-6 mb-10 md:mb-12 flex-1">
                      {tier.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-3 md:gap-4 text-slate-700 dark:text-slate-300 font-bold text-label md:text-heading-3">
                          <div className="p-1 rounded-full bg-emerald-500/20 shrink-0">
                            <Check className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
                          </div>
                          {feature}
                        </div>
                      ))}
                    </div>
                    <button
                      disabled={isActive}
                      onClick={() => alert(`${tier.name} Plan selection functionality can be connected to Stripe Checkout.`)}
                      className={`w-full py-4 md:py-6 rounded-xl md:rounded-2xl text-heading-3 md:text-heading-1 font-black text-center transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 ${isActive
                          ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 cursor-not-allowed border border-emerald-500/20"
                          : tier.popular
                            ? "bg-orange-500 text-white shadow-xl shadow-orange-500/40 hover:bg-orange-400 hover:-translate-y-1 active:scale-95"
                            : "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 hover:-translate-y-1 active:scale-95"
                        }`}
                    >
                      {isActive ? "Active Plan" : `Upgrade to ${tier.name}`}
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>        {/* Invoices */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] md:rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-xl overflow-hidden">
          <div className="px-8 md:px-12 py-7 md:py-8 border-b-2 border-slate-50 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Invoice History
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {invoices.length} total invoices
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 hidden md:flex">
              {/* Temporary Button for Testing - Moved here so it's always visible */}
              <button
                onClick={async () => {
                  if (!profile?.company_id) return;
                  const { error } = await supabase.from('invoices').insert({
                    company_id: profile.company_id,
                    amount: 1000,
                    status: 'pending',
                    invoice_number: 'DEMO-' + Math.floor(Math.random() * 10000)
                  });
                  if (error) {
                    alert("Error creating demo invoice: " + error.message);
                  } else {
                    fetchBillingData(); // Reload invoices
                  }
                }}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-violet-500/20 active:scale-95"
              >
                + Demo Invoice
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Most Recent First
              </span>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center px-8">
              <FileText className="h-16 w-16 text-slate-200 dark:text-slate-700" />
              <p className="text-heading-2 font-black text-slate-400 uppercase tracking-tight">
                No Invoices Yet
              </p>
              <p className="text-[12px] font-bold text-slate-400 max-w-xs">
                Your invoice history will appear here once you have an active
                subscription.
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-slate-50 dark:divide-white/5">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="px-8 md:px-12 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${inv.status === "paid"
                          ? "bg-emerald-50 dark:bg-emerald-500/10"
                          : "bg-amber-50 dark:bg-amber-500/10"
                        }`}
                    >
                      <CreditCard
                        className={`h-5 w-5 ${inv.status === "paid"
                            ? "text-emerald-500"
                            : "text-amber-500"
                          }`}
                      />
                    </div>
                    <div>
                      <p className="text-heading-3 font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        #{inv.invoice_number || inv.id.substring(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {inv.subscription_plans?.name || "Subscription"} ·{" "}
                        {new Date(inv.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 ml-[68px] sm:ml-0">
                    <p className="text-heading-2 font-black text-slate-900 dark:text-white">
                      ${inv.amount}
                    </p>
                    {getStatusBadge(inv.status)}
                    {inv.status !== "paid" && (
                      <button
                        onClick={() => handlePayNow(inv)}
                        disabled={payingId === inv.id}
                        className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-violet-500/20 disabled:opacity-60 active:scale-95"
                      >
                        {payingId === inv.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                            Processing...
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="h-3.5 w-3.5" /> Pay Now
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
