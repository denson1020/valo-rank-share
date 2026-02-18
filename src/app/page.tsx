"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// ここでSupabaseと接続します
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'];

export default function Home() {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    fetchPlayers();
    
    // リアルタイム購読：DBが更新されたら自動で画面を更新する
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        fetchPlayers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('*').order('name');
    if (data) setPlayers(data);
  }

  async function updateRank(id: string, newRank: string) {
    await supabase.from('players').update({ rank: newRank }).eq('id', id);
  }

  return (
    <main className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-red-500 text-center uppercase">Valorant Rank Share</h1>
      
      <div className="max-w-2xl mx-auto grid gap-6">
        {players.map(player => (
          <div key={player.id} className="bg-gray-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center border border-gray-700 shadow-lg">
            <span className="text-xl font-bold mb-4 md:mb-0">{player.name}</span>
            <div className="flex flex-wrap justify-center gap-2">
              {RANKS.map(r => (
                <button
                  key={r}
                  onClick={() => updateRank(player.id, r)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-200 ${
                    player.rank === r 
                    ? 'bg-red-600 scale-110 shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}