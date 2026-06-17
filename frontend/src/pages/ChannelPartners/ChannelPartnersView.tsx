import React, { useEffect, useMemo, useState } from 'react';
import { Handshake, Search, MapPin, Building2, Briefcase, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { networkApi, ChannelPartnerProfile } from '../../services/networkApi';
import { ENV } from '../../config/env';

const resolvePhoto = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${ENV.API_URL}${path}`;
};

const initials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const ChannelPartnersView: React.FC = () => {
  const [partners, setPartners] = useState<ChannelPartnerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchPartners = async () => {
    try {
      setError(null);
      const res = await networkApi.getChannelPartners();
      setPartners(res.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load channel partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartners(); }, []);

  const toggleFollow = async (p: ChannelPartnerProfile) => {
    setBusyId(p.id);
    // optimistic update
    setPartners((prev) => prev.map((x) => x.id === p.id ? { ...x, is_following: !x.is_following } : x));
    try {
      if (p.is_following) await networkApi.unfollowPartner(p.id);
      else await networkApi.followPartner(p.id);
    } catch {
      // revert on failure
      setPartners((prev) => prev.map((x) => x.id === p.id ? { ...x, is_following: p.is_following } : x));
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return partners.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.firm_name || '').toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q)
    );
  }, [partners, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Handshake className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Channel Partners</h1>
          <p className="text-gray-600 text-sm">Discover and follow channel partners across the network.</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, firm or city…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
        </div>
      )}
      {error && !loading && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Handshake className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No channel partners found.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((p) => {
            const photo = resolvePhoto(p.profile_image);
            return (
              <div key={p.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {photo ? <img src={photo} alt={p.name} className="w-full h-full object-cover" /> : initials(p.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{p.name}</h3>
                      <span className="inline-block text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded mt-0.5">Channel Partner</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                    {p.firm_name && <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-gray-400" /> {p.firm_name}</div>}
                    {(p.city || p.location) && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> {p.location || p.city}{p.state ? `, ${p.state}` : ''}</div>}
                    <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-gray-400" /> {p.projects_count ?? 0} project{(p.projects_count ?? 0) !== 1 ? 's' : ''}</div>
                  </div>

                  <button
                    onClick={() => toggleFollow(p)}
                    disabled={busyId === p.id}
                    className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                      p.is_following
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : p.is_following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {p.is_following ? 'Following' : 'Follow'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChannelPartnersView;
