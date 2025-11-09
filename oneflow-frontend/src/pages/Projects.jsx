import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import ProjectModal from "../components/projects/ProjectModal";
import api from "../utils/api";
import {
  formatCurrency,
  getStatusColor,
  calculateProgress,
} from "../utils/helpers";
import { useAuth } from "../context/AuthContext";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    try {
      const params = filter !== "All" ? { status: filter } : {};
      const response = await api.get("/projects", { params });
      setProjects(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen page-transition">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">Manage and track your projects</p>
        </div>
        {hasRole(["Admin", "Project Manager"]) && (
          <Button
            variant="primary"
            onClick={() => {
              setSelectedProject(null);
              setShowModal(true);
            }}
          >
            Create Project
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {["All", "Planned", "In Progress", "Completed", "On Hold"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === status
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all duration-300 hover:border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 card-grid">
        {projects
          .filter(project => 
            searchTerm === '' || 
            project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map((project) => (
          <Card
            key={project.id}
            hover
            glass
            className="cursor-pointer animate-fade-in"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {project.name}
              </h3>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                  project.status
                )}`}
              >
                {project.status}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>
            {project.tasks_count > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>
                    {calculateProgress(
                      project.completed_tasks || 0,
                      project.tasks_count
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${calculateProgress(
                        project.completed_tasks || 0,
                        project.tasks_count
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {project.budget && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(project.budget)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Start Date:</span>
                <span className="text-gray-900">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
            {hasRole(["Admin", "Project Manager"]) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProject(project);
                    setShowModal(true);
                  }}
                  className="w-full"
                >
                  Edit Project
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <ProjectModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onSave={() => {
          fetchProjects();
        }}
      />

      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No projects found. Create your first project to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default Projects;
