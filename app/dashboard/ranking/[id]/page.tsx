'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Jogo {
  id: string;
  time_casa: string;
  time_fora: string;
  gols_casa: number | null;
  gols_fora: number | null;
}

interface PalpiteJogo {
  id: string;
  palpite_casa: number;
  palpite_fora: number;
  pontos_ganhos: number;
  jogos: Jogo;
}

interface Perfil {
  nome: string;
  pontos: number;
}

function traduzirFaseVaga(faseVaga: string) {
  const numeroJogo = parseInt(faseVaga.replace(/\D/g, ''), 10);

  if (numeroJogo >= 73 && numeroJogo <= 88) {
    return { fase: "Fase de 32", detalhe: `Jogo ${numeroJogo}` };
  }
  if (numeroJogo >= 89 && numeroJogo <= 96) {
    return { fase: "Oitavas de Final", detalhe: `Jogo ${numeroJogo}` };
  }
  if (numeroJogo >= 97 && numeroJogo <= 100) {
    return { fase: "Quartas de Final", detalhe: `Jogo ${numeroJogo}` };
  }
  if (numeroJogo === 101 || numeroJogo === 102) {
    return { fase: "Semifinal", detalhe: `Jogo ${numeroJogo}` };
  }
  if (numeroJogo === 103) {
    return { fase: "Disputa do 3º Lugar", detalhe: "3º Lugar" };
  }
  if (numeroJogo === 104) {
    return { fase: "Grande Final", detalhe: "Final 🏆" };
  }

  return { fase: "Mata-Mata", detalhe: faseVaga };
}

