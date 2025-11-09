import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../utils/api';

const VendorBillModal = ({ isOpen, onClose, bill, projectId, onSave }) => {
  const [formData, setFormData] = useState({
    vendor_name: '', total_amount: '', status: 'Received',
    bill_date: new Date().toISOString().split('T')[0], due_date: '',
    project_id: projectId || '', purchase_order_id: '',
  });
  const [projects, setProjects] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      // Fetch purchase orders if projectId is provided as prop
      if (projectId) {
        fetchPurchaseOrders(projectId);
      }
      if (bill) {
        setFormData({ vendor_name: bill.vendor_name || '', total_amount: bill.total_amount || '',
          status: bill.status || 'Received', bill_date: bill.bill_date || new Date().toISOString().split('T')[0],
          due_date: bill.due_date || '', project_id: bill.project_id || projectId || '',
          purchase_order_id: bill.purchase_order_id || '', });
        // If bill has a project_id, fetch purchase orders for it
        if (bill.project_id) {
          fetchPurchaseOrders(bill.project_id);
        }
      } else {
        setFormData({ vendor_name: '', total_amount: '', status: 'Received',
          bill_date: new Date().toISOString().split('T')[0], due_date: '',
          project_id: projectId || '', purchase_order_id: '', });
      }
    } else {
      // Reset purchase orders when modal closes
      setPurchaseOrders([]);
    }
  }, [isOpen, bill, projectId]);

  // Fetch purchase orders when project is selected from dropdown
  useEffect(() => {
    if (isOpen && formData.project_id && formData.project_id !== '') {
      fetchPurchaseOrders(formData.project_id);
    } else if (isOpen && (!formData.project_id || formData.project_id === '')) {
      // Clear purchase orders if no project is selected
      setPurchaseOrders([]);
      setFormData(prev => ({ ...prev, purchase_order_id: '' }));
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

  const fetchPurchaseOrders = async (projId) => {
    try { 
      setLoadingOrders(true);
      console.log('Fetching purchase orders for project:', projId);
      const response = await api.get('/financial/purchase-orders', { params: { project_id: projId } }); 
      console.log('Purchase orders received:', response.data);
      setPurchaseOrders(response.data || []); 
    } catch (error) { 
      console.error('Error fetching purchase orders:', error); 
      setPurchaseOrders([]);
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
      if (!formData.vendor_name || !formData.total_amount || !formData.bill_date) {
        setError('Vendor name, total amount, and bill date are required');
        setLoading(false);
        return;
      }

      // Prepare data - convert empty strings to null for optional fields
      const data = {
        vendor_name: formData.vendor_name.trim(),
        total_amount: parseFloat(formData.total_amount),
        status: formData.status || 'Received',
        bill_date: formData.bill_date,
        due_date: formData.due_date || null,
        project_id: formData.project_id && formData.project_id !== '' ? parseInt(formData.project_id) : null,
        purchase_order_id: formData.purchase_order_id && formData.purchase_order_id !== '' ? parseInt(formData.purchase_order_id) : null,
      };

      // Validate total_amount is a valid number
      if (isNaN(data.total_amount) || data.total_amount <= 0) {
        setError('Total amount must be a valid positive number');
        setLoading(false);
        return;
      }

      console.log('Submitting vendor bill:', data);
      
      let response;
      if (bill) {
        response = await api.put(`/financial/vendor-bills/${bill.id}`, data);
      } else {
        response = await api.post('/financial/vendor-bills', data);
      }
      
      console.log('Vendor bill saved successfully:', response.data);
      onSave();
      onClose();
    } catch (error) {
      console.error('Vendor bill submission error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to save vendor bill';
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
    <Modal isOpen={isOpen} onClose={onClose} title={bill ? 'Edit Vendor Bill' : 'Create Vendor Bill'} size="md">
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
              Purchase Order (Optional)
              {loadingOrders && <span className="ml-2 text-xs text-gray-500">Loading...</span>}
            </label>
            <select 
              name="purchase_order_id" 
              value={formData.purchase_order_id} 
              onChange={(e) => setFormData({...formData, purchase_order_id: e.target.value})}
              disabled={loadingOrders}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingOrders ? 'Loading purchase orders...' : 'None'}
              </option>
              {purchaseOrders.map(po => (
                <option key={po.id} value={po.id}>
                  {po.po_number} {po.vendor_name ? `- ${po.vendor_name}` : ''}
                </option>
              ))}
            </select>
            {!loadingOrders && purchaseOrders.length === 0 && formData.project_id && (
              <p className="mt-1 text-xs text-gray-500">No purchase orders found for this project</p>
            )}
          </div>
        )}
        <Input label="Vendor Name" name="vendor_name" value={formData.vendor_name}
          onChange={(e) => setFormData({...formData, vendor_name: e.target.value})} required />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label="Total Amount" name="total_amount" type="number" step="0.01" min="0" value={formData.total_amount}
            onChange={(e) => setFormData({...formData, total_amount: e.target.value})} required />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Received">Received</option>
              <option value="In Payment">In Payment</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label="Bill Date" name="bill_date" type="date" value={formData.bill_date}
            onChange={(e) => setFormData({...formData, bill_date: e.target.value})} required />
          <Input label="Due Date" name="due_date" type="date" value={formData.due_date}
            onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
        </div>
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default VendorBillModal;

