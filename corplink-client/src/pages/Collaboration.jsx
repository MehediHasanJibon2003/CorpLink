import { useState } from "react"
import AppLayout from "../components/layout/AppLayout"
import DiscoverPanel from "../components/collaboration/DiscoverPanel"
import PartnerRequestsPanel from "../components/collaboration/PartnerRequestsPanel"
import ProposalsPanel from "../components/collaboration/ProposalsPanel"
import MessagesPanel from "../components/collaboration/MessagesPanel"

const TABS = [
  { id: "discover",  label: "Discover",  icon: "🔍" },
  { id: "requests",  label: "Requests",  icon: "📫" },
  { id: "proposals", label: "Proposals", icon: "📄" },
  { id: "messages",  label: "Messages",  icon: "💬" },
]

function Collaboration() {
  const [activeTab, setActiveTab] = useState("discover")

  return (
    <AppLayout
      title="Collaboration"
      subtitle="Connect with other companies, send proposals and manage corporate partnerships"
    >
      <div className="space-y-6">
        
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 shadow-sm inline-flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === "discover"  && <DiscoverPanel />}
          {activeTab === "requests"  && <PartnerRequestsPanel />}
          {activeTab === "proposals" && <ProposalsPanel />}
          {activeTab === "messages"  && <MessagesPanel />}
        </div>
        
      </div>
    </AppLayout>
  )
}

export default Collaboration
