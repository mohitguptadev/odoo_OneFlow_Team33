import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../utils/api';

const SalesOrderModal = ({ isOpen, onClose, order, projectId, onSave }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    total_amount: '',
    status: 'Draft',
    order_date: new Date().toISOString().split('T')[0],
    project_id: projectId || '',
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      if (order) {
        setFormData({
          customer_name: order.customer_name || '',
          customer_email: order.customer_email || '',
          total_amount: order.total_amount || '',
          status: order.status || 'Draft',
          order_date: order.order_date || new Date().toISOString().split('T')[0],
          project_id: order.project_id || projectId || '',
        });
      } else {
        setFormData({
          customer_name: '',
          customer_email: '',
          total_amount: '',
          status: 'Draft',
          order_date: new Date().toISOString().split('T')[0],
          project_id: projectId || '',
        });
      }
    }
  }, [isOpen, order, projectId]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...formData,
        total_amount: parseFloat(formData.total_amount),
      };

      if (order) {
        await api.put(`/financial/sales-orders/${order.id}`, data);
      } else {
        await api.post('/financial/sales-orders', data);
      }
      onSave();
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save sales order');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={order ? 'Edit Sales Order' : 'Create Sales Order'} size="md">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!projectId && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Project (Optional)</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Customer Name"
          name="customer_name"
          value={formData.customer_name}
          onChange={handleChange}
          required
        />

        <Input
          label="Customer Email"
          name="customer_email"
          type="email"
          value={formData.customer_email}
          onChange={handleChange}
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            label="Total Amount"
            name="total_amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.total_amount}
            onChange={handleChange}
            required
          />
          <Input
            label="Order Date"
            name="order_date"
            type="date"
            value={formData.order_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SalesOrderModal;

