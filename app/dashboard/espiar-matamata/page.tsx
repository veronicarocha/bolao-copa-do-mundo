'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

type MatchId = string;

// Grafo estrutural idêntico para renderização e mapeamento de herança
const DEZESSEIS_AVOS = [
  { id: 'J74', label: 'Match 74', de1: '1º Lugar Grupo E', de2: 'Melhor 3º (A/B/C/D/F)' },
  { id: 'J77', label: 'Match 77', de1: '1º Lugar Grupo I', de2: 'Melhor 3º (C/D/F/G/H)' },
  { id: 'J73', label: 'Match 73', de1: '2º Lugar Grupo A', de2: '2º Lugar Grupo B' },
  { id: 'J75', label: 'Match 75', de1: '1º Lugar Grupo F', de2: '2º Lugar Grupo C' },
  { id: 'J83', label: 'Match 83', de1: '2º Lugar Grupo K', de2: '2º Lugar Grupo L' },
  { id: 'J84', label: 'Match 84', de1: '1º Lugar Grupo H', de2: '2º Lugar Grupo J' },
  { id: 'J81', label: 'Match 81', de1: '1º Lugar Grupo D', de2: 'Melhor 3º (B/E/F/I/J)' },
  { id: 'J82', label: 'Match 82', de1: '1º Lugar Grupo G', de2: 'Melhor 3º (A/E/H/I/J)' },
  { id: 'J76', label: 'Match 76', de1: '1º Lugar Grupo C', de2: '2º Lugar Grupo F' },
  { id: 'J78', label: 'Match 78', de1: '2º Lugar Grupo E', de2: '2º Lugar Grupo I' },
  { id: 'J79', label: 'Match 79', de1: '1º Lugar Grupo A', de2: 'Melhor 3º (C/E/F/H/I)' },
  { id: 'J80', label: 'Match 80', de1: '1º Lugar Grupo L', text: 'Melhor 3º (E/H/I/J/K)' },
  { id: 'J86', label: 'Match 86', de1: '1º Lugar Grupo J', de2: '2º Lugar Grupo H' },
  { id: 'J88', label: 'Match 88', de1: '2º Lugar Grupo D', de2: '2º Lugar Grupo G' },
  { id: 'J85', label: 'Match 85', de1: '1º Lugar Grupo B', de2: 'Melhor 3º (E/F/G/I/J)' },
  { id: 'J87', label: 'Match 87', de1: '1º Lugar Grupo K', de2: 'Melhor 3º (D/E/I/J/L)' }
];

const OITAVAS = [
  { id: 'J89', label: 'Match 89', req1: 'J74', req2: 'J77', pts: 10 },
  { id: 'J90', label: 'Match 90', req1: 'J73', req2: 'J75', pts: 10 },
  { id: 'J93', label: 'Match 93', req1: 'J83', req2: 'J84', pts: 10 },
  { id: 'J94', label: 'Match 94', req1: 'J81', req2: 'J82', pts: 10 },
  { id: 'J91', label: 'Match 91', req1: 'J76', req2: 'J78', pts: 10 },
  { id: 'J92', label: 'Match 92', req1: 'J79', req2: 'J80', pts: 10 },
  { id: 'J95', label: 'Match 95', req1: 'J86', req2: 'J88', pts: 10 },
  { id: 'J96', label: 'Match 96', req1: 'J85', req2: 'J87', pts: 10 }
];

const QUARTAS = [
  { id: 'J97', label: 'Match 97', req1: 'J89', req2: 'J90', pts: 20 },
  { id: 'J98', label: 'Match 98', req1: 'J93', req2: 'J94', pts: 20 },
  { id: 'J99', label: 'Match 99', req1: 'J91', req2: 'J92', pts: 20 },
  { id: 'J100', label: 'Match 100', req1: 'J95', req2: 'J96', pts: 20 }
];

const SEMIS = [
  { id: 'J101', label: 'Match 101', req1: 'J97', req2: 'J98', pts: 25 },
  { id: 'J102', label: 'Match 102', req1: 'J99', req2: 'J100', pts: 25 }
];

export default function EspiarMataMata() {
  const [participantes, setParticipantes] = useState<{ id: string; nome: string }[]>([]);
  const [userIdSelecionado, setUserIdSelecionado] = useState<string>('');
  const [palpites, setPalpites] = useState<Record<string, string>>({});
  const [gabaritoReal, setGabaritoReal] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);

  // 1. Inicializa buscando a lista de perfis dos participantes e gabaritos reais
  useEffect(() => {
    async function inicializarFiltros() {
      try {
        const { data: perfis } = await supabase.from('perfis').select('id, nome').order('nome', { ascending: true });
        setParticipantes(perfis || []);
        if (perfis && perfis.length > 0) setUserIdSelecionado(perfis[0].id);

        const { data: reais } = await supabase.from('resultados_reais_matamata').select('*');
        const mapaReal: Record<string, string> = {};
        reais?.forEach(item => { mapaReal[item.fase_vaga] = item.selecao_escolhida; });
        setGabaritoReal(mapaReal);

      } catch (err) {
        console.error('Erro ao carregar filtros do espiar:', err);
      } finally {
        setCarregando(false);
      }
    }
    inicializarFiltros();
  }, []);

  // 2. Monitora a troca do usuário no Select para recarregar a árvore correspondente
  useEffect(() => {
    if (!userIdSelecionado) return;

    async function carregarEspionagem() {
      const { data: salvos } = await supabase
        .from('palpites_matamata')
        .select('*')
        .eq('user_id', userIdSelecionado);
      
      const mapa: Record<string, string> = {};
      salvos?.forEach(item => { mapa[item.fase_vaga] = item.selecao_escolhida; });
      setPalpites(mapa);
    }
    carregarEspionagem();
  }, [userIdSelecionado]);

  const obterVencedor = (matchId: MatchId) => palpites[matchId] || '';

  const obterEstiloValidacao = (vagaId: string, selecaoApostada: string) => {
    if (!selecaoApostada) return 'bg-black/10 border-white/5 text-gray-600 border-dashed';
    
    const resultadoCerto = gabaritoReal[vagaId];
    if (!resultadoCerto) return 'bg-black/40 border-white/10 font-bold text-gray-200';
    
    return (selecaoApostada.toLowerCase().trim() === resultadoCerto.toLowerCase().trim())
      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)]'
      : 'bg-red-950/40 border-red-500/30 text-red-400/80 line-through opacity-60';
  };

  // 🌟 DEDUÇÃO MATEMÁTICA PURA VIA USEMEMO (Baseada estritamente no seu print)
  const terceiro1 = useMemo(() => {
    // Para o J101 (Semi 1), os times de entrada reais salvos no banco vêm do J97 e J98
    const timeA = palpites['J97'] || '';
    const timeB = palpites['J98'] || '';
    const avancouParaFinal = palpites['J101'] || '';

    if (!timeA || !timeB || !avancouParaFinal) return '';
    return avancouParaFinal === timeA ? timeB : timeA;
  }, [palpites]);

  const terceiro2 = useMemo(() => {
    // Para o J102 (Semi 2), os times de entrada reais salvos no banco vêm do J99 e J100
    const timeA = palpites['J99'] || '';
    const timeB = palpites['J100'] || '';
    const avancouParaFinal = palpites['J102'] || '';

    if (!timeA || !timeB || !avancouParaFinal) return '';
    return avancouParaFinal === timeA ? timeB : timeA;
  }, [palpites]);

  // Cálculo de pontuação global
  const pontuacaoTotalMataMata = useMemo(() => {
    let pts = 0;
    Object.entries(palpites).forEach(([vagaId, selecao]) => {
      const real = gabaritoReal[vagaId];
      if (real && selecao && real.toLowerCase().trim() === selecao.toLowerCase().trim()) {
        const num = parseInt(vagaId.replace(/[^\d]/g, ''), 10);
        if (num >= 73 && num <= 88) pts += 5;
        else if (num >= 89 && num <= 96) pts += 10;
        else if (num >= 97 && num <= 100) pts += 20;
        else if (num === 101 || num === 102) pts += 25;
        else if (num === 104 && !vagaId.includes('campeao')) pts += 30;
        else if (vagaId.includes('campeao') || (num === 104 && palpites['J104'] === real)) pts += 30;
      }
    });
    return pts;
  }, [palpites, gabaritoReal]);

  const renderFaseEncadeadaReadOnly = (fase: typeof OITAVAS, titulo: string, cor: string, margin: string) => (
    <div className={`w-72 space-y-12 flex-shrink-0 ${margin}`}>
      <h3 className={`text-xs font-black uppercase tracking-wider text-center border-b border-white/5 pb-2 ${cor}`}>
        {titulo}
      </h3>
      {fase.map((c) => {
        const t1 = obterVencedor(`${c.id}_1`) || obterVencedor(c.req1);
        const t2 = obterVencedor(`${c.id}_2`) || obterVencedor(c.req2);
        const apostaFinal = palpites[c.id] || '';

        return (
          <div key={c.id} className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-3 shadow-xl relative">
            <span className={`text-[10px] font-bold block uppercase ${cor}`}>{c.label} | {c.id}</span>
            
            <div className={`p-2 rounded border text-xs truncate ${obterEstiloValidacao(`${c.id}_1`, t1)}`}>
              {t1 || ` Aguardando ${c.req1}`}
            </div>
            <div className={`p-2 rounded border text-xs truncate ${obterEstiloValidacao(`${c.id}_2`, t2)}`}>
              {t2 || ` Aguardando ${c.req2}`}
            </div>

            <div className={`mt-2 p-2 rounded-lg text-center text-xs font-black uppercase border ${
              apostaFinal ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-900/40 border-dashed border-white/5 text-gray-600'
            }`}>
              {apostaFinal ? `➔ Avançou: ${apostaFinal}` : '⚠️ Não Preenchido'}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (carregando) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center">
        <div className="p-8 text-center text-gray-400 font-mono animate-pulse">Carregando painel de auditoria...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto pb-24 space-y-6">
        
        {/* Painel de Controle Superior */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950 p-6 rounded-2xl border border-white/5">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">🕵️‍♂️ Espiar Chaveamento Real</h1>
            <p className="text-xs text-gray-400 mt-1">Selecione um participante para inspecionar a árvore e ver o status de acertos.</p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-center">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Pontos Computados</span>
              <span className="text-xl font-black text-white font-mono">{pontuacaoTotalMataMata} PTS</span>
            </div>

            <select
              value={userIdSelecionado}
              onChange={(e) => setUserIdSelecionado(e.target.value)}
              className="bg-slate-900 border border-white/10 px-4 py-3 rounded-xl text-xs font-bold text-white focus:border-amber-500 outline-none transition cursor-pointer flex-1 md:w-64"
            >
              {participantes.map(p => (
                <option key={p.id} value={p.id}>👤 {p.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Zona de Scroll Horizontal da Árvore Espelhada */}
        <div className="w-full overflow-x-auto custom-scrollbar pb-8">
          <div className="flex flex-row gap-6 justify-between items-start min-w-[1200px] pr-8">

            {/* COLUNA 1: 16 AVOS COM OS PALPITES FIXADOS */}
            <div className="w-72 space-y-6 flex-shrink-0">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider text-center border-b border-white/5 pb-2">
                Fase 16 Avos
              </h3>
              {DEZESSEIS_AVOS.map((c) => {
                const val1 = palpites[`${c.id}_1`] || '';
                const val2 = palpites[`${c.id}_2`] || '';
                const quemAvanca = palpites[c.id] || '';

                return (
                  <div key={c.id} className="bg-slate-950 p-3.5 rounded-xl border border-white/5 space-y-2 shadow-xl">
                    <span className="text-[10px] text-emerald-500 font-bold block uppercase">{c.label} | {c.id}</span>
                    
                    <div className={`p-2 rounded border text-xs truncate ${obterEstiloValidacao(`${c.id}_1`, val1)}`}>
                      {val1 || `❌ ${c.de1}`}
                    </div>
                    
                    <div className="text-center text-[10px] text-gray-700 font-black">VS</div>
                    
                    <div className={`p-2 rounded border text-xs truncate ${obterEstiloValidacao(`${c.id}_2`, val2)}`}>
                      {val2 || `❌ ${c.de2}`}
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <div className={`p-2 rounded-lg text-center text-xs font-black border ${
                        quemAvanca ? 'bg-slate-900 border-emerald-500/20 text-emerald-400' : 'bg-slate-900/40 border-white/5 text-gray-600'
                      }`}>
                        {quemAvanca ? `➔ Avançou: ${quemAvanca}` : '⚠️ Sem Palpite'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {renderFaseEncadeadaReadOnly(OITAVAS, 'Oitavas de Final', 'text-blue-400', 'pt-16')}
            {renderFaseEncadeadaReadOnly(QUARTAS, 'Quartas de Final', 'text-purple-400', 'pt-32')}
            {renderFaseEncadeadaReadOnly(SEMIS, 'Semifinais', 'text-pink-400', 'pt-56')}

            {/* COLUNA FINAIS COMPLETA */}
            <div className="w-72 space-y-12 flex-shrink-0 pt-48">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider text-center border-b border-white/5 pb-2">Finais</h3>

              {/* Disputa de 3º Lugar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-orange-500/20 space-y-3 shadow-2xl relative">
                <span className="text-[10px] text-orange-400 font-black block uppercase tracking-widest text-center">Disputa de 3º Lugar</span>
                <div className={`p-2 rounded border text-xs text-center ${obterEstiloValidacao('J103_1', terceiro1)}`}>
                  {terceiro1 || '⚠️ Não Preenchido'}
                </div>
                <div className="text-center text-xs text-gray-700 font-black">VS</div>
                <div className={`p-2 rounded border text-xs text-center ${obterEstiloValidacao('J103_2', terceiro2)}`}>
                  {terceiro2 || '⚠️ Não Preenchido'}
                </div>
                <div className="p-2 rounded-lg text-center text-xs font-black bg-slate-900 border border-white/10 text-orange-400">
                  🥉 Bronze: {palpites['J103'] || '—'}
                </div>
              </div>

              {/* Campeão */}
              <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-3 shadow-2xl relative">
                <span className="text-[10px] text-amber-400 font-black block uppercase tracking-widest text-center">Grande Final</span>
                <div className={`p-2 rounded border text-xs text-center ${obterEstiloValidacao('J104_1', obterVencedor('J101'))}`}>
                  {obterVencedor('J101') || 'Vencedor J101'}
                </div>
                <div className="text-center text-xs text-gray-700 font-black">VS</div>
                <div className={`p-2 rounded border text-xs text-center ${obterEstiloValidacao('J104_2', obterVencedor('J102'))}`}>
                  {obterVencedor('J102') || 'Vencedor J102'}
                </div>
                
                <div className={`p-3 rounded-xl text-center text-sm font-black tracking-wide border uppercase ${
                  palpites['J104'] ? 'bg-amber-500 text-slate-950 shadow-lg' : 'bg-slate-900 text-gray-600 border-dashed border-white/5'
                }`}>
                  👑 Campeão: {palpites['J104'] || '—'}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}