"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase接続設定
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ランク名のリスト
const RANKS = [
  'Unranked',
  'Iron', 'Bronze', 'Silver', 'Gold', 
  'Platinum', 'Diamond', 'Ascendant', 
  'Immortal', 'Radiant'
];

export default function Home() {
  const [players, setPlayers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  // リアルタイム同期設定
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

  // 確実に表示される画像URLを取得する関数
  const getRankImageUrl = (rank: string, division: string) => {
    // UnrankedはID 0
    if (rank === 'Unranked') return 'https://trackercdn.com/cdn/tracker.gg/valorant/icons/tiers/0.png';
    // RadiantはID 27
    if (rank === 'Radiant') return 'https://trackercdn.com/cdn/tracker.gg/valorant/icons/tiers/27.png';

    // 各ランクの開始ID定義
    const baseIds: { [key: string]: number } = {
      'Iron': 3,
      'Bronze': 6,
      'Silver': 9,
      'Gold': 12,
      'Platinum': 15,
      'Diamond': 18,
      'Ascendant': 21,
      'Immortal': 24
    };

    const base = baseIds[rank];
    if (!base) return 'https://trackercdn.com/cdn/tracker.gg/valorant/icons/tiers/0.png'; // 見つからない場合はUnranked

    // 例: Iron 1 = 3 + 1 - 1 = 3
    // 例: Iron 2 = 3 + 2 - 1 = 4
    const divNum = parseInt(division) || 1;
    const finalId = base + divNum - 1;

    return `https://trackercdn.com/cdn/tracker.gg/valorant/icons/tiers/${finalId}.png`;
  };

  return (
    <main className="w-full h-screen bg-[#0f1923] text-white overflow-hidden flex flex-col font-sans relative">
      {/* 背景の装飾 */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#ff4655] opacity-5 -skew-x-12 pointer-events-none"></div>

      {/* ヘッダーエリア */}
      <header className="h-16 flex items-center justify-between px-8 border-b-2 border-[#ff4655] bg-[#1f2326] z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#ff4655] flex items-center justify-center font-black text-xl italic text-white rounded-sm">V</div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase text-[#ece8e1]">RANK TRACKER</h1>
          </div>
        </div>
        <div className="text-[10px] text-[#ff4655] font-bold tracking-[0.2em] uppercase">
          Live Sync Active
        </div>
      </header>

      {/* メインリストエリア（スクロール対応） */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-[1800px] mx-auto flex flex-col gap-2">
          
          {/* 項目名ヘッダー */}
          <div className="flex px-4 text-[#ff4655] font-bold text-xs uppercase tracking-widest opacity-70 mb-1">
            <div className="w-12 text-center">No.</div>
            <div className="w-48">Agent Name</div>
            <div className="w-24 text-center">Icon</div>
            <div className="w-32 text-center">Rank</div>
            <div className="flex-1 pl-4">Controls</div>
          </div>

          {/* プレイヤーリスト */}
          {players.map((player, index) => (
            <div key={player.id} className="flex items-center bg-[#1f2326]/90 border border-white/10 hover:border-[#ff4655] transition-all px-4 py-2 group min-h-[80px]">
              
              {/* 1. 番号 */}
              <div className="w-12 text-center font-black text-xl text-gray-600 italic">
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* 2. 名前 */}
              <div className="w-48 border-r border-white/10 pr-4 mr-4 h-full flex items-center">
                {editingId === player.id ? (
                  <input
                    autoFocus
                    className="bg-transparent text-xl font-bold w-full outline-none text-[#ff4655] border-b border-[#ff4655]"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => updatePlayer(player.id, { name: tempName })}
                    onKeyDown={(e) => e.key === 'Enter' && updatePlayer(player.id, { name: tempName })}
                  />
                ) : (
                  <div 
                    className="text-xl font-bold truncate cursor-pointer hover:text-[#ff4655] w-full"
                    onClick={() => { setEditingId(player.id); setTempName(player.name); }}
                  >
                    {player.name}
                  </div>
                )}
              </div>

              {/* 3. ランク画像 */}
              <div className="w-24 flex justify-center items-center">
                <img 
                  src={getRankImageUrl(player.rank, player.division)}
                  alt={player.rank}
                  className="h-14 w-14 object-contain drop-shadow-[0_0_10px_rgba(255,70,85,0.4)]"
                  onError={(e) => {
                    // 画像読み込みエラー時のフォールバック処理
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                {/* 画像エラー時の予備テキスト */}
                <span className="hidden text-[10px] text-gray-500 font-bold text-center">
                  NO IMG
                </span>
              </div>

              {/* 4. 現在のランク文字 */}
              <div className="w-32 text-center border-r border-white/10 h-full flex flex-col justify-center mr-4">
                <span className="text-base font-black uppercase tracking-tight leading-tight">{player.rank}</span>
                {player.rank !== 'Unranked' && player.rank !== 'Radiant' && (
                  <span className="text-[#ff4655] text-xs font-bold">DIV {player.division}</span>
                )}
              </div>

              {/* 5. 操作パネル */}
              <div className="flex-1 flex flex-col justify-center gap-1.5 pl-2">
                {/* ランクボタン */}
                <div className="flex gap-1 flex-wrap">
                  {RANKS.map(r => (
                    <button
                      key={r}
                      onClick={() => updatePlayer(player.id, { rank: r })}
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-all border rounded-sm ${
                        player.rank === r 
                          ? 'bg-[#ff4655] border-[#ff4655] text-white' 
                          : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-400 hover:text-gray-300'
                      }`}
                    >
                      {r === 'Unranked' ? 'UN' : r.substring(0, 3)}
                    </button>
                  ))}
                </div>

                {/* ディビジョンボタン（Unranked/Radiant以外） */}
                {player.rank !== 'Unranked' && player.rank !== 'Radiant' && (
                  <div className="flex gap-1">
                    {['1', '2', '3'].map(d => (
                      <button
                        key={d}
                        onClick={() => updatePlayer(player.id, { division: d })}
                        className={`w-12 py-0.5 text-[10px] font-bold border rounded-sm ${
                          player.division === d 
                            ? 'bg-white text-black border-white' 
                            : 'bg-[#1f2326] border-gray-700 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                        DIV {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}