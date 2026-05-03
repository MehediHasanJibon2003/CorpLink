import AppLayout from "../components/layout/AppLayout";
import { MessageCircle, Search, MoreVertical } from "lucide-react";

export default function Messages() {
  return (
    <AppLayout title="Messages" subtitle="Connect with team members directly">
      <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex h-[700px] md:h-[800px] lg:h-[850px]">
        {/* Left Sidebar */}
        <div className="w-80 md:w-[26rem] lg:w-[30rem] border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-900/50">
          <div className="p-5 md:p-8 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="relative">
              <Search className="absolute left-4 top-3 md:top-4 h-5 w-5 md:h-6 md:w-6 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search messages..." 
                className="w-full bg-slate-100 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 md:pl-14 pr-5 md:pr-6 py-3 md:py-4 text-base md:text-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 md:gap-6 p-4 md:p-5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition shadow-sm hover:shadow-md mb-3 md:mb-4 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-lg md:text-2xl border border-blue-200 dark:border-blue-800/50 shrink-0">
                  U{i}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base md:text-2xl font-bold text-slate-800 dark:text-slate-100 truncate mb-1">Corporate User {i}</h4>
                  <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 truncate leading-relaxed">Welcome to the new messaging upgrade...</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800">
          <div className="p-5 md:p-8 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-lg md:text-2xl border border-blue-200 dark:border-blue-800/50 shrink-0">
                U1
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl md:text-3xl mb-1">Corporate User 1</h3>
                <p className="text-sm md:text-lg text-emerald-500 font-bold tracking-wide">Online</p>
              </div>
            </div>
            <button className="text-slate-400 p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition">
              <MoreVertical className="h-6 w-6 md:h-8 md:w-8" />
            </button>
          </div>
          
          <div className="flex-1 p-8 md:p-16 flex flex-col items-center justify-center text-slate-400 gap-6 md:gap-8">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center shadow-inner">
               <MessageCircle className="h-12 w-12 md:h-16 md:w-16 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg md:text-2xl font-medium">Select a conversation to start chatting</p>
          </div>

          <div className="p-5 md:p-8 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
            <div className="flex gap-3 md:gap-4 relative">
              <input 
                type="text" 
                placeholder="Type a message..." 
                disabled
                className="w-full bg-white dark:bg-slate-800 border md:border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl px-6 py-4 md:px-8 md:py-5 outline-none opacity-50 cursor-not-allowed text-base md:text-xl placeholder-slate-400"
              />
              <button disabled className="bg-blue-600 text-white px-8 md:px-12 rounded-xl md:rounded-2xl font-bold text-base md:text-xl opacity-50 cursor-not-allowed shadow-md">Send</button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
