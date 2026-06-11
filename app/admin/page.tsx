'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface DadosPalpites {
    grupos: any[];
    mm: any[];
    esp: any[];
}

export default function PainelAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState(false);

    // Estados para inputs do Admin (Gabarito)
    const [jogos, setJogos] = useState<any[]>([]);
    const [resultadosMM, setResultadosMM] = useState<Record<string, string>>({});
    const [resultadosEsp, setResultadosEsp] = useState<Record<string, string>>({});

    // Estados para o Bloco de Correção Manual
    const [participantes, setParticipantes] = useState<any[]>([]);
    const [userSelecionado, setUserSelecionado] = useState('');
    const [dados, setDados] = useState<DadosPalpites>({ grupos: [], mm: [], esp: [] });

    const router = useRouter();

    const CATEGORIAS_ESPECIAIS = [
        { id: 'artilheiro_geral', label: '⚽ Artilheiro da Copa' },
        { id: 'craque_copa', label: '👑 Craque da Copa (Bola de Ouro)' },
        { id: 'melhor_goleiro', label: '🧤 Melhor Goleiro (Luva de Ouro)' },
        { id: 'craque_final', label: '🏅 Craque da Final (Homem do Jogo)' },
        { id: 'lider_assistencias', label: '🎯 Líder de Assistências (Garçom)' },
        { id: 'total_gols', label: '⚽ Total de GOLS na Copa (104 jogos)' },
        { id: 'total_vermelhos', label: '🟥 Total de CARTÕES VERMELHOS na Copa' },
        { id: 'primeiro_gol_brasil', label: '🇧🇷 1º Jogador a marcar gol pelo Brasil' },
        { id: 'artilheiro_brasil', label: '🇧🇷 Artilheiro do Brasil na Copa' },
        { id: 'melhor_ataque', label: '🔥 Melhor Ataque da Copa' },
        { id: 'melhor_defesa', label: '🛡️ Melhor Defesa da Copa' },
        { id: 'arbitro_final', label: '🏁 Árbitro da Grande Final' },
        { id: 'primeiro_gol_copa', label: '🏃‍♂️ Jogador a marcar o 1º gol da Copa' },
        { id: 'mais_cartoes_selecao', label: '🟨 Seleção com MAIS cartões na Copa' },
        { id: 'menos_cartoes_selecao', label: '🕊️ Seleção com MENOS cartões (Fair Play)' },
        { id: 'primeiro_zero_a_zero', label: '🚫 Primeiro jogo a terminar em 0 a 0' }
    ];

    useEffect(() => {
        async function verificarAdminECarregarDados() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/'); return; }

            const { data: perfil } = await supabase.from('perfis').select('is_admin').eq('id', user.id).maybeSingle();
            if (!perfil?.is_admin) { router.push('/dashboard/grupos'); return; }

            setIsAdmin(true);

            const { data: listaJogos } = await supabase.from('jogos').select('*').order('id', { ascending: true });
            setJogos(listaJogos || []);

            const { data: listaMM } = await supabase.from('resultados_matamata').select('*');
            const mapaMM: Record<string, string> = {};
            listaMM?.forEach(x => { mapaMM[x.fase_vaga] = x.selecao_real; });
            setResultadosMM(mapaMM);

            const { data: listaEsp } = await supabase.from('resultados_especiais').select('*');
            const mapaEsp: Record<string, string> = {};
            listaEsp?.forEach(x => { mapaEsp[x.pergunta_id] = x.resposta_real; });
            setResultadosEsp(mapaEsp);

            const { data: listaUsuarios } = await supabase.from('perfis').select('id, nome').order('nome', { ascending: true });
            setParticipantes(listaUsuarios || []);

            setCarregando(false);
        }
        verificarAdminECarregarDados();
    }, [router]);

    const carregarDadosUsuarioAuditoria = async (userId: string) => {
        setUserSelecionado(userId);
        if (!userId) { setDados({ grupos: [], mm: [], esp: [] }); return; }

        const { data: pJogos } = await supabase.from('palpites_jogos').select('*, jogos(time_casa, time_fora)').eq('user_id', userId);
        const { data: pMM } = await supabase.from('palpites_matamata').select('*').eq('user_id', userId);
        const { data: pEsp } = await supabase.from('palpites_especiais').select('*').eq('user_id', userId);

        const { data: ajustes } = await supabase.from('pontuacoes_manuais').select('*').eq('user_id', userId);

        // 🛠️ Unificação da chave com a tabela de origem para isolar colisões de ID sequencial
        const mapaAjustes = new Map(ajustes?.map(a => [`${a.user_id}_${a.tabela_origem}_${a.referencia_id}`, a.pontos_ajustados]));

        const gruposMesclados = (pJogos || []).map(p => {
            const chave = `${userId}_palpites_jogos_${p.id}`;
            const temAjuste = mapaAjustes.has(chave);
            return {
                ...p,
                pontos_sistema_original: p.pontos_ganhos, // 🛡️ Salva o cálculo original do motor aqui
                pontos_ganhos: temAjuste ? mapaAjustes.get(chave) : p.pontos_ganhos
            };
        });

        const mmMesclados = (pMM || []).map(p => {
            const chave = `${userId}_palpites_matamata_${p.id}`;
            const temAjuste = mapaAjustes.has(chave);
            return {
                ...p,
                pontos_sistema_original: p.pontos_ganhos, // 🛡️ Salva o cálculo original do motor aqui
                pontos_ganhos: temAjuste ? mapaAjustes.get(chave) : p.pontos_ganhos
            };
        });

        const espMesclados = (pEsp || []).map(p => {
            const chave = `${userId}_palpites_especiais_${p.id}`;
            const temAjuste = mapaAjustes.has(chave);
            return {
                ...p,
                pontos_sistema_original: p.pontos_ganhos, // 🛡️ Salva o cálculo original do motor aqui
                pontos_ganhos: temAjuste ? mapaAjustes.get(chave) : p.pontos_ganhos
            };
        });

        setDados({ grupos: gruposMesclados, mm: mmMesclados, esp: espMesclados });
    };

    const salvarAjusteManualDB = async (tabela: string, refId: string, valor: number) => {
        if (isNaN(valor) || !userSelecionado) return;

        const { error } = await supabase.from('pontuacoes_manuais').upsert({
            user_id: userSelecionado,
            referencia_id: String(refId),
            tabela_origem: tabela,
            pontos_ajustados: valor
        }, { onConflict: 'user_id,referencia_id' });

        if (error) {
            console.error("Erro ao salvar ajuste manual:", error);
            alert(`Erro ao salvar ajuste: ${error.message}`);
            return;
        }

        setDados(prev => {
            const atualizarItem = (lista: any[]) =>
                lista.map(item => String(item.id) === String(refId) ? { ...item, pontos_ganhos: valor } : item);

            return {
                grupos: tabela === 'palpites_jogos' ? atualizarItem(prev.grupos) : prev.grupos,
                mm: tabela === 'palpites_matamata' ? atualizarItem(prev.mm) : prev.mm,
                esp: tabela === 'palpites_especiais' ? atualizarItem(prev.esp) : prev.esp,
            };
        });
    };

    // 🛠️ Função atualizada para marcar o jogo como FINALIZADO automaticamente
    const salvarPlacarJogo = async (jogoId: number, campo: 'gols_casa' | 'gols_fora', valorRaw: string) => {
        const valorLimpo = valorRaw.trim();
        const gols = valorLimpo === '' ? null : parseInt(valorLimpo, 10);

        if (gols !== null && isNaN(gols)) return;

        // Regra: Se ambos os campos tiverem valor ou se você estiver preenchendo o placar,
        // definimos que o jogo foi finalizado. Se apagar o placar, volta para false.
        const jogoAtual = jogos.find(j => j.id === jogoId);
        const outroCampo = campo === 'gols_casa' ? 'gols_fora' : 'gols_casa';
        const temPlacarCompleto = gols !== null && jogoAtual?.[outroCampo] !== null;

        const { error } = await supabase
            .from('jogos')
            .update({
                [campo]: gols,
                finalizado: temPlacarCompleto // 🔥 Seta TRUE se ambos os gols existirem
            })
            .eq('id', jogoId);

        if (error) {
            console.error("Erro ao salvar placar oficial no Supabase:", error);
            alert(`Erro ao salvar resultado do jogo: ${error.message}`);
        } else {
            // Atualiza o estado local para refletir o "finalizado" na tela se necessário
            setJogos(prev => prev.map(j => j.id === jogoId ? { ...j, [campo]: gols, finalizado: temPlacarCompleto } : j));
        }
    };

    const salvarResultadoMM = async (faseVaga: string, selecao: string) => {
        if (!selecao) return;
        await supabase.from('resultados_matamata').upsert({ fase_vaga: faseVaga, selecao_real: selecao }, { onConflict: 'fase_vaga' });
    };

    const salvarResultadoEsp = async (pId: string, resposta: string) => {
        if (!resposta) return;
        await supabase.from('resultados_especiais').upsert({ pergunta_id: pId, resposta_real: resposta }, { onConflict: 'pergunta_id' });
    };

    const rodarCalculoPontuacaoGlobal = async () => {
        setProcessando(true);
        try {
            const { data: jogosReais } = await supabase.from('jogos').select('*');
            const { data: mmReal } = await supabase.from('resultados_matamata').select('*');
            const { data: espReal } = await supabase.from('resultados_especiais').select('*');
            const { data: ajustesManuais } = await supabase.from('pontuacoes_manuais').select('*');

            const mapaMMReal = new Map(mmReal?.map(x => [x.fase_vaga, x.selecao_real.trim().toLowerCase()]));
            const mapaEspReal = new Map(espReal?.map(x => [x.pergunta_id, x.resposta_real.trim().toLowerCase()]));
            const mapaAjustes = new Map(ajustesManuais?.map(x => [`${x.user_id}_${x.tabela_origem}_${x.referencia_id}`, x.pontos_ajustados]));

            const obterPontosFase = (id: string) => {
                if (id === 'J104' || id === 'J103') return 30;
                const num = parseInt(id.replace('J', ''));
                if (num >= 73 && num <= 88) return 5;
                if (num >= 89 && num <= 96) return 10;
                if (num >= 97 && num <= 100) return 20;
                if (num >= 101 && num <= 102) return 25;
                return 0;
            };

            const pesosEspeciais: Record<string, number> = {
                artilheiro_geral: 40, craque_copa: 40, melhor_goleiro: 40, craque_final: 30, lider_assistencias: 30,
                total_gols: 25, total_vermelhos: 20, primeiro_gol_brasil: 20, artilheiro_brasil: 20, melhor_ataque: 20,
                melhor_defesa: 20, arbitro_final: 20, primeiro_gol_copa: 20, mais_cartoes_selecao: 15,
                menos_cartoes_selecao: 15, primeiro_zero_a_zero: 15
            };

            const { data: perfis } = await supabase.from('perfis').select('id');
            if (!perfis) return;

            // 🛠️ Trocado para loop síncrono "for...of" para respeitar o fluxo do await passo a passo
            for (const perfil of perfis) {
                let totalPontosUsuario = 0;

                // A) FASE DE GRUPOS
                const { data: palpitesGrupos } = await supabase.from('palpites_jogos').select('*').eq('user_id', perfil.id);
                if (palpitesGrupos) {
                    for (const p of palpitesGrupos) {
                        const chaveAjuste = `${perfil.id}_palpites_jogos_${p.id}`;
                        let pontosDestePalpite = 0;

                        if (mapaAjustes.has(chaveAjuste)) {
                            pontosDestePalpite = Number(mapaAjustes.get(chaveAjuste) || 0);
                        } else {
                            const jogoReal = jogosReais?.find(j => String(j.id) === String(p.jogo_id));
                            if (jogoReal && jogoReal.gols_casa !== null && jogoReal.gols_fora !== null) {
                                const pC = Number(p.palpite_casa);
                                const pF = Number(p.palpite_fora);
                                const rC = Number(jogoReal.gols_casa);
                                const rF = Number(jogoReal.gols_fora);

                                if (pC === rC && pF === rF) {
                                    pontosDestePalpite = 15;
                                } else if (
                                    (pC > pF && rC > rF) ||
                                    (pC < pF && rC < rF) ||
                                    (pC === pF && rC === rF)
                                ) {
                                    pontosDestePalpite = 5;
                                }
                            }
                        }

                        if (Number(p.pontos_ganhos) !== pontosDestePalpite) {
                            await supabase.from('palpites_jogos').update({ pontos_ganhos: pontosDestePalpite }).eq('id', p.id);
                        }
                        totalPontosUsuario += pontosDestePalpite;
                    }
                }

                // B) MATA-MATA
                const { data: palpitesMM } = await supabase.from('palpites_matamata').select('*').eq('user_id', perfil.id);
                if (palpitesMM) {
                    for (const p of palpitesMM) {
                        const chaveAjuste = `${perfil.id}_palpites_matamata_${p.id}`;
                        let pontosDesteMM = 0;

                        if (mapaAjustes.has(chaveAjuste)) {
                            pontosDesteMM = Number(mapaAjustes.get(chaveAjuste) || 0);
                        } else {
                            const realVencedor = mapaMMReal.get(p.fase_vaga);
                            if (realVencedor && p.selecao_escolhida.trim().toLowerCase() === realVencedor) {
                                pontosDesteMM = obterPontosFase(p.fase_vaga);
                            }
                        }

                        if (Number(p.pontos_ganhos) !== pontosDesteMM) {
                            await supabase.from('palpites_matamata').update({ pontos_ganhos: pontosDesteMM }).eq('id', p.id);
                        }
                        totalPontosUsuario += pontosDesteMM;
                    }
                }

                // C) PALPITES ESPECIAIS
                const { data: palpitesEsp } = await supabase.from('palpites_especiais').select('*').eq('user_id', perfil.id);
                if (palpitesEsp) {
                    for (const p of palpitesEsp) {
                        const chaveAjuste = `${perfil.id}_palpites_especiais_${p.id}`;
                        let pontosDesteEsp = 0;

                        if (mapaAjustes.has(chaveAjuste)) {
                            pontosDesteEsp = Number(mapaAjustes.get(chaveAjuste) || 0);
                        } else {
                            const realResp = mapaEspReal.get(p.pergunta_id);
                            if (realResp && p.resposta_palpite.trim().toLowerCase() === realResp) {
                                pontosDesteEsp = (pesosEspeciais[p.pergunta_id] || 0);
                            }
                        }

                        if (Number(p.pontos_ganhos) !== pontosDesteEsp) {
                            await supabase.from('palpites_especiais').update({ pontos_ganhos: pontosDesteEsp }).eq('id', p.id);
                        }
                        totalPontosUsuario += pontosDesteEsp;
                    }
                }

                // 💾 AGORA SIM: O total acumulado vai atualizar de verdade a tabela perfis!
                await supabase.from('perfis').update({ pontos: totalPontosUsuario }).eq('id', perfil.id);
            }

            alert('🚀 Sucesso! Todas as tabelas e perfis foram consolidados com sucesso.');
            if (userSelecionado) carregarDadosUsuarioAuditoria(userSelecionado);
        } catch (err) {
            console.error(err);
            alert('Erro crítico no motor de cálculo.');
        } finally {
            setProcessando(false);
        }
    };

    if (carregando) return <div className="p-8 text-center text-gray-400 font-mono">Verificando credenciais de Admin...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto text-white space-y-10">
            {/* Topo Administrativo */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-amber-400 tracking-tight">👑 Painel de Administração Geral</h1>
                    <p className="text-sm text-gray-400 mt-1">Insira os resultados reais da Copa do Mundo e processe o motor de pontuação.</p>
                </div>
                <button
                    onClick={rodarCalculoPontuacaoGlobal}
                    disabled={processando}
                    className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl shadow-xl transition transform active:scale-95 disabled:opacity-50"
                >
                    {processando ? '🔄 Processando Pontos...' : '🔄 RECUPERAR & RECALCULAR PONTUAÇÕES'}
                </button>
            </div>

            {/* GRID DE GABARITOS OFICIAIS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* JOGOS */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4 max-h-[600px] overflow-y-auto">
                    <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-emerald-400">⚽ Resultados Fase de Grupos</h2>
                    <div className="space-y-3">
                        {jogos?.map((j) => (
                            <div key={j.id} className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5 text-xs">
                                <span className="text-gray-500 font-mono">G{j.grupo}</span>
                                <div className="flex items-center gap-2 w-3/4 justify-end">
                                    <span className="truncate font-medium">{j.time_casa}</span>
                                    <input
                                        type="number"
                                        defaultValue={j.gols_casa ?? ''}
                                        onBlur={(e) => salvarPlacarJogo(j.id, 'gols_casa', e.target.value)}
                                        className="w-10 bg-slate-900 border border-white/10 text-center rounded p-1 font-black"
                                    />
                                    <span className="text-gray-600">x</span>
                                    <input
                                        type="number"
                                        defaultValue={j.gols_fora ?? ''}
                                        onBlur={(e) => salvarPlacarJogo(j.id, 'gols_fora', e.target.value)}
                                        className="w-10 bg-slate-900 border border-white/10 text-center rounded p-1 font-black"
                                    />
                                    <span className="truncate font-medium w-24 text-left">{j.time_fora}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MATA-MATA E ESPECIAIS */}
                <div className="space-y-8">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
                        <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-blue-400">⚡ Resultados Oficiais Mata-Mata</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-h-[250px] overflow-y-auto pr-1">
                            {Array.from({ length: 32 }, (_, i) => `J${73 + i}`).map(id => (
                                <div key={id} className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                                    <span className="font-bold text-gray-400">
                                        {id === 'J104' ? '🏆 Final (J104)' : id === 'J103' ? '🥉 3º Lugar (J103)' : `${id}:`}
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Seleção Vencedora"
                                        value={resultadosMM[id] || ''}
                                        onChange={(e) => {
                                            setResultadosMM(p => ({ ...p, [id]: e.target.value }));
                                            salvarResultadoMM(id, e.target.value);
                                        }}
                                        className="bg-slate-900 border border-white/10 p-1.5 rounded text-right w-36 font-semibold outline-none focus:border-blue-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
                        <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-purple-400">🔥 Gabarito Palpites Especiais</h2>
                        <div className="space-y-3 text-xs max-h-[250px] overflow-y-auto pr-1">
                            {CATEGORIAS_ESPECIAIS.map(c => (
                                <div key={c.id} className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5 gap-4">
                                    <span className="font-semibold text-gray-300">{c.label}:</span>
                                    <input
                                        type="text"
                                        placeholder="Resposta Correta"
                                        value={resultadosEsp[c.id] || ''}
                                        onChange={(e) => {
                                            setResultadosEsp(p => ({ ...p, [c.id]: e.target.value }));
                                            salvarResultadoEsp(c.id, e.target.value);
                                        }}
                                        className="bg-slate-900 border border-white/10 p-1.5 rounded text-right w-44 font-semibold outline-none focus:border-purple-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* SEÇÃO DE AUDITORIA E CORREÇÃO MANUAL */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-amber-500/20 mt-10">
                <h2 className="text-xl font-black text-amber-400 mb-6">🛠️ Seção de Auditoria de Participantes</h2>
                <select
                    className="w-full bg-slate-900 border border-white/20 p-4 rounded-xl mb-8 text-white font-semibold outline-none"
                    onChange={(e) => carregarDadosUsuarioAuditoria(e.target.value)}
                    value={userSelecionado}
                >
                    <option value="">Selecione um participante para auditar...</option>
                    {participantes?.map(u => <option key={u.id} value={u.id}>{u.nome || 'Sem Nome'}</option>)}
                </select>

                {userSelecionado && (
                    <div className="space-y-6">
                        <SecaoCorrecao
                            titulo="Fase de Grupos (Ajustar Notas)"
                            itens={dados.grupos}
                            tabela="palpites_jogos"
                            renderLabel={(p: any) => `${p.jogos?.time_casa || 'Time'} x ${p.jogos?.time_fora || 'Time'}`}
                            renderPalpite={(p: any) => `${p.palpite_casa} x ${p.palpite_fora}`}
                            onSave={salvarAjusteManualDB}
                        />

                        <SecaoCorrecao
                            titulo="Mata-Mata (Ajustar Notas)"
                            itens={dados.mm}
                            tabela="palpites_matamata"
                            renderLabel={(p: any) => `Jogo ${p.fase_vaga}`}
                            renderPalpite={(p: any) => p.selecao_escolhida || 'Nenhum'}
                            onSave={salvarAjusteManualDB}
                        />

                        <SecaoCorrecao
                            titulo="Palpites Especiais (Ajustar Notas)"
                            itens={dados.esp}
                            tabela="palpites_especiais"
                            renderLabel={(p: any) => `${p.pergunta_id}`}
                            renderPalpite={(p: any) => p.resposta_palpite || 'Em branco'}
                            onSave={salvarAjusteManualDB}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function SecaoCorrecao({ titulo, itens, tabela, renderLabel, renderPalpite, onSave }: {
    titulo: string,
    itens: any[],
    tabela: string,
    renderLabel: (p: any) => string,
    renderPalpite: (p: any) => string,
    onSave: (tabela: string, id: string, valor: number) => void
}) {
    const [aberto, setAberto] = useState(false);

    const itensFiltrados = tabela === 'palpites_matamata'
        ? itens?.filter((p: any) => !p.fase_vaga.includes('_'))
        : itens;

    const obterBadgeFase = (faseVaga: string) => {
        if (tabela !== 'palpites_matamata') return null;

        const num = parseInt(faseVaga.replace('J', ''));
        if (isNaN(num)) return null;

        if (faseVaga === 'J104') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">🏆 Final</span>;
        if (faseVaga === 'J103') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">🥉 3º Lugar</span>;
        if (num >= 73 && num <= 88) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Fase de 32</span>;
        if (num >= 89 && num <= 96) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Oitavas</span>;
        if (num >= 97 && num <= 100) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">Quartas</span>;
        if (num >= 101 && num <= 102) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">Semi</span>;

        return null;
    };

    return (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
            <button className="w-full p-4 text-left font-black flex justify-between text-white bg-slate-900/50 hover:bg-slate-900 transition" onClick={() => setAberto(!aberto)}>
                <span>{titulo}</span>
                <span>{aberto ? '▲' : '▼'}</span>
            </button>
            {aberto && (
                <div className="p-4 border-t border-white/10 space-y-2 bg-black/40">
                    <div className="grid grid-cols-12 text-[10px] font-bold text-gray-400 uppercase px-2 pb-2 border-b border-white/5">
                        <span className="col-span-4">Item Evaluated</span>
                        <span className="col-span-3 text-center text-amber-500">Palpite Usuário</span>
                        <span className="col-span-2 text-center">Pts Sistema</span>
                        <span className="col-span-3 text-center">Ajuste Manual</span>
                    </div>
                    {itensFiltrados?.length === 0 ? (
                        <p className="text-xs text-gray-500 p-2">Nenhum palpite enviado nesta categoria.</p>
                    ) : (
                        itensFiltrados?.map((p: any) => (
                            <div key={p.id} className="grid grid-cols-12 gap-2 items-center bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition">
                                <div className="col-span-4 flex items-center gap-2 truncate">
                                    <span className="text-xs font-semibold text-gray-200 truncate">{renderLabel(p)}</span>
                                    {obterBadgeFase(p.fase_vaga)}
                                </div>
                                <span className="col-span-3 text-center text-xs font-black text-amber-400 bg-amber-500/10 py-1 rounded border border-amber-500/20 truncate px-1">
                                    {renderPalpite(p)}
                                </span>
                                {/* 🎯 Agora mostra o ponto real calculado pelo robô, sem o override manual */}
                                <span className="col-span-2 text-center text-emerald-400 font-mono font-bold text-sm">
                                    {p.pontos_sistema_original ?? p.pontos_ganhos ?? 0}
                                </span>                                
                                <input
                                    key={`${p.id}_${p.pontos_ganhos}`}
                                    type="number"
                                    placeholder="Nota"
                                    defaultValue={p.pontos_ganhos ?? ''}
                                    className="col-span-3 bg-slate-900 border border-white/20 p-2 rounded text-center font-bold text-white text-xs focus:border-amber-500 outline-none"
                                    onBlur={(e) => onSave(tabela, p.id, parseInt(e.target.value, 10))}
                                />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}