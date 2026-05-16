import React, { useEffect, useState } from 'react';
import {
  Briefcase, TrendingUp, Home, CheckCircle,
  Clock, XCircle, Plus, ArrowRight, Building2,
  MapPin, IndianRupee
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../routes/routePaths';
import StatsCard from './StatsCard';
import { formatPrice, statusConfig } from '../Projects/utils';

interface ProjectStats {
  total: number;
  active: number;       // launched + under_construction
  upcoming: number;
  ready: number;
  sold_out: number;
  totalUnits: number;
  availableUnits: number;
  soldUnits: number;
}

const ChannelPartnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.getMyProjects();
        setProjects(res.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats: ProjectStats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'launched' || p.status === 'under_construction').length,
    upcoming: projects.filter((p) => p.status === 'upcoming').length,
    ready: projects.filter((p) => p.status === 'ready').length,
    sold_out: projects.filter((p) => p.status === 'sold_out').length,
    totalUnits: projects.reduce((s, p) => s + p.total_units, 0),
    availableUnits: projects.reduce((s, p) => s + p.available_units, 0),
    soldUnits: projects.reduce((s, p) => s + (p.total_units - p.available_units), 0),
  };

  const overallSoldPct = stats.totalUnits > 0
    ? Math.round((stats.soldUnits / stats.totalUnits) * 100)
    : 0;

  // Recent 4 projects
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  // Status breakdown for the donut-style list
  const statusBreakdown = [
    { key: 'launched',           label: 'Launched',           count: projects.filter((p) => p.status === 'launched').length,           color: 'bg-blue-500' },
    { key: 'under_construction', label: 'Under Construction', count: projects.filter((p) => p.status === 'under_construction').length, color: 'bg-orange-400' },
    { key: 'upcoming',           label: 'Upcoming',           count: stats.upcoming,  color: 'bg-yellow-400' },
    { key: 'ready',              label: 'Ready',              count: stats.ready,     color: 'bg-green-500'  },
    { key: 'sold_out',           label: 'Sold Out',           count: stats.sold_out,  color: 'bg-gray-400'   },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1">
              Welcome back, {user?.name?.split(' ')[0] ?? 'Partner'}!
            </h1>
            <p className="text-indigo-100 text-sm">
              {user?.company_name ?? user?.firm_name
                ? `${user.company_name ?? user.firm_name} · `
                : ''}
              {user?.city}{user?.state ? `, ${user.state}` : ''}
            </p>
          </div>
          <button
            onClick={() => navigate(ROUTES.PROJECTS)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Projects"
          value={loading ? '—' : stats.total}
          icon={Briefcase}
          color="purple"
          subtitle="All your listings"
        />
        <StatsCard
          title="Active Projects"
          value={loading ? '—' : stats.active}
          icon={TrendingUp}
          color="blue"
          subtitle="Launched + Under construction"
        />
        <StatsCard
          title="Available Units"
          value={loading ? '—' : stats.availableUnits}
          icon={Home}
          color="green"
          subtitle={`of ${stats.totalUnits} total units`}
        />
        <StatsCard
          title="Units Sold"
          value={loading ? '—' : `${overallSoldPct}%`}
          icon={CheckCircle}
          color="orange"
          subtitle={`${stats.soldUnits} units across all projects`}
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Projects by Status</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : stats.total === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No projects yet</div>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map((s) => {
                const pct = stats.total > 0 ? Math.round((s.count / stats.total) * 100) : 0;
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 text-gray-700">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                        {s.label}
                      </span>
                      <span className="font-semibold text-gray-900">{s.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${s.color} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overall inventory meter */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Overall Inventory</h3>
          {loading ? (
            <div className="space-y-4">
              <div className="h-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : stats.totalUnits === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No units data yet</div>
          ) : (
            <>
              {/* Big circular-style display */}
              <div className="flex items-center justify-around mb-5">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUnits}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Units</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.availableUnits}</p>
                  <p className="text-xs text-gray-500 mt-1">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.soldUnits}</p>
                  <p className="text-xs text-gray-500 mt-1">Sold / Booked</p>
                </div>
              </div>
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Sold</span>
                  <span>{overallSoldPct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all"
                    style={{ width: `${overallSoldPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span>{stats.totalUnits}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent projects */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Recent Projects</h3>
          <button
            onClick={() => navigate(ROUTES.PROJECTS)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-sm text-gray-500 mb-3">No projects listed yet</p>
            <button
              onClick={() => navigate(ROUTES.PROJECTS)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add your first project
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentProjects.map((project) => {
              const sc = statusConfig[project.status] ?? statusConfig.upcoming;
              const soldPct = project.total_units > 0
                ? Math.round(((project.total_units - project.available_units) / project.total_units) * 100)
                : 0;
              return (
                <div
                  key={project.id}
                  onClick={() => navigate(ROUTES.PROJECTS)}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100"
                >
                  {/* Color dot */}
                  <div className={`w-2 h-10 rounded-full flex-shrink-0 ${sc.bar}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{project.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${sc.badge}`}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{project.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />{project.builder_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {formatPrice(project.price_range_min)}+
                      </span>
                    </div>
                  </div>

                  {/* Units mini bar */}
                  <div className="w-20 flex-shrink-0 hidden sm:block">
                    <p className="text-xs text-gray-400 mb-1 text-right">{soldPct}% sold</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${soldPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 text-right">
                      {project.available_units} left
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Add Project',    icon: Plus,        color: 'bg-indigo-600 hover:bg-indigo-700 text-white', route: ROUTES.PROJECTS },
          { label: 'View Projects',  icon: Briefcase,   color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', route: ROUTES.PROJECTS },
          { label: 'Broker Network', icon: TrendingUp,  color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200', route: ROUTES.NETWORK },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${action.color}`}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChannelPartnerDashboard;
