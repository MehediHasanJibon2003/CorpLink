import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import DiscoverPanel from "../components/collaboration/DiscoverPanel";
import PartnerRequestsPanel from "../components/collaboration/PartnerRequestsPanel";
import ProposalsPanel from "../components/collaboration/ProposalsPanel";
import MessagesPanel from "../components/collaboration/MessagesPanel";
import { useAuth } from "../context/AuthContext";
import { logModuleUsage } from "../services/usageService";

const TABS = [
  { id: "discover", label: "Discover", icon: "🔍" },
  { id: "requests", label: "Requests", icon: "📫" },
  { id: "proposals", label: "Proposals", icon: "📄" },
  { id: "messages", label: "Messages", icon: "💬" },
];

function Collaboration() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("discover");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentTab = TABS.find(t => t.id === activeTab);

  useEffect(() => {
    if (profile) {
      logModuleUsage("Collaboration", profile.company_id, user.id);
    }
  }, [profile, user.id]);

  return (
    <AppLayout
      title="Collaboration"
      subtitle="Connect with other companies and manage corporate partnerships"
    >
      <div className="space-y-6 md:space-y-12">
        {/* Responsive Tab Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-700 p-2 md:p-4 shadow-sm">
          {/* Mobile Dropdown */}
          <div className="md:hidden relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-4 text-[13px] font-black uppercase tracking-widest outline-none focus:ring-2 ring-blue-500/20 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{currentTab?.icon}</span>
                {currentTab?.label}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isDropdownOpen ? "rotate-180 text-blue-600" : "text-slate-400"}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-4 text-[13px] font-black uppercase tracking-widest transition-all border-b last:border-0 border-slate-100 dark:border-slate-700/50 ${
                      activeTab === tab.id
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex flex-wrap gap-4 md:gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 md:gap-4 px-6 md:px-8 py-3.5 md:py-6 rounded-xl md:rounded-[1.8rem] text-heading-3 md:text-heading-1 font-black transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <span className="text-heading-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px] md:min-h-[500px]">
          {activeTab === "discover" && <DiscoverPanel />}
          {activeTab === "requests" && <PartnerRequestsPanel />}
          {activeTab === "proposals" && <ProposalsPanel />}
          {activeTab === "messages" && <MessagesPanel />}
        </div>
      </div>
    </AppLayout>
  );
}

export default Collaboration;
