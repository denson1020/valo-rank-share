"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'];
const DIVISIONS = ['1', '2', '3'];

export default function Home() {
  const [players, setPlayers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    fetchPlayers();
    const channel = supabase.channel('realtime-valo').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'players' }, () => fetchPlayers()
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('*').order('name');
    if (data) setPlayers(data);
  }

  async function updatePlayer(id: string, updates: any) {
    await supabase.from('players').update(updates).eq('id', id);
    setEditingId(null);
  }

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] p-6 md:p-12 font-sans tracking-tight">
      <div className="max-w-6xl mx-auto">
        <header className="border-b-2 border-[#ff4655] pb-6 mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-5xl font-black italic text-[#ff4655] leading-none uppercase">Valo Rank Share</h1>
            <p className="text-xs mt-2 text-gray-400 tracking-[0.2em] font-mono uppercase">Live Strategic Dashboard // Ver 2.0</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map(player => (
            <div key={player.id} className="group relative bg-[#1f2326] p-6 border border-gray-800 hover:border-[#ff4655] transition-all duration-300">
              {/* 装飾用の斜めライン */}
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#ff4655] clip-path-slant opacity-20 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="mb-6">
                {editingId === player.id ? (
                  <input
                    autoFocus
                    className="bg-transparent border-b-2 border-[#ff4655] text-2xl font-bold w-full outline-none"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => updatePlayer(player.id, { name: tempName })}
                    onKeyDown={(e) => e.key === 'Enter' && updatePlayer(player.id, { name: tempName })}
                  />
                ) : (
                  <h2 
                    className="text-2xl font-black uppercase cursor-pointer hover:text-[#ff4655] transition-colors"
                    onClick={() => { setEditingId(player.id); setTempName(player.name); }}
                  >
                    {player.name} <span className="text-[10px] opacity-30 text-white ml-2">✎</span>
                  </h2>
                )}
                <div className="text-[#ff4655] text-sm font-black italic mt-1">
                  {player.rank} {player.division || ''}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-gray-500 mb-2 uppercase font-bold tracking-widest">Select Rank</p>
                  <div className="grid grid-cols-3 gap-1">
                    {RANKS.map(r => (
                      <button
                        key={r}
                        onClick={() => updatePlayer(player.id, { rank: r })}
                        className={`text-[9px] py-1.5 font-bold border transition-all ${
                          player.rank === r 
                          ? 'bg-[#ff4655] border-[#ff4655] text-white' 
                          : 'border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-gray-500 mb-2 uppercase font-bold tracking-widest">Select Division</p>
                  <div className="flex gap-2">
                    {DIVISIONS.map(d => (
                      <button
                        key={d}
                        onClick={() => updatePlayer(player.id, { division: d })}
                        className={`flex-1 py-1 text-xs font-bold border transition-all ${
                          player.division === d 
                          ? 'bg-white text-black border-white' 
                          : 'border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .clip-path-slant {
          clip-path: polygon(100% 0, 0 0, 100% 100%);
        }
      `}</style>
    </main>
  );
}