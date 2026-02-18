"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// --------------------------------------------------------
// Supabase接続設定
// --------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// --------------------------------------------------------
// 定数データ
// --------------------------------------------------------
const RANKS = [
  'Unranked',
  'Iron', 'Bronze', 'Silver', 'Gold', 
  'Platinum', 'Diamond', 'Ascendant', 
  'Immortal', 'Radiant'
];

const DIVISIONS = ['1', '2', '3'];

const RANK_JP_NAMES: { [key: string]: string } = {
  'Unranked': 'アンランク',
  'Iron': 'アイアン',
  'Bronze': 'ブロンズ',
  'Silver': 'シルバー',
  'Gold': 'ゴールド',
  'Platinum': 'プラチナ',
  'Diamond': 'ダイヤモンド',
  'Ascendant': 'アセンダント',
  'Immortal': 'イモータル',
  'Radiant': 'レディアント'
};

export default function Home() {
  const [players, setPlayers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [tempRiotId, setTempRiotId] = useState(""); // ID用の一時保存
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    document.title = "VALORANT チーム管理ボード";
  }, []);

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase URL or Key is missing!");
      setIsError(true);
      return;
    }
    fetchPlayers();
    const channel = supabase.channel('realtime-valo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchPlayers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPlayers() {
    try {
      const { data, error } = await supabase.from('players').select('*').order('id');
      if (error) throw error;
      if (data) setPlayers(data);
    } catch (e) {
      console.error("Fetch Error:", e);
    }
  }

  // 更新処理
  async function updatePlayer(id: string, updates: any) {
    try {
      const updatesWithTime = { ...updates, last_updated: new Date().toISOString() };
      await supabase.from('players').update(updatesWithTime).eq('id', id);
      // 編集モードを終了しない（連続入力のため）が、ここでは終了させる
      if (updates.name || updates.riot_id) {
        setEditingId(null);
      }
    } catch (e) {
      console.error("Update Error:", e);
    }
  }

  // 編集開始処理
  const startEditing = (player: any) => {
    setEditingId(player.id);
    setTempName(player.name || "");
    setTempRiotId(player.riot_id || "");
  };

  // 編集保存処理
  const saveEdit = (id: string) => {
    updatePlayer(id, { name: tempName, riot_id: tempRiotId });
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "--/-- --:--";
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', { 
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getRankImageUrl = (rank: string | null, division: string | null) => {
    const safeRank = rank || 'Unranked';
    const safeDiv = division || '1';
    if (safeRank === 'Unranked') return 'https://trackercdn.com/cdn/tracker.gg/valorant/icons/tiers/0.png';
    if (safeRank === 'Radiant') return 'https://trackercdn.com/cdn/tracker.gg/valorant/icons/tiers/27.png';
    const baseIds: { [key: string]: number } = {
      'Iron': 3, 'Bronze': 6, 'Silver': 9, 'Gold': 12,
      'Platinum': 15, 'Diamond': 18, 'Ascendant': 21, 'Immortal': 24
    };
    const base = baseIds[safeRank];
    if (!base) return 'https://trackercdn.com/cdn/tracker.gg/valorant/icons/tiers/0.png';
    const divNum = parseInt(safeDiv) || 1;
    const finalId = base + divNum - 1;
    return `https://trackercdn.com/cdn/tracker.gg/valorant/icons/tiers/${finalId}.png`;
  };

  if (isError) return <div className="p-10 text-white bg-red-900">設定エラー: APIキーを確認してください</div>;

  return (
    <main className="w-full min-h-screen bg-[#0f1923] text-white font-sans overflow-x-hidden flex flex-col">
      
      {/* ヘッダー */}
      <header className="h-20 flex items-center justify-between px-8 bg-[#1f2326] border-b-4 border-[#ff4655] shadow-lg z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#ff4655] flex items-center justify-center text-white font-black text-2xl italic rounded shadow-[0_0_15px_rgba(255,70,85,0.6)]">
            V
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-[#ece8e1] leading-none">
              VALORANT TRACKER
            </h1>
            <p className="text-[10px] text-gray-400 font-bold tracking-[0.4em] mt-1 uppercase">
              Team Status Board
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded border border-white/10">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></span>
            <span className="text-[10px] text-[#ff4655] font-bold tracking-widest uppercase">
              ONLINE
            </span>
        </div>
      </header>

      {/* メインエリア */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1600px] mx-auto">
          
          {/* テーブルヘッダー */}
          <div className="grid grid-cols-12 gap-4 px-6 pb-2 text-[#ff4655] font-bold text-xs tracking-widest uppercase opacity-80 border-b border-white/10">
            <div className="col-span-1 text-center">No.</div>
            <div className="col-span-3 pl-2">PROFILE (Name & ID)</div>
            <div className="col-span-1 text-center">RANK ICON</div>
            <div className="col-span-2 text-center">CURRENT TIER</div>
            <div className="col-span-2 text-center">LAST UPDATE</div>
            <div className="col-span-3 pl-4">CONTROLS</div>
          </div>

          {/* プレイヤーリスト */}
          <div className="flex flex-col gap-3 mt-4">
            {players.map((player, index) => (
              <div 
                key={player.id || index} 
                className="grid grid-cols-12 gap-4 items-center bg-[#1f2326] border-l-4 border-transparent hover:border-[#ff4655] hover:bg-[#252a30] transition-all duration-200 px-6 py-3 shadow-md rounded-r-lg group h-[100px]"
              >
                
                {/* 1. 番号 */}
                <div className="col-span-1 text-center">
                  <span className="font-black text-3xl text-gray-700 italic group-hover:text-gray-500 transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* 2. プロフィール (名前とID) */}
                <div className="col-span-3 pl-2 border-r border-white/10 pr-4 h-full flex items-center">
                  {editingId === player.id ? (
                    <div className="w-full space-y-2">
                      <input
                        autoFocus
                        className="w-full bg-[#0f1923] border border-[#ff4655] text-white font-bold px-2 py-1 text-lg outline-none rounded"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="プレイヤー名"
                      />
                      <input
                        className="w-full bg-[#0f1923] border border-gray-600 text-gray-300 font-mono text-sm px-2 py-1 outline-none rounded focus:border-[#ff4655]"
                        value={tempRiotId}
                        onChange={(e) => setTempRiotId(e.target.value)}
                        onBlur={() => saveEdit(player.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(player.id)}
                        placeholder="#TAG"
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-full cursor-pointer group/name"
                      onClick={() => startEditing(player)}
                    >
                      <div className="text-xl font-bold text-white truncate group-hover/name:text-[#ff4655] transition-colors">
                        {player.name || "名称未設定"}
                      </div>
                      <div className="text-sm font-mono text-gray-500 flex items-center gap-1 mt-1 group-hover/name:text-gray-300">
                        <span className="text-[10px] bg-gray-800 px-1 rounded text-gray-400">ID</span>
                        {player.riot_id || "未設定"}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. ランク画像 */}
                <div className="col-span-1 flex justify-center items-center h-full">
                  <img 
                    src={getRankImageUrl(player.rank, player.division)}
                    alt={player.rank || 'rank'}
                    className="h-16 w-16 object-contain drop-shadow-[0_0_15px_rgba(255,70,85,0.4)] transform group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* 4. 現在のランク (日本語) */}
                <div className="col-span-2 text-center h-full flex flex-col justify-center border-r border-white/10">
                  <div className="text-xl font-black tracking-tight text-white uppercase">
                    {RANK_JP_NAMES[player.rank] || 'アンランク'}
                  </div>
                  {player.rank !== 'Unranked' && player.rank !== 'Radiant' && (
                    <div className="text-[#ff4655] text-sm font-bold tracking-widest mt-1">
                      DIV {player.division || '1'}
                    </div>
                  )}
                </div>

                {/* 5. 最終更新 */}
                <div className="col-span-2 text-center text-xs font-mono text-gray-400 h-full flex flex-col justify-center border-r border-white/10">
                  <span className="block text-[9px] opacity-40 mb-1 uppercase">Last Update</span>
                  <span className="text-[#ece8e1] font-bold text-sm tracking-wide">
                    {formatTime(player.last_updated)}
                  </span>
                </div>

                {/* 6. 操作パネル (プルダウン) */}
                <div className="col-span-3 pl-4 flex flex-col justify-center gap-2 h-full">
                  {/* ランク選択 */}
                  <div className="relative w-full">
                    <select
                      className="w-full bg-[#0f1923] hover:bg-[#16222e] border border-gray-600 hover:border-gray-400 text-white text-sm font-bold py-2 pl-3 pr-8 rounded appearance-none cursor-pointer focus:border-[#ff4655] focus:outline-none transition-all uppercase"
                      value={player.rank || 'Unranked'}
                      onChange={(e) => updatePlayer(player.id, { rank: e.target.value })}
                    >
                      {RANKS.map(r => (
                        <option key={r} value={r}>{RANK_JP_NAMES[r]}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#ff4655] text-xs">▼</div>
                  </div>

                  {/* ディビジョン選択 */}
                  <div className={`relative w-full transition-opacity duration-200 ${
                    (player.rank === 'Unranked' || player.rank === 'Radiant') ? 'opacity-20 pointer-events-none' : 'opacity-100'
                  }`}>
                    <select
                      className="w-full bg-[#0f1923] hover:bg-[#16222e] border border-gray-600 hover:border-gray-400 text-white text-sm font-bold py-2 pl-3 pr-8 rounded appearance-none cursor-pointer focus:border-[#ff4655] focus:outline-none transition-all"
                      value={player.division || '1'}
                      onChange={(e) => updatePlayer(player.id, { division: e.target.value })}
                    >
                      {DIVISIONS.map(d => (
                        <option key={d} value={d}>ディビジョン {d}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#ff4655] text-xs">▼</div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}