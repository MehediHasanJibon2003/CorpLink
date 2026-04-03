function TaskOverview({ pending, inProgress, finished }) {
  const maxValue = Math.max(pending, inProgress, finished, 1)

  const bars = [
    { label: "Pending", value: pending },
    { label: "In Progress", value: inProgress },
    { label: "Finished", value: finished },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800">Tasks Overview</h3>
        <p className="text-sm text-slate-500">Dynamic summary</p>
      </div>

      <div className="flex items-end gap-8 h-64">
        {bars.map((bar) => (
          <div key={bar.label} className="flex-1 flex flex-col items-center">
            <div className="w-full max-w-[90px] bg-slate-100 rounded-t-2xl h-52 flex items-end overflow-hidden">
              <div
                className="w-full bg-blue-500 rounded-t-2xl transition-all duration-500"
                style={{
                  height: `${(bar.value / maxValue) * 100}%`,
                }}
              />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">{bar.label}</p>
            <p className="text-xs text-slate-500">{bar.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TaskOverview