import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import LogHoursModal from './LogHoursModal';
import api from '../../utils/api';
import { getPriorityColor, getStatusColor, formatDateTime } from '../../utils/helpers';
import { MessageSquare, Paperclip, Clock, User, Calendar } from 'lucide-react';

const TaskDetailModal = ({ isOpen, onClose, taskId, onUpdate }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogHours, setShowLogHours] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    }
  }, [isOpen, taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching task details:', error);
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      fetchTaskDetails();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      await api.put(`/tasks/${task.id}`, { priority: newPriority });
      fetchTaskDetails();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setCommentLoading(true);
      await api.post(`/tasks/${taskId}/comments`, { comment: newComment });
      setNewComment('');
      fetchTaskDetails();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchTaskDetails();
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  if (loading || !task) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="lg">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task details...</p>
        </div>
      </Modal>
    );
  }

  const totalHours = task.timesheets?.reduce((sum, ts) => sum + parseFloat(ts.hours_worked || 0), 0) || 0;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={task.title} size="xl">
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              {task.description && (
                <p className="text-gray-700 mt-3">{task.description}</p>
              )}
            </div>
          </div>

          {/* Task Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {task.due_date && (
              <div className="flex items-center space-x-2 text-sm">
                <Calendar size={18} className="text-gray-400" />
                <span className="text-gray-600">Due:</span>
                <span className="font-medium">{new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
            {task.estimated_hours && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock size={18} className="text-gray-400" />
                <span className="text-gray-600">Estimated:</span>
                <span className="font-medium">{task.estimated_hours} hours</span>
              </div>
            )}
          </div>

          {/* Status and Priority Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Timesheets Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Clock size={18} className="mr-2" />
                Timesheets ({task.timesheets?.length || 0})
              </h3>
              <Button size="sm" variant="primary" onClick={() => setShowLogHours(true)}>
                Log Hours
              </Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {task.timesheets && task.timesheets.length > 0 ? (
                task.timesheets.map((ts) => (
                  <div key={ts.id} className="bg-gray-50 p-3 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{ts.hours_worked} hours</span>
                      <span className="text-gray-500">{new Date(ts.work_date).toLocaleDateString()}</span>
                    </div>
                    {ts.description && <p className="text-gray-600 mt-1">{ts.description}</p>}
                    {ts.is_billable && <span className="text-green-600 text-xs">Billable</span>}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No hours logged yet</p>
              )}
            </div>
            {totalHours > 0 && (
              <p className="text-sm text-gray-600 mt-2">Total: {totalHours.toFixed(2)} hours</p>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 flex items-center mb-3">
              <MessageSquare size={18} className="mr-2" />
              Comments ({task.comments?.length || 0})
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{comment.full_name || 'User'}</span>
                      <span className="text-xs text-gray-500">{formatDateTime(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No comments yet</p>
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="submit" variant="primary" disabled={commentLoading || !newComment.trim()}>
                {commentLoading ? '...' : 'Post'}
              </Button>
            </form>
          </div>

          {/* Attachments Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 flex items-center mb-3">
              <Paperclip size={18} className="mr-2" />
              Attachments ({task.attachments?.length || 0})
            </h3>
            <div className="space-y-2 mb-3">
              {task.attachments && task.attachments.length > 0 ? (
                task.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{attachment.file_name}</span>
                    <a
                      href={`http://localhost:5000${attachment.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Download
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No attachments</p>
              )}
            </div>
            <label className="block">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button type="button" variant="outline" size="sm" as="span">
                Upload File
              </Button>
            </label>
          </div>
        </div>
      </Modal>

      <LogHoursModal
        isOpen={showLogHours}
        onClose={() => setShowLogHours(false)}
        taskId={taskId}
        onSave={() => {
          fetchTaskDetails();
          if (onUpdate) onUpdate();
        }}
      />
    </>
  );
};

export default TaskDetailModal;

