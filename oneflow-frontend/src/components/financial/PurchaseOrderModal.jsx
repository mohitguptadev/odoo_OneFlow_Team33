import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../utils/api';

const PurchaseOrderModal = ({ isOpen, onClose, order, projectId, onSave }) => {
  const [formData, setFormData] = useState({
    vendor_name: '', vendor_email: '', total_amount: '', status: 'Draft',
    order_date: new Date().toISOString().split('T')[0], project_id: projectId || '',
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      if (order) {
        setFormData({ vendor_name: order.vendor_name || '', vendor_email: order.vendor_email || '',
          total_amount: order.total_amount || '', status: order.status || 'Draft',
          order_date: order.order_date || new Date().toISOString().split('T')[0],
          project_id: order.project_id || projectId || '', });
      } else {
        setFormData({ vendor_name: '', vendor_email: '', total_amount: '', status: 'Draft',
          order_date: new Date().toISOString().split('T')[0], project_id: projectId || '', });
      }
    }
  }, [isOpen, order, projectId]);

  const fetchProjects = async () => {
    try { const response = await api.get('/projects'); setProjects(response.data); }
    catch (error) { console.error('Error fetching projects:', error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const data = { ...formData, total_amount: parseFloat(formData.total_amount) };
      if (order) await api.put(`/financial/purchase-orders/${order.id}`, data);
      else await api.post('/financial/purchase-orders', data);
      onSave(); onClose();
    } catch (error) { setError(error.response?.data?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={order ? 'Edit Purchase Order' : 'Create Purchase Order'} size="md">
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
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
        <Input label="Vendor Name" name="vendor_name" value={formData.vendor_name}
          onChange={(e) => setFormData({...formData, vendor_name: e.target.value})} required />
        <Input label="Vendor Email" name="vendor_email" type="email" value={formData.vendor_email}
          onChange={(e) => setFormData({...formData, vendor_email: e.target.value})} />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label="Total Amount" name="total_amount" type="number" step="0.01" min="0" value={formData.total_amount}
            onChange={(e) => setFormData({...formData, total_amount: e.target.value})} required />
          <Input label="Order Date" name="order_date" type="date" value={formData.order_date}
            onChange={(e) => setFormData({...formData, order_date: e.target.value})} required />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select name="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Received">Received</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default PurchaseOrderModal;

