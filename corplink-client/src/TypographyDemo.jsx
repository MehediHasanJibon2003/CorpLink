import React from 'react';

const TypographyDemo = () => {
  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Page Title */}
      <section>
        <h1 className="text-heading-1">Dashboard Overview</h1>
        <p className="text-body text-slate-600 mt-1">Welcome back, Admin. Here is what's happening today.</p>
      </section>

      {/* Card Title & Body */}
      <div className="max-w-sm p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
        <h3 className="text-heading-3 mb-2">Project Statistics</h3>
        <p className="text-body text-slate-500">
          Total active projects have increased by 12% this month compared to the last quarter.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-badge px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Active</span>
          <span className="text-label text-slate-400">Updated 2h ago</span>
        </div>
      </div>

      {/* Table Example */}
      <div className="overflow-hidden border border-slate-200 rounded-lg">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-table font-semibold text-slate-700">Employee</th>
              <th className="px-4 py-2 text-left text-table font-semibold text-slate-700">Role</th>
              <th className="px-4 py-2 text-left text-table font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            <tr>
              <td className="px-4 py-2 text-table">John Doe</td>
              <td className="px-4 py-2 text-table text-slate-500">Software Engineer</td>
              <td className="px-4 py-2">
                <span className="text-badge px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Remote</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Form Elements */}
      <div className="max-w-md space-y-4">
        <div>
          <label className="block text-label font-medium text-slate-700 mb-1">Company Email</label>
          <input 
            type="email" 
            placeholder="admin@corplink.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-input focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>
        <button className="px-4 py-2 bg-violet-600 text-white rounded-md text-button hover:bg-violet-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default TypographyDemo;

