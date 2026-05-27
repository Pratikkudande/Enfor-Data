import React from 'react';
import { Phone, Mail, MapPin, Briefcase, Clock, Edit2, Trash2, FileText, User } from 'lucide-react';
import { StaffMember } from './StaffView';

interface StaffCardProps {
  member: StaffMember;
  onEdit: (member: StaffMember) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  available: { label: 'Available', cls: 'bg-green-100 text-green-700' },
  employed: { label: 'Employed', cls: 'bg-blue-100 text-blue-700' },
  inactive: { label: 'Inactive', cls: 'bg-gray-100 text-gray-600' },
};

const typeConfig = {
  available: { label: 'Available Staff', cls: 'bg-emerald-50 border-emerald-200' },
  required: { label: 'Staff Required', cls: 'bg-orange-50 border-orange-200' },
};

const StaffCard: React.FC<StaffCardProps> = ({ member, onEdit, onDelete }) => {
  const isRequired = member.type === 'required';
  const status = statusConfig[member.status] ?? statusConfig.available;
  const typeStyle = typeConfig[member.type];

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${typeStyle.cls} overflow-hidden hover:shadow-md transition-shadow`}>
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={`${member.first_name} ${member.last_name}`}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 text-base">
                {isRequired
                  ? member.first_name
                  : `${member.first_name} ${member.last_name}`.trim()}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                <Briefcase className="h-3.5 w-3.5" />
                {member.role}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              isRequired ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {typeStyle.label}
            </span>
            {!isRequired && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.cls}`}>
                {status.label}
              </span>
            )}
          </div>
        </div>

        {/* Experience */}
        {member.experience_years > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{member.experience_years} year{member.experience_years !== 1 ? 's' : ''} experience</span>
          </div>
        )}

        {/* Description */}
        {member.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{member.description}</p>
        )}

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">{member.location}</span>
        </div>

        {/* Contact — only for available staff */}
        {!isRequired && (
          <div className="space-y-1.5 mb-4">
            {member.phone && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{member.phone}</span>
              </div>
            )}
            {member.email && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
          </div>
        )}

        {/* Resume badge */}
        {member.resume_url && (
          <div className="mb-4">
            <a
              href={member.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              {isRequired ? 'View JD / Sample Resume' : 'View Resume'}
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(member)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffCard;
