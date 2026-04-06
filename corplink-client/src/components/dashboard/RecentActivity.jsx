export default function RecentActivity({ activities = [] }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-full">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 dark:text-white flex items-center gap-2 mb-6">
        Corporate Activity
      </h3>

      {activities.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm">No recent activity found</p>
      ) : (
        <div className="space-y-6">
          {activities.map((log) => {
            const colors = {
              critical: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-200 dark:ring-red-800' },
              warning: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800' },
              default: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-800' }
            }[log.severity] || { bg: 'bg-slate-50 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', ring: 'ring-slate-200 dark:ring-slate-600' };

            return (
              <div key={log.id} className="flex gap-4">
                <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${colors.bg} ${colors.text} shadow-sm ring-1 ring-inset ${colors.ring}`}>
                  <div className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-100 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">{log.user?.name || "Someone"}</span> {log.action.replace(log.user?.name || "User", "").trim()}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 font-medium">
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