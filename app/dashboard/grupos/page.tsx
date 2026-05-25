'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMercado } from '@/lib/useMercado'; // <-- Importando o seu novo Hook

interface Jogo {
    id: number;
    grupo: string;
    time_casa: string;
    time_fora: string;
    bandeira_casa: string;
    bandeira_fora: string;
}

export default function PalpitesGrupos() {
    // 1. Trazendo a lógica de bloqueio através do seu Hook
    const { apenasLeitura, carregandoMercado } = useMercado();

    const [jogos, setJogos] = useState<Jogo[]>([]);
    const [palpites, setPalpites] = useState<Record<string, { casa: string; fora: string }>>({});
    const [carregandoDados, setCarregandoDados] = useState(true);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Buscar a lista de jogos cadastrados
                const { data: jogosData } = await supabase
                    .from('jogos')
                    .select('*')
                    .order('id', { ascending: true });
                setJogos(jogosData || []);

                // 2. Buscar os palpites salvos do usuário autenticado
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: userPalpites } = await supabase
                        .from('palpites_jogos')
                        .select('*')
                        .eq('user_id', user.id);

                    const initialPalpites: Record<string, { casa: string; fora: string }> = {};
                    userPalpites?.forEach(p => {
                        initialPalpites[p.jogo_id] = { casa: p.palpite_casa.toString(), fora: p.palpite_fora.toString() };
                    });
                    setPalpites(initialPalpites);
                }
            } catch (err) {
                console.error('Erro ao buscar dados:', err);
            } finally {
                setCarregandoDados(false);
            }
        }
        fetchData();
    }, []);

    const handleInputChange = (jogoId: number, campo: 'casa' | 'fora', valor: string) => {
        if (apenasLeitura) return; // Segurança extra no teclado
        setPalpites(prev => ({
            ...prev,
            [jogoId]: {
                ...prev[jogoId],
                [campo]: valor
            }
        }));
    };

    const salvarPalpites = async () => {
        // 1. Verificação local (UX rápida)
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
            .filter(([_, valores]) => valores.casa !== '' && valores.fora !== '')
            .map(([jogoId, valores]) => ({
                user_id: user.id,
                jogo_id: parseInt(jogoId),
                palpite_casa: parseInt(valores.casa),
                palpite_fora: parseInt(valores.fora),
            }));

        if (inserts.length === 0) {
            alert('Preencha pelo menos um placar antes de salvar.');
            setSalvando(false);
            return;
        }

        // 2. Tenta a operação no Supabase
        const { error } = await supabase
            .from('palpites_jogos')
            .upsert(inserts, { onConflict: 'user_id,jogo_id' });

        setSalvando(false);

        // 3. Tratamento de erro 
        if (error) {
            if (error.code === '42501') {
                alert('Acesso negado: O mercado foi fechado e não é mais possível alterar palpites.');
            } else {
                alert(`Erro ao salvar palpites: ${error.message}`);
            }
        } else {
            alert('Seus palpites foram salvos com sucesso!');
        }
    };

    // Só exibe a tela quando AMBOS terminarem de carregar (mercado e dados)
    if (carregandoDados || carregandoMercado) {
        return (
            <div className="p-8 text-center text-gray-400 font-mono text-sm">
                Carregando tabela de jogos da Copa...
            </div>
        );
    }

    const gruposLetras = Array.from(new Set(jogos.map(j => j.grupo))).sort();

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Cabeçalho da Seção */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Fase de Grupos</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Preencha os placares. Pontuação: <span className="text-emerald-400 font-bold">Placar Exato (15 pts)</span> | <span className="text-blue-400 font-bold">Apenas Resultado (5 pts)</span>
                    </p>
                    <p className="text-sm text-amber-400 font-semibold mt-1">
                        ⏰ Data limite para envio dos palpites: 09 de Junho de 2026. Após essa data as informações serão apenas leitura.
                    </p>
                </div>
                <button
                    onClick={salvarPalpites}
                    disabled={apenasLeitura || salvando}
                    className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-bold shadow-lg transition transform active:scale-95 ${apenasLeitura
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-950/20'
                        }`}
                >
                    {salvando ? 'Salvando palpites...' : apenasLeitura ? '🔒 Mercado Fechado' : '💾 Salvar Meus Palpites'}
                </button>
            </div>

            {/* Lista de Grupos */}
            {gruposLetras.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400">
                    Nenhum jogo cadastrado no banco de dados ainda. O Administrador precisa rodar a carga inicial dos jogos.
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {gruposLetras.map(grupo => (
                        <div key={grupo} className="bg-slate-950 rounded-2xl border border-white/5 p-6 shadow-xl">
                            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 border-b border-white/10 pb-3 mb-5">
                                🏆 GRUPO {grupo}
                            </h2>
                            <div className="space-y-4">
                                {jogos.filter(j => j.grupo === grupo).map(jogo => (
                                    <div key={jogo.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition gap-2">

                                        {/* Time Casa - Ocupa espaço, mas não esmaga o centro */}
                                        <div className="flex items-center space-x-2 w-[35%] min-w-0">
                                            <span className="text-xl sm:text-2xl">{jogo.bandeira_casa}</span>
                                            <span className="text-[11px] sm:text-sm font-semibold text-gray-200 truncate block">
                                                {jogo.time_casa}
                                            </span>
                                        </div>

                                        {/* Quadrantes de Input - O shrink-0 garante que eles nunca diminuam de tamanho */}
                                        <div className="flex items-center space-x-1 justify-center shrink-0">
                                            <input
                                                type="number"
                                                min="0"
                                                disabled={apenasLeitura}
                                                className="w-9 h-9 sm:w-11 sm:h-11 text-center bg-black/40 border border-white/10 rounded-lg sm:rounded-xl font-bold text-white focus:outline-none focus:border-emerald-500 transition disabled:opacity-40 disabled:bg-slate-900"
                                                value={palpites[jogo.id]?.casa || ''}
                                                onChange={(e) => handleInputChange(jogo.id, 'casa', e.target.value)}
                                            />
                                            <span className="text-gray-600 font-bold text-xs">x</span>
                                            <input
                                                type="number"
                                                min="0"
                                                disabled={apenasLeitura}
                                                className="w-9 h-9 sm:w-11 sm:h-11 text-center bg-black/40 border border-white/10 rounded-lg sm:rounded-xl font-bold text-white focus:outline-none focus:border-emerald-500 transition disabled:opacity-40 disabled:bg-slate-900"
                                                value={palpites[jogo.id]?.fora || ''}
                                                onChange={(e) => handleInputChange(jogo.id, 'fora', e.target.value)}
                                            />
                                        </div>

                                        {/* Time Fora */}
                                        <div className="flex items-center space-x-2 w-[35%] justify-end text-right min-w-0">
                                            <span className="text-[11px] sm:text-sm font-semibold text-gray-200 truncate block">
                                                {jogo.time_fora}
                                            </span>
                                            <span className="text-xl sm:text-2xl">{jogo.bandeira_fora}</span>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}