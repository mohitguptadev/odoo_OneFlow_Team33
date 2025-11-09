import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/common/Card";
import api from "../utils/api";
import { exportAnalyticsToExcel } from "../utils/excelExport";
import { Download, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  const [projectAnalytics, setProjectAnalytics] = useState([]);
  const [resourceUtilization, setResourceUtilization] = useState([]);
  const [timeTracking, setTimeTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [projectsRes, resourcesRes, timeRes] = await Promise.all([
        api.get("/analytics/projects"),
        api.get("/analytics/resource-utilization"),
        api.get("/analytics/time-tracking"),
      ]);

      setProjectAnalytics(projectsRes.data);
      setResourceUtilization(resourcesRes.data);
      setTimeTracking(timeRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setLoading(false);
    }
  };

  const COLORS = ["#3B82F6", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6"];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen page-transition">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Insights and performance metrics</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/analytics/advanced"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2"
          >
            <TrendingUp size={18} />
            <span>Advanced Analytics</span>
          </Link>
          <button
            onClick={exportAnalyticsToExcel}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download size={18} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 card-grid">
        <Card hover glass className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Project Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectAnalytics.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="progress_percentage" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card hover glass className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Resource Utilization</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resourceUtilization.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="full_name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="total_hours_logged" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card hover glass className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Project Cost vs Revenue
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectAnalytics.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
              <Bar dataKey="costs" fill="#EF4444" name="Costs" />
              <Bar dataKey="profit" fill="#3B82F6" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card hover glass className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Time Tracking Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeTracking?.hours_per_day || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#3B82F6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card hover glass className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Billable vs Non-Billable Hours
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: "Billable",
                    value: timeTracking?.billable_hours || 0,
                  },
                  {
                    name: "Non-Billable",
                    value: timeTracking?.non_billable_hours || 0,
                  },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10B981" />
                <Cell fill="#EF4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card hover glass className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Hours by Project (Top 5)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeTracking?.hours_by_project || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="project_name"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 card-grid">
        <Card hover glass className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Top Performing Projects
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Profit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectAnalytics
                  .sort((a, b) => (b.profit || 0) - (a.profit || 0))
                  .slice(0, 5)
                  .map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${(project.profit || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {project.progress_percentage?.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card hover glass className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Team Productivity</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hours
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Completion
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resourceUtilization.slice(0, 5).map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.full_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.total_hours_logged?.toFixed(1) || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.completion_rate?.toFixed(1) || 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
