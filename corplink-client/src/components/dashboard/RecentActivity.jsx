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
            <div
              key={item.id}
              className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
            >
              <p className="text-sm font-medium text-slate-800">{item.action}</p>
              <p className="text-xs text-slate-500 mt-1 capitalize">
                {item.entity} • {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecentActivity