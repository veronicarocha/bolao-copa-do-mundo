'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import GerenciadorFasesAdmin from './gerenciadorFases';

export const dynamic = 'force-dynamic';

interface DadosPalpites {
    grupos: any[];
    mm: any[];
    esp: any[];
}

// 🎯 MAPA ESTRUTURAL DAS DEPENDÊNCIAS DO MATA-MATA (Baseado na árvore de palpites)
const MAPA_DEPENDENCIAS_MOTOR: Record<string, { casa: string; fora: string }> = {
    'J89': { casa: 'J74', fora: 'J77' },
    'J90': { casa: 'J73', fora: 'J75' },
    'J93': { casa: 'J83', fora: 'J84' },
    'J94': { casa: 'J81', fora: 'J82' },
    'J91': { casa: 'J76', fora: 'J78' },
    'J92': { casa: 'J79', fora: 'J80' },
    'J95': { casa: 'J86', fora: 'J88' },
    'J96': { casa: 'J85', fora: 'J87' },

    'J97': { casa: 'J89', fora: 'J90' },
    'J98': { casa: 'J93', fora: 'J94' },
    'J99': { casa: 'J91', fora: 'J92' },
    'J100': { casa: 'J95', fora: 'J96' },

    'J101': { casa: 'J97', fora: 'J98' },
    'J102': { casa: 'J99', fora: 'J100' },
    'J104': { casa: 'J101', fora: 'J102' }
};

function validarRespostaEspecial(respostaParticipante: string, termoValidacao: string): boolean {
    if (!respostaParticipante || !termoValidacao) return false;

    const normalizar = (texto: string) => {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const participanteLimpo = normalizar(respostaParticipante);
    const gabaritoLimpo = normalizar(termoValidacao);

    if (gabaritoLimpo.includes(participanteLimpo) || participanteLimpo.includes(gabaritoLimpo)) {
        return true;
    }

    const palavrasGabarito = gabaritoLimpo.split(' ').filter(p => p.length > 2);
    if (palavrasGabarito.length > 0) {
        const acertouPorGabarito = palavrasGabarito.every(palavra => participanteLimpo.includes(palavra));
        if (acertouPorGabarito) return true;
    }

    const palavrasParticipante = participanteLimpo.split(' ').filter(p => p.length > 2);
    if (palavrasParticipante.length > 0) {
        const acertouPorParticipante = palavrasParticipante.every(palavra => gabaritoLimpo.includes(palavra));
        if (acertouPorParticipante) return true;
    }

    return false;
}

export default function PainelAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState(false);
    const [tabAtiva, setTabAtiva] = useState<'gabaritos_gerais' | 'fases_checkboxes'>('gabaritos_gerais');

    const [jogos, setJogos] = useState<any[]>([]);
    const [resultadosEsp, setResultadosEsp] = useState<Record<string, string>>({});

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

    const carregarDadosUsuarioAuditoria = async (userId: string) => {
        setUserSelecionado(userId);
        if (!userId) { setDados({ grupos: [], mm: [], esp: [] }); return; }

        const { data: pJogos } = await supabase.from('palpites_jogos').select('*, jogos(time_casa, time_fora)').eq('user_id', userId);
        const { data: pMM } = await supabase.from('palpites_matamata').select('*').eq('user_id', userId).order('fase_vaga', { ascending: true });
        const { data: pEsp } = await supabase.from('palpites_especiais').select('*').eq('user_id', userId);
        const { data: ajustes } = await supabase.from('pontuacoes_manuais').select('*').eq('user_id', userId);

        const mapaAjustes = new Map(ajustes?.map(a => [`${a.user_id}_${a.tabela_origem}_${a.referencia_id}`, a.pontos_ajustados]));

        const gruposMesclados = (pJogos || []).map(p => {
            const chave = `${userId}_palpites_jogos_${p.id}`;
            return {
                ...p,
                pontos_sistema_original: p.pontos_ganhos,
                pontos_ganhos: mapaAjustes.has(chave) ? mapaAjustes.get(chave) : p.pontos_ganhos
            };
        });

        const mmMesclados = (pMM || []).map(p => {
            const chave = `${userId}_palpites_matamata_${p.id}`;
            return {
                ...p,
                pontos_sistema_original: p.pontos_ganhos,
                pontos_ganhos: mapaAjustes.has(chave) ? mapaAjustes.get(chave) : p.pontos_ganhos
            };
        });

        const espMesclados = (pEsp || []).map(p => {
            const chave = `${userId}_palpites_especiais_${p.id}`;
            return {
                ...p,
                pontos_sistema_original: p.pontos_ganhos,
                pontos_ganhos: mapaAjustes.has(chave) ? mapaAjustes.get(chave) : p.pontos_ganhos
            };
        });

        setDados({ grupos: gruposMesclados, mm: mmMesclados, esp: espMesclados });
    };

    function removerAcentos(str: string): string {
        if (!str) return '';
        let texto = str.toLowerCase();

        if (texto === 'eua') texto = 'estados unidos';
        if (texto === 'bosnia') texto = 'bosnia e herzegovina';
        if (texto === 'curacao' || texto === 'curacau') texto = 'curacau';

        const de = "áàâãäéèêëíìîïóòôõöúùûüçñ";
        const para = "aaaaaeeeeiiiiooooouuuucn";
        for (let i = 0; i < de.length; i++) {
            texto = texto.split(de[i]).join(para[i]);
        }
        texto = texto.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();

        if (texto === 'ri do ira') return 'ira';
        if (texto === 'tchequia') return 'republica tcheca';
        return texto;
    }

    useEffect(() => {
        async function verificarAdminECarregarDados() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/'); return; }

            const { data: perfil } = await supabase.from('perfis').select('is_admin').eq('id', user.id).maybeSingle();
            if (!perfil?.is_admin) { router.push('/dashboard/grupos'); return; }

            setIsAdmin(true);

            const { data: listaJogos } = await supabase.from('jogos').select('*').order('id', { ascending: true });
            setJogos(listaJogos || []);

            const { data: listaEsp } = await supabase.from('resultados_especiais').select('*');
            const mapaEsp: Record<string, string> = {};
            listaEsp?.forEach(x => { if (x.pergunta_id) mapaEsp[x.pergunta_id.trim()] = x.resposta_real; });
            setResultadosEsp(mapaEsp);

            const { data: listaUsuarios } = await supabase.from('perfis').select('id, nome').order('nome', { ascending: true });
            setParticipantes(listaUsuarios || []);

            setCarregando(false);
        }
        verificarAdminECarregarDados();
    }, [router]);

    const salvarAjusteManualDB = async (tabela: string, refId: string, valor: number) => {
        if (isNaN(valor) || !userSelecionado) return;

        const { error } = await supabase.from('pontuacoes_manuais').upsert({
            user_id: userSelecionado,
            referencia_id: String(refId),
            tabela_origem: tabela,
            pontos_ajustados: valor
        }, { onConflict: 'user_id,tabela_origem,referencia_id' });

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

    const salvarPlacarJogo = async (jogoId: number, campo: 'gols_casa' | 'gols_fora', valorRaw: string) => {
        const valorLimpo = valorRaw.trim();
        const gols = valorLimpo === '' ? null : parseInt(valorLimpo, 10);

        if (gols !== null && isNaN(gols)) return;

        const juegoAtual = jogos.find(j => j.id === jogoId);
        const outroCampo = campo === 'gols_casa' ? 'gols_fora' : 'gols_casa';
        const temPlacarCompleto = gols !== null && juegoAtual?.[outroCampo] !== null;

        const { error } = await supabase
            .from('jogos')
            .update({ [campo]: gols, finalizado: temPlacarCompleto })
            .eq('id', jogoId);

        if (error) {
            console.error("Erro ao salvar placar oficial:", error);
            alert(`Erro ao salvar resultado do jogo: ${error.message}`);
        } else {
            setJogos(prev => prev.map(j => j.id === jogoId ? { ...j, [campo]: gols, finalizado: temPlacarCompleto } : j));
        }
    };

    const salvarResultadoEsp = async (pId: string, resposta: string) => {
        if (!resposta) return;
        await supabase.from('resultados_especiais').upsert({ pregunta_id: pId.trim(), resposta_real: resposta.trim() }, { onConflict: 'pergunta_id' });
    };

    const rodarCalculoPontuacaoGlobal = async () => {
        setProcessando(true);
        try {
            const [
                { data: jogosReais },
                { data: espReal },
                { data: ajustesManuais },
                { data: perfis },
                { data: fasesReais }
            ] = await Promise.all([
                supabase.from('jogos').select('*'),
                supabase.from('resultados_especiais').select('*'),
                supabase.from('pontuacoes_manuais').select('*'),
                supabase.from('perfis').select('*'),
                supabase.from('resultados_fases_reais').select('*')
            ]);

            const dezoitoReais = new Set(fasesReais?.find(f => f.fase === 'dezesseis_avos')?.selecoes.map((s: string) => removerAcentos(s)) || []);
            const oitavasReal = new Set(fasesReais?.find(f => f.fase === 'oitavas')?.selecoes.map((s: string) => removerAcentos(s)) || []);
            const quartasReal = new Set(fasesReais?.find(f => f.fase === 'quartas')?.selecoes.map((s: string) => removerAcentos(s)) || []);
            const semiReal = new Set(fasesReais?.find(f => f.fase === 'semi')?.selecoes.map((s: string) => removerAcentos(s)) || []);
            const finalReal = new Set(fasesReais?.find(f => f.fase === 'finalistas')?.selecoes.map((s: string) => removerAcentos(s)) || []);
            const campeaoReal = new Set(fasesReais?.find(f => f.fase === 'campeao')?.selecoes.map((s: string) => removerAcentos(s)) || []);
            const terceiroReal = new Set(fasesReais?.find(f => f.fase === 'terceiro')?.selecoes.map((s: string) => removerAcentos(s)) || []);
            const quartoReal = new Set(fasesReais?.find(f => f.fase === 'quarto')?.selecoes.map((s: string) => removerAcentos(s)) || []);

            const mapaEspReal = new Map(espReal?.map(x => [x.pergunta_id.trim().toLowerCase(), x.resposta_real.trim()]));
            const mapaAjustes = new Map(ajustesManuais?.map(x => [`${x.user_id}_${x.tabela_origem}_${x.referencia_id}`, x.pontos_ajustados]));

            const pesosEspeciais: Record<string, number> = {
                campeao: 70, vice: 35, terceiro: 20, artilheiro_geral: 40, craque_copa: 40, melhor_goleiro: 40,
                craque_final: 30, lider_assistencias: 30, total_gols: 25, total_vermelhos: 20, primeiro_gol_brasil: 20,
                artilheiro_brasil: 20, melhor_ataque: 20, melhor_defesa: 20, arbitro_final: 20, primeiro_gol_copa: 20,
                mais_cartoes_selecao: 15, menos_cartoes_selecao: 15, primeiro_zero_a_zero: 15
            };

            if (!perfis) throw new Error("Erro na base de dados de perfis");

            const updateLoteGrupos: any[] = [];
            const updateLoteMM: any[] = [];
            const updateLoteEsp: any[] = [];
            const updateLotePerfis: any[] = [];

            for (const perfil of perfis) {
                let totalPontosUsuario = 0;
                let exatos = 0;
                let acertosVencedor = 0;
                let especiaisAcertos = 0;
                let mm16 = 0, mm8 = 0, mm4 = 0, mm2 = 0, mmFin = 0, mmCamp = 0;
                let mmTerceiro = 0, mmQuarto = 0;

                const [
                    { data: pJogos },
                    { data: pMM },
                    { data: pEsp }
                ] = await Promise.all([
                    supabase.from('palpites_jogos').select('*').eq('user_id', perfil.id),
                    supabase.from('palpites_matamata').select('*').eq('user_id', perfil.id),
                    supabase.from('palpites_especiais').select('*').eq('user_id', perfil.id)
                ]);

                // A) FASE DE GRUPOS
                for (const p of (pJogos || [])) {
                    const chaveAjuste = `${perfil.id}_palpites_jogos_${p.id}`;
                    let pts = 0;

                    if (mapaAjustes.has(chaveAjuste)) {
                        pts = Number(mapaAjustes.get(chaveAjuste) || 0);
                    } else {
                        const jogoReal = jogosReais?.find(j => String(j.id) === String(p.jogo_id));
                        if (jogoReal && jogoReal.gols_casa !== null && jogoReal.gols_fora !== null) {
                            const pC = Number(p.palpite_casa);
                            const pF = Number(p.palpite_fora);
                            const rC = Number(jogoReal.gols_casa);
                            const rF = Number(jogoReal.gols_fora);

                            if (pC === rC && pF === rF) pts = 15;
                            else if ((pC > pF && rC > rF) || (pC < pF && rC < rF) || (pC === pF && rC === rF)) pts = 5;
                            else pts = 0;
                        } else {
                            pts = Number(p.pontos_ganhos || 0);
                        }
                    }

                    if (pts === 15) { exatos++; acertosVencedor++; }
                    else if (pts === 5) { acertosVencedor++; }

                    totalPontosUsuario += pts;
                    updateLoteGrupos.push({ ...p, pontos_ganhos: pts });
                }

                // ⚡ B) MATA-MATA
                for (const p of (pMM || [])) {
                    if (!p.fase_vaga) continue;
                    const faseLimpa = p.fase_vaga.trim().toLowerCase();

                    const parteJogoBase = faseLimpa.split('_')[0];
                    const numJogo = parseInt(parteJogoBase.replace(/[^\d]/g, ''), 10);

                    const keyAjuste = `${perfil.id}_palpites_matamata_${p.id}`;
                    let pts = 0;

                    if (mapaAjustes.has(keyAjuste)) {
                        pts = Number(mapaAjustes.get(keyAjuste) || 0);
                    } else {
                        if (numJogo >= 73 && numJogo <= 88) {
                            if (faseLimpa.endsWith('_1') || faseLimpa.endsWith('_2')) {
                                if (p.selecao_escolhida && dezoitoReais.has(removerAcentos(p.selecao_escolhida))) {
                                    pts = 5;
                                }
                            } else {
                                pts = 0;
                            }
                        }
                        else if (numJogo >= 89 && numJogo <= 96) {
                            if (!faseLimpa.includes('_')) {
                                const deps = MAPA_DEPENDENCIAS_MOTOR[p.fase_vaga.trim().toUpperCase()];
                                if (deps) {
                                    const listaPalpitesMM = pMM || [];
                                    const palpiteCasa = listaPalpitesMM.find(x => x.fase_vaga.trim().toUpperCase() === deps.casa)?.selecao_escolhida;
                                    const palpiteFora = listaPalpitesMM.find(x => x.fase_vaga.trim().toUpperCase() === deps.fora)?.selecao_escolhida;

                                    let pontosRodada = 0;
                                    if (palpiteCasa && oitavasReal.has(removerAcentos(palpiteCasa))) pontosRodada += 10;
                                    if (palpiteFora && oitavasReal.has(removerAcentos(palpiteFora))) pontosRodada += 10;
                                    pts = pontosRodada;
                                }
                            } else {
                                pts = 0;
                            }
                        }
                        else if (numJogo >= 97 && numJogo <= 100) {
                            if (!faseLimpa.includes('_')) {
                                const deps = MAPA_DEPENDENCIAS_MOTOR[p.fase_vaga.trim().toUpperCase()];
                                if (deps) {
                                    const listaPalpitesMM = pMM || [];
                                    const palpiteCasa = listaPalpitesMM.find(x => x.fase_vaga.trim().toUpperCase() === deps.casa)?.selecao_escolhida;
                                    const palpiteFora = listaPalpitesMM.find(x => x.fase_vaga.trim().toUpperCase() === deps.fora)?.selecao_escolhida;

                                    let pontosRodada = 0;
                                    if (palpiteCasa && quartasReal.has(removerAcentos(palpiteCasa))) pontosRodada += 20;
                                    if (palpiteFora && quartasReal.has(removerAcentos(palpiteFora))) pontosRodada += 20;
                                    pts = pontosRodada;
                                }
                            } else {
                                pts = 0;
                            }
                        }
                        else if (numJogo === 101 || numJogo === 102) {
                            if (!faseLimpa.includes('_')) {
                                const deps = MAPA_DEPENDENCIAS_MOTOR[p.fase_vaga.trim().toUpperCase()];
                                if (deps) {
                                    const listaPalpitesMM = pMM || [];
                                    const palpiteCasa = listaPalpitesMM.find(x => x.fase_vaga.trim().toUpperCase() === deps.casa)?.selecao_escolhida;
                                    const palpiteFora = listaPalpitesMM.find(x => x.fase_vaga.trim().toUpperCase() === deps.fora)?.selecao_escolhida;

                                    let pontosRodada = 0;
                                    if (palpiteCasa && semiReal.has(removerAcentos(palpiteCasa))) pontosRodada += 25;
                                    if (palpiteFora && semiReal.has(removerAcentos(palpiteFora))) pontosRodada += 25;
                                    pts = pontosRodada;
                                }
                            } else {
                                pts = 0;
                            }
                        }
                        // DISPUTA DE 3º LUGAR (J103) -> Posição exata
                        else if (numJogo === 103) {
                            if (p.selecao_escolhida) {
                                const selecaoApostada = removerAcentos(p.selecao_escolhida);
                                if (faseLimpa === 'j103_3' || faseLimpa.includes('terceiro')) {
                                    if (terceiroReal.has(selecaoApostada)) pts = 25;
                                } else if (faseLimpa === 'j103_4' || faseLimpa.includes('quarto')) {
                                    if (quartoReal.has(selecaoApostada)) pts = 25;
                                } else {
                                    if (faseLimpa.endsWith('_1') && terceiroReal.has(selecaoApostada)) pts = 25;
                                    if (faseLimpa.endsWith('_2') && quartoReal.has(selecaoApostada)) pts = 25;
                                }
                            }
                        }
                        // 🏆 GRANDE FINAL (J104) -> Validação do Campeão e dedução dinâmica do Vice pelas Semifinais
                        else if (numJogo === 104) {
                            if (p.selecao_escolhida) {
                                const selecaoApostada = removerAcentos(p.selecao_escolhida);

                                // 1. Avalia se o palpite do J104 acertou o Campeão Oficial
                                if (campeaoReal.has(selecaoApostada)) {
                                    pts = 70;
                                }

                                // 2. Dedução estrutural do Vice: Procura as chaves J101 e J102 nas chaves do próprio usuário
                                const listaPalpitesMM = pMM || [];
                                const palpiteJ101 = listaPalpitesMM.find(x => x.fase_vaga.trim().toUpperCase() === 'J101')?.selecao_escolhida;
                                const palpiteJ102 = listaPalpitesMM.find(x => x.fase_vaga.trim().toUpperCase() === 'J102')?.selecao_escolhida;

                                let viceApostado = '';

                                if (palpiteJ101 && removerAcentos(palpiteJ101) === selecaoApostada) {
                                    viceApostado = palpiteJ102 ? removerAcentos(palpiteJ102) : '';
                                } else if (palpiteJ102 && removerAcentos(palpiteJ102) === selecaoApostada) {
                                    viceApostado = palpiteJ101 ? removerAcentos(palpiteJ101) : '';
                                }

                                // Se o vice encontrado nas chaves bater com o finalReal oficial (Argentina), soma os 35 pontos!
                                if (viceApostado && finalReal.has(removerAcentos(viceApostado))) {
                                    pts += 35;
                                }
                            }
                        }
                    }

                    // Contadores de estatísticas para a tela de ranking
                    if (pts > 0) {
                        if (numJogo >= 73 && numJogo <= 88) mm16++;
                        else if (numJogo >= 89 && numJogo <= 96) {
                            mm8 += (pts === 20 ? 2 : 1);
                        }
                        else if (numJogo >= 97 && numJogo <= 100) {
                            mm4 += (pts === 40 ? 2 : 1);
                        }
                        else if (numJogo >= 101 && numJogo <= 102) {
                            mm2 += (pts === 50 ? 2 : 1);
                        }
                        else if (numJogo === 103 && p.selecao_escolhida) {
                            const selecaoApostada = removerAcentos(p.selecao_escolhida);
                            if (terceiroReal.has(selecaoApostada)) {
                                mmTerceiro++;
                            } else if (quartoReal.has(selecaoApostada)) {
                                mmQuarto++;
                            }
                            mmFin++;
                        }
                        // Sincronização condicional dos contadores baseados na composição da nota do J104
                        else if (numJogo === 104) {
                            if (pts >= 70) mmCamp++; // Acertou o campeão
                            if (pts === 35) mmFin++; // Acertou só o vice
                            if (pts === 105) mmFin += 2; // Acertou campeão E vice (soma 2 para balancear a subtração do front)
                        }
                    }

                    totalPontosUsuario += pts;
                    updateLoteMM.push({ ...p, pontos_ganhos: pts });
                }

                // C) PALPITES ESPECIAIS
                for (const p of (pEsp || [])) {
                    const chaveAjuste = `${perfil.id}_palpites_especiais_${p.id}`;
                    let pts = 0;

                    if (mapaAjustes.has(chaveAjuste)) {
                        pts = Number(mapaAjustes.get(chaveAjuste) || 0);
                    } else {
                        const perguntaLimpa = p.pergunta_id ? String(p.pergunta_id).trim().toLowerCase() : '';
                        const realResp = mapaEspReal.get(perguntaLimpa);

                        if (realResp && p.resposta_palpite) {
                            const acertou = validarRespostaEspecial(String(p.resposta_palpite), String(realResp));
                            if (acertou) {
                                pts = pesosEspeciais[perguntaLimpa] || 0;
                            }
                        } else if (!realResp) {
                            pts = Number(p.pontos_ganhos || 0);
                        }
                    }

                    if (pts > 0) especiaisAcertos++;

                    totalPontosUsuario += pts;
                    updateLoteEsp.push({ ...p, pontos_ganhos: pts });
                }

                updateLotePerfis.push({
                    ...perfil,
                    pontos: totalPontosUsuario,
                    placares_exatos: exatos,
                    acertos_vencedor: acertosVencedor - exatos,
                    especiais_acertos: especiaisAcertos,
                    acertos_16avos: mm16,
                    acertos_oitavas: mm8,
                    acertos_quartas: mm4,
                    acertos_semi: mm2,
                    acertos_finalistas: mmFin,
                    acertos_campeao: mmCamp,
                    acertos_terceiro: mmTerceiro,
                    acertos_quarto: mmQuarto
                });
            }

            const ejecutarUpsertEmLotes = async (tabela: string, dados: any[]) => {
                const TAMANHO_LOTE = 500;
                for (let i = 0; i < dados.length; i += TAMANHO_LOTE) {
                    const lote = dados.slice(i, i + TAMANHO_LOTE);
                    const { error } = await supabase.from(tabela).upsert(lote);
                    if (error) throw new Error(`Erro upsert em ${tabela}: ${error.message}`);
                }
            };

            if (updateLoteGrupos.length > 0) await ejecutarUpsertEmLotes('palpites_jogos', updateLoteGrupos);
            if (updateLoteMM.length > 0) await ejecutarUpsertEmLotes('palpites_matamata', updateLoteMM);
            if (updateLoteEsp.length > 0) await ejecutarUpsertEmLotes('palpites_especiais', updateLoteEsp);
            if (updateLotePerfis.length > 0) await ejecutarUpsertEmLotes('perfis', updateLotePerfis);

            alert('🚀 Motor de Presença Rodado com Sucesso! Pontuações sincronizadas em toda a base.');
            if (userSelecionado) carregarDadosUsuarioAuditoria(userSelecionado);
        } catch (err: any) {
            console.error('❌ CRITICAL ENGINE ERROR:', err);
            alert(`Erro crítico no processamento com UPDATE: ${err.message || err}`);
        } finally {
            setProcessando(false);
        }
    };

    if (carregando) return <div className="p-8 text-center text-gray-400 font-mono">Verificando credenciais de Admin...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto text-white space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-amber-400 tracking-tight">👑 Painel de Administração Geral</h1>
                    <p className="text-sm text-gray-400 mt-1">Insira os resultados reais da Copa do Mundo e processe o motor de pontuação.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 gap-1 font-bold text-xs shrink-0">
                        <button
                            onClick={() => setTabAtiva('gabaritos_gerais')}
                            className={`px-4 py-2.5 rounded-lg transition ${tabAtiva === 'gabaritos_gerais' ? 'bg-white/10 text-amber-400 font-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            📋 Painel de Jogos
                        </button>
                        <button
                            onClick={() => setTabAtiva('fases_checkboxes')}
                            className={`px-4 py-2.5 rounded-lg transition ${tabAtiva === 'fases_checkboxes' ? 'bg-white/10 text-amber-400 font-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            ✅ Checkboxes Mata-Mata
                        </button>
                    </div>

                    <button
                        onClick={rodarCalculoPontuacaoGlobal}
                        disabled={processando}
                        className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl shadow-xl transition transform active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider"
                    >
                        {processando ? '🔄 Processando em Lote...' : '🔄 Recalcular Pontuações'}
                    </button>
                </div>
            </div>

            {tabAtiva === 'fases_checkboxes' ? (
                <GerenciadorFasesAdmin />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4 max-h-[600px] overflow-y-auto font-mono">
                        <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-emerald-400">⚽ Resultados Fase de Grupos</h2>
                        <div className="space-y-3">
                            {jogos?.map((j) => (
                                <div key={j.id} className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5 text-xs">
                                    <span className="text-gray-500">G{j.grupo}</span>
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

                    <div className="space-y-8">
                        <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
                            <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-purple-400 font-mono">🔥 Gabarito Palpites Especiais</h2>
                            <div className="space-y-3 text-xs max-h-[450px] overflow-y-auto pr-1">
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
            )}

            <div className="bg-slate-950 p-6 rounded-2xl border border-amber-500/20 mt-10">
                <h2 className="text-xl font-black text-amber-400 mb-6 font-mono">🛠️ Seção de Auditoria de Participantes</h2>
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
    const itensFiltrados = itens;

    const obterBadgeFase = (faseVaga: string) => {
        if (tabela !== 'palpites_matamata') return null;

        const num = parseInt(faseVaga.replace('J', ''), 10);
        if (isNaN(num)) return null;

        if (faseVaga.startsWith('J104')) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">🏆 Final</span>;
        if (faseVaga.startsWith('J103')) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">🥉 3º Lugar</span>;
        if (num >= 73 && num <= 88) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Fase de 32</span>;
        if (num >= 89 && num <= 96) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Oitavas</span>;
        if (num >= 97 && num <= 100) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">Quartas</span>;
        if (num >= 101 && num <= 102) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">Semi</span>;

        return null;
    };

    return (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20 font-sans">
            <button className="w-full p-4 text-left font-black flex justify-between text-white bg-slate-900/50 hover:bg-slate-900 transition" onClick={() => setAberto(!aberto)}>
                <span>{titulo}</span>
                <span>{aberto ? '▲' : '▼'}</span>
            </button>
            {aberto && (
                <div className="p-4 border-t border-white/10 space-y-2 bg-black/40">
                    <div className="grid grid-cols-12 text-[10px] font-bold text-gray-400 uppercase px-2 pb-2 border-b border-white/5 font-mono">
                        <span className="col-span-4">Item Evaluated</span>
                        <span className="col-span-3 text-center text-amber-500">Palpite Usuário</span>
                        <span className="col-span-2 text-center">Pts Sistema</span>
                        <span className="col-span-3 text-center">Ajuste Manual</span>
                    </div>
                    {itensFiltrados?.length === 0 ? (
                        <p className="text-xs text-gray-500 p-2 font-mono">Nenhum palpite enviado nesta categoria.</p>
                    ) : (
                        itensFiltrados?.map((p: any) => (
                            <div key={p.id} className="grid grid-cols-12 gap-2 items-center bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition font-mono">
                                <div className="col-span-4 flex items-center gap-2 truncate font-sans">
                                    <span className="text-xs font-semibold text-gray-200 truncate">{renderLabel(p)}</span>
                                    {obterBadgeFase(p.fase_vaga)}
                                </div>
                                <span className="col-span-3 text-center text-xs font-black text-amber-400 bg-amber-500/10 py-1 rounded border border-amber-500/20 truncate px-1 font-sans">
                                    {renderPalpite(p)}
                                </span>
                                <span className="col-span-2 text-center text-emerald-400 font-bold text-sm">
                                    {p.pontos_ganhos ?? 0}
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