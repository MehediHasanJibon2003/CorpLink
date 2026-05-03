export default function RecentActivity({ activities = [] }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 h-full">
      <h3 className="text-lg md:text-3xl font-bold text-slate-800 dark:text-slate-100 dark:text-white flex items-center gap-2 md:gap-3 mb-6 md:mb-8">
        Corporate Activity
      </h3>

      {activities.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg">No recent activity found</p>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {activities.map((log) => {
            const colors = {
              critical: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-200 dark:ring-red-800' },
              warning: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800' },
              default: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-800' }
            }[log.severity] || { bg: 'bg-slate-50 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', ring: 'ring-slate-200 dark:ring-slate-600' };

            return (
              <div key={log.id} className="flex gap-4 md:gap-6">
                <div className={`mt-1 h-8 w-8 md:h-12 md:w-12 rounded-full flex items-center justify-center shrink-0 ${colors.bg} ${colors.text} shadow-sm ring-1 md:ring-2 ring-inset ${colors.ring}`}>
                  <div className="h-4 w-4 md:h-6 md:w-6" />
                </div>
                <div>
                  <p className="text-sm md:text-xl leading-relaxed text-slate-800 dark:text-slate-100 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">{log.user?.name || "Someone"}</span> {log.action.replace(log.user?.name || "User", "").trim()}
                  </p>
                  <div className="flex items-center gap-1.5 md:gap-2 mt-1 md:mt-2 text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}