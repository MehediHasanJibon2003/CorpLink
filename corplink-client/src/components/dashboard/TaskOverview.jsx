import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function TaskOverview({ pending, inProgress, needsReview, finished, rejected }) {
  const data = [
    { name: "Pending", value: pending, fill: "#f59e0b" },
    { name: "In Progress", value: inProgress, fill: "#3b82f6" },
    { name: "Needs Review", value: needsReview, fill: "#f97316" }, // Orange 500
    { name: "Finished", value: finished, fill: "#10b981" },
    { name: "Rejected", value: rejected, fill: "#ef4444" }, // Red 500
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 h-full">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h3 className="text-heading-2 md:text-heading-1 font-bold text-slate-800 dark:text-slate-100 dark:text-white flex items-center gap-2 md:gap-3">
          <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
          Task Performance
        </h3>
        <select className="text-body md:text-heading-3 bg-slate-50 dark:bg-slate-900 border md:border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg md:rounded-2xl px-3 py-1.5 md:px-6 md:py-3 outline-none font-medium">
          <option>This Week</option>
          <option>This Month</option>
          <option>All Time</option>
        </select>
      </div>

      <div className="h-64 md:h-[400px] mt-6 md:mt-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} maxBarSize={80}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 14, fontWeight: 500}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 14, fontWeight: 500}} />
            <Tooltip 
              cursor={{fill: '#f1f5f9'}}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontSize: '14px', fontWeight: 'bold' }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

