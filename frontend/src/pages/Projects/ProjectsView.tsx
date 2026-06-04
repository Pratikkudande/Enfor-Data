import React, { useEffect, useState } from 'react';
import { Plus, Search, Briefcase } from 'lucide-react';
import { Project } from '../../types';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProjectCard from './ProjectCard';
import ProjectFormModal from './ProjectFormModal';
import ProjectViewModal from './ProjectViewModal';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'launched', label: 'Launched' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'ready', label: 'Ready' },
  { value: 'sold_out', label: 'Sold Out' },
];

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed', label: 'Mixed' },
];

const ProjectsView: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isChannelPartner = user?.role === 'channel_partner';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = isChannelPartner
        ? await apiClient.getMyProjects()
        : await apiClient.getAllProjects();
      setProjects(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const showTimedSuccess = (msg: string) => {
    setSuccessMessage(msg);
    window.setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCreate = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
    setShowFormModal(false);
    showTimedSuccess('Project created successfully!');
  };

  const handleUpdate = (project: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    setSelectedProject(project);
    setShowFormModal(false);
    showTimedSuccess('Project updated successfully!');
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await apiClient.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setShowViewModal(false);
      setSelectedProject(null);
      showTimedSuccess('Project deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleView = (project: Project) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setFormMode('edit');
    setShowFormModal(true);
  };

  const handleOpenCreate = () => {
    setSelectedProject(null);
    setFormMode('create');
    setShowFormModal(true);
  };

  const filtered = projects.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.builder_name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchType = filterType === 'all' || p.project_type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const activeCount = projects.filter((p) => p.status === 'launched' || p.status === 'under_construction').length;
  const upcomingCount = projects.filter((p) => p.status === 'upcoming').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isChannelPartner ? 'My Projects' : 'Projects'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {projects.length} total
            {' · '}
            <span className="text-blue-600 font-medium">{activeCount} active</span>
            {' · '}
            <span className="text-yellow-600 font-medium">{upcomingCount} upcoming</span>
          </p>
        </div>
        {isChannelPartner && (
          <button
            onClick={handleOpenCreate}
            className="mt-4 sm:mt-0 btn-primary px-4 py-2 flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by project name, builder, city…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchProjects} className="underline ml-4">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? 'No projects match your filters'
              : 'No projects yet'}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? 'Try adjusting your search or filters.'
              : isChannelPartner
              ? 'Add your first project to start showcasing it to brokers.'
              : 'No projects have been listed yet.'}
          </p>
          {isChannelPartner && !(searchTerm || filterStatus !== 'all' || filterType !== 'all') && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Project
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isOwner={isChannelPartner && project.channel_partner_id === user?.id}
              isBusy={actionLoadingId === project.id}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <ProjectFormModal
          mode={formMode}
          project={selectedProject}
          onClose={() => setShowFormModal(false)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}

      {/* View Modal */}
      {showViewModal && selectedProject && (
        <ProjectViewModal
          project={selectedProject}
          isOwner={isChannelPartner && selectedProject.channel_partner_id === user?.id}
          isBusy={actionLoadingId === selectedProject.id}
          onClose={() => setShowViewModal(false)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Success toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 text-sm">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default ProjectsView;
