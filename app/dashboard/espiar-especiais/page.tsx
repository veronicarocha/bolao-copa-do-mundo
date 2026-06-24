'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

const PERGUNTAS_ESPECIAIS = [
  { id: 'artilheiro_geral', label: '⚽ Artilheiro da Copa', pts: 40 },
  { id: 'craque_copa', label: '👑 Craque da Copa (Bola de Ouro)', pts: 40 },
  { id: 'melhor_goleiro', label: '🧤 Melhor Goleiro (Luva de Ouro)', pts: 40 },
  { id: 'craque_final', label: '🏅 Craque da Final', pts: 30 },
  { id: 'lider_assistencias', label: '🎯 Líder de Assistências (Garçom)', pts: 30 },
  { id: 'total_gols', label: '⚽ Total de GOLS na Copa (104 jogos)', pts: 25, tipo: 'numerico' },
  { id: 'total_vermelhos', label: '🟥 Total de CARTÕES VERMELHOS', pts: 20, tipo: 'numerico' },
  { id: 'primeiro_gol_brasil', label: '🇧🇷 1º Jogador a marcar gol pelo Brasil', pts: 20 },
  { id: 'artilheiro_brasil', label: '🇧🇷 Artilheiro do Brasil na Copa', pts: 20 },
  { id: 'melhor_ataque', label: '🔥 Melhor Ataque da Copa', pts: 20 },
  { id: 'melhor_defesa', label: '🛡️ Melhor Defesa da Copa', pts: 20 },
  { id: 'arbitro_final', label: '🏁 Árbitro da Grande Final', pts: 20 },
  { id: 'primeiro_gol_copa', label: '🏃‍♂️ Jogador a marcar o 1º gol da Copa', pts: 20 },
  { id: 'mais_cartoes_selecao', label: '🟨 Seleção com MAIS cartões', pts: 15 },
  { id: 'menos_cartoes_selecao', label: '🕊️ Seleção com MENOS cartões (Fair Play)', pts: 15 },
  { id: 'primeiro_zero_a_zero', label: '🚫 Primeiro jogo a terminar em 0 a 0', pts: 15 }
];

interface PalpiteBruto {
  user_id: string;
  pergunta_id: string;
  resposta_palpite: string;
}

interface GrupoResposta {
  exibicao: string;
  apostadores: { nome: string; respostaOriginal: string }[];
}

export default function EspiarEspeciais() {
  const [participantes, setParticipantes] = useState<{ id: string; nome: string }[]>([]);
  const [filtroParticipante, setFiltroParticipante] = useState<string>('todos');
  const [palpites, setPalpites] = useState<PalpiteBruto[]>([]);
  const [termoBuscaPergunta, setTermoBuscaPergunta] = useState('');
  const [carregando, setCarregando] = useState(true);

  // 📱 Estado para rastrear quais perguntas estão expandidas no mobile
  const [perguntasExpandidas, setPerguntasExpandidas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function carregarParticipantes() {
      const { data } = await supabase.from('perfis').select('id, nome').order('nome', { ascending: true });
      if (data) setParticipantes(data);
    }
    carregarParticipantes();
  }, []);

  useEffect(() => {
    async function carregarPalpitesEspeciais() {
      try {
        setCarregando(true);
        let query = supabase.from('palpites_especiais').select('user_id, pergunta_id, resposta_palpite');

        if (filtroParticipante !== 'todos') {
          query = query.eq('user_id', filtroParticipante);
        }

        const { data } = await query.not('resposta_palpite', 'is', null);
        setPalpites(data || []);
      } catch (err) {
        console.error('Erro ao buscar palpites especiais:', err);
      } finally {
        setCarregando(false);
      }
    }
    carregarPalpitesEspeciais();
  }, [filtroParticipante]);

  const mapaNomes = useMemo(() => {
    return new Map(participantes.map(p => [p.id, p.nome || 'Sem Nome']));
  }, [participantes]);

  const extrairChaveSimilaridade = (texto: string): string => {
    if (!texto) return '';
    let normalizado = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/gi, '').trim();

    if (normalizado.includes('mbappe') || normalizado.includes('mbape') || normalizado.includes('mpbape')) return 'mbappe';
    if (normalizado.includes('vinicius') || normalizado.includes('vinicus') || normalizado.includes('vini jr') || normalizado.includes('vini junior') || normalizado.includes('vinicius jr')) return 'viniciusjr';
    if (normalizado.includes('bellingham') || normalizado.includes('jude bellingham')) return 'bellingham';
    if (normalizado.includes('estados unidos') || normalizado.includes('eua')) return 'estadosunidos';
    if (normalizado.includes('kane') || normalizado.includes('caine')) return 'kane';
    if (normalizado.includes('olise')) return 'olise';
    if (normalizado.includes('haaland') || normalizado.includes('haarland') || normalizado.includes('halland')) return 'haaland';
    if (normalizado.includes('yamal') || normalizado.includes('lamine') || normalizado.includes('laminie') || normalizado.includes('yamalq')) return 'yamal';
    if (normalizado.includes('raphinha') || normalizado.includes('rafinha')) return 'raphinha';
    if (normalizado.includes('bruno fernandes')) return 'brunofernandes';
    if (normalizado.includes('endrick') || normalizado.includes('endrik')) return 'endrick';
    if (normalizado.includes('franca') || normalizado.includes('france')) return 'franca';
    if (normalizado.includes('espanha') || normalizado.includes('espania') || normalizado.includes('esrpanha')) return 'espanha';
    if (normalizado.includes('japao') || normalizado.includes('japan')) return 'japao';
    if (normalizado.includes('vincic') || normalizado.includes('slavko')) return 'slavkovincic';
    if (normalizado.includes('claus') || normalizado.includes('graus') || normalizado.includes('klaus')) return 'raphaelclaus';
    if (normalizado.includes('jimenez') || normalizado.includes('raul')) return 'rauljimenez';
    if (normalizado.includes('quinones') || normalizado.includes('julian')) return 'julianquinones';

    if (normalizado.includes('unai') || normalizado.includes('simon')) return 'unaisimon';
    if (normalizado.includes('martinez') || normalizado.includes('martines') || normalizado.includes('dibu')) return 'emilianomartinez';
    if (normalizado.includes('maignan') || (normalizado.includes('mike') && normalizado.includes('franca'))) return 'mikemaignan';
    if (normalizado.includes('alisson') || normalizado.includes('alison')) return 'alissonbecker';
    if (normalizado.includes('costa') && (normalizado.includes('diogo') || normalizado.includes('diego') || normalizado.includes('portugal'))) return 'diogocosta';
    if (normalizado.includes('neuer') || normalizado.includes('nuer') || normalizado.includes('noer')) return 'manuelneuer';
    if (normalizado.includes('courtois') || normalizado.includes('courtua') || normalizado.includes('courtuis')) return 'thibautcourtois';

    const palavras = normalizado.split(' ').filter(p => p.length > 2);
    if (palavras.length > 0) {
      return palavras.sort((a, b) => b.length - a.length)[0]; 
    }
    return normalizado;
  };

  const dadosAgrupadosPorPergunta = useMemo(() => {
    const mapa: Record<string, GrupoResposta[]> = {};
    PERGUNTAS_ESPECIAIS.forEach(p => { mapa[p.id] = []; });

    palpites.forEach(p => {
      const listaFase = mapa[p.pergunta_id];
      if (!listaFase) return;

      const respostaOriginal = p.resposta_palpite.trim();
      if (!respostaOriginal) return;

      const nomeUsuario = mapaNomes.get(p.user_id) || 'Usuário Sem Nome';
      const chaveCentral = extrairChaveSimilaridade(respostaOriginal);

      let grupoExistente = listaFase.find(g => extrairChaveSimilaridade(g.exibicao) === chaveCentral);

      if (grupoExistente) {
        const lowerOrig = respostaOriginal.toLowerCase();
        if ((lowerOrig.endsWith('q') || lowerOrig.includes('graus') || lowerOrig.includes('klaus') || lowerOrig.includes('portugual') || lowerOrig.includes('esrpanha')) && grupoExistente.exibicao.length > 3) {
          // Ignora erro ortográfico
        } else if (respostaOriginal.length > grupoExistente.exibicao.length && !grupoExistente.exibicao.includes('(')) {
          grupoExistente.exibicao = respostaOriginal;
        }
        grupoExistente.apostadores.push({ nome: nomeUsuario, respostaOriginal });
      } else {
        listaFase.push({
          exibicao: respostaOriginal,
          apostadores: [{ nome: nomeUsuario, respostaOriginal }]
        });
      }
    });

    PERGUNTAS_ESPECIAIS.forEach(p => {
      const grupos = mapa[p.id];
      if (!grupos) return;
      if (p.tipo === 'numerico') {
        grupos.sort((a, b) => {
          const numA = parseInt(a.exibicao.replace(/[^\d]/g, ''), 10) || 0;
          const numB = parseInt(b.exibicao.replace(/[^\d]/g, ''), 10) || 0;
          return numA - numB;
        });
      } else {
        grupos.sort((a, b) => b.apostadores.length - a.apostadores.length);
      }
      grupos.forEach(g => g.apostadores.sort((a, b) => a.nome.localeCompare(b.nome)));
    });

    return mapa;
  }, [palpites, mapaNomes]);

  const togglePergunta = (id: string) => {
    setPerguntasExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const perguntasFiltradas = PERGUNTAS_ESPECIAIS.filter(p =>
    p.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .includes(termoBuscaPergunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );

  return (
    <div className="min-h-screen w-full bg-slate-900 p-3 md:p-8 text-white">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">

        {/* Painel de Controle */}
        <div className="bg-slate-950 p-4 md:p-6 rounded-2xl border border-white/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-2xl text-left">
          <div>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block mb-1">Mural Semântico 🕵️‍♂️</span>
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-white">
              Espiar Palpites <span className="text-purple-400">Especiais</span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="flex flex-col w-full sm:w-56 text-left">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Filtrar Apostador</label>
              <select
                value={filtroParticipante}
                onChange={(e) => setFiltroParticipante(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 px-3 py-2.5 rounded-xl text-xs font-bold text-white outline-none focus:border-purple-500 cursor-pointer transition"
              >
                <option value="todos">👤 Todos os Participantes</option>
                {participantes.map(p => (
                  <option key={p.id} value={p.id}>👤 {p.nome}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col w-full sm:w-52 text-left">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Buscar Item</label>
              <input
                type="text"
                placeholder="Ex: Artilheiro..."
                value={termoBuscaPergunta}
                onChange={(e) => setTermoBuscaPergunta(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold focus:border-purple-500 outline-none text-white placeholder-gray-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Listagem Geral */}
        {carregando ? (
          <div className="bg-slate-950 p-12 rounded-2xl border border-white/5 text-center text-gray-500 font-mono text-xs animate-pulse">
            Agrupando e indexando Power Picks de forma inteligente...
          </div>
        ) : (
          <div className="space-y-3">
            {perguntasFiltradas.map(p => {
              const gruposDoItem = dadosAgrupadosPorPergunta[p.id] || [];
              const totalRespostas = gruposDoItem.reduce((acc, g) => acc + g.apostadores.length, 0);
              const estaExpandida = perguntasExpandidas[p.id] || false;

              return (
                <div 
                  key={p.id} 
                  className={`rounded-2xl border transition text-left overflow-hidden ${
                    totalRespostas > 0 ? 'bg-slate-950 border-white/5 shadow-xl' : 'bg-slate-950/40 border-white/5 opacity-50'
                  }`}
                >
                  {/* Cabeçalho da Pergunta (Accordion Clicável no Mobile) */}
                  <div 
                    onClick={() => togglePergunta(p.id)}
                    className="p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer md:cursor-default select-none bg-slate-950 hover:bg-slate-900/40 md:hover:bg-transparent transition"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs md:text-sm font-black text-white tracking-wide truncate md:whitespace-normal">{p.label}</h3>
                      <span className="text-[9px] md:text-[10px] text-purple-400 font-black uppercase tracking-wider block mt-0.5">
                        Bônus de {p.pts} pontos {p.tipo === 'numerico' && '• 🔢 Ordem Crescente'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-[10px] font-mono font-bold bg-slate-900 border border-white/10 px-2 py-0.5 md:py-1 md:px-2.5 rounded-lg text-gray-400">
                        {totalRespostas} {totalRespostas === 1 ? 'voto' : 'votos'}
                      </div>
                      {/* Seta indicadora apenas no mobile */}
                      <div className="md:hidden text-xs text-purple-400 font-mono h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                        {estaExpandida ? '▲' : '▼'}
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo das Respostas */}
                  <div className={`p-4 pt-0 border-t border-white/5 md:border-t-0 md:block ${estaExpandida ? 'block animate-fadeIn' : 'hidden'}`}>
                    {gruposDoItem.length === 0 ? (
                      <div className="text-xs text-gray-600 font-medium italic font-mono py-2 text-center md:text-left">— Nenhuma resposta cadastrada para este item —</div>
                    ) : (
                      <div className="space-y-3 mt-3 md:mt-0">
                        {gruposDoItem.map((grupo, gIdx) => {
                          let tituloFormatado = grupo.exibicao;
                          const lowerTit = tituloFormatado.toLowerCase();
                          if (lowerTit === 'lamine yamalq') tituloFormatado = 'Lamine Yamal';
                          if (lowerTit === 'rafael graus' || lowerTit === 'rafael klaus') tituloFormatado = 'Raphael Claus';
                          if (lowerTit === 'bruno fernandes (portugual)') tituloFormatado = 'Bruno Fernandes';

                          return (
                            <div 
                              key={gIdx} 
                              className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 hover:border-white/10 transition"
                            >
                              {/* Nome Escolhido */}
                              <div className="min-w-[160px] text-left">
                                <span className="text-xs font-mono font-black text-amber-400 bg-black/40 px-2 py-0.5 rounded border border-white/5 inline-block max-w-full truncate">
                                  {tituloFormatado}
                                </span>
                                <span className="text-[10px] font-bold text-gray-500 block mt-0.5 ml-1">
                                  Votos: {grupo.apostadores.length}
                                </span>
                              </div>

                              {/* Caixa de Participantes Responsiva */}
                              <div className="flex-1 text-[11px] text-gray-300 font-medium flex flex-wrap gap-x-2.5 gap-y-1 bg-black/20 p-2 rounded-lg border border-white/5 max-w-full overflow-hidden">
                                {grupo.apostadores.map((ap, aIdx) => {
                                  const digitouDiferente = ap.respostaOriginal.toLowerCase().trim() !== tituloFormatado.toLowerCase().trim();
                                  return (
                                    <span key={aIdx} className="inline-flex items-center gap-0.5 whitespace-nowrap bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-[10px] md:text-[11px]">
                                      👤 <strong className="text-gray-200 font-bold max-w-[120px] truncate">{ap.nome}</strong>
                                      {digitouDiferente && <span className="text-[9px] text-gray-500 font-mono tracking-tight"> ("{ap.respostaOriginal.trim() || ap.respostaOriginal}")</span>}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}