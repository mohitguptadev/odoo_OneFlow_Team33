import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import InvoiceModal from './InvoiceModal';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import { Receipt, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SmartInvoiceGenerator = ({ projectId, onInvoiceCreated }) => {
  const [completedWork, setCompletedWork] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [quickSuccess, setQuickSuccess] = useState('');

  const { hasRole } = useAuth();
  const canGenerate = hasRole(['Admin', 'Sales', 'Project Manager']);

  useEffect(() => {
    if (projectId) {
      fetchCompletedWorkValue();
    }
  }, [projectId]);

  const fetchCompletedWorkValue = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/invoice-generator/projects/${projectId}/completed-work-value`);
      setCompletedWork(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching completed work value:', error);
      setLoading(false);
    }
  };

  const handleGenerateInvoice = () => {
    if (completedWork && completedWork.total_value > 0) {
      setShowInvoiceModal(true);
    }
  };

  const handleQuickCreate = async () => {
    if (!completedWork || !canGenerate) return;
    try {
      setQuickError('');
      setQuickSuccess('');
      setQuickLoading(true);
      const today = new Date();
      const invoice_date = today.toISOString().split('T')[0];
      const due = new Date(today);
      due.setDate(due.getDate() + 14);
      const due_date = due.toISOString().split('T')[0];

      const payload = {
        customer_name: completedWork.project_name || 'Customer',
        total_amount: completedWork.total_value,
        status: 'Draft',
        invoice_date,
        due_date,
        project_id: projectId,
        sales_order_id: completedWork.sales_orders?.[0]?.id || null,
      };

      const res = await api.post('/financial/invoices', payload);
      setQuickSuccess('Invoice created');
      if (onInvoiceCreated) onInvoiceCreated(res.data);
    } catch (err) {
      console.error('Quick create invoice failed:', err);
      setQuickError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setQuickLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="h-4 w-4 bg-blue-200 rounded"></div>
          <div className="h-4 bg-blue-200 rounded flex-1"></div>
        </div>
      </div>
    );
  }

  if (!completedWork || !completedWork.can_generate || completedWork.total_value === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="bg-green-100 p-3 rounded-lg">
              <Sparkles className="text-green-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <Receipt className="mr-2" size={20} />
                Smart Invoice Suggestion
              </h3>
              <p className="text-gray-700 mb-3">
                You have <span className="font-bold text-green-700 text-xl">
                  {formatCurrency(completedWork.total_value)}
                </span> worth of completed work ready to invoice!
              </p>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="bg-white px-3 py-2 rounded-lg shadow-sm">
                  <span className="text-xs text-gray-500">Labor Value</span>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(completedWork.breakdown.labor_value)}
                  </p>
                </div>
                <div className="bg-white px-3 py-2 rounded-lg shadow-sm">
                  <span className="text-xs text-gray-500">Expenses</span>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(completedWork.breakdown.expenses_value)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <Button
                  variant="primary"
                  onClick={handleGenerateInvoice}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!canGenerate}
                >
                  <Receipt size={18} className="mr-2" />
                  Generate Invoice
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleQuickCreate}
                  className="disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!canGenerate || quickLoading}
                >
                  {quickLoading ? 'Creating...' : 'Quick Create Invoice'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide' : 'Show'} Details
                </Button>
              </div>
              {!canGenerate && (
                <p className="mt-2 text-xs text-gray-500 flex items-center">
                  <AlertCircle size={14} className="mr-1" /> Only Admin, Sales, or Project Manager can generate invoices.
                </p>
              )}
              {quickError && (
                <p className="mt-2 text-xs text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" /> {quickError}
                </p>
              )}
              {quickSuccess && (
                <p className="mt-2 text-xs text-green-700">{quickSuccess}</p>
              )}
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <h4 className="font-semibold text-gray-900 mb-3">Breakdown:</h4>
            
            {completedWork.breakdown.tasks_breakdown.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Completed Tasks:</p>
                <div className="space-y-2">
                  {completedWork.breakdown.tasks_breakdown.map((task, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{task.task_title}</span>
                        <span className="text-gray-600">
                          {task.estimated_hours}h × {formatCurrency(task.hourly_rate)} = {formatCurrency(task.value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedWork.breakdown.expenses_breakdown.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Billable Expenses:</p>
                <div className="space-y-2">
                  {completedWork.breakdown.expenses_breakdown.map((expense, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{expense.type}</span>
                        <span className="text-gray-600">{formatCurrency(expense.amount)}</span>
                      </div>
                      {expense.description && (
                        <p className="text-xs text-gray-500 mt-1">{expense.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        projectId={projectId}
        prefillData={{
          customer_name: completedWork.project_name || 'Customer',
          total_amount: completedWork.total_value,
          sales_order_id: completedWork.sales_orders?.[0]?.id || '',
        }}
        onSave={() => {
          if (onInvoiceCreated) onInvoiceCreated();
          setShowInvoiceModal(false);
        }}
      />
    </>
  );
};

export default SmartInvoiceGenerator;

