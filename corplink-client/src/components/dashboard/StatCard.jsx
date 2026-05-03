function StatCard({ title, value, subtitle, icon: Icon, colorClass = "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 md:p-8 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm md:text-xl font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-white mt-2 md:mt-4 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 md:p-5 rounded-xl md:rounded-2xl ${colorClass}`}>
            <Icon className="h-6 w-6 md:h-10 md:w-10" />
          </div>
        )}
      </div>
      {subtitle && <p className="text-xs md:text-lg text-slate-400 dark:text-slate-500 mt-3 md:mt-5 font-medium flex items-center gap-1 md:gap-2">{subtitle}</p>}
    </div>
  );
}

export default StatCard;
