import React, { useEffect, useMemo, useState } from 'react';
import {
  Handshake, Search, MapPin, Building2, Briefcase, UserPlus, UserMinus,
  MessageCircle, Loader2, Users, UserCheck,
} from 'lucide-react';
import { networkApi, ChannelPartnerProfile } from '../../services/networkApi';
import { ENV } from '../../config/env';
import { useChat } from './useChat';
import ChatPanel from './ChatPanel';

const resolvePhoto = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${ENV.API_URL}${path}`;
};
const initials = (name: string) =>
  (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

type Tab = 'discover' | 'following' | 'messages';

const ChannelPartnersView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('discover');
  const [partners, setPartners] = useState<ChannelPartnerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const chat = useChat(tab === 'messages', 'channel_partner');

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
    setPartners((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_following: !x.is_following } : x)));
    try {
      if (p.is_following) await networkApi.unfollowPartner(p.id);
      else await networkApi.followPartner(p.id);
    } catch {
      setPartners((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_following: p.is_following } : x)));
    } finally {
      setBusyId(null);
    }
  };

  const message = (p: ChannelPartnerProfile) => { setTab('messages'); chat.openChat(p.id); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return partners.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.firm_name || '').toLowerCase().includes(q) || (p.city || '').toLowerCase().includes(q)
    );
  }, [partners, search]);
  const following = useMemo(() => partners.filter((p) => p.is_following), [partners]);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'discover', label: 'Discover', icon: Users },
    { id: 'following', label: `Following (${following.length})`, icon: UserCheck },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
  ];

  const PartnerCard = (p: ChannelPartnerProfile) => {
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

          {p.is_following ? (
            <div className="flex gap-2">
              <button onClick={() => toggleFollow(p)} disabled={busyId === p.id}
                className="flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60">
                {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />} Unfollow
              </button>
              <button onClick={() => message(p)}
                className="flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
                <MessageCircle className="h-4 w-4" /> Message
              </button>
            </div>
          ) : (
            <button onClick={() => toggleFollow(p)} disabled={busyId === p.id}
              className="w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
              {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Follow
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><Handshake className="h-5 w-5 text-indigo-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Channel Partners</h1>
          <p className="text-gray-600 text-sm">Discover, follow and message channel partners.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 px-2 flex gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {(error || chat.error) && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error || chat.error}</div>}

      {tab === 'discover' && (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, firm or city…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100"><Handshake className="h-8 w-8 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No channel partners found.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{filtered.map(PartnerCard)}</div>
          )}
        </>
      )}

      {tab === 'following' && (
        following.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100"><UserCheck className="h-8 w-8 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">You aren't following any channel partners yet.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{following.map(PartnerCard)}</div>
        )
      )}

      {tab === 'messages' && (
        <ChatPanel chat={chat} accent="indigo" emptyHint="No conversations yet. Message a channel partner from Discover or Following." />
      )}
    </div>
  );
};

export default ChannelPartnersView;
