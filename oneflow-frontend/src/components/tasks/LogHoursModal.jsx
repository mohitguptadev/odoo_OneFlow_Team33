import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../utils/api';

const LogHoursModal = ({ isOpen, onClose, taskId, onSave, projectId }) => {
  const [formData, setFormData] = useState({
    hours_worked: '',
    work_date: new Date().toISOString().split('T')[0],
    description: '',
    is_billable: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!taskId) {
      setError('Please select a task first');
      return;
    }

    setLoading(true);

    try {
      await api.post('/financial/timesheets', {
        task_id: taskId,
        ...formData,
        hours_worked: parseFloat(formData.hours_worked),
      });
      onSave();
      onClose();
      setFormData({
        hours_worked: '',
        work_date: new Date().toISOString().split('T')[0],
        description: '',
        is_billable: true,
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to log hours');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Hours" size="sm">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Input
          label="Hours Worked"
          name="hours_worked"
          type="number"
          step="0.25"
          min="0.25"
          value={formData.hours_worked}
          onChange={handleChange}
          required
        />

        <Input
          label="Work Date"
          name="work_date"
          type="date"
          value={formData.work_date}
          onChange={handleChange}
          required
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What did you work on?"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_billable"
              checked={formData.is_billable}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Billable</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Logging...' : 'Log Hours'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LogHoursModal;