export default function VisualizarPalpites() {
  const { id } = useParams();
  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [palpitesGrupos, setPalpitesGrupos] = useState<PalpiteJogo[]>([]);
  const [palpitesMM, setPalpitesMM] = useState<any[]>([]);
  const [palpitesEsp, setPalpitesEsp] = useState<any[]>([]);

  const [abaAtiva, setAbaAtiva] = useState<'grupos' | 'matamata' | 'especiais'>('grupos');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function carregarDadosDoParticipante() {
      try {
        // 1. Busca o nome do perfil do participante
        const { data: dadosPerfil, error: erroPerfil } = await supabase
          .from('perfis')
          .select('nome')
          .eq('id', id)
          .maybeSingle();

        if (erroPerfil) throw erroPerfil;

        // 2. Busca Fase de Grupos
        const { data: dadosGrupos, error: erroGrupos } = await supabase
          .from('palpites_jogos')
          .select(`
            id,
            palpite_casa,
            palpite_fora,
            pontos_ganhos,
            jogos:jogo_id (
              id,
              time_casa,
              time_fora,
              gols_casa,
              gols_fora
            )
          `)
          .eq('user_id', id);

        if (erroGrupos) throw erroGrupos;
        const grupos = (dadosGrupos as any) || [];
        setPalpitesGrupos(grupos);

        // 3. Busca Mata-Mata
        const { data: dadosMM } = await supabase
          .from('palpites_matamata')
          .select('*')
          .eq('user_id', id);
        const mm = dadosMM || [];
        setPalpitesMM(mm);

        // 4. Busca Especiais
        const { data: dadosEsp } = await supabase
          .from('palpites_especiais')
          .select('*')
          .eq('user_id', id);
        const esp = dadosEsp || [];
        setPalpitesEsp(esp);

        // 🧮 SOMA DINÂMICA EM MEMÓRIA: Evita o bug do '0' fixo no topo
        let somaTotal = 0;
        grupos.forEach((p: any) => somaTotal += Number(p.pontos_ganhos || 0));
        mm.forEach((p: any) => somaTotal += Number(p.pontos_ganhos || 0));
        esp.forEach((p: any) => somaTotal += Number(p.pontos_ganhos || 0));

        setPerfil({
          nome: dadosPerfil?.nome || 'Usuário Sem Nome',
          pontos: somaTotal
        });

      } catch (err) {
        console.error("Erro ao espiar palpites:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDadosDoParticipante();
  }, [id]);

  if (carregando) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center">
        <div className="text-gray-400 font-mono animate-pulse">Carregando auditoria de palpites...</div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <p className="text-red-400 font-mono">Participante não encontrado.</p>
        <button onClick={() => router.back()} className="text-sm text-blue-400 underline">Voltar para o Ranking</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 p-4 md:p-12 text-white">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Voltar e Cabeçalho */}
        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sm font-black text-gray-200 hover:text-white rounded-xl border border-white/10 shadow-md transition group focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label="Voltar para a página de classificação"
          >
            <span className="text-base transition-transform group-hover:-translate-x-1">⬅️</span>
            <span>Voltar para o Ranking Geral</span>
          </button>

          {/* 🛠️ Corrigido o fechamento e alinhamento deste bloco de flexbox */}
          <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">Modo Leitura Auditado 👁️</span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Palpites de <span className="text-amber-400">{perfil.nome}</span>
              </h1>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-2 rounded-xl text-right shrink-0">
              <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Pontuação Total</p>
              <p className="text-2xl font-black text-emerald-400 font-mono">{perfil.pontos} pts</p>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 gap-1">
          <button
            onClick={() => setAbaAtiva('grupos')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${abaAtiva === 'grupos' ? 'bg-white/10 text-amber-400' : 'text-gray-400 hover:text-white'}`}
          >
            ⚽ Fase de Grupos
          </button>
          <button
            onClick={() => setAbaAtiva('matamata')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${abaAtiva === 'matamata' ? 'bg-white/10 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          >
            ⚡ Mata-Mata
          </button>
          <button
            onClick={() => setAbaAtiva('especiais')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${abaAtiva === 'especiais' ? 'bg-white/10 text-purple-400' : 'text-gray-400 hover:text-white'}`}
          >
            🔥 Especiais
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="space-y-3">

          {/* ABA 1: FASE DE GRUPOS */}
          {abaAtiva === 'grupos' && (
            palpitesGrupos.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl text-gray-500 text-sm border border-white/5">Nenhum palpite de grupos enviado.</div>
            ) : (
              palpitesGrupos.map((item) => {
                const jogo = item.jogos;
                if (!jogo) return null;
                const jogoTevePlacarReal = jogo.gols_casa !== null && jogo.gols_fora !== null;

                return (
                  <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-white/10 transition">
                    <div className="flex items-center gap-3 w-full md:w-2/5 justify-center md:justify-start">
                      <span className="text-sm font-bold text-gray-200">{jogo.time_casa}</span>
                      <span className="text-xs text-gray-500 font-bold px-1.5 py-0.5 bg-white/5 rounded">VS</span>
                      <span className="text-sm font-bold text-gray-200">{jogo.time_fora}</span>
                    </div>
                    <div className="flex gap-4 shrink-0">
                      <div className="flex flex-col items-center bg-amber-500/5 border border-amber-500/10 px-4 py-2 rounded-lg min-w-[120px]">
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-1">Palpite</span>
                        <div className="text-lg font-black font-mono text-amber-200">{item.palpite_casa} x {item.palpite_fora}</div>
                      </div>
                      <div className="flex flex-col items-center bg-slate-900 border border-white/5 px-4 py-2 rounded-lg min-w-[120px]">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Oficial</span>
                        <div className="text-sm font-bold font-mono text-gray-400 mt-0.5">{jogoTevePlacarReal ? `${jogo.gols_casa} x ${jogo.gols_fora}` : '— x —'}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono font-black text-emerald-400 min-w-[60px]">+{item.pontos_ganhos || 0} pts</div>
                  </div>
                );
              })
            )
          )}

          {/* ABA 2: MATA MATA */}
          {abaAtiva === 'matamata' && (
            palpitesMM.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl text-gray-500 text-sm border border-white/5">
                Nenhum palpite de mata-mata enviado.
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const confrontosAgrupados: Record<string, { componentes: string[]; vencedor?: string; pontos?: number }> = {};

                  palpitesMM.forEach((item) => {
                    const idVaga = item.fase_vaga;
                    const baseVaga = idVaga.split('_')[0];

                    if (!confrontosAgrupados[baseVaga]) {
                      confrontosAgrupados[baseVaga] = { componentes: [] };
                    }

                    if (idVaga.endsWith('_1') || idVaga.endsWith('_2')) {
                      if (item.selecao_escolhida) {
                        confrontosAgrupados[baseVaga].componentes.push(item.selecao_escolhida);
                      }
                    } else {
                      confrontosAgrupados[baseVaga].vencedor = item.selecao_escolhida;
                      confrontosAgrupados[baseVaga].pontos = item.pontos_ganhos;
                    }
                  });

                  return Object.entries(confrontosAgrupados)
                    .sort((a, b) => parseInt(a[0].replace(/\D/g, ''), 10) - parseInt(b[0].replace(/\D/g, ''), 10))
                    .map(([codigoJogo, dados]) => {
                      const info = traduzirFaseVaga(codigoJogo);
                      const vencedor = dados.vencedor;
                      const timesNoConfronto = Array.from(new Set(dados.componentes));

                      return (
                        <div key={codigoJogo} className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition">
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded font-bold uppercase tracking-wider">
                              {info.fase}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              [{info.detalhe}]
                            </span>
                          </div>

                          {/* Cenário do Participante para esta vaga — Adaptável para Oitavas/Finais */}
                          <div className="text-xs text-gray-400 sm:text-center flex-1">
                            {timesNoConfronto.length > 0 ? (
                              <p>Confronto simulado: <span className="text-gray-200 font-bold">{timesNoConfronto.join(' x ')}</span></p>
                            ) : (
                              // ✨ Se não houver o cruzamento direto, simplifica o texto para os usuários
                              <p className="text-gray-500">
                                Disputa pela vaga das <span className="text-blue-400 font-medium">{info.fase}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t border-white/5 sm:border-0 pt-2 sm:pt-0">
                            <div className="text-sm">
                              <span className="text-gray-400 text-xs mr-1">Apostou em:</span>
                              <span className="text-amber-400 font-black tracking-wide bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/15">
                                {vencedor || 'Ninguém'}
                              </span>
                            </div>
                            <div className="font-mono font-black text-emerald-400 shrink-0">
                              +{dados.pontos || 0} pts
                            </div>
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            )
          )}

          {/* ABA 3: ESPECIAIS */}
          {abaAtiva === 'especiais' && (
            palpitesEsp.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl text-gray-500 text-sm border border-white/5">Nenhum palpite especial enviado.</div>
            ) : (
              palpitesEsp.map((item) => (
                <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-white/5 flex justify-between items-center gap-4 hover:border-white/10 transition">
                  <div className="truncate pr-4">
                    <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-1">{item.pergunta_id.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-black text-gray-200 truncate">{item.resposta_palpite || 'Em branco'}</p>
                  </div>
                  <div className="text-right font-mono font-black text-emerald-400 shrink-0">+{item.pontos_ganhos || 0} pts</div>
                </div>
              ))
            )
          )}

        </div>
      </div>
    </div>
  );
}