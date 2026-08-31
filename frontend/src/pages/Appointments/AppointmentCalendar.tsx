import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, X, CalendarDays } from 'lucide-react';
import { Appointment as ApiAppointment } from '../../services/api';

interface AppointmentCalendarProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  appointments: ApiAppointment[];
  getStatusColor: (status: string) => string;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  currentDate,
  setCurrentDate,
  appointments,
  getStatusColor,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getAppointmentsForDate = (date: string) =>
    appointments.filter((apt) => apt.date === date);

  const formatTime12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hours24, minutes] = time24.split(':');
    const h = parseInt(hours24, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const hours12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hours12}:${minutes} ${period}`;
  };

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
  };

  const handleDayClick = (dateString: string) => {
    setSelectedDate(dateString);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedDate(null);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days: React.ReactNode[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(
      <div key={`empty-${i}`} className="cal-cell cal-cell--empty" />,
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayAppointments = getAppointmentsForDate(dateString);
    const isToday = dateString === formatLocalDate(new Date());
    const isSelected = dateString === selectedDate;

    days.push(
      <div
        key={day}
        onClick={() => handleDayClick(dateString)}
        className={[
          'cal-cell',
          isToday ? 'cal-cell--today' : '',
          isSelected ? 'cal-cell--selected' : '',
          dayAppointments.length > 0 ? 'cal-cell--has-appointments' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className={`cal-day-number ${isToday ? 'cal-day-number--today' : ''} ${isSelected ? 'cal-day-number--selected' : ''}`}>
          {day}
        </span>
        <div className="cal-apt-list">
          {dayAppointments.slice(0, 2).map((apt) => (
            <div
              key={apt.id}
              className={`cal-apt-chip ${getStatusColor(apt.status)}`}
              title={`${apt.time} - ${apt.title}`}
            >
              {apt.time} {apt.title}
            </div>
          ))}
          {dayAppointments.length > 2 && (
            <div className="cal-apt-more">+{dayAppointments.length - 2} more</div>
          )}
        </div>
      </div>,
    );
  }

  const selectedAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  return (
    <>
      {/* ── inline styles ─────────────────────────────────────────────────── */}
      <style>{`
        /* Layout wrapper */
        .cal-wrapper {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
        }

        /* ── Side panel ── */
        .cal-side-panel {
          width: 280px;
          min-width: 260px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0,0,0,.08);
          overflow: hidden;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .cal-side-panel--empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.25rem;
          text-align: center;
          color: #9ca3af;
          min-height: 200px;
        }

        .cal-side-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: #ffffff;
        }

        .cal-side-panel-title {
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.3;
        }

        .cal-side-panel-subtitle {
          font-size: 0.7rem;
          opacity: 0.85;
          margin-top: 1px;
        }

        .cal-side-close-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          color: #fff;
          transition: background 0.2s;
        }
        .cal-side-close-btn:hover { background: rgba(255,255,255,0.35); }

        .cal-side-panel-body {
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          max-height: 480px;
          overflow-y: auto;
        }

        .cal-apt-item {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.625rem 0.75rem;
          border-radius: 0.5rem;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          cursor: default;
          transition: box-shadow 0.15s;
        }
        .cal-apt-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.07); }

        .cal-apt-item-time-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: #6366f1;
          white-space: nowrap;
          margin-top: 1px;
          flex-shrink: 0;
        }

        .cal-apt-item-info { flex: 1; min-width: 0; }

        .cal-apt-item-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cal-apt-item-meta {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-top: 0.25rem;
          flex-wrap: wrap;
        }

        .cal-apt-status-badge {
          font-size: 0.625rem;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .cal-no-appointments {
          text-align: center;
          padding: 1.5rem 1rem;
          color: #9ca3af;
          font-size: 0.8125rem;
        }

        /* ── Calendar main area ── */
        .cal-main { flex: 1; min-width: 0; }

        .cal-card {
          background: #ffffff;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0,0,0,.08);
          border: 1px solid #e5e7eb;
          padding: 1.25rem;
        }

        /* ── Calendar header ── */
        .cal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .cal-month-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #111827;
        }

        .cal-nav { display: flex; gap: 0.375rem; align-items: center; }

        .cal-nav-btn {
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.375rem;
          color: #374151;
          transition: background 0.15s, border-color 0.15s;
        }
        .cal-nav-btn:hover { background: #f3f4f6; border-color: #d1d5db; }

        .cal-today-btn {
          padding: 0.375rem 0.875rem;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: #fff;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .cal-today-btn:hover { opacity: 0.9; }

        /* ── Grid ── */
        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .cal-day-header {
          background: #f9fafb;
          padding: 0.5rem;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
        }

        /* ── Day cell ── */
        .cal-cell {
          min-height: 5.5rem;
          border: 1px solid #e5e7eb;
          padding: 0.375rem;
          background: #ffffff;
          cursor: pointer;
          transition: background 0.15s;
          position: relative;
          overflow: hidden;
        }
        .cal-cell:hover { background: #f0f9ff; }

        .cal-cell--empty {
          background: #f9fafb;
          cursor: default;
        }
        .cal-cell--empty:hover { background: #f9fafb; }

        .cal-cell--today { background: #eff6ff; }
        .cal-cell--today:hover { background: #dbeafe; }

        .cal-cell--selected {
          background: #eef2ff !important;
          box-shadow: inset 0 0 0 2px #6366f1;
        }

        .cal-cell--has-appointments::after {
          content: '';
          position: absolute;
          bottom: 3px;
          right: 3px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #6366f1;
          opacity: 0.5;
        }

        .cal-day-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #374151;
          border-radius: 50%;
          margin-bottom: 0.25rem;
        }

        .cal-day-number--today {
          background: #3b82f6;
          color: #ffffff;
          font-weight: 700;
        }

        .cal-day-number--selected:not(.cal-day-number--today) {
          background: #6366f1;
          color: #ffffff;
        }

        .cal-apt-list { display: flex; flex-direction: column; gap: 2px; }

        .cal-apt-chip {
          font-size: 0.65rem;
          padding: 1px 4px;
          border-radius: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
        }

        .cal-apt-more {
          font-size: 0.65rem;
          color: #6b7280;
          padding-left: 2px;
        }

        /* ── Mobile overlay panel ── */
        .cal-mobile-overlay {
          display: none;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .cal-wrapper { flex-direction: column; }
          .cal-side-panel { width: 100%; min-width: unset; }
          .cal-side-panel-body { max-height: 320px; }
        }

        @media (max-width: 640px) {
          .cal-card { padding: 0.75rem; }
          .cal-month-title { font-size: 1rem; }
          .cal-cell { min-height: 3.5rem; padding: 0.25rem; }
          .cal-day-header { padding: 0.375rem 0.125rem; font-size: 0.65rem; }
          .cal-apt-chip { display: none; }
          .cal-cell--has-appointments::after { opacity: 0.9; width: 6px; height: 6px; }
        }
      `}</style>

      <div className="cal-wrapper">
        {/* ── LEFT SIDE PANEL ── */}
        <div className="cal-side-panel">
          {!selectedDate ? (
            <div className="cal-side-panel--empty">
              <CalendarDays size={36} strokeWidth={1.25} style={{ marginBottom: '0.75rem', color: '#d1d5db' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>
                No date selected
              </p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Click a date on the calendar to view its appointments
              </p>
            </div>
          ) : (
            <>
              <div className="cal-side-panel-header">
                <div>
                  <div className="cal-side-panel-title">{formatDisplayDate(selectedDate)}</div>
                  <div className="cal-side-panel-subtitle">
                    {selectedAppointments.length} appointment{selectedAppointments.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <button className="cal-side-close-btn" onClick={closePanel} aria-label="Close panel">
                  <X size={15} />
                </button>
              </div>

              <div className="cal-side-panel-body">
                {selectedAppointments.length === 0 ? (
                  <div className="cal-no-appointments">
                    <CalendarDays size={28} strokeWidth={1.25} style={{ marginBottom: '0.5rem', color: '#d1d5db' }} />
                    <p>No appointments scheduled for this date.</p>
                  </div>
                ) : (
                  selectedAppointments
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((apt) => (
                      <div key={apt.id} className="cal-apt-item">
                        <div className="cal-apt-item-time-badge">
                          <Clock size={11} />
                          {formatTime12Hour(apt.time)}
                        </div>
                        <div className="cal-apt-item-info">
                          <div className="cal-apt-item-title" title={apt.title}>
                            {apt.title}
                          </div>
                          <div className="cal-apt-item-meta">
                            <span className={`cal-apt-status-badge ${getStatusColor(apt.status)}`}>
                              {apt.status}
                            </span>
                            {apt.client_name && (
                              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                {apt.client_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </>
          )}
        </div>

        {/* ── MAIN CALENDAR ── */}
        <div className="cal-main">
          <div className="cal-card">
            {/* Header */}
            <div className="cal-header">
              <h3 className="cal-month-title">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="cal-nav">
                <button
                  className="cal-nav-btn"
                  onClick={() =>
                    setCurrentDate(
                      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
                    )
                  }
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="cal-today-btn"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </button>
                <button
                  className="cal-nav-btn"
                  onClick={() =>
                    setCurrentDate(
                      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
                    )
                  }
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="cal-grid">
              {dayNames.map((d) => (
                <div key={d} className="cal-day-header">
                  {d}
                </div>
              ))}
              {days}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppointmentCalendar;
