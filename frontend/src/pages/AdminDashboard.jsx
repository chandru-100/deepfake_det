import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Users, ShieldAlert, FileImage } from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState({ stats: null, recentUploads: [], recentReports: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5002/api/admin/stats');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading dashboard data...</div>;
  }

  const { stats, recentUploads, recentReports } = data;

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">Admin <span className="text-gradient">Dashboard</span></h1>
        <p className="text-gray-600">System overview and investigation portal.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard icon={<FileImage className="text-primary w-8 h-8"/>} title="Total Scans" value={stats?.totalScans || 0} />
        <StatCard icon={<ShieldAlert className="text-red-500 w-8 h-8"/>} title="Fake Detections" value={stats?.fakeCount || 0} />
        <StatCard icon={<Activity className="text-accent w-8 h-8"/>} title="User Reports" value={stats?.totalReports || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Uploads */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2 text-gray-900">Recent Scans</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">File</th>
                  <th className="py-3 px-2">Result</th>
                  <th className="py-3 px-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {recentUploads.length > 0 ? recentUploads.slice(0, 8).map(upload => (
                  <tr key={upload.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-gray-500">#{upload.id}</td>
                    <td className="py-3 px-2 text-gray-800 truncate max-w-[150px]" title={upload.filename}>{upload.filename}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${upload.result === 'Fake' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {upload.result}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-gray-700">{upload.score}%</td>
                  </tr>
                )) : <tr><td colSpan="4" className="py-4 text-center text-gray-500">No scans yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2 text-gray-900">Recent Reports</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200">
                  <th className="py-3 px-2">Link</th>
                  <th className="py-3 px-2">Reason</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.length > 0 ? recentReports.slice(0, 8).map(report => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 truncate max-w-[150px]"><a href={report.media_link} target="_blank" rel="noreferrer" className="text-primary hover:underline">{report.media_link}</a></td>
                    <td className="py-3 px-2 truncate max-w-[150px] text-gray-800" title={report.reason}>{report.reason}</td>
                    <td className="py-3 px-2 text-yellow-600 font-medium">{report.status}</td>
                  </tr>
                )) : <tr><td colSpan="3" className="py-4 text-center text-gray-500">No reports yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value }) => (
  <div className="glass-panel p-6 flex items-center gap-4">
    <div className="bg-blue-50 p-4 rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

export default AdminDashboard;
