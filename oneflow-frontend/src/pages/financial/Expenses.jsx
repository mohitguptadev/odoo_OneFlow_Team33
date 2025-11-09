import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ExpenseModal from '../../components/financial/ExpenseModal';
import api from '../../utils/api';
import { formatCurrency, getStatusColor, formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Check, X } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const { hasRole, user } = useAuth();

  useEffect(() => {
    fetchExpenses();
  }, [filterStatus, projectId]);

  const fetchExpenses = async () => {
    try {
      const params = {};
      if (projectId) params.project_id = projectId;
      if (filterStatus !== 'All') params.status = filterStatus;
      const response = await api.get('/financial/expenses', { params });
      setExpenses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/financial/expenses/${id}/approve`);
      fetchExpenses();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/financial/expenses/${id}/reject`);
      fetchExpenses();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredExpenses = expenses.filter(exp =>
    searchTerm === '' ||
    exp.expense_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-6"><div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/4"></div></div></div>;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen page-transition">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expenses</h1>
          <p className="text-gray-600">Track and manage expenses</p>
        </div>
        <Button variant="primary" onClick={() => { setSelectedExpense(null); setShowModal(true); }}>
          <Plus size={18} className="mr-2" />Submit Expense
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['All', 'Pending', 'Approved', 'Rejected', 'Reimbursed'].map((status) => (
            <button key={status} onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                filterStatus === status 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow-md'
              }`}>{status}</button>
          ))}
        </div>
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all duration-300 hover:border-gray-300" />
        </div>
      </div>

      <Card hover glass className="animate-fade-in">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billable</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.expense_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">User {expense.submitted_by}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(expense.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(expense.expense_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {expense.is_billable ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(expense.status)}`}>{expense.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {hasRole(['Admin', 'Project Manager']) && expense.status === 'Pending' && (
                      <>
                        <button onClick={() => handleApprove(expense.id)} className="text-green-600 hover:text-green-800 flex items-center">
                          <Check size={16} className="mr-1" />Approve
                        </button>
                        <button onClick={() => handleReject(expense.id)} className="text-red-600 hover:text-red-800 flex items-center">
                          <X size={16} className="mr-1" />Reject
                        </button>
                      </>
                    )}
                    {expense.receipt_url && (
                      <a href={`http://localhost:5000${expense.receipt_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Receipt</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExpenses.length === 0 && <div className="text-center py-12"><p className="text-gray-500">No expenses found</p></div>}
        </div>
      </Card>

      <ExpenseModal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedExpense(null); }}
        expense={selectedExpense} projectId={projectId ? parseInt(projectId) : null} onSave={fetchExpenses} />
    </div>
  );
};

export default Expenses;

