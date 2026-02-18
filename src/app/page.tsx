"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'];
const DIVISIONS = ['1', '2', '3'];

// 指定URLに基づいたランク画像取得関数
const getRankImage = (rank: string, division: string) => {
  if (rank === 'Radiant') return "https://static.wikia.nocookie.net/valorant/images/e/ee/Radiant_Rank.png";
  if (rank === 'Unranked') return "https://static.wikia.nocookie.net/valorant/images/a/a2/TX_CompetitiveTier_Large_0.png";
  // 例: Iron 1 Rank.png
  return `https://static.wikia.nocookie.net/valorant/images/${rank}_${division}_Rank.png`;
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
    <main className="h-screen w-screen bg-[#0f1923] text-[#ece8e1] overflow-hidden flex flex-col p-6 font-sans">
      {/* 上部ヘッダー */}
      <header className="flex justify-between items-center border-b-2 border-[#ff4655] mb-4 pb-4">
        <div>
          <h1 className="text-3xl font-black italic text-[#ff4655] uppercase tracking-tight">VALORANT リアルタイム・ランク共有ボード</h1>
          <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">STATUS: OPERATIONAL // 1920x1080 OPTIMIZED</p>
        </div>
      </header>

      {/* プレイヤー行リスト（9等分） */}
      <div className="flex-1 flex flex-col gap-1 overflow-hidden pb-4">
        {players.slice(0, 9).map((player, index) => (
          <div key={player.id} className="flex-1 flex items-center bg-[#1f2326] border border-gray-800 hover:border-[#ff4655] px-6 transition-all group">
            
            {/* 番号 */}
            <div className="w-12 text-gray-600 font-black italic text-xl">0{index + 1}</div>

            {/* 名前 (クリックで編集) */}
            <div className="w-64">
              {editingId === player.id ? (
                <input
                  autoFocus
                  className="bg-gray-800 border-b-2 border-[#ff4655] text-xl font-bold w-full outline-none px-2 py-1"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={() => updatePlayer(player.id, { name: tempName })}
                  onKeyDown={(e) => e.key === 'Enter' && updatePlayer(player.id, { name: tempName })}
                />
              ) : (
                <div 
                  className="text-xl font-black uppercase cursor-pointer hover:text-[#ff4655] truncate flex items-center gap-2"
                  onClick={() => { setEditingId(player.id); setTempName(player.name); }}
                >
                  {player.name}
                  <span className="text-[10px] opacity-0 group-hover:opacity-40 transition-opacity">編集</span>
                </div>
              )}
            </div>

            {/* ランク画像 */}
            <div className="w-32 flex justify-center">
              <img 
                src={getRankImage(player.rank, player.division)} 
                alt={player.rank}
                className="h-16 w-16 object-contain drop-shadow-[0_0_8px_rgba(255,70,85,0.4)]"
                onError={(e) => { (e.target as HTMLImageElement).src = RANK_ICONS['Unranked']; }}
              />
            </div>

            {/* 現在のランク表示 */}
            <div className="w-48 text-center">
              <div className="text-[#ff4655] font-black italic text-lg uppercase tracking-wider">
                {player.rank} {player.rank !== 'Radiant' && player.division}
              </div>
            </div>

            {/* ランク選択ボタン群 */}
            <div className="flex-1 flex flex-wrap gap-1 items-center justify-end px-4">
              {RANKS.map(r => (
                <button
                  key={r}
                  onClick={() => updatePlayer(player.id, { rank: r })}
                  className={`text-[9px] px-2 py-1.5 font-bold border transition-all ${
                    player.rank === r 
                    ? 'bg-[#ff4655] border-[#ff4655] text-white' 
                    : 'border-gray-700 text-gray-500 hover:border-gray-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* ディビジョン選択 */}
            <div className="w-40 flex gap-1 justify-end">
              {DIVISIONS.map(d => (
                <button
                  key={d}
                  onClick={() => updatePlayer(player.id, { division: d })}
                  className={`w-10 py-2 text-xs font-bold border transition-all ${
                    player.division === d 
                    ? 'bg-white text-black border-white' 
                    : 'border-gray-700 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}