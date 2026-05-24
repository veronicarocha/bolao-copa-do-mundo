'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient'
import { notFound } from 'next/navigation';

interface DetalhePerfil {
  id: string;
  nome: string;
  pontos: number;
}

interface PalpiteGrupo {
  jogo_id: number;
  time_casa: string;
  time_fora: string;
  grupo: string;
  palpite_casa: number;
  palpite_fora: number;
  gols_casa: number | null; // Resultado real
  gols_fora: number | null; // Resultado real
}

interface PalpiteMataMata {
  fase_vaga: string;
  selecao_escolhida: string;
  selecao_real: string | null;
}

interface PalpiteEspecial {
  pergunta_id: string;
  label: string;
  resposta_palpite: string;
  resposta_real: string | null;
}

export default function DetalheParticipante({ params }: { params: { id: string } }) {
  const [perfil, setPerfil] = useState<DetalhePerfil | null>(null);
  const [palpitesG, setPalpitesG] = useState<PalpiteGrupo[]>([]);
  const [palpitesMM, setPalpitesMM] = useState<PalpiteMataMata[]>([]);
  const [palpitesEsp, setPalpitesEsp] = useState<PalpiteEspecial[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Lista de perguntas especiais para mapear o ID para o Rótulo
  const CATEGORIAS_ESPECIAIS: Record<string, string> = {
    campeao: '🥇 Grande Campeão', vice: '🥈 Vice-Campeão', terceiro: '🥉 3º Colocado',
    artilheiro_geral: '⚽ Artilheiro da Copa', craque_copa: '👑 Craque da Copa (Bola de Ouro)',
    melhor_goleiro: '🧤 Melhor Goleiro (Luva de Ouro)', craque_final: '🏅 Craque da Final',
    lider_assistencias: '🎯 Líder de Assistências', total_gols: '⚽ Total de GOLS',
    total_vermelhos: '🟥 Total de CARTÕES VERMELHOS', primeiro_gol_brasil: '🇧🇷 1º Gol do Brasil',
    artilheiro_brasil: '🇧🇷 Artilheiro do Brasil', melhor_ataque: '🔥 Melhor Ataque',
    melhor_defesa: '🛡️ Melhor Defesa', arbitro_final: '🏁 Árbitro da Final',
    primeiro_gol_copa: '🏃‍♂️ Jogador do 1º Gol', mais_cartoes_selecao: '🟨 Seleção com MAIS cartões',
    menos_cartoes_selecao: '🕊️ Seleção com MENOS cartões', primeiro_zero_a_zero: '🚫 Primeiro 0 a 0'
  };

  useEffect(() => {
    async function carregarTudo() {
      try {
        // 1. Puxar as tabelas de gabarito reais (Mata-Mata e Especiais) para cruzar
        const { data: mmReal } = await supabase.from('resultados_matamata').select('*');
        const { data: espReal } = await supabase.from('resultados_especiais').select('*');
        
        const mapaMMReal = new Map(mmReal?.map(x => [x.fase_vaga, x.selecao_real]));
        const mapaEspReal = new Map(espReal?.map(x => [x.pergunta_id, x.resposta_real]));

        // 2. Puxar Perfil e Pontuação consolidada do usuário
        const { data: perfilData } = await supabase.from('perfis').select('id, nome, pontos').eq('id', params.id).single();
        if (!perfilData) {
          notFound();
          return;
        }
        setPerfil(perfilData);

        // 3. Puxar Palpites da Fase de Grupos cruzando com tabela JOGOS
        const { data: pGrupos } = await supabase
          .from('palpites')
          .select(`
            jogo_id,
            palpite_casa,
            palpite_fora,
            jogos (time_casa, time_fora, grupo, gols_casa, gols_fora)
          `)
          .eq('user_id', params.id);

        const formatadoG = pGrupos?.map((p: any) => ({
          jogo_id: p.jogo_id,
          time_casa: p.jogos.time_casa,
          time_fora: p.jogos.time_fora,
          grupo: p.jogos.grupo,
          palpite_casa: p.palpite_casa,
          palpite_fora: p.palpite_fora,
          gols_casa: p.jogos.gols_casa,
          gols_fora: p.jogos.gols_fora
        })) || [];
        setPalpitesG(formatadoG.sort((a,b) => a.jogo_id - b.jogo_id));

        // 4. Puxar Palpites do Mata-Mata cruzando com gabarito real
        const { data: pMM } = await supabase.from('palpites_matamata').select('*').eq('user_id', params.id);
        
        const formatadoMM = pMM?.map(p => ({
          fase_vaga: p.fase_vaga,
          selecao_escolhida: p.selecao_escolhida,
          selecao_real: mapaMMReal.get(p.fase_vaga) || null
        })) || [];
        setPalpitesMM(formatadoMM);

        // 5. Puxar Palpites Especiais cruzando com gabarito real e rótulos
        const { data: pEsp } = await supabase.from('palpites_especiais').select('*').eq('user_id', params.id);
        
        const formatadoEsp = pEsp?.map(p => ({
          pergunta_id: p.pergunta_id,
          label: CATEGORIAS_ESPECIAIS[p.pergunta_id] || 'Power Pick',
          resposta_palpite: p.resposta_palpite,
          resposta_real: mapaEspReal.get(p.pergunta_id) || null
        })) || [];
        setPalpitesEsp(formatadoEsp);

      } catch (err) {
        console.error(err);
      } finally {
        setCarregando(false);
      }
    }
    carregarTudo();
  }, [params.id]);

  if (carregando) return <div className="p-8 text-center text-gray-400 font-mono animate-pulse">Cruzando os palpites do participante...</div>;
  if (!perfil) return notFound();

  // Função utilitária para checar acerto (ignora caixa alta e espaços em branco nas laterais)
  const isAcertoStrict = (palpite: string, real: string | null) => {
    if (!real) return false;
    return palpite.trim().toLowerCase() === real.trim().toLowerCase();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white space-y-10 pb-16">
      
      {/* Cabeçalho do Perfil Detalhado */}
      <div className="bg-slate-950 p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <p className="text-xs text-gray-400 font-mono">Detalhes do Participante</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">{perfil.nome}</h1>
          <p className="text-xs text-amber-300 mt-1 font-semibold uppercase tracking-wider">Perfil Público do Bolão</p>
        </div>
        <div className="text-center md:text-right bg-black/40 px-8 py-5 rounded-3xl border border-white/10 shadow-inner">
          <p className="text-gray-400 text-sm">Pontuação Consolidada</p>
          <span className="text-6xl font-black text-emerald-400 tracking-tighter">{perfil.pontos} <span className="text-3xl text-emerald-600 font-bold">pts</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* BLOCO 1: FASE DE GRUPOS */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
          <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-emerald-400 flex items-center gap-2">⚽ Palpites: Fase de Grupos</h2>
          <div className="space-y-3 pr-2">
            {palpitesG.map((j) => {
              const temResultado = j.gols_casa !== null && j.gols_fora !== null;
              
              const pC = j.palpite_casa;
              const pF = j.palpite_fora;
              const rC = j.gols_casa;
              const rF = j.gols_fora;

              let acertouPlacar = false;
              let acertouResultado = false;

              if (temResultado && rC !== null && rF !== null) {
                acertouPlacar = pC === rC && pF === rF;
                acertouResultado = (pC > pF && rC > rF) || (pC < pF && rC < rF) || (pC === pF && rC === rF);
              }

              return (
                <div key={j.jogo_id} className={`flex items-center justify-between p-3 rounded-xl border text-xs gap-3 ${
                    temResultado 
                      ? (acertouPlacar ? 'bg-emerald-500/10 border-emerald-500/20' : acertouResultado ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20')
                      : 'bg-black/30 border-white/5'
                }`}>
                  <div className="flex-col w-12 text-center text-gray-500">
                    <span className="font-mono block">G{j.grupo}</span>
                    <span className='text-[10px]'>J{j.jogo_id}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full justify-center">
                    <span className="font-medium truncate text-right w-36">{j.time_casa}</span>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 font-bold text-white border border-white/5">
                        <span className='text-gray-400'>{j.palpite_casa}</span>
                        <span className="text-gray-600">x</span>
                        <span className='text-gray-400'>{j.palpite_fora}</span>
                    </div>
                    <span className="font-medium truncate text-left w-36">{j.time_fora}</span>
                  </div>

                  <div className="w-20 text-center">
                    {temResultado && (
                        <span className={`text-[10px] font-black uppercase tracking-wider ${acertouPlacar ? 'text-emerald-400' : acertouResultado ? 'text-blue-400' : 'text-red-400'}`}>
                            {acertouPlacar ? '15 pts 🎉' : acertouResultado ? '5 pts ✅' : '0 pts'}
                        </span>
                    )}
                    {!temResultado && <span className="text-gray-700 font-mono text-[10px]">Aguard.</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BLOCO 2: MATA-MATA E ESPECIAIS */}
        <div className="space-y-8">
          
          {/* MATA-MATA */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-blue-400 flex items-center gap-2">⚡ Palpites: Mata-Mata</h2>
            <div className="grid grid-cols-2 gap-3 text-[11px] max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {palpitesMM.map(p => {
                const acertou = isAcertoStrict(p.selecao_escolhida, p.selecao_real);
                const temResultado = p.selecao_real !== null;
                return (
                  <div key={p.fase_vaga} className={`p-2.5 rounded-lg border space-y-1 ${
                      temResultado 
                        ? (acertou ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20')
                        : 'bg-black/20 border-white/5'
                  }`}>
                    <div className="flex justify-between items-center text-[9px] text-gray-500">
                      <span className="font-mono">{p.fase_vaga}</span>
                      {temResultado && (
                        <span className={`font-black uppercase ${acertou ? 'text-emerald-400' : 'text-red-400'}`}>
                          {acertou ? 'Acertou!' : 'Errou'}
                        </span>
                      )}
                    </div>
                    <p className={`font-bold ${temResultado ? (acertou ? 'text-emerald-100' : 'text-red-100') : 'text-gray-100'}`}>
                      {p.selecao_escolhida}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ESPECIAIS */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-purple-400 flex items-center gap-2">🔥 Palpites: Especiais (Power Picks)</h2>
            <div className="space-y-3 text-[11px] max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {palpitesEsp.map(p => {
                const acertou = isAcertoStrict(p.resposta_palpite, p.resposta_real);
                const temResultado = p.resposta_real !== null;
                return (
                  <div key={p.pergunta_id} className={`p-3 rounded-lg border flex items-center justify-between gap-4 ${
                      temResultado 
                        ? (acertou ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20')
                        : 'bg-black/20 border-white/5'
                  }`}>
                    <div className="w-1/2">
                      <p className="font-semibold text-gray-300">{p.label}</p>
                    </div>
                    <div className="w-1/2 text-right">
                      <p className={`font-bold ${temResultado ? (acertou ? 'text-emerald-100' : 'text-red-100') : 'text-gray-100'}`}>
                        {p.resposta_palpite}
                      </p>
                      {temResultado && !acertou && (
                        <p className="text-[10px] text-red-500 font-medium">Real: {p.resposta_real}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}