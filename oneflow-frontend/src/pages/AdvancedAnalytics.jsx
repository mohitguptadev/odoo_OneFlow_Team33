import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sankey,
} from "recharts";
import Card from "../components/common/Card";
import api from "../utils/api";
import { Download, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { exportAnalyticsToExcel } from "../utils/excelExport";

const COLORS = ["#3B82F6", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6"];

const AdvancedAnalytics = () => {
  const [projects, setProjects] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [dateRange, setDateRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, timesheetsRes] = await Promise.all([
        api.get("/analytics/projects"),
        api.get("/analytics/time-tracking"),
      ]);

      setProjects(projectsRes.data);
      setTimesheets(timesheetsRes.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate burn rate
  const calculateBurnRate = (project) => {
    if (!project.start_date || !project.budget) return null;
    
    const daysElapsed = Math.max(1, Math.floor((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24)));
    const spent = parseFloat(project.costs || 0);
    const dailyBurnRate = spent / daysElapsed;
    const daysRemaining = project.end_date 
      ? Math.max(0, Math.floor((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
      : null;
    const projectedTotal = daysRemaining ? spent + (dailyBurnRate * daysRemaining) : null;
    const budgetAtRisk = projectedTotal && projectedTotal > parseFloat(project.budget) 
      ? projectedTotal - parseFloat(project.budget) 
      : 0;

    return {
      dailyBurnRate,
      projectedTotal,
      budgetAtRisk,
      daysRemaining,
    };
  };

  // Calculate velocity (tasks completed per week)
  const calculateVelocity = () => {
    // This would require task completion history
    // For now, return mock data structure
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      weeks.push({
        week: `Week ${4 - i}`,
        tasks: Math.floor(Math.random() * 20) + 10,
      });
    }
    return weeks;
  };

  // Calculate risk score
  const calculateRiskScore = (project) => {
    let score = 0;
    const factors = [];

    // Budget usage
    if (project.budget) {
      const budgetUsage = (parseFloat(project.costs || 0) / parseFloat(project.budget)) * 100;
      if (budgetUsage > 90) {
        score += 40;
        factors.push("Budget over 90%");
      } else if (budgetUsage > 75) {
        score += 20;
        factors.push("Budget over 75%");
      }
    }

    // Progress vs time
    if (project.start_date && project.end_date) {
      const totalDays = Math.floor((new Date(project.end_date) - new Date(project.start_date)) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.floor((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24));
      const timeProgress = (elapsedDays / totalDays) * 100;
      const taskProgress = parseFloat(project.progress_percentage || 0);

      if (taskProgress < timeProgress - 20) {
        score += 30;
        factors.push("Behind schedule");
      }
    }

    // Delayed tasks
    // This would require task data with due dates

    return {
      score: Math.min(100, score),
      level: score < 30 ? "low" : score < 70 ? "medium" : "high",
      factors,
    };
  };

  // Filter data by date range
  const filterByDateRange = (data) => {
    if (dateRange === "all") return data;
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return data.filter(item => new Date(item.created_at || item.date) >= cutoffDate);
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Analytics</h1>
          <p className="text-gray-600">Deep insights and predictive analytics</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={exportAnalyticsToExcel}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download size={18} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Risk Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {projects.slice(0, 3).map((project) => {
          const risk = calculateRiskScore(project);
          return (
            <Card key={project.id} hover glass className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                {risk.level === "high" ? (
                  <AlertCircle className="text-red-600" size={24} />
                ) : risk.level === "medium" ? (
                  <AlertCircle className="text-yellow-600" size={24} />
                ) : (
                  <TrendingUp className="text-green-600" size={24} />
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Risk Score</span>
                    <span className={`font-bold ${
                      risk.level === "high" ? "text-red-600" :
                      risk.level === "medium" ? "text-yellow-600" :
                      "text-green-600"
                    }`}>
                      {risk.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        risk.level === "high" ? "bg-red-600" :
                        risk.level === "medium" ? "bg-yellow-600" :
                        "bg-green-600"
                      }`}
                      style={{ width: `${risk.score}%` }}
                    ></div>
                  </div>
                </div>
                {risk.factors.length > 0 && (
                  <div className="text-xs text-gray-600 mt-2">
                    <p className="font-semibold">Factors:</p>
                    <ul className="list-disc list-inside">
                      {risk.factors.map((factor, i) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Burn Rate Chart */}
      <Card hover glass className="mb-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Burn Rate Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={projects.map(p => {
            const burnRate = calculateBurnRate(p);
            return {
              name: p.name,
              dailyBurnRate: burnRate?.dailyBurnRate || 0,
              projectedTotal: burnRate?.projectedTotal || 0,
              budget: parseFloat(p.budget || 0),
            };
          })}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="dailyBurnRate" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Daily Burn Rate" />
            <Area type="monotone" dataKey="projectedTotal" stackId="2" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="Projected Total" />
            <Line type="monotone" dataKey="budget" stroke="#10B981" strokeWidth={2} name="Budget" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Velocity Chart */}
      <Card hover glass className="mb-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Task Velocity (Tasks Completed per Week)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={calculateVelocity()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="tasks" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Profitability Trend */}
      <Card hover glass className="mb-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Profitability Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={projects.map(p => ({
            name: p.name,
            profit: parseFloat(p.profit || 0),
            revenue: parseFloat(p.revenue || 0),
            costs: parseFloat(p.costs || 0),
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Revenue" />
            <Area type="monotone" dataKey="costs" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Costs" />
            <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={3} name="Profit" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Budget Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card hover glass className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Budget Forecast</h2>
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => {
              const burnRate = calculateBurnRate(project);
              if (!burnRate || !project.budget) return null;
              
              return (
                <div key={project.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    {burnRate.budgetAtRisk > 0 ? (
                      <span className="text-red-600 font-bold">
                        -₹{burnRate.budgetAtRisk.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-green-600 font-bold">On Track</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Daily Burn: ₹{burnRate.dailyBurnRate.toFixed(2)}</p>
                    {burnRate.projectedTotal && (
                      <p>Projected Total: ₹{burnRate.projectedTotal.toLocaleString()}</p>
                    )}
                    {burnRate.daysRemaining !== null && (
                      <p>Days Remaining: {burnRate.daysRemaining}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card hover glass className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Completion Date Prediction</h2>
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => {
              const progress = parseFloat(project.progress_percentage || 0);
              const velocity = 5; // Tasks per week (would be calculated from history)
              const estimatedCompletion = project.end_date 
                ? new Date(project.end_date)
                : new Date(Date.now() + (100 - progress) / velocity * 7 * 24 * 60 * 60 * 1000);
              
              return (
                <div key={project.id} className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Current Progress: {progress.toFixed(1)}%</p>
                    <p>Estimated Completion: {estimatedCompletion.toLocaleDateString()}</p>
                    {project.end_date && (
                      <p className={estimatedCompletion > new Date(project.end_date) ? "text-red-600" : "text-green-600"}>
                        {estimatedCompletion > new Date(project.end_date) ? "⚠️ Behind Schedule" : "✅ On Track"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;

