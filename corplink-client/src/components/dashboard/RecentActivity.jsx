function RecentActivity({ activities = [] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-slate-800">Recent Activity</h3>
        <p className="text-sm text-slate-500">Latest updates</p>
      </div>

      {activities.length === 0 ? (
        <p className="text-slate-500 text-sm">No recent activity found</p>
      ) : (
        <div className="space-y-4">
          {activities.map((item) => (
            <div key={item.id} className="relative pl-6 pb-4 last:pb-0">
              {/* Timeline line */}
              <div className="absolute left-2 top-2 bottom-[-16px] w-px bg-slate-100 last:hidden"></div>
              
              {/* Timeline indicator (Color based on severity) */}
              <div className={`absolute left-[5px] top-1.5 w-2 h-2 rounded-full border-2 border-white ring-1 ring-slate-100 ${
                item.severity === 'critical' ? 'bg-red-500' : item.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
              }`}></div>

              <div className="flex justify-between items-start">
                <p className={`text-sm font-medium ${item.status === 'failed' ? 'text-red-700 line-through' : 'text-slate-800'}`}>
                  {item.action}
                </p>
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-semibold capitalize border border-slate-200">
                  {item.entity}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">
                {new Date(item.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })} • {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecentActivity