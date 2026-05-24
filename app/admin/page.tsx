'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function PainelAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState(false);

    // Estados para inputs do Admin
    const [jogos, setJogos] = useState<any[]>([]);
    const [resultadosMM, setResultadosMM] = useState<Record<string, string>>({});
    const [resultadosEsp, setResultadosEsp] = useState<Record<string, string>>({});

    const router = useRouter();

    // Lista de perguntas especiais idêntica para o Admin pontuar
    const CATEGORIAS_ESPECIAIS = [
        { id: 'campeao', label: '🥇 1º Colocado (Grande Campeão)' },
        { id: 'vice', label: '🥈 2º Colocado (Vice-Campeão)' },
        { id: 'terceiro', label: '🥉 3º Colocado' },
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
        async function verificarAdmin() {
            const { data: { user } } = await supabase.auth.getUser();
            console.log("[ADMIN DEBUG] Usuário autenticado:", user);

            if (!user) {
                console.log("[ADMIN DEBUG] Nenhum usuário logado encontrado.");
                router.push('/');
                return;
            }

            const { data: perfil, error } = await supabase
                .from('perfis')
                .select('is_admin')
                .eq('id', user.id)
                .maybeSingle();

            console.log("[ADMIN DEBUG] Resposta do Perfil:", perfil);
            if (error) console.error("[ADMIN DEBUG] Erro na query do perfil:", error);

            if (!perfil || !perfil.is_admin) {
                alert(`Acesso negado. Perfil encontrado: ${JSON.stringify(perfil)}`);
                router.push('/dashboard/grupos');
                return;
            }

            setIsAdmin(true);

            // Carregar dados existentes para edição
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

            setCarregando(false);
        }
        verificarAdmin();
    }, [router]);

    // Handlers de atualização individual
    const salvarPlacarJogo = async (jogoId: number, golsCasa: string, golsFora: string) => {
        const gc = golsCasa === '' ? null : parseInt(golsCasa);
        const gf = golsFora === '' ? null : parseInt(golsFora);

        const { error } = await supabase
            .from('jogos')
            .update({ gols_casa: gc, gols_fora: gf })
            .eq('id', jogoId);

        if (error) alert(`Erro ao salvar placar: ${error.message}`);
    };

    const salvarResultadoMM = async (faseVaga: string, selecao: string) => {
        if (!selecao) return;
        await supabase.from('resultados_matamata').upsert({ fase_vaga: faseVaga, selecao_real: selecao }, { onConflict: 'fase_vaga' });
    };

    const salvarResultadoEsp = async (pId: string, resposta: string) => {
        if (!resposta) return;
        await supabase.from('resultados_especiais').upsert({ pergunta_id: pId, resposta_real: resposta }, { onConflict: 'pergunta_id' });
    };

    // --- 🔄 MOTOR DO CÁLCULO ALGORÍTMICO DE PONTUAÇÕES ---
    const rodarCalculoPontuacaoGlobal = async () => {
        setProcessando(true);
        try {
            // 1. Puxar todos os gabaritos oficiais inseridos pelo Admin
            const { data: jogosReais } = await supabase.from('jogos').select('*');
            const { data: mmReal } = await supabase.from('resultados_matamata').select('*');
            const { data: espReal } = await supabase.from('resultados_especiais').select('*');

            const mapaMMReal = new Map(mmReal?.map(x => [x.fase_vaga, x.selecao_real.trim().toLowerCase()]));
            const mapaEspReal = new Map(espReal?.map(x => [x.pergunta_id, x.resposta_real.trim().toLowerCase()]));

            // Pesos do mata-mata por ID de partida
            const obterPontosFase = (id: string) => {
                if (id === 'J104') return 30; // Finalista/Campeão
                if (id === 'J103') return 30; // 3º Lugar
                const num = parseInt(id.replace('J', ''));
                if (num >= 73 && num <= 88) return 5;   // 32 avos
                if (num >= 89 && num <= 96) return 10;  // Oitavas
                if (num >= 97 && num <= 100) return 20; // Quartas
                if (num >= 101 && num <= 102) return 25; // Semifinais
                return 0;
            };

            // Pesos dos palpites especiais
            const pesosEspeciais: Record<string, number> = {
                campeao: 70, vice: 35, terceiro: 20, artilheiro_geral: 40, craque_copa: 40, melhor_goleiro: 40,
                craque_final: 30, lider_assistencias: 30, total_gols: 25, total_vermelhos: 20, primeiro_gol_brasil: 20,
                artilheiro_brasil: 20, melhor_ataque: 20, melhor_defesa: 20, arbitro_final: 20, primeiro_gol_copa: 20,
                mais_cartoes_selecao: 15, menos_cartoes_selecao: 15, primeiro_zero_a_zero: 15
            };

            // 2. Puxar todos os perfis de usuários participantes
            const { data: perfis } = await supabase.from('perfis').select('id');
            if (!perfis) return;

            for (const perfil of perfis) {
                let totalPontosUsuario = 0;

                // A) PONTUAÇÃO FASE DE GRUPOS
                const { data: palpitesGrupos } = await supabase.from('palpites').select('*').eq('user_id', perfil.id);

                palpitesGrupos?.forEach(p => {
                    const jogoReal = jogosReais?.find(j => j.id === p.jogo_id);
                    if (jogoReal && jogoReal.gols_casa !== null && jogoReal.gols_fora !== null) {
                        const pC = p.palpite_casa;
                        const pF = p.palpite_fora;
                        const rC = jogoReal.gols_casa;
                        const rF = jogoReal.gols_fora;

                        if (pC === rC && pF === rF) {
                            totalPontosUsuario += 15; // Placar Exato
                        } else if ((pC > pF && rC > rF) || (pC < pF && rC < rF) || (pC === pF && rC === rF)) {
                            totalPontosUsuario += 5;  // Apenas Resultado
                        }
                    }
                });

                // B) PONTUAÇÃO MATA-MATA
                const { data: palpitesMM } = await supabase.from('palpites_matamata').select('*').eq('user_id', perfil.id);

                palpitesMM?.forEach(p => {
                    const realVencedor = mapaMMReal.get(p.fase_vaga);
                    if (realVencedor && p.selecao_escolhida.trim().toLowerCase() === realVencedor) {
                        totalPontosUsuario += obterPontosFase(p.fase_vaga);
                    }
                });

                // C) PONTUAÇÃO PALPITES ESPECIAIS
                const { data: palpitesEsp } = await supabase.from('palpites_especiais').select('*').eq('user_id', perfil.id);

                palpitesEsp?.forEach(p => {
                    const realResp = mapaEspReal.get(p.pergunta_id);
                    if (realResp && p.resposta_palpite.trim().toLowerCase() === realResp) {
                        totalPontosUsuario += (pesosEspeciais[p.pergunta_id] || 0);
                    }
                });

                // D) ATUALIZAR TABELA PERFIL COM A NOVA PONTUAÇÃO CONSOLIDADA
                await supabase
                    .from('perfis')
                    .update({ pontos: totalPontosUsuario })
                    .eq('id', perfil.id);
            }

            alert('🚀 Sucesso! Todas as pontuações e ranking foram recalculados instantaneamente.');
        } catch (err) {
            console.error(err);
            alert('Erro crítico durante o processamento.');
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
                    className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-xl transition transform active:scale-95 disabled:opacity-50"
                >
                    {processando ? '🔄 Processando Pontos...' : '🔄 RECUPERAR & RECALCULAR PONTUAÇÕES'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* BLOCO A: INPUT DA FASE DE GRUPOS */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4 max-h-[600px] overflow-y-auto">
                    <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-emerald-400">⚽ Resultados Fase de Grupos</h2>
                    <div className="space-y-3">
                        {jogos.map((j) => (
                            <div key={j.id} className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5 text-xs">
                                <span className="text-gray-500 font-mono">G{j.grupo}</span>
                                <div className="flex items-center gap-2 w-3/4 justify-end">
                                    <span className="truncate font-medium">{j.time_casa}</span>
                                    <input
                                        type="number"
                                        defaultValue={j.gols_casa ?? ''}
                                        onBlur={(e) => salvarPlacarJogo(j.id, e.target.value, String(j.gols_fora ?? ''))}
                                        className="w-10 bg-slate-900 border border-white/10 text-center rounded p-1 font-black"
                                    />
                                    <span className="text-gray-600">x</span>
                                    <input
                                        type="number"
                                        defaultValue={j.gols_fora ?? ''}
                                        onBlur={(e) => salvarPlacarJogo(j.id, String(j.gols_casa ?? ''), e.target.value)}
                                        className="w-10 bg-slate-900 border border-white/10 text-center rounded p-1 font-black"
                                    />
                                    <span className="truncate font-medium w-24 text-left">{j.time_fora}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BLOCO B: INPUT MATA-MATA E ESPECIAIS */}
                <div className="space-y-8">

                    {/* MATA MATA */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
                        <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-blue-400">⚡ Resultados Oficiais Mata-Mata</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-h-[250px] overflow-y-auto pr-1">
                            {Array.from({ length: 32 }, (_, i) => `J${73 + i}`).map(id => (
                                <div key={id} className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                                    <span className="font-bold text-gray-400">{id}:</span>
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

                    {/* ESPECIAIS */}
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
        </div>
    );
}