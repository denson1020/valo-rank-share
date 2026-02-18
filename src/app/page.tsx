"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase接続
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ランクの定義
const RANKS = [
  'Unranked',
  'Iron', 'Bronze', 'Silver', 'Gold', 
  'Platinum', 'Diamond', 'Ascendant', 
  'Immortal', 'Radiant'
];

// ランクごとのベースID（Valorant-APIの仕様に基づく）
const RANK_BASE_ID: { [key: string]: number } = {
  'Unranked': 0,
  'Iron': 3,
  'Bronze': 6,
  'Silver': 9,
  'Gold': 12,
  'Platinum': 15,
  'Diamond': 18,
  'Ascendant': 21,
  'Immortal': 24,
  'Radiant': 27
};

export default function Home() {
  const [players, setPlayers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  // リアルタイム同期の設定
  useEffect(() => {
    fetchPlayers();
    const channel = supabase.channel('realtime-valo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchPlayers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('*').order('id');
    if (data) setPlayers(data);
  }

  async function updatePlayer(id: string, updates: any) {
    await supabase.from('players').update(updates).eq('id', id);
    setEditingId(null);
  }

  // 画像URLを生成する関数
  const getRankImageUrl = (rank: string, division: string) => {
    let tierId = 0;
    const base = RANK_BASE_ID[rank] || 0;
    
    if (rank === 'Unranked' || rank === 'Radiant') {
      tierId = base;
    } else {
      // 例: Iron(3) + Division(1) - 1 = 3
      // 例: Iron(3) + Division(2) - 1 = 4
      const divNum = parseInt(division) || 1;
      tierId = base + divNum - 1;
    }
    return `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a3b05d0d/${tierId}/largeicon.png`;
  };

  return (
    <main className="w-[1920px] h-[1080px] bg-[#0f1923] text-white overflow-hidden flex flex-col font-sans relative">
      {/* 背景装飾 */}
      <div className="absolute top-0 right-0 w-[500px] h-full bg-[#ff4655] opacity-5 -skew-x-12 pointer-events-none"></div>

      {/* ヘッダーエリア (高さ固定) */}
      <header className="h-[80px] flex items-center justify-between px-10 border-b-2 border-[#ff4655] bg-[#1f2326] z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#ff4655] flex items-center justify-center font-black text-2xl italic">V</div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#ece8e1]">VALORANT RANK TRACKER</h1>
            <p className="text-[10px] text-[#ff4655] font-bold tracking-[0.3em]">LIVE DASHBOARD // 9 PLAYERS</p>
          </div>
        </div>
      </header>

      {/* メインリストエリア (残りの高さ) */}
      <div className="flex-1 flex flex-col p-4 gap-2">
        {/* ヘッダー行 */}
        <div className="flex px-4 text-[#ff4655] font-bold text-xs uppercase tracking-widest opacity-70 mb-1">
          <div className="w-16 text-center">No.</div>
          <div className="w-64">Player Name</div>
          <div className="w-32 text-center">Rank Icon</div>
          <div className="w-40 text-center">Current Rank</div>
          <div className="flex-1">Rank Control</div>
        </div>

        {/* プレイヤーリスト (9人分) */}
        {players.slice(0, 9).map((player, index) => (
          <div key={player.id} className="flex-1 flex items-center bg-[#1f2326]/80 border border-white/10 hover:border-[#ff4655] transition-all px-4 group backdrop-blur-sm">
            
            {/* 1. 番号 */}
            <div className="w-16 text-center font-black text-2xl text-gray-600 italic">0{index + 1}</div>

            {/* 2. 名前 (クリック編集) */}
            <div className="w-64 border-r border-white/10 pr-6 mr-6 h-full flex items-center">
              {editingId === player.id ? (
                <input
                  autoFocus
                  className="bg-transparent text-2xl font-bold w-full outline-none text-[#ff4655] border-b border-[#ff4655]"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={() => updatePlayer(player.id, { name: tempName })}
                  onKeyDown={(e) => e.key === 'Enter' && updatePlayer(player.id, { name: tempName })}
                />
              ) : (
                <div 
                  className="text-2xl font-bold truncate cursor-pointer hover:text-[#ff4655] w-full"
                  onClick={() => { setEditingId(player.id); setTempName(player.name); }}
                >
                  {player.name}
                </div>
              )}
            </div>

            {/* 3. ランク画像 */}
            <div className="w-32 flex justify-center">
              <img 
                src={getRankImageUrl(player.rank, player.division)}
                alt={player.rank}
                className="h-16 w-16 object-contain drop-shadow-[0_0_15px_rgba(255,70,85,0.4)]"
              />
            </div>

            {/* 4. 現在のランク文字 */}
            <div className="w-40 text-center border-r border-white/10 h-full flex flex-col justify-center mr-4">
              <span className="text-lg font-black uppercase tracking-tight">{player.rank}</span>
              {player.rank !== 'Unranked' && player.rank !== 'Radiant' && (
                <span className="text-[#ff4655] text-sm font-bold">DIV {player.division}</span>
              )}
            </div>

            {/* 5. コントロールパネル */}
            <div className="flex-1 flex flex-col justify-center gap-1">
              {/* ランク選択ボタン */}
              <div className="flex gap-1 flex-wrap">
                {RANKS.filter(r => r !== 'Unranked').map(r => (
                  <button
                    key={r}
                    onClick={() => updatePlayer(player.id, { rank: r })}
                    className={`px-2 py-1 text-[9px] font-bold uppercase transition-all border ${
                      player.rank === r 
                        ? 'bg-[#ff4655] border-[#ff4655] text-white' 
                        : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {r.substring(0, 3)}
                  </button>
                ))}
              </div>

              {/* ディビジョン選択 (Unranked/Radiant以外で表示) */}
              {player.rank !== 'Unranked' && player.rank !== 'Radiant' && (
                <div className="flex gap-1 mt-1">
                  {['1', '2', '3'].map(d => (
                    <button
                      key={d}
                      onClick={() => updatePlayer(player.id, { division: d })}
                      className={`w-8 py-0.5 text-[9px] font-bold border ${
                        player.division === d 
                          ? 'bg-white text-black border-white' 
                          : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}