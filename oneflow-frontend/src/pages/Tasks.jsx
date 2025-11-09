import React, { useEffect, useState } from "react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import TaskModal from "../components/tasks/TaskModal";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import api from "../utils/api";
import { getPriorityColor, getStatusColor } from "../utils/helpers";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [showMyTasks]);

  const fetchTasks = async () => {
    try {
      const endpoint = showMyTasks ? "/tasks/my-tasks" : "/tasks";
      const response = await api.get(endpoint);
      setTasks(response.data);
      setLoading(false);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setLoading(false);
    }
  };

  const groupTasksByStatus = (tasks) => {
    const groups = {
      New: [],
      "In Progress": [],
      Blocked: [],
      Done: [],
    };

    tasks.forEach((task) => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });

    return groups;
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      await api.put(`/tasks/${draggedTask.id}`, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
    setDraggedTask(null);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task.id);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        </div>
      </div>
    );
  }

  const taskGroups = groupTasksByStatus(tasks);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen page-transition">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tasks</h1>
          <p className="text-gray-600">Manage your tasks and track progress</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowMyTasks(!showMyTasks)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showMyTasks
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {showMyTasks ? "All Tasks" : "My Tasks"}
          </button>
          <Button variant="primary" onClick={() => setShowTaskModal(true)}>Create Task</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Object.entries(taskGroups).map(([status, statusTasks]) => (
          <div
            key={status}
            className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 min-h-[400px] border-2 border-gray-200 transition-all duration-300 hover:border-gray-300"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <h3 className="font-semibold text-gray-700 mb-4">
              {status} ({statusTasks.length})
            </h3>
            <div className="space-y-3">
              {statusTasks.map((task) => (
                <Card
                  key={task.id}
                  hover
                  glass
                  className="p-4 cursor-pointer animate-fade-in"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onClick={() => handleTaskClick(task)}
                >
                  <h4 className="font-medium text-gray-900 mb-2">
                    {task.title}
                  </h4>
                  <div className="flex items-center justify-between mt-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="text-xs text-gray-500">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
              {statusTasks.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSave={() => {
          fetchTasks();
          setShowTaskModal(false);
        }}
      />

      <TaskDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTask(null);
        }}
        taskId={selectedTask}
        onUpdate={fetchTasks}
      />
    </div>
  );
};

export default Tasks;
