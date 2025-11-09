import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../utils/api';

const ExpenseModal = ({ isOpen, onClose, expense, projectId, onSave }) => {
  const [formData, setFormData] = useState({
    expense_type: 'Travel', amount: '', description: '',
    expense_date: new Date().toISOString().split('T')[0], is_billable: false,
    project_id: projectId || '',
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      if (expense) {
        setFormData({ expense_type: expense.expense_type || 'Travel', amount: expense.amount || '',
          description: expense.description || '', expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
          is_billable: expense.is_billable || false, project_id: expense.project_id || projectId || '', });
      } else {
        setFormData({ expense_type: 'Travel', amount: '', description: '',
          expense_date: new Date().toISOString().split('T')[0], is_billable: false,
          project_id: projectId || '', });
      }
    }
  }, [isOpen, expense, projectId]);

  const fetchProjects = async () => {
    try { const response = await api.get('/projects'); setProjects(response.data); }
    catch (error) { console.error('Error:', error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const data = { ...formData, amount: parseFloat(formData.amount) };
      if (expense) await api.put(`/financial/expenses/${expense.id}`, data);
      else await api.post('/financial/expenses', data);
      onSave(); onClose();
    } catch (error) { setError(error.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={expense ? 'Edit Expense' : 'Submit Expense'} size="md">
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
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type</label>
          <select name="expense_type" value={formData.expense_type} onChange={(e) => setFormData({...formData, expense_type: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="Travel">Travel</option>
            <option value="Equipment">Equipment</option>
            <option value="Supplies">Supplies</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label="Amount" name="amount" type="number" step="0.01" min="0" value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
          <Input label="Expense Date" name="expense_date" type="date" value={formData.expense_date}
            onChange={(e) => setFormData({...formData, expense_date: e.target.value})} required />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input type="checkbox" name="is_billable" checked={formData.is_billable}
              onChange={(e) => setFormData({...formData, is_billable: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="ml-2 text-sm text-gray-700">Billable to customer</span>
          </label>
        </div>
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseModal;

