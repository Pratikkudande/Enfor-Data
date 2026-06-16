import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Lightbulb, AlertTriangle, BookOpen, List, LayoutGrid, Monitor } from 'lucide-react';
import { HELP_LANGS, LangCode, dashboardHelp } from './helpData';

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpDrawer: React.FC<HelpDrawerProps> = ({ isOpen, onClose }) => {
  const [lang, setLang] = useState<LangCode>('en');

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const d = dashboardHelp[lang];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] z-[70] flex flex-col shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: '#f8fafc' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4"
          style={{ background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#1e40af' }}>
              <BookOpen className="h-4 w-4 text-blue-200" />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#93c5fd' }}>SOP Guide</p>
              <p className="text-sm font-semibold text-white leading-none mt-0.5">Help & Instructions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Language pills */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex flex-wrap gap-2">
            {HELP_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  lang === l.code
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Module header */}
          <div className="px-5 py-5" style={{ background: '#0f172a' }}>
            <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-2"
              style={{ background: '#1e40af', color: '#bfdbfe' }}>
              Standard Operating Procedure
            </span>
            <h2 className="text-lg font-semibold text-white">{d.module}</h2>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{d.subtitle}</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Purpose */}
            <Section icon={<Monitor className="h-3.5 w-3.5" />} title="Purpose">
              <p className="text-sm text-gray-600 leading-relaxed">{d.purpose}</p>
            </Section>

            {/* Steps */}
            <Section icon={<List className="h-3.5 w-3.5" />} title="Step-by-step guide">
              <div className="space-y-3">
                {d.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{step.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Fields */}
            <Section icon={<LayoutGrid className="h-3.5 w-3.5" />} title="Fields explained">
              <div className="divide-y divide-gray-100">
                {d.fields.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <ChevronRight className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-gray-900">{f.name}</span>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Tips */}
            <Section icon={<Lightbulb className="h-3.5 w-3.5" />} title="Tips for best use">
              <div className="space-y-2">
                {d.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-green-500 text-base leading-none mt-0.5 flex-shrink-0">✓</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Mistakes */}
            <Section icon={<AlertTriangle className="h-3.5 w-3.5" />} title="Common mistakes to avoid">
              <div className="space-y-2">
                {d.mistakes.map((m, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-red-500 text-sm leading-none mt-0.5 flex-shrink-0">✕</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{m}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Screen ref */}
            <div className="rounded-lg p-3 text-xs text-gray-500 leading-relaxed border-l-4 border-blue-500"
              style={{ background: '#f1f5f9' }}>
              <span className="font-semibold text-gray-700">Screen reference: </span>
              Dashboard – enfordata.com (after login) | Sections: top banner, summary cards, charts, today's appointments, recent activity
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3 text-gray-500">
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
    </div>
    {children}
  </div>
);

export default HelpDrawer;
