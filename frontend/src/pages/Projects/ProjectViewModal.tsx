import React, { useState } from 'react';
import {
  X, MapPin, Calendar, IndianRupee, Home, Building2,
  Pencil, Trash2, Loader2, ExternalLink, Copy, Check
} from 'lucide-react';
import { Project } from '../../types';
import { formatPrice, statusConfig, typeConfig } from './utils';

interface Props {
  project: Project;
  isOwner: boolean;
  isBusy: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

const ProjectViewModal: React.FC<Props> = ({ project, isOwner, isBusy, onClose, onEdit, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = statusConfig[project.status] ?? statusConfig.upcoming;
  const type = typeConfig[project.project_type] ?? typeConfig.residential;

  const soldUnits = project.total_units - project.available_units;
  const soldPct = project.total_units > 0 ? Math.round((soldUnits / project.total_units) * 100) : 0;

  const handleCopyShare = () => {
    const text = `🏗️ *${project.name}* by ${project.builder_name}\n📍 ${project.location}, ${project.city}, ${project.state}\n💰 ${formatPrice(project.price_range_min)} – ${formatPrice(project.price_range_max)}\n🏠 ${project.available_units} units available\n📅 Possession: ${new Date(project.possession_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}\n\nContact us for more details!`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className={`h-2 rounded-t-2xl ${status.bar}`} />
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.badge}`}>{status.label}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${type.badge}`}>{type.label}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
            <p className="text-sm text-gray-500">{project.builder_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Location */}
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
            <span>{project.address}, {project.location}, {project.city}, {project.state}</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <IndianRupee className="h-5 w-5 text-gray-500" />
            {formatPrice(project.price_range_min)} – {formatPrice(project.price_range_max)}
          </div>

          {/* Units availability */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Home className="h-4 w-4" /> Unit Availability
              </span>
              <span className="text-sm text-gray-500">{soldPct}% sold</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${soldPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{soldUnits} sold</span>
              <span className="font-medium text-green-600">{project.available_units} available</span>
              <span>{project.total_units} total</span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Launch Date</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(project.launch_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Possession Date</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(project.possession_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">About this Project</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
          </div>

          {/* Amenities */}
          {project.amenities.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {project.amenities.map((a) => (
                  <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Brochure */}
          {project.brochure_url && (
            <a
              href={project.brochure_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <ExternalLink className="h-4 w-4" /> View Brochure
            </a>
          )}

          {/* Partner info */}
          {project.partner_name && (
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-1 border-t border-gray-100">
              <Building2 className="h-3.5 w-3.5" />
              Listed by {project.partner_name}{project.partner_firm ? ` · ${project.partner_firm}` : ''}
            </div>
          )}

          {/* Share panel */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-sm font-medium text-green-800 mb-2">Share this project</p>
            <p className="text-xs text-green-700 mb-3">Copy a ready-to-send WhatsApp message with project details.</p>
            <button
              onClick={handleCopyShare}
              className="inline-flex items-center gap-2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy for WhatsApp</>}
            </button>
          </div>
        </div>

        {/* Footer actions */}
        {isOwner && (
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-red-600 flex-1">Delete this project permanently?</p>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDelete(project.id)}
                  disabled={isBusy}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => { onClose(); onEdit(project); }}
                  className="flex-1 flex items-center justify-center gap-2 border border-blue-200 text-blue-600 rounded-lg py-2.5 hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  <Pencil className="h-4 w-4" /> Edit Project
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-lg py-2.5 px-4 hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectViewModal;
