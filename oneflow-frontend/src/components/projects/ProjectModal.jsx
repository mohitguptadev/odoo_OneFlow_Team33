import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import api from "../../utils/api";

const ProjectModal = ({ isOpen, onClose, project, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Planned",
    start_date: "",
    end_date: "",
    budget: "",
    project_manager_id: "",
    member_ids: [],
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (project) {
        setFormData({
          name: project.name || "",
          description: project.description || "",
          status: project.status || "Planned",
          start_date: project.start_date || "",
          end_date: project.end_date || "",
          budget: project.budget || "",
          project_manager_id: project.project_manager_id || "",
          member_ids: project.members?.map((m) => m.id) || [],
        });
      } else {
        setFormData({
          name: "",
          description: "",
          status: "Planned",
          start_date: "",
          end_date: "",
          budget: "",
          project_manager_id: "",
          member_ids: [],
        });
      }
    }
  }, [isOpen, project]);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      };

      if (project) {
        await api.put(`/projects/${project.id}`, data);
      } else {
        await api.post("/projects", data);
      }
      onSave();
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to save project");
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

  const handleMemberToggle = (userId) => {
    setFormData({
      ...formData,
      member_ids: formData.member_ids.includes(userId)
        ? formData.member_ids.filter((id) => id !== userId)
        : [...formData.member_ids, userId],
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? "Edit Project" : "Create Project"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Input
          label="Project Name"
          name="name"
          value={formData.name}
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
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            label="Start Date"
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
          />
          <Input
            label="End Date"
            name="end_date"
            type="date"
            value={formData.end_date}
            onChange={handleChange}
          />
        </div>

        <Input
          label="Budget"
          name="budget"
          type="number"
          step="0.01"
          value={formData.budget}
          onChange={handleChange}
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Manager
          </label>
          <select
            name="project_manager_id"
            value={formData.project_manager_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Project Manager</option>
            {users
              .filter((u) => u.role === "Project Manager" || u.role === "Admin")
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Members
          </label>
          <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
            {users.map((user) => (
              <label key={user.id} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  checked={formData.member_ids.includes(user.id)}
                  onChange={() => handleMemberToggle(user.id)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">
                  {user.full_name} ({user.role})
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectModal;
