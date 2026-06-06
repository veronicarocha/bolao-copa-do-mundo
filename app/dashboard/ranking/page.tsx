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
  const [erro, setErro] = useState(false);

  useEffect(() => {
    async function calcularRankingConsolidado() {
      try {
        // 1. Busca todos os participantes inscritos
        const { data: perfis, error: erroPerfis } = await supabase
          .from('perfis')
          .select('id, nome');

        if (erroPerfis) throw erroPerfis;

        // 2. Busca os palpites automáticos com os pontos reais calculados pelo motor
        const { data: pGrupos } = await supabase.from('palpites_jogos').select('user_id, id, pontos_ganhos');
        const { data: pMM } = await supabase.from('palpites_matamata').select('user_id, id, pontos_ganhos');
        const { data: pEsp } = await supabase.from('palpites_especiais').select('user_id, id, pontos_ganhos');

        // 3. Busca todas as correções manuais do banco
        const { data: ajustesManuais, error: erroAjustes } = await supabase
          .from('pontuacoes_manuais')
          .select('user_id, referencia_id, tabela_origem, pontos_ajustados');

        if (erroAjustes) throw erroAjustes;

        // Criamos o mapa de ajustes usando a chave tripla unificada (garantindo String nos IDs)
        const mapaAjustes = new Map(
          ajustesManuais?.map(a => [`${a.user_id}_${a.tabela_origem}_${String(a.referencia_id)}`, a.pontos_ajustados])
        );

        // 4. Consolida a pontuação de cada participante
        const rankingCalculado = (perfis || []).map((usuario) => {
          let totalPontosUsuario = 0;

          // Função interna para somar os pontos de cada tabela respeitando o override
          const somarCategoria = (listaPalpites: any[], nomeTabela: string) => {
            // Filtra os palpites pertencentes a este usuário específico
            const palpitesDoUsuario = (listaPalpites || []).filter(p => p.user_id === usuario.id);
            
            palpitesDoUsuario.forEach(p => {
              // 🛠️ Blindagem de tipo: Força o ID do palpite a virar String na composição da chave
              const chaveAjuste = `${usuario.id}_${nomeTabela}_${String(p.id)}`;
              
              if (mapaAjustes.has(chaveAjuste)) {
                // Se existe ajuste manual do admin, usa a sua nota soberana
                totalPontosUsuario += Number(mapaAjustes.get(chaveAjuste) || 0);
              } else {
                // SENÃO, pega o ponto que o motor calculou e gravou no palpite (os 15 ou 5 pontos!)
                totalPontosUsuario += Number(p.pontos_ganhos || 0);
              }
            });
          };

          // Executa a somatória passando pelas 3 tabelas
          somarCategoria(pGrupos || [], 'palpites_jogos');
          somarCategoria(pMM || [], 'palpites_matamata');
          somarCategoria(pEsp || [], 'palpites_especiais');

          return {
            id: usuario.id,
            nome: usuario.nome,
            pontos_finais: totalPontosUsuario
          };
        });

        // 5. Ordena o ranking do maior pontuador para o menor de forma estrita
        rankingCalculado.sort((a, b) => b.pontos_finais - a.pontos_finais);

        setRanking(rankingCalculado);
      } catch (err) {
        console.error("Erro ao processar lógica de soma do ranking:", err);
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }

    calcularRankingConsolidado();
  }, []);

  if (carregando) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center">
        <div className="p-8 text-center text-gray-400 font-mono animate-pulse">
          Consolidando classificação geral...
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center text-red-400 font-mono">
        Erro ao processar as pontuações e regras de override.
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 p-4 md:p-12 text-white">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        
        {/* Cabeçalho */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-amber-400">🏆 Tabela de Classificação Oficial</h1>
            <p className="text-xs md:text-sm text-gray-400 mt-2">
              Pontuação consolidada em tempo real com os resultados do motor.
            </p>
          </div>
          <div className="bg-black/30 border border-white/5 px-4 py-2 rounded-xl text-center w-full md:w-auto">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Participantes Ativos</p>
            <p className="text-2xl font-black text-emerald-400">{ranking.length}</p>
          </div>
        </div>

        {/* Lista de Ranking */}
        <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="hidden md:flex items-center justify-between bg-white/5 border-b border-white/10 p-4 text-xs uppercase tracking-wider text-gray-400 font-semibold">
            <div className="flex gap-4 w-1/2">
              <span className="w-12 text-center">Pos</span>
              <span>Participante</span>
            </div>
            <div className="flex items-center justify-end gap-12 w-1/2 pr-4">
              <span className="w-16 text-center">Pontos</span>
              <span className="w-24 text-center">Ação</span>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {ranking.map((p, index) => {
              const posicao = index + 1;
              const isTop3 = posicao <= 3;
              const badgePosicao = posicao === 1 ? '🥇' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : `${posicao}º`;

              return (
                <div key={p.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition group gap-3">
                  
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <span className={`font-mono font-black text-sm md:text-base w-6 md:w-12 text-center shrink-0 ${isTop3 ? '' : 'text-gray-500'}`}>
                      {badgePosicao}
                    </span>
                    <span className={`font-bold text-sm md:text-base truncate ${isTop3 ? 'text-white' : 'text-gray-300'}`}>
                      {p.nome || 'Participante sem nome'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 md:gap-12 shrink-0">
                    <div className="text-center font-black text-emerald-400 text-sm md:text-base w-12 md:w-16 font-mono">
                      {p.pontos_finais} <span className="text-[9px] md:text-[10px] text-emerald-600 uppercase font-normal">pts</span>
                    </div>
                    
                    <Link
                      href={`/dashboards/ranking/${p.id}`}
                      className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-[11px] font-bold text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-2 rounded-lg hover:bg-blue-500/10 transition active:scale-95 outline-none"
                    >
                      🔍 <span>Espiar</span>
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