"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'];
const DIVISIONS = ['1', '2', '3'];

// 公式に近いランクアイコンのURLマッピング
const RANK_ICONS: { [key: string]: string } = {
  'Iron': 'https://titles.trackercdn.com/valorant-api/competitivetiers/03621f52-342b-cf4e-4f86-9350a3b05d0d/3/smallicon.png',
  'Bronze': 'https://titles.trackercdn.com/valorant-api/competitivetiers/03621f52-342b-cf4e-4f86-9350a3b05d0d/6/smallicon.png',
  'Silver': 'https://titles.trackercdn.com/valorant-api/competitivetiers/03621f52-342b-cf4e-4f86-9350a3b05d0d/9/smallicon.png',
  'Gold': 'https://titles.trackercdn.com/valorant-api/competitivetiers/03621f52-342b-cf4e-4f86-9350a3b05d0d/12/smallicon.png',
  'Platinum': 'https://titles.trackercdn.com/valorant-api/competitivetiers/03621f52-342b-cf4e-4f86-9350a3b05d0d/15/smallicon.png',
  'Diamond': 'https://titles.trackercdn.com/valorant-api/competitivetiers/03621f52-342b-cf4e-4f86-9350a3b05d0d/18/smallicon.png',
  'Ascendant': 'https://titles.trackercdn.com/valorant-api/competitivetiers/03621f52-342b-cf4e-4f86-9350a3b05d0d/21/smallicon.png',
  'Immortal': 'https://titles.trackercdn.com/valorant-api/competitivetiers/03621f52-342b-cf4e-4f86-9350a3b05d0d/24/smallicon.png',
  'Radiant': 'https://titles.trackercdn.com/valorant-api/competitivetiers/03621f52-342b-cf4e-4f86-9350a3b05d0d/27/smallicon.png',
  'Unranked': 'https://titles.trackercdn.com/valorant-api/competitivetiers/03621f52-342b-cf4e-4f86-9350a3b05d0d/0/smallicon.png'
};

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
    <main className="h-screen w-screen bg-[#0f1923] text-[#ece8e1] overflow-hidden flex flex-col p-4 font-sans">
      {/* ヘッダー */}
      <header className="flex justify-between items-center border-b border-[#ff4655] mb-4 pb-2">
        <h1 className="text-2xl font-black italic text-[#ff4655] uppercase tracking-tighter">VALO ランク管理ボード</h1>
        <div className="text-[10px] text-gray-500 font-mono">RESOLUTION: 1920x1080 OPTIMIZED // LIVE</div>
      </header>

      {/* プレイヤーリスト：横に9等分して1画面に収める */}
      <div className="flex-1 grid grid-cols-9 gap-2 h-full pb-4">
        {players.slice(0, 9).map(player => (
          <div key={player.id} className="bg-[#1f2326] border border-gray-800 flex flex-col items-center p-2 relative group hover:border-[#ff4655]">
            
            {/* 名前編集エリア */}
            <div className="w-full text-center mb-4 pt-2">
              {editingId === player.id ? (
                <input
                  autoFocus
                  className="bg-gray-800 border-b border-[#ff4655] text-sm font-bold w-full text-center outline-none"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={() => updatePlayer(player.id, { name: tempName })}
                  onKeyDown={(e) => e.key === 'Enter' && updatePlayer(player.id, { name: tempName })}
                />
              ) : (
                <div 
                  className="text-sm font-black truncate cursor-pointer hover:text-[#ff4655]"
                  onClick={() => { setEditingId(player.id); setTempName(player.name); }}
                >
                  {player.name}
                </div>
              )}
            </div>

            {/* ランク画像 */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-2">
              <img 
                src={RANK_ICONS[player.rank] || RANK_ICONS['Unranked']} 
                alt={player.rank}
                className="w-20 h-20 object-contain drop-shadow-[0_0_10px_rgba(255,70,85,0.3)]"
              />
              <div className="text-[#ff4655] font-black italic text-xs uppercase text-center">
                {player.rank} <br/> {player.division && `DIV ${player.division}`}
              </div>
            </div>

            {/* 操作パネル（ホバーで強調） */}
            <div className="w-full space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-1">
                {RANKS.map(r => (
                  <button
                    key={r}
                    onClick={() => updatePlayer(player.id, { rank: r })}
                    className={`text-[8px] py-1 border transition-all ${
                      player.rank === r ? 'bg-[#ff4655] border-[#ff4655]' : 'border-gray-700 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex border-t border-gray-800 pt-2 gap-1">
                {DIVISIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => updatePlayer(player.id, { division: d })}
                    className={`flex-1 text-[9px] py-1 font-bold ${
                      player.division === d ? 'bg-white text-black' : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}