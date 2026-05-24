'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Jogador {
    id: string;
    nome: string;
    pontos: number;
}

export default function Ranking() {
    const [jogadores, setJogadores] = useState<Jogador[]>([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        async function buscarRanking() {
            try {
                const { data, error } = await supabase
                    .from('perfis')
                    .select('id, nome, pontos')
                    .order('pontos', { ascending: false });

                if (error) throw error;
                setJogadores(data || []);
            } catch (err) {
                console.error('Erro ao buscar ranking:', err);
            } finally {
                setCarregando(false);
            }
        }
        buscarRanking();
    }, []);

    if (carregando) return <div className="p-8 text-center text-gray-400 font-mono">Carregando classificação...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto text-white">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-amber-400 tracking-tight drop-shadow-lg mb-2">🏆 Ranking Oficial</h1>
                
                {/* BARRA DE PREMIAÇÃO */}
                <div className="inline-flex flex-wrap justify-center gap-3 bg-emerald-950/40 border border-emerald-500/20 px-6 py-3 rounded-full text-sm font-bold text-emerald-400 shadow-lg">
                    <span>💰 Prêmios:</span>
                    <span>🥇 1º (65%)</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-300">🥈 2º (20%)</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-orange-400">🥉 3º (10%)</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-blue-400">🏅 4º (5%)</span>
                </div>
            </div>

            <div className="bg-slate-950 rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 bg-black/50 p-4 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-2 text-center">Posição</div>
                    <div className="col-span-8">Participante</div>
                    <div className="col-span-2 text-right pr-4">Pontos</div>
                </div>

                <div className="divide-y divide-white/5">
                    {jogadores.map((jogador, index) => {
                        let corPosicao = "text-gray-500 font-medium";
                        let bgLinha = "hover:bg-white/5";
                        let icone = `${index + 1}º`;
                        let nomeDestaque = "text-gray-300";

                        if (index === 0) {
                            corPosicao = "text-amber-400 font-black text-xl";
                            bgLinha = "bg-gradient-to-r from-amber-500/10 to-transparent";
                            nomeDestaque = "text-white font-black";
                            icone = "🥇";
                        } else if (index === 1) {
                            corPosicao = "text-gray-300 font-black text-xl";
                            bgLinha = "bg-gradient-to-r from-gray-400/10 to-transparent";
                            nomeDestaque = "text-white font-black";
                            icone = "🥈";
                        } else if (index === 2) {
                            corPosicao = "text-orange-400 font-black text-xl";
                            bgLinha = "bg-gradient-to-r from-orange-500/10 to-transparent";
                            nomeDestaque = "text-white font-black";
                            icone = "🥉";
                        } else if (index === 3) {
                            corPosicao = "text-blue-400 font-black text-xl";
                            bgLinha = "bg-gradient-to-r from-blue-500/10 to-transparent";
                            nomeDestaque = "text-white font-bold";
                            icone = "🏅";
                        }

                        return (
                            <div key={jogador.id} className={`grid grid-cols-12 gap-4 p-4 items-center transition ${bgLinha}`}>
                                <div className={`col-span-2 text-center ${corPosicao}`}>
                                    {icone}
                                </div>
                                <div className="col-span-8">
                                    <span className={nomeDestaque}>
                                        {jogador.nome || 'Usuário sem nome'}
                                    </span>
                                </div>
                                <div className="col-span-2 text-right pr-4">
                                    <span className="font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-lg">
                                        {jogador.pontos || 0}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {jogadores.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Nenhum participante encontrado ainda.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}