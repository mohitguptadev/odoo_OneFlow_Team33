import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../utils/api';

const TaskModal = ({ isOpen, onClose, task, projectId, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: projectId || '',
    assigned_to: '',
    status: 'New',
    priority: 'Medium',
    due_date: '',
    estimated_hours: '',
  });
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      fetchUsers();
      if (task) {
        setFormData({
          title: task.title || '',
          description: task.description || '',
          project_id: task.project_id || projectId || '',
          assigned_to: task.assigned_to || '',
          status: task.status || 'New',
          priority: task.priority || 'Medium',
          due_date: task.due_date || '',
          estimated_hours: task.estimated_hours || '',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          project_id: projectId || '',
          assigned_to: '',
          status: 'New',
          priority: 'Medium',
          due_date: '',
          estimated_hours: '',
        });
      }
    }
  }, [isOpen, task, projectId]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.title.trim()) {
        setError('Task title is required');
        setLoading(false);
        return;
      }

      // If projectId is not provided in props, it must be selected
      if (!projectId && (!formData.project_id || formData.project_id === '')) {
        setError('Project is required');
        setLoading(false);
        return;
      }

      // Prepare data - convert empty strings to null for optional fields
      const data = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        project_id: projectId || (formData.project_id && formData.project_id !== '' ? parseInt(formData.project_id) : null),
        assigned_to: formData.assigned_to && formData.assigned_to !== '' ? parseInt(formData.assigned_to) : null,
        status: formData.status || 'New',
        priority: formData.priority || 'Medium',
        due_date: formData.due_date && formData.due_date !== '' ? formData.due_date : null,
        estimated_hours: formData.estimated_hours && formData.estimated_hours !== '' 
          ? parseFloat(formData.estimated_hours) 
          : null,
      };

      // Validate estimated_hours if provided
      if (data.estimated_hours !== null && (isNaN(data.estimated_hours) || data.estimated_hours < 0)) {
        setError('Estimated hours must be a valid positive number');
        setLoading(false);
        return;
      }

      console.log('Submitting task:', data);

      let response;
      if (task) {
        response = await api.put(`/tasks/${task.id}`, data);
      } else {
        response = await api.post('/tasks', data);
      }
      
      console.log('Task saved successfully:', response.data);
      onSave();
      onClose();
    } catch (error) {
      console.error('Task submission error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to save task';
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'Create Task'} size="md">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <Input
          label="Task Title"
          name="title"
          value={formData.title}
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
          />
        </div>

        {!projectId && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              required={!projectId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            label="Due Date"
            name="due_date"
            type="date"
            value={formData.due_date}
            onChange={handleChange}
          />
          <Input
            label="Estimated Hours"
            name="estimated_hours"
            type="number"
            step="0.5"
            value={formData.estimated_hours}
            onChange={handleChange}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign To
          </label>
          <select
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Unassigned</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.full_name} ({user.role})</option>
            ))}
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

export default TaskModal;

