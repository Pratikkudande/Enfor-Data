import React, { useEffect, useMemo, useState } from 'react';
import { Network, Search, MapPin, Building2, Home, MessageCircle, Loader2, Users } from 'lucide-react';
import { networkApi, FollowerProfile } from '../../services/networkApi';
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

type Tab = 'followers' | 'messages';

const BrokerFollowersView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('followers');
  const [brokers, setBrokers] = useState<FollowerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const chat = useChat(tab === 'messages', 'broker');

  useEffect(() => {
    let mounted = true;
    networkApi.getFollowers()
      .then((res) => { if (mounted) setBrokers(res.data || []); })
      .catch((e) => { if (mounted) setError(e?.message || 'Failed to load brokers'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const message = (b: FollowerProfile) => { setTab('messages'); chat.openChat(b.id); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return brokers.filter((b) =>
      b.name.toLowerCase().includes(q) || (b.firm_name || '').toLowerCase().includes(q) || (b.city || '').toLowerCase().includes(q)
    );
  }, [brokers, search]);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'followers', label: `Followers (${brokers.length})`, icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Network className="h-5 w-5 text-blue-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brokers</h1>
          <p className="text-gray-600 text-sm">Brokers who follow you — connect and chat with them.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 px-2 flex gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {(error || chat.error) && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error || chat.error}</div>}

      {tab === 'followers' && (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, firm or city…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100"><Network className="h-8 w-8 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No brokers are following you yet.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((b) => {
                const photo = resolvePhoto(b.profile_image);
                return (
                  <div key={b.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {photo ? <img src={photo} alt={b.name} className="w-full h-full object-cover" /> : initials(b.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{b.name}</h3>
                          <span className="inline-block text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded mt-0.5">Broker</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                        {b.firm_name && <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-gray-400" /> {b.firm_name}</div>}
                        {(b.city || b.location) && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> {b.location || b.city}{b.state ? `, ${b.state}` : ''}</div>}
                        <div className="flex items-center gap-2"><Home className="h-4 w-4 text-gray-400" /> {b.properties_count ?? 0} propert{(b.properties_count ?? 0) !== 1 ? 'ies' : 'y'}</div>
                      </div>
                      <button onClick={() => message(b)}
                        className="w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
                        <MessageCircle className="h-4 w-4" /> Message
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'messages' && (
        <ChatPanel chat={chat} accent="blue" emptyHint="No conversations yet. Message a broker from the Followers tab." />
      )}
    </div>
  );
};

export default BrokerFollowersView;
