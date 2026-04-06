function StatCard({ title, value, subtitle, icon: Icon, colorClass = "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 dark:text-white mt-2 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium flex items-center gap-1">{subtitle}</p>}
    </div>
  );
}

export default StatCard;
