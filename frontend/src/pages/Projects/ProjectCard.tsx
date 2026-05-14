import React from 'react';
import {
  MapPin, Building2, Calendar, IndianRupee,
  Home, Eye, Pencil, Trash2, Loader2
} from 'lucide-react';
import { Project } from '../../types';
import { formatPrice, statusConfig, typeConfig } from './utils';

interface Props {
  project: Project;
  isOwner: boolean;
  isBusy: boolean;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

const ProjectCard: React.FC<Props> = ({ project, isOwner, isBusy, onView, onEdit, onDelete }) => {
  const status = statusConfig[project.status] ?? statusConfig.upcoming;
  const type = typeConfig[project.project_type] ?? typeConfig.residential;
  const soldPct = project.total_units > 0
    ? Math.round(((project.total_units - project.available_units) / project.total_units) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Top color bar */}
      <div className={`h-1.5 rounded-t-xl ${status.bar}`} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{project.name}</h3>
            <p className="text-xs text-gray-500 truncate">{project.builder_name}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.badge}`}>
              {status.label}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${type.badge}`}>
              {type.label}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{project.location}, {project.city}</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <IndianRupee className="h-3.5 w-3.5 text-gray-500" />
          <span>{formatPrice(project.price_range_min)} – {formatPrice(project.price_range_max)}</span>
        </div>

        {/* Units availability bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              {project.available_units} / {project.total_units} units available
            </span>
            <span>{soldPct}% sold</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${soldPct}%` }}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Launch: {new Date(project.launch_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </span>
          <span>·</span>
          <span>
            Possession: {new Date(project.possession_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Amenities */}
        {project.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.amenities.slice(0, 3).map((a) => (
              <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>
            ))}
            {project.amenities.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                +{project.amenities.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 flex gap-2 border-t border-gray-50 pt-3">
        <button
          onClick={() => onView(project)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" /> View
        </button>
        {isOwner && (
          <>
            <button
              onClick={() => onEdit(project)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg py-2 hover:bg-blue-50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={() => onDelete(project.id)}
              disabled={isBusy}
              className="flex items-center justify-center gap-1.5 text-xs text-red-600 border border-red-200 rounded-lg py-2 px-3 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
