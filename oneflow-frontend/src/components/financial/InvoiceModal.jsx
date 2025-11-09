import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../utils/api';

// Helpers for date formatting and default due date suggestion (+14 days)
const formatDate = (d) => new Date(d).toISOString().split('T')[0];
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};
const todayStr = formatDate(new Date());
const defaultDueStr = addDays(todayStr, 14);

const InvoiceModal = ({ isOpen, onClose, invoice, projectId, onSave, prefillData }) => {
  const [formData, setFormData] = useState({
    customer_name: '', total_amount: '', status: 'Draft',
    invoice_date: todayStr, due_date: defaultDueStr,
    project_id: projectId || '', sales_order_id: '',
  });
  const [projects, setProjects] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      // Fetch sales orders if projectId is provided as prop
      if (projectId) {
        fetchSalesOrders(projectId);
      }
      if (invoice) {
        const invDate = invoice.invoice_date || todayStr;
        setFormData({ customer_name: invoice.customer_name || '', total_amount: invoice.total_amount || '',
          status: invoice.status || 'Draft', invoice_date: invDate,
          // If due_date not present, suggest +14 days from invoice_date
          due_date: invoice.due_date || addDays(invDate, 14), project_id: invoice.project_id || projectId || '',
          sales_order_id: invoice.sales_order_id || '', });
        // If invoice has a project_id, fetch sales orders for it
        if (invoice.project_id) {
          fetchSalesOrders(invoice.project_id);
        }
      } else if (prefillData) {
        // Prefill from smart invoice generator
        const invDate = todayStr;
        setFormData({ 
          customer_name: prefillData.customer_name || '', 
          total_amount: prefillData.total_amount || '', 
          status: 'Draft',
          invoice_date: invDate, 
          due_date: addDays(invDate, 14),
          project_id: projectId || '', 
          sales_order_id: prefillData.sales_order_id || '', 
        });
        if (projectId) {
          fetchSalesOrders(projectId);
        }
      } else {
        const invDate = todayStr;
        setFormData({ customer_name: '', total_amount: '', status: 'Draft',
          invoice_date: invDate, due_date: addDays(invDate, 14),
          project_id: projectId || '', sales_order_id: '', });
      }
    } else {
      // Reset sales orders when modal closes
      setSalesOrders([]);
    }
  }, [isOpen, invoice, projectId, prefillData]);

  // Fetch sales orders when project is selected from dropdown
  useEffect(() => {
    if (isOpen && formData.project_id && formData.project_id !== '') {
      fetchSalesOrders(formData.project_id);
    } else if (isOpen && (!formData.project_id || formData.project_id === '')) {
      // Clear sales orders if no project is selected
      setSalesOrders([]);
      setFormData(prev => ({ ...prev, sales_order_id: '' }));
    }
  }, [formData.project_id, isOpen]);

  const fetchProjects = async () => {
    try { 
      const response = await api.get('/projects'); 
      setProjects(response.data); 
    } catch (error) { 
      console.error('Error fetching projects:', error); 
    }
  };

  const fetchSalesOrders = async (projId) => {
    try { 
      setLoadingOrders(true);
      console.log('Fetching sales orders for project:', projId);
      const response = await api.get('/financial/sales-orders', { params: { project_id: projId } }); 
      console.log('Sales orders received:', response.data);
      setSalesOrders(response.data || []); 
    } catch (error) { 
      console.error('Error fetching sales orders:', error); 
      setSalesOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.customer_name || !formData.total_amount || !formData.invoice_date) {
        setError('Customer name, total amount, and invoice date are required');
        setLoading(false);
        return;
      }

      // Prepare data - convert empty strings to null for optional fields
      const data = {
        customer_name: formData.customer_name.trim(),
        total_amount: parseFloat(formData.total_amount),
        status: formData.status || 'Draft',
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        project_id: formData.project_id && formData.project_id !== '' ? parseInt(formData.project_id) : null,
        sales_order_id: formData.sales_order_id && formData.sales_order_id !== '' ? parseInt(formData.sales_order_id) : null,
      };

      // Validate total_amount is a valid number
      if (isNaN(data.total_amount) || data.total_amount <= 0) {
        setError('Total amount must be a valid positive number');
        setLoading(false);
        return;
      }

      console.log('Submitting invoice:', data);
      
      let response;
      if (invoice) {
        response = await api.put(`/financial/invoices/${invoice.id}`, data);
      } else {
        response = await api.post('/financial/invoices', data);
      }
      
      console.log('Invoice saved successfully:', response.data);
      onSave();
      onClose();
    } catch (error) {
      console.error('Invoice submission error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to save invoice';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = `${error.response.data.error || 'Error'}: ${error.response.data.details}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={invoice ? 'Edit Invoice' : 'Create Invoice'} size="md">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">{error}</p>
          </div>
        )}
        {!projectId && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select name="project_id" value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Project (Optional)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        {formData.project_id && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sales Order (Optional)
              {loadingOrders && <span className="ml-2 text-xs text-gray-500">Loading...</span>}
            </label>
            <select 
              name="sales_order_id" 
              value={formData.sales_order_id} 
              onChange={(e) => setFormData({...formData, sales_order_id: e.target.value})}
              disabled={loadingOrders}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingOrders ? 'Loading sales orders...' : 'None'}
              </option>
              {salesOrders.map(so => (
                <option key={so.id} value={so.id}>
                  {so.so_number} {so.customer_name ? `- ${so.customer_name}` : ''}
                </option>
              ))}
            </select>
            {!loadingOrders && salesOrders.length === 0 && formData.project_id && (
              <p className="mt-1 text-xs text-gray-500">No sales orders found for this project</p>
            )}
          </div>
        )}
        <Input label="Customer Name" name="customer_name" value={formData.customer_name}
          onChange={(e) => setFormData({...formData, customer_name: e.target.value})} required />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label="Total Amount" name="total_amount" type="number" step="0.01" min="0" value={formData.total_amount}
            onChange={(e) => setFormData({...formData, total_amount: e.target.value})} required />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label="Invoice Date" name="invoice_date" type="date" value={formData.invoice_date}
            onChange={(e) => setFormData({...formData, invoice_date: e.target.value, due_date: formData.due_date || addDays(e.target.value, 14)})} required />
          <div>
            <Input label="Due Date" name="due_date" type="date" value={formData.due_date}
              onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
            <p className="mt-1 text-xs text-gray-500">Defaulted to 14 days after invoice date. You can change this.</p>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default InvoiceModal;

