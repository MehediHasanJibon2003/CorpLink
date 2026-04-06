import AppLayout from "../components/layout/AppLayout";
import { MessageCircle, Search, MoreVertical } from "lucide-react";

export default function Messages() {
  return (
    <AppLayout title="Messages" subtitle="Connect with team members directly">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex h-[600px]">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-900/50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search messages..." 
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:bg-slate-800 cursor-pointer transition mb-1">
                <div className="w-10 h-10 rounded-full bg-blue-100/50 flex items-center justify-center font-bold text-blue-600">
                  U{i}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">Corporate User {i}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">Welcome to the new messaging upgrade...</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100/50 flex items-center justify-center font-bold text-blue-600">
                U1
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Corporate User 1</h3>
                <p className="text-xs text-emerald-500 font-medium">Online</p>
              </div>
            </div>
            <button className="text-slate-400 p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-full">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center">
               <MessageCircle className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2 relative">
              <input 
                type="text" 
                placeholder="Type a message..." 
                disabled
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none opacity-50 cursor-not-allowed"
              />
              <button disabled className="bg-blue-600 text-white px-6 rounded-xl font-medium opacity-50 cursor-not-allowed">Send</button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
