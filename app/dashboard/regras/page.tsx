'use client';
import React from 'react';

export default function Regras() {
    return (
        <div className="p-6 max-w-4xl mx-auto text-white space-y-10">
            {/* Cabeçalho */}
            <div className="text-center border-b border-white/10 pb-8">
                <h1 className="text-4xl font-black text-emerald-400 tracking-tight drop-shadow-lg mb-2">
                    📖 Regras do Bolão
                </h1>
                <p className="text-gray-400">
                    Entenda como funciona a distribuição de prêmios e a pontuação oficial do sistema.
                </p>
            </div>

            {/* SEÇÃO 1: PREMIAÇÃO */}
            <section className="bg-slate-950 p-8 rounded-3xl border border-emerald-500/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl">💰</div>
                <h2 className="text-2xl font-black text-amber-400 mb-6 flex items-center gap-3">
                    💰 Distribuição dos Prêmios
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-b from-amber-500/20 to-black/40 border border-amber-500/30 p-4 rounded-xl text-center">
                        <div className="text-3xl mb-2">🥇</div>
                        <div className="font-black text-lg text-white">1º Colocado</div>
                        <div className="text-amber-400 font-bold text-2xl mt-1">65%</div>
                    </div>
                    <div className="bg-gradient-to-b from-gray-400/20 to-black/40 border border-gray-400/30 p-4 rounded-xl text-center">
                        <div className="text-3xl mb-2">🥈</div>
                        <div className="font-black text-lg text-white">2º Colocado</div>
                        <div className="text-gray-300 font-bold text-2xl mt-1">20%</div>
                    </div>
                    <div className="bg-gradient-to-b from-orange-500/20 to-black/40 border border-orange-500/30 p-4 rounded-xl text-center">
                        <div className="text-3xl mb-2">🥉</div>
                        <div className="font-black text-lg text-white">3º Colocado</div>
                        <div className="text-orange-400 font-bold text-2xl mt-1">10%</div>
                    </div>
                    <div className="bg-gradient-to-b from-blue-500/20 to-black/40 border border-blue-500/30 p-4 rounded-xl text-center">
                        <div className="text-3xl mb-2">🏅</div>
                        <div className="font-black text-lg text-white">4º Colocado</div>
                        <div className="text-blue-400 font-bold text-2xl mt-1">5%</div>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 2: REGRAS MATA-MATA (Copiado exatamente como você pediu) */}
            <section className="bg-slate-900/80 p-8 rounded-3xl border border-white/10 shadow-xl">
                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                    ⚡ CHAVEAMENTO DO MATA-MATA (QUEM PASSA)
                </h2>
                <ul className="space-y-6">
                    <li className="flex flex-col sm:flex-row gap-3 sm:items-center bg-black/40 p-4 rounded-xl border border-white/5">
                        <span className="font-black text-emerald-400 text-lg min-w-[220px]">
                            1️⃣6️⃣ DEZESSEIS-AVOS:
                        </span>
                        <span className="text-gray-300">
                            (As 32 seleções qualificadas dos grupos) — <strong className="text-emerald-400">5 pontos</strong> por acerto
                        </span>
                    </li>
                    <li className="flex flex-col sm:flex-row gap-3 sm:items-center bg-black/40 p-4 rounded-xl border border-white/5">
                        <span className="font-black text-blue-400 text-lg min-w-[220px]">
                            8️⃣ OITAVAS DE FINAL:
                        </span>
                        <span className="text-gray-300">
                            (As 16 seleções que avançam) — <strong className="text-blue-400">10 pontos</strong> por acerto
                        </span>
                    </li>
                    <li className="flex flex-col sm:flex-row gap-3 sm:items-center bg-black/40 p-4 rounded-xl border border-white/5">
                        <span className="font-black text-purple-400 text-lg min-w-[220px]">
                            4️⃣ QUARTAS DE FINAL:
                        </span>
                        <span className="text-gray-300">
                            (As 8 seleções que avançam) — <strong className="text-purple-400">20 pontos</strong> por acerto
                        </span>
                    </li>
                    <li className="flex flex-col sm:flex-row gap-3 sm:items-center bg-black/40 p-4 rounded-xl border border-white/5">
                        <span className="font-black text-pink-400 text-lg min-w-[220px]">
                            2️⃣ SEMIFINAIS:
                        </span>
                        <span className="text-gray-300">
                            (As 4 seleções que avançam) — <strong className="text-pink-400">25 pontos</strong> por acerto
                        </span>
                    </li>
                    <li className="flex flex-col sm:flex-row gap-3 sm:items-center bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                        <span className="font-black text-amber-400 text-lg min-w-[220px]">
                            🏆 GRANDE FINAL:
                        </span>
                        <span className="text-gray-300">
                            (Os 2 finalistas e o Campeão) — <strong className="text-amber-400">30 pontos</strong> por acerto
                        </span>
                    </li>
                </ul>
            </section>

            {/* SEÇÃO 3: FASE DE GRUPOS (Lembrete rápido para manter a página completa) */}
            <section className="bg-slate-900/80 p-8 rounded-3xl border border-white/10 shadow-xl">
                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                    ⚽ FASE DE GRUPOS
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                        <h3 className="font-black text-emerald-400 mb-1">Placar Exato</h3>
                        <p className="text-gray-400 text-sm">Acertou o número de gols dos dois times.</p>
                        <div className="mt-3 font-bold text-white text-lg">+15 Pontos</div>
                    </div>
                    <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                        <h3 className="font-black text-blue-400 mb-1">Apenas Resultado</h3>
                        <p className="text-gray-400 text-sm">Acertou quem ganhou ou o empate, mas errou o placar.</p>
                        <div className="mt-3 font-bold text-white text-lg">+5 Pontos</div>
                    </div>
                </div>
            </section>
        </div>
    );
}