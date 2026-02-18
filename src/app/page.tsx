"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// --------------------------------------------------------
// 安全なSupabase接続
// --------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// --------------------------------------------------------
// 定数・設定（内部データは英語、表示は日本語）
// --------------------------------------------------------
const RANKS = [
  'Unranked',
  'Iron', 'Bronze', 'Silver', 'Gold', 
  'Platinum', 'Diamond', 'Ascendant', 
  'Immortal', 'Radiant'
];

const DIVISIONS = ['1', '2', '3'];

// 日本語変換マップ
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
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    document.title = "VALORANT ランク・トラッカー";
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

  async function updatePlayer(id: string, updates: any) {
    try {
      const updatesWithTime = { ...updates, last_updated: new Date().toISOString() };
      await supabase.from('players').update(updatesWithTime).eq('id', id);
      setEditingId(null);
    } catch (e) {
      console.error("Update Error:", e);
    }
  }

  // 日時フォーマット (例: 2/19 14:30)
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "---";
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
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

  if (isError) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-red-900 text-white p-10">
        <h1 className="text-2xl font-bold">設定エラー: Vercelの環境変数を確認してください</h1>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#0f1923] text-white font-sans overflow-x-hidden">
      
      {/* ヘッダー */}
      <header className="h-16 flex items-center justify-between px-8 border-b-2 border-[#ff4655] bg-[#1f2326]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#ff4655] flex items-center justify-center font-black text-xl italic rounded-sm shadow-[0_0_10px_#ff4655]">V</div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-[#ece8e1]">VALORANT ランク・トラッカー</h1>
        </div>
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <div className="text-[12px] text-[#ff4655] font-bold tracking-widest">
            リアルタイム同期中
            </div>
        </div>
      </header>

      {/* メインリスト */}
      <div className="p-4 max-w-[1920px] mx-auto">
        <div className="flex flex-col gap-2">
          {/* リストヘッダー（完全日本語） */}
          <div className="flex px-6 text-[#ff4655] font-bold text-xs tracking-widest opacity-70 mb-1">
            <div className="w-12 text-center">No.</div>
            <div className="w-48">プレイヤー名</div>
            <div className="w-24 text-center">ランク</div>
            <div className="w-40 text-center">現在の階級</div>
            <div className="w-40 text-center">最終更新</div>
            <div className="flex-1 pl-4">ランク更新 / 編集</div>
          </div>

          {/* プレイヤー行 */}
          {players.map((player, index) => (
            <div key={player.id || index} className="flex items-center bg-[#1f2326]/90 border border-white/10 hover:border-[#ff4655] transition-all px-6 py-2 h-[88px] group relative shadow-lg">
              
              {/* No. */}
              <div className="w-12 text-center font-black text-2xl text-gray-600 italic">
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* 名前 */}
              <div className="w-48 border-r border-white/10 pr-6 mr-6 h-full flex items-center">
                {editingId === player.id ? (
                  <input
                    autoFocus
                    className="bg-transparent text-xl font-bold w-full outline-none text-[#ff4655] border-b border-[#ff4655]"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => updatePlayer(player.id, { name: tempName })}
                    onKeyDown={(e) => e.key === 'Enter' && updatePlayer(player.id, { name: tempName })}
                    placeholder="名前を入力"
                  />
                ) : (
                  <div 
                    className="text-xl font-bold truncate cursor-pointer hover:text-[#ff4655] transition-colors w-full"
                    onClick={() => { setEditingId(player.id); setTempName(player.name || ""); }}
                  >
                    {player.name || "未登録"}
                  </div>
                )}
              </div>

              {/* ランク画像 */}
              <div className="w-24 flex justify-center h-full items-center">
                <img 
                  src={getRankImageUrl(player.rank, player.division)}
                  alt={player.rank || 'rank'}
                  className="h-14 w-14 object-contain drop-shadow-[0_0_12px_rgba(255,70,85,0.5)] transition-transform hover:scale-110"
                />
              </div>

              {/* 現在ランク文字（日本語表示） */}
              <div className="w-40 text-center border-r border-white/10 h-full flex flex-col justify-center mr-4">
                <span className="text-lg font-black tracking-tight leading-none text-white">
                  {RANK_JP_NAMES[player.rank] || 'アンランク'}
                </span>
                {player.rank !== 'Unranked' && player.rank !== 'Radiant' && (
                  <span className="text-[#ff4655] text-sm font-bold mt-1">
                    ディビジョン {player.division || '1'}
                  </span>
                )}
              </div>

              {/* 最終更新日時 */}
              <div className="w-40 text-center text-xs font-mono text-gray-400 border-r border-white/10 h-full flex flex-col justify-center mr-6">
                <span className="block opacity-50 text-[9px] mb-1">最終更新日時</span>
                <span className="text-[#ece8e1] font-bold">{formatTime(player.last_updated)}</span>
              </div>

              {/* コントロール（日本語プルダウン） */}
              <div className="flex-1 flex items-center gap-3">
                {/* ランク選択プルダウン */}
                <div className="relative group/select w-44">
                  <select
                    className="w-full bg-[#0f1923] border border-gray-600 text-white text-sm font-bold py-2 px-3 rounded appearance-none cursor-pointer focus:border-[#ff4655] focus:outline-none transition-colors"
                    value={player.rank || 'Unranked'}
                    onChange={(e) => updatePlayer(player.id, { rank: e.target.value })}
                  >
                    {RANKS.map(r => (
                      <option key={r} value={r}>
                        {RANK_JP_NAMES[r]}
                      </option>
                    ))}
                  </select>
                  {/* 下矢印アイコン */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#ff4655]">▼</div>
                </div>

                {/* ディビジョン選択プルダウン */}
                {player.rank !== 'Unranked' && player.rank !== 'Radiant' && (
                  <div className="relative group/select w-32">
                    <select
                      className="w-full bg-[#0f1923] border border-gray-600 text-white text-sm font-bold py-2 px-3 rounded appearance-none cursor-pointer focus:border-[#ff4655] focus:outline-none transition-colors"
                      value={player.division || '1'}
                      onChange={(e) => updatePlayer(player.id, { division: e.target.value })}
                    >
                      {DIVISIONS.map(d => (
                        <option key={d} value={d}>
                          ディビジョン {d}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#ff4655]">▼</div>
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