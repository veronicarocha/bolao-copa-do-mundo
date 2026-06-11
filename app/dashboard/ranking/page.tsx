'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface PerfilRanking {
  id: string;
  nome: string;
  pontos_finais: number;
}

export default function PaginaRanking() {
  const [ranking, setRanking] = useState<PerfilRanking[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarRanking() {
      try {
        setCarregando(true);

        // Buscamos direto da tabela perfis, onde você confirmou que os 35 pts estão salvos
        const { data, error } = await supabase
          .from('perfis')
          .select('id, nome, pontos')
          .order('pontos', { ascending: false }); // Ordenação direta pelo banco

        if (error) throw error;

        const listaFormatada = (data || []).map(p => ({
          id: p.id,
          nome: p.nome || 'Participante',
          pontos_finais: p.pontos || 0
        }));

        setRanking(listaFormatada);
      } catch (err) {
        console.error("Erro ao carregar ranking:", err);
      } finally {
        setCarregando(false);
      }
    }
    carregarRanking();
  }, []);

  if (carregando) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center">
        <div className="p-8 text-center text-gray-400 font-mono animate-pulse">Carregando classificação...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 p-4 md:p-12 text-white">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">

        {/* Cabeçalho */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-amber-400">🏆 Tabela de Classificação</h1>
            <p className="text-xs md:text-sm text-gray-400 mt-2 font-medium">
              <span className="text-emerald-400 font-bold">{ranking.length} participantes</span> ativos.
            </p>
          </div>
          <div className="bg-black/30 border border-white/5 px-6 py-3 rounded-xl text-center w-full md:w-auto">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total</p>
            <p className="text-2xl font-black text-white">{ranking.length}</p>
          </div>
        </div>

        {/* Lista de Ranking */}
        <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="divide-y divide-white/5">
            {ranking.map((p, index) => {
              const posicao = index + 1;
              const isTop3 = posicao <= 3;
              const isQuarto = posicao === 4;

              // Definição dos ícones: O 4º lugar agora ganha um distintivo especial (🛡️)
              const badge = posicao === 1 ? '🥇'
                : posicao === 2 ? '🥈'
                  : posicao === 3 ? '🥉'
                    : isQuarto ? '🛡️'
                      : `${posicao}º`;

              return (
                <div key={p.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition group gap-3">
                  <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0 px-2">
                    <span className={`font-black text-sm md:text-lg w-8 md:w-12 text-center shrink-0 ${isTop3 ? '' : 'text-gray-500'}`}>
                      {badge}
                    </span>
                    <span className="font-bold text-sm md:text-lg truncate text-gray-200">{p.nome}</span>
                  </div>

                  <div className="flex items-center gap-6 md:gap-12 shrink-0 pr-2">
                    <div className="text-center font-black text-emerald-400 text-sm md:text-xl w-12 md:w-20 font-mono">
                      {p.pontos_finais}
                    </div>
                    <Link
                      href={`/dashboard/ranking/${p.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 rounded-xl text-[10px] md:text-xs font-bold transition active:scale-95 uppercase tracking-wider"
                    >
                      🔍 Espiar
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}