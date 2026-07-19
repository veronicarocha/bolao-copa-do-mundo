'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface PerfilRanking {
  id: string;
  nome: string;
  pontos: number;
  placares_exatos: number;
  acertos_vencedor: number;
  especiais_acertos: number;
  acertos_16avos: number;
  acertos_oitavas: number;
  acertos_quartas: number;
  acertos_semi: number;
  acertos_finalistas: number;
  acertos_campeao: number;
  acertos_terceiro: number; // 🌟 Adicionado
  acertos_quarto: number;   // 🌟 Adicionado
}

export default function PaginaRanking() {
  const [ranking, setRanking] = useState<PerfilRanking[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarRanking() {
      try {
        setCarregando(true);
        const { data, error } = await supabase
          .from('perfis')
          .select(`
            id, nome, pontos, placares_exatos, acertos_vencedor, especiais_acertos,
            acertos_16avos, acertos_oitavas, acertos_quartas, acertos_semi, acertos_finalistas, acertos_campeao,
            acertos_terceiro, acertos_quarto
          `); // 🌟 Inclusão dos novos campos na busca

        if (error) throw error;

        // 🧠 Ordenação Oficial por Critério de Desempate
        const listaOrdenada = (data || []).sort((a, b) => {
          if (b.pontos !== a.pontos) return b.pontos - a.pontos;
          if (b.placares_exatos !== a.placares_exatos) return b.placares_exatos - a.placares_exatos;
          return b.especiais_acertos - a.especiais_acertos;
        });

        setRanking(listaOrdenada);
      } catch (err) {
        console.error("Erro ao carregar ranking:", err);
      } finally {
        setCarregando(false);
      }
    }
    carregarRanking();
  }, []);

  if (carregando) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-gray-400 font-mono">Consolidando classificação analítica...</div>;

  return (
    <div className="min-h-screen w-full bg-slate-900 p-4 md:p-12 text-white">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Cabeçalho */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-amber-400">
              🏆 Classificação Geral
            </h1>
          </div>
        </div>

        {/* TABELA CONTAINER */}
        <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            <table className="w-full text-left border-collapse">

              {/* CABEÇALHO ÚNICO */}
              <thead className="sticky top-0 bg-slate-900 z-10 shadow-lg border-b border-white/10">
                <tr className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                  <th className="p-4 w-16">Posição</th>
                  <th className="p-4 w-24 text-center">Pontos</th>
                  <th className="p-4 w-24 text-center">Ação</th>
                  <th className="p-4 min-w-[200px]">Participante</th>
                  <th className="p-4 text-center text-blue-400">Placar Exato</th>
                  <th className="p-4 text-center text-sky-400">Resultado</th>
                  <th className="p-4 text-center text-purple-400">Especial</th>
                  <th className="p-4 text-center text-gray-400">16 Avos</th>
                  <th className="p-4 text-center text-indigo-400">Oitavas</th>
                  <th className="p-4 text-center text-pink-400">Quartas</th>
                  <th className="p-4 text-center text-orange-400">Semi</th>
                  <th className="p-4 text-center text-amber-600">3º Lugar</th> {/* 🌟 Nova Coluna */}
                  <th className="p-4 text-center text-teal-400">4º Lugar</th>  {/* 🌟 Nova Coluna */}
                  <th className="p-4 text-center text-rose-400">Vice</th>
                  <th className="p-4 text-center text-amber-400">Campeão</th>
                </tr>
              </thead>

              {/* CORPO DA TABELA */}
              <tbody className="divide-y divide-white/5">
                {ranking.map((p, index) => {
                  const posicao = index + 1;
                  const badge = posicao === 1 ? '🥇' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : posicao === 4 ? '🏅' : `${posicao}º`;

                  // 🧠 Subtrai o acerto do campeão para isolar estritamente o acerto do Vice
                  const acertosVice = Math.max(0, (p.acertos_finalistas || 0) - (p.acertos_campeao || 0));

                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition text-sm items-center">
                      <td className="p-4 font-black text-gray-500">{badge}</td>
                      <td className="p-4 font-black text-emerald-400 text-center text-base">{p.pontos || 0}</td>
                      <td className="p-4 text-center">
                        <Link href={`/dashboard/ranking/${p.id}`} className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg transition">
                          ESPIAR
                        </Link>
                      </td>
                      <td className="p-4 font-bold text-gray-200 truncate">{p.nome}</td>
                      <td className="p-4 text-center text-blue-400">{p.placares_exatos || 0}</td>
                      <td className="p-4 text-center text-sky-400">{p.acertos_vencedor || 0}</td>
                      <td className="p-4 text-center text-purple-400">{p.especiais_acertos || 0}</td>
                      <td className="p-4 text-center text-gray-400">{p.acertos_16avos || 0}</td>
                      <td className="p-4 text-center text-indigo-400">{p.acertos_oitavas || 0}</td>
                      <td className="p-4 text-center text-pink-400">{p.acertos_quartas || 0}</td>
                      <td className="p-4 text-center text-orange-400">{p.acertos_semi || 0}</td>
                      <td className="p-4 text-center text-amber-600 font-bold">{p.acertos_terceiro || 0}</td> {/* 🌟 Render 3º */}
                      <td className="p-4 text-center text-teal-400 font-bold">{p.acertos_quarto || 0}</td>  {/* 🌟 Render 4º */}
                      <td className="p-4 text-center text-rose-400 font-bold">{acertosVice}</td>
                      <td className="p-4 text-center text-amber-400 font-black">{p.acertos_campeao || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}