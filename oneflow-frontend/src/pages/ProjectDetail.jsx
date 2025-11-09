import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import TaskModal from '../components/tasks/TaskModal';
import SmartInvoiceGenerator from '../components/financial/SmartInvoiceGenerator';
import api from '../utils/api';
import { formatCurrency, getStatusColor, calculateProgress } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, 
  Users, 
  DollarSign, 
  CheckSquare,
  ShoppingCart,
  FileText,
  Receipt,
  CreditCard,
  DollarSign as ExpenseIcon
} from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [financialCounts, setFinancialCounts] = useState({
    salesOrders: 0,
    purchaseOrders: 0,
    invoices: 0,
    bills: 0,
    expenses: 0,
  });
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchProjectDetails();
    fetchTasks();
    fetchFinancialSummary();
    fetchFinancialCounts();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks', { params: { project_id: id } });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      const response = await api.get(`/projects/${id}/financial-summary`);
      setFinancialSummary(response.data);
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    }
  };

  const fetchFinancialCounts = async () => {
    try {
      const [so, po, inv, bills, exp] = await Promise.all([
        api.get('/financial/sales-orders', { params: { project_id: id } }),
        api.get('/financial/purchase-orders', { params: { project_id: id } }),
        api.get('/financial/invoices', { params: { project_id: id } }),
        api.get('/financial/vendor-bills', { params: { project_id: id } }),
        api.get('/financial/expenses', { params: { project_id: id } }),
      ]);
      setFinancialCounts({
        salesOrders: so.data.length,
        purchaseOrders: po.data.length,
        invoices: inv.data.length,
        bills: bills.data.length,
        expenses: exp.data.length,
      });
    } catch (error) {
      console.error('Error fetching financial counts:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <p className="text-red-600">Project not found</p>
        <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    );
  }

  const progress = calculateProgress(project.completed_tasks || 0, project.tasks_count || 0);

  return (
    <div className="p-6">
      {/* Smart Invoice Generator */}
      <SmartInvoiceGenerator
        projectId={parseInt(id)}
        onInvoiceCreated={() => {
          fetchFinancialSummary();
          fetchFinancialCounts();
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Projects
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <span className={`inline-block mt-2 px-3 py-1 rounded text-sm font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
        {hasRole(['Admin', 'Project Manager']) && (
          <Button variant="primary" onClick={() => setShowTaskModal(true)}>
            Create Task
          </Button>
        )}
      </div>

      {/* Financial Links Bar */}
      <div className="glass-card bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-4 mb-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate(`/financial/sales-orders?project=${id}`)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <ShoppingCart size={18} className="text-green-600" />
            <span className="text-sm font-medium text-gray-700">Sales Orders</span>
            <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">{financialCounts.salesOrders}</span>
          </button>
          <button
            onClick={() => navigate(`/financial/purchase-orders?project=${id}`)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <FileText size={18} className="text-red-600" />
            <span className="text-sm font-medium text-gray-700">Purchase Orders</span>
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{financialCounts.purchaseOrders}</span>
          </button>
          <button
            onClick={() => navigate(`/financial/invoices?project=${id}`)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <Receipt size={18} className="text-green-600" />
            <span className="text-sm font-medium text-gray-700">Invoices</span>
            <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">{financialCounts.invoices}</span>
          </button>
          <button
            onClick={() => navigate(`/financial/vendor-bills?project=${id}`)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <CreditCard size={18} className="text-red-600" />
            <span className="text-sm font-medium text-gray-700">Vendor Bills</span>
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{financialCounts.bills}</span>
          </button>
          <button
            onClick={() => navigate(`/financial/expenses?project=${id}`)}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
          >
            <ExpenseIcon size={18} className="text-yellow-600" />
            <span className="text-sm font-medium text-gray-700">Expenses</span>
            <span className="bg-yellow-600 text-white text-xs px-2 py-0.5 rounded-full">{financialCounts.expenses}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['overview', 'tasks', 'team', 'financial'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all duration-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card hover glass className="animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Project Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Description:</span>
                  <p className="text-gray-900 mt-1">{project.description || 'No description'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Start Date:</span>
                    <p className="text-gray-900">
                      {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">End Date:</span>
                    <p className="text-gray-900">
                      {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                {project.budget && (
                  <div>
                    <span className="text-sm text-gray-600">Budget:</span>
                    <p className="text-gray-900 font-semibold">{formatCurrency(project.budget)}</p>
                  </div>
                )}
              </div>
            </Card>

          <Card hover glass className="animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Task Completion</span>
                    <span className="font-medium text-gray-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {project.completed_tasks || 0} of {project.tasks_count || 0} tasks completed
                  </p>
                </div>
                {project.budget && financialSummary && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Budget Usage</span>
                      <span className="font-medium text-gray-900">{financialSummary.budget_usage?.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-600 h-4 rounded-full transition-all"
                        style={{ width: `${Math.min(financialSummary.budget_usage || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div>
          <div className="mb-4">
            <p className="text-gray-600">Total Tasks: {tasks.length}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {['New', 'In Progress', 'Blocked', 'Done'].map((status) => {
              const statusTasks = tasks.filter(t => t.status === status);
              return (
                <Card key={status} hover glass className="animate-fade-in">
                  <h4 className="font-semibold mb-3 text-gray-900">{status} ({statusTasks.length})</h4>
                  <div className="space-y-2">
                    {statusTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all duration-300 transform hover:scale-[1.02] border-2 border-transparent hover:border-blue-200"
                        onClick={() => navigate(`/tasks?task=${task.id}`)}
                      >
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'team' && (
          <Card hover glass className="animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
            <Users className="mr-2" size={20} />
            Team Members ({project.members?.length || 0})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {project.members && project.members.length > 0 ? (
              project.members.map((member) => (
                <div key={member.id} className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200 transition-all duration-300 hover:border-blue-300 hover:shadow-md transform hover:scale-[1.02]">
                  <p className="font-medium text-gray-900">{member.full_name}</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {member.role}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No team members assigned</p>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'financial' && financialSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 card-grid">
          <Card hover glass className="animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialSummary.total_revenue)}
                </p>
              </div>
              <Receipt className="text-green-600" size={32} />
            </div>
          </Card>
          <Card hover glass className="animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Costs</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(financialSummary.total_costs)}
                </p>
              </div>
              <DollarSign className="text-red-600" size={32} />
            </div>
          </Card>
          <Card hover glass className="animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Profit</p>
                <p className={`text-2xl font-bold ${
                  financialSummary.profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(financialSummary.profit)}
                </p>
              </div>
              <DollarSign className={financialSummary.profit >= 0 ? 'text-green-600' : 'text-red-600'} size={32} />
            </div>
          </Card>
          <Card hover glass className="animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Usage</p>
                <p className="text-2xl font-bold text-blue-600">
                  {financialSummary.budget_usage?.toFixed(1)}%
                </p>
              </div>
              <FolderKanban className="text-blue-600" size={32} />
            </div>
          </Card>
        </div>
      )}

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        projectId={parseInt(id)}
        onSave={() => {
          fetchTasks();
          setShowTaskModal(false);
        }}
      />
    </div>
  );
};

export default ProjectDetail;

