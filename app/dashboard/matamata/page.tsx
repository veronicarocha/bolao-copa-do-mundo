'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMercado } from '@/lib/useMercado';

// 1. TIPAGEM FORTE
type MatchId = string;

// 2. GRAFO DECLARATIVO DE DEPENDÊNCIAS (Para limpeza em cascata)
const DEPENDENCIAS: Record<MatchId, MatchId> = {
  J74: 'J89', J77: 'J89', J73: 'J90', J75: 'J90',
  J83: 'J93', J84: 'J93', J81: 'J94', J82: 'J94',
  J76: 'J91', J78: 'J91', J79: 'J92', J80: 'J92',
  J86: 'J95', J88: 'J95', J85: 'J96', J87: 'J96',
  J89: 'J97', J90: 'J97', J93: 'J98', J94: 'J98',
  J91: 'J99', J92: 'J99', J95: 'J100', J96: 'J100',
  J97: 'J101', J98: 'J101', J99: 'J102', J100: 'J102',
  J101: 'J104', J102: 'J104'
};

// 3. ESTRUTURAS DAS FASES
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
  { id: 'J80', label: 'Match 80', de1: '1º Lugar Grupo L', de2: 'Melhor 3º (E/H/I/J/K)' },
  { id: 'J86', label: 'Match 86', de1: '1º Lugar Grupo J', de2: '2º Lugar Grupo H' },
  { id: 'J88', label: 'Match 88', de1: '2º Lugar Grupo D', de2: '2º Lugar Grupo G' },
  { id: 'J85', label: 'Match 85', de1: '1º Lugar Grupo B', de2: 'Melhor 3º (E/F/G/I/J)' },
  { id: 'J87', label: 'Match 87', de1: '1º Lugar Grupo K', de2: 'Melhor 3º (D/E/I/J/L)' }
];

const OITAVAS = [
  { id: 'J89', label: 'Match 89', req1: 'J74', req2: 'J77' },
  { id: 'J90', label: 'Match 90', req1: 'J73', req2: 'J75' },
  { id: 'J93', label: 'Match 93', req1: 'J83', req2: 'J84' },
  { id: 'J94', label: 'Match 94', req1: 'J81', req2: 'J82' },
  { id: 'J91', label: 'Match 91', req1: 'J76', req2: 'J78' },
  { id: 'J92', label: 'Match 92', req1: 'J79', req2: 'J80' },
  { id: 'J95', label: 'Match 95', req1: 'J86', req2: 'J88' },
  { id: 'J96', label: 'Match 96', req1: 'J85', req2: 'J87' }
];

const QUARTAS = [
  { id: 'J97', label: 'Match 97', req1: 'J89', req2: 'J90' },
  { id: 'J98', label: 'Match 98', req1: 'J93', req2: 'J94' },
  { id: 'J99', label: 'Match 99', req1: 'J91', req2: 'J92' },
  { id: 'J100', label: 'Match 100', req1: 'J95', req2: 'J96' }
];

const SEMIS = [
  { id: 'J101', label: 'Match 101', req1: 'J97', req2: 'J98' },
  { id: 'J102', label: 'Match 102', req1: 'J99', req2: 'J100' }
];

// --- 4. MAPA DE GRUPOS E FILTROS ---
const GRUPOS: Record<string, string[]> = {
  "Grupo A": ["Mexico", "Africa do Sul", "Coreia do Sul", "Republica Tcheca"],
  "Grupo B": ["Canada", "Bosnia e Herzegovina", "Catar", "Suiça"],
  "Grupo C": ["Brasil", "Marrocos", "Haiti", "Escocia"],
  "Grupo D": ["Estados Unidos", "Paraguai", "Australia", "Turquia"],
  "Grupo E": ["Alemanha", "Curaçau", "Costa do Marfim", "Equador"],
  "Grupo F": ["Holanda", "Japao", "Suecia", "Tunisia"],
  "Grupo G": ["Belgica", "Egito", "Ira", "Nova Zelandia"],
  "Grupo H": ["Espanha", "Cabo Verde", "Arábia Saudita", "Uruguai"],
  "Grupo I": ["França", "Senegal", "Iraque", "Noruega"],
  "Grupo J": ["Argentina", "Argelia", "Austria", "Jordania"],
  "Grupo K": ["Portugal", "RD do Congo", "Uzbequistao", "Colombia"],
  "Grupo L": ["Inglaterra", "Croacia", "Gana", "Panama"]
};

const MAPA_FILTROS: Record<string, string[]> = {
  "Melhor 3º (A/B/C/D/F)": [...GRUPOS["Grupo A"], ...GRUPOS["Grupo B"], ...GRUPOS["Grupo C"], ...GRUPOS["Grupo D"], ...GRUPOS["Grupo F"]].sort(),
  "Melhor 3º (C/D/F/G/H)": [...GRUPOS["Grupo C"], ...GRUPOS["Grupo D"], ...GRUPOS["Grupo F"], ...GRUPOS["Grupo G"], ...GRUPOS["Grupo H"]].sort(),
  "Melhor 3º (B/E/F/I/J)": [...GRUPOS["Grupo B"], ...GRUPOS["Grupo E"], ...GRUPOS["Grupo F"], ...GRUPOS["Grupo I"], ...GRUPOS["Grupo J"]].sort(),
  "Melhor 3º (A/E/H/I/J)": [...GRUPOS["Grupo A"], ...GRUPOS["Grupo E"], ...GRUPOS["Grupo H"], ...GRUPOS["Grupo I"], ...GRUPOS["Grupo J"]].sort(),
  "Melhor 3º (C/E/F/H/I)": [...GRUPOS["Grupo C"], ...GRUPOS["Grupo E"], ...GRUPOS["Grupo F"], ...GRUPOS["Grupo H"], ...GRUPOS["Grupo I"]].sort(),
  "Melhor 3º (E/H/I/J/K)": [...GRUPOS["Grupo E"], ...GRUPOS["Grupo H"], ...GRUPOS["Grupo I"], ...GRUPOS["Grupo J"], ...GRUPOS["Grupo K"]].sort(),
  "Melhor 3º (E/F/G/I/J)": [...GRUPOS["Grupo E"], ...GRUPOS["Grupo F"], ...GRUPOS["Grupo G"], ...GRUPOS["Grupo I"], ...GRUPOS["Grupo J"]].sort(),
  "Melhor 3º (D/E/I/J/L)": [...GRUPOS["Grupo D"], ...GRUPOS["Grupo E"], ...GRUPOS["Grupo I"], ...GRUPOS["Grupo J"], ...GRUPOS["Grupo L"]].sort(),
  "1º Lugar Grupo A": GRUPOS["Grupo A"].sort(), "2º Lugar Grupo A": GRUPOS["Grupo A"].sort(),
  "1º Lugar Grupo B": GRUPOS["Grupo B"].sort(), "2º Lugar Grupo B": GRUPOS["Grupo B"].sort(),
  "1º Lugar Grupo C": GRUPOS["Grupo C"].sort(), "2º Lugar Grupo C": GRUPOS["Grupo C"].sort(),
  "1º Lugar Grupo D": GRUPOS["Grupo D"].sort(), "2º Lugar Grupo D": GRUPOS["Grupo D"].sort(),
  "1º Lugar Grupo E": GRUPOS["Grupo E"].sort(), "2º Lugar Grupo E": GRUPOS["Grupo E"].sort(),
  "1º Lugar Grupo F": GRUPOS["Grupo F"].sort(), "2º Lugar Grupo F": GRUPOS["Grupo F"].sort(),
  "1º Lugar Grupo G": GRUPOS["Grupo G"].sort(), "2º Lugar Grupo G": GRUPOS["Grupo G"].sort(),
  "1º Lugar Grupo H": GRUPOS["Grupo H"].sort(), "2º Lugar Grupo H": GRUPOS["Grupo H"].sort(),
  "1º Lugar Grupo I": GRUPOS["Grupo I"].sort(), "2º Lugar Grupo I": GRUPOS["Grupo I"].sort(),
  "1º Lugar Grupo J": GRUPOS["Grupo J"].sort(), "2º Lugar Grupo J": GRUPOS["Grupo J"].sort(),
  "1º Lugar Grupo K": GRUPOS["Grupo K"].sort(), "2º Lugar Grupo K": GRUPOS["Grupo K"].sort(),
  "1º Lugar Grupo L": GRUPOS["Grupo L"].sort(), "2º Lugar Grupo L": GRUPOS["Grupo L"].sort(),
};

export default function PalpitesMataMata() {
  const { apenasLeitura, carregandoMercado } = useMercado();

  const [carregandoDados, setCarregandoDados] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [palpites, setPalpites] = useState<Record<string, string>>({});

  useEffect(() => {
    async function carregarDados() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: salvos } = await supabase.from('palpites_matamata').select('*').eq('user_id', user.id);
          const mapa: Record<string, string> = {};
          salvos?.forEach(item => { mapa[item.fase_vaga] = item.selecao_escolhida; });
          setPalpites(mapa);
        }
      } catch (err) {
        console.error('Erro:', err);
      } finally {
        setCarregandoDados(false);
      }
    }
    carregarDados();
  }, []);

  const selecoesEscolhidasGlobais = useMemo(() => {
    return Object.entries(palpites)
      .filter(([k]) => k.includes('_1') || k.includes('_2'))
      .map(([_, v]) => v)
      .filter(Boolean);
  }, [palpites]);

  const handleSelectChange = (vagaId: string, selecao: string) => {
    if (apenasLeitura) return;

    setPalpites(prev => {
      const novo = { ...prev, [vagaId]: selecao };
      
      let nodeAtual = vagaId;
      let valorAntigo = prev[vagaId];

      if (nodeAtual.includes('_')) {
        const matchBase = nodeAtual.split('_')[0];
        if (novo[matchBase] === valorAntigo && valorAntigo !== '') {
          novo[matchBase] = '';
          valorAntigo = prev[matchBase];
          nodeAtual = matchBase;
        } else {
          valorAntigo = ''; 
        }
      }

      while (DEPENDENCIAS[nodeAtual] && valorAntigo) {
        const proximoNode = DEPENDENCIAS[nodeAtual];
        if (novo[proximoNode] === valorAntigo) {
          novo[proximoNode] = '';
          nodeAtual = proximoNode;
        } else {
          break; 
        }
      }

      if (vagaId.includes('J101') || vagaId.includes('J102') || vagaId.includes('J97') || vagaId.includes('J98') || vagaId.includes('J99') || vagaId.includes('J100')) {
         novo['J103'] = '';
      }

      return novo;
    });
  };

  const salvarMataMata = async () => {
    if (apenasLeitura) {
      alert('O mercado está fechado para palpites.');
      return;
    }

    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Sessão expirada. Faça login novamente.');
      setSalvando(false);
      return;
    }

    const inserts = Object.entries(palpites)
      .filter(([_, selecao]) => selecao !== '')
      .map(([vagaId, selecao]) => ({ user_id: user.id, fase_vaga: vagaId, selecao_escolhida: selecao }));

    const { error } = await supabase.from('palpites_matamata').upsert(inserts, { onConflict: 'user_id,fase_vaga' });
    
    setSalvando(false);

    if (error) {
      if (error.code === '42501') {
        alert('Acesso negado: O mercado foi fechado e não é mais possível alterar palpites.');
      } else {
        alert(`Erro ao salvar palpites: ${error.message}`);
      }
    } else {
      alert('Chaveamento salvo com sucesso!');
    }
  };

  const obterVencedor = (matchId: MatchId) => palpites[matchId] || '';
  
  const obterPerdedor = (matchId: MatchId, req1: MatchId, req2: MatchId) => {
    const t1 = obterVencedor(req1);
    const t2 = obterVencedor(req2);
    const vencedor = obterVencedor(matchId);
    
    if (!t1 || !t2 || !vencedor) return '';
    if (vencedor !== t1 && vencedor !== t2) return ''; 
    
    return vencedor === t1 ? t2 : t1;
  };

  const getOpcoesFiltradas = (label: string, currentValue: string, oponenteValue: string) => {
    // Busca a lista filtrada no mapa, se não achar retorna todos os times (fallback de segurança)
    const listaPermitida = MAPA_FILTROS[label] || Object.values(GRUPOS).flat().sort();
    
    return listaPermitida.map(s => {
      const isIndisponivel = (selecoesEscolhidasGlobais.includes(s) && s !== currentValue) || (s === oponenteValue && s !== '');
      return (
        <option key={s} value={s} disabled={isIndisponivel}>
          {s}
        </option>
      );
    });
  };

  const renderFaseEncadeada = (fase: typeof OITAVAS, titulo: string, cor: string, margin: string) => (
    <div className={`w-72 space-y-12 flex-shrink-0 ${margin}`}>
      <h3 className={`text-xs font-black uppercase tracking-wider text-center border-b border-white/5 pb-2 ${cor}`}>
        {titulo}
      </h3>
      {fase.map((c) => {
        const t1 = obterVencedor(c.req1);
        const t2 = obterVencedor(c.req2);
        return (
          <div key={c.id} className="bg-slate-800 p-3.5 rounded-xl border border-white/5 space-y-3 shadow-xl hover:border-white/10 transition">
            <span className={`text-[10px] font-bold block uppercase ${cor}`}>{c.label} | {c.id}</span>
            <div className={`p-2 rounded border text-xs text-gray-200 ${t1 ? 'bg-black/40 border-white/10 font-bold' : 'bg-black/10 border-white/5 text-gray-600 border-dashed'}`}>
              {t1 || `⚡ Aguardando ${c.req1}`}
            </div>
            <div className={`p-2 rounded border text-xs text-gray-200 ${t2 ? 'bg-black/40 border-white/10 font-bold' : 'bg-black/10 border-white/5 text-gray-600 border-dashed'}`}>
              {t2 || `⚡ Aguardando ${c.req2}`}
            </div>
            <select
              disabled={apenasLeitura || !t1 || !t2}
              value={palpites[c.id] || ''}
              onChange={(e) => handleSelectChange(c.id, e.target.value)}
              className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-2 text-xs font-bold outline-none focus:border-emerald-500 disabled:opacity-30 disabled:bg-transparent"
            >
              <option value="">-- Avança --</option>
              {t1 && <option value={t1}>{t1}</option>}
              {t2 && <option value={t2} disabled={t1 === t2}>{t2}</option>}
            </select>
          </div>
        );
      })}
    </div>
  );

  if (carregandoDados || carregandoMercado) return <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center"><div className="p-8 text-center text-gray-400 font-mono animate-pulse">Montando chaves da Copa...</div></div>;

  const terceiro1 = obterPerdedor('J101', 'J97', 'J98');
  const terceiro2 = obterPerdedor('J102', 'J99', 'J100');

  return (
    // Aplicado min-h-screen e bg-slate-900 para garantir que o mobile pinte tudo
    <div className="min-h-screen w-full bg-slate-900">
      <div className="p-6 max-w-[1600px] mx-auto text-white">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Chaveamento Mata-Mata</h1>
            <p className="text-sm text-amber-400 font-semibold mt-1">⏰ Data limite: 09 de Junho de 2026.</p>
          </div>
          <button
            onClick={salvarMataMata}
            disabled={apenasLeitura || salvando}
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : apenasLeitura ? '🔒 Mercado Fechado' : '💾 Salvar Chaveamento'}
          </button>
        </div>

        <div className="flex flex-row gap-6 overflow-x-auto pb-8 justify-between items-start min-w-[1200px] custom-scrollbar">
          
          {/* COLUNA 1: 32 AVOS DE FINAL */}
          <div className="w-72 space-y-6 flex-shrink-0">
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider text-center border-b border-white/5 pb-2">
              Fase 32 Avos (Round of 32)
            </h3>
            {DEZESSEIS_AVOS.map((c) => {
              const val1 = palpites[`${c.id}_1`] || '';
              const val2 = palpites[`${c.id}_2`] || '';
              return (
                <div key={c.id} className="bg-slate-950 p-3.5 rounded-xl border border-white/5 space-y-2 shadow-xl hover:border-white/10 transition">
                  <span className="text-[10px] text-emerald-500 font-bold block uppercase">{c.label} | {c.id}</span>
                  <div>
                    <label className="text-[9px] text-gray-500 block mb-1">{c.de1}</label>
                    <select
                      disabled={apenasLeitura}
                      value={val1}
                      onChange={(e) => handleSelectChange(`${c.id}_1`, e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs font-semibold outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Vaga 1 --</option>
                      {getOpcoesFiltradas(c.de1, val1, val2)}
                    </select>
                  </div>
                  <div className="text-center text-[10px] text-gray-700 font-black">VS</div>
                  <div>
                    <label className="text-[9px] text-gray-500 block mb-1">{c.de2}</label>
                    <select
                      disabled={apenasLeitura}
                      value={val2}
                      onChange={(e) => handleSelectChange(`${c.id}_2`, e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs font-semibold outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Vaga 2 --</option>
                      {getOpcoesFiltradas(c.de2, val2, val1)}
                    </select>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <select
                      disabled={apenasLeitura || !val1 || !val2}
                      value={palpites[c.id] || ''}
                      onChange={(e) => handleSelectChange(c.id, e.target.value)}
                      className="w-full bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded-lg p-2 text-xs font-bold outline-none focus:border-emerald-500 disabled:opacity-30 disabled:bg-transparent"
                    >
                      <option value="">-- Qual seleção avança? --</option>
                      {val1 && <option value={val1}>{val1}</option>}
                      {val2 && <option value={val2} disabled={val1 === val2}>{val2}</option>}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* COLUNAS DECLARATIVAS */}
          {renderFaseEncadeada(OITAVAS, 'Oitavas de Final', 'text-blue-400', 'pt-16')}
          {renderFaseEncadeada(QUARTAS, 'Quartas de Final', 'text-purple-400', 'pt-32')}
          {renderFaseEncadeada(SEMIS, 'Semifinais', 'text-pink-400', 'pt-56')}

          {/* COLUNA FINAL */}
          <div className="w-72 space-y-12 flex-shrink-0 pt-48">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider text-center border-b border-white/5 pb-2">Finais</h3>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-orange-500/20 space-y-3 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-2xl">🥉</div>
              <span className="text-[10px] text-orange-400 font-black block uppercase tracking-widest text-center">Disputa de 3º Lugar</span>
              <div className={`p-2.5 rounded border text-xs text-center ${terceiro1 ? 'bg-black/40 border-white/10 font-bold text-gray-200' : 'bg-black/10 border-white/5 text-gray-600 border-dashed'}`}>
                {terceiro1 || '⚡ Perdedor J101'}
              </div>
              <div className="text-center text-xs text-gray-700 font-black">VS</div>
              <div className={`p-2.5 rounded border text-xs text-center ${terceiro2 ? 'bg-black/40 border-white/10 font-bold text-gray-200' : 'bg-black/10 border-white/5 text-gray-600 border-dashed'}`}>
                {terceiro2 || '⚡ Perdedor J102'}
              </div>
              <select
                disabled={apenasLeitura || !terceiro1 || !terceiro2}
                value={palpites['J103'] || ''}
                onChange={(e) => handleSelectChange('J103', e.target.value)}
                className="w-full bg-orange-950/40 border border-orange-500/30 text-orange-400 rounded-lg p-2 text-xs font-bold outline-none focus:border-orange-500 disabled:opacity-30 disabled:bg-transparent"
              >
                <option value="">-- Medalhista de Bronze --</option>
                {terceiro1 && <option value={terceiro1}>{terceiro1}</option>}
                {terceiro2 && <option value={terceiro2} disabled={terceiro1 === terceiro2}>{terceiro2}</option>}
              </select>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-3 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-2xl">🏆</div>
              <span className="text-[10px] text-amber-400 font-black block uppercase tracking-widest text-center">Grande Final</span>
              <div className={`p-2.5 rounded border text-xs text-center ${obterVencedor('J101') ? 'bg-black/40 border-white/10 font-bold text-gray-200' : 'bg-black/10 border-white/5 text-gray-600 border-dashed'}`}>
                {obterVencedor('J101') || '⚡ Vencedor J101'}
              </div>
              <div className="text-center text-xs text-gray-700 font-black">VS</div>
              <div className={`p-2.5 rounded border text-xs text-center ${obterVencedor('J102') ? 'bg-black/40 border-white/10 font-bold text-gray-200' : 'bg-black/10 border-white/5 text-gray-600 border-dashed'}`}>
                {obterVencedor('J102') || '⚡ Vencedor J102'}
              </div>
              <select
                disabled={apenasLeitura || !obterVencedor('J101') || !obterVencedor('J102')}
                value={palpites['J104'] || ''}
                onChange={(e) => handleSelectChange('J104', e.target.value)}
                className="w-full bg-amber-500 text-black rounded-lg p-2.5 text-xs font-black outline-none tracking-wide uppercase shadow-lg disabled:opacity-30"
              >
                <option value="" className="text-white bg-slate-900 font-normal">-- CRAVE O CAMPEÃO --</option>
                {obterVencedor('J101') && <option value={obterVencedor('J101')} className="text-white bg-slate-900">{obterVencedor('J101')}</option>}
                {obterVencedor('J102') && <option value={obterVencedor('J102')} className="text-white bg-slate-900" disabled={obterVencedor('J101') === obterVencedor('J102')}>{obterVencedor('J102')}</option>}
              </select>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}