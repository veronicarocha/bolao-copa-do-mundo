'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Jogo {
  id: string;
  time_casa: string;
  time_fora: string;
  gols_casa: number | null;
  gols_fora: number | null;
  data_jogo: string;
}

interface Palpite {
  id: string;
  jogo_id: string;
  gols_casa_palpite: number;
  gols_fora_palpite: number;
  pontos_ganhos: number; // Coluna onde o seu motor guarda os pontos que essa aposta rendeu
  jogos: Jogo; // Join com a tabela de jogos
}

interface Perfil {
  nome: string;
  pontos: number;
}

export default function VisualizarPalpites() {
  const { id } = useParams(); // Pega o ID do participante da URL
  const router = useRouter();
  
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [palpites, setPalpites] = useState<Palpite[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function carregarDadosDoParticipante() {
      try {
        // 1. Busca os dados de resumo do perfil do participante
        const { data: dadosPerfil, error: erroPerfil } = await supabase
          .from('perfis')
          .select('nome, pontos')
          .eq('id', id)
          .single();

        if (erroPerfil) throw erroPerfil;
        setPerfil(dadosPerfil);

        // 2. Busca os palpites dele trazendo os dados do Jogo junto (Inner Join)
        const { data: dadosPalpites, error: erroPalpites } = await supabase
          .from('palpites')
          .select(`
            id,
            jogo_id,
            gols_casa_palpite,
            gols_fora_palpite,
            pontos_ganhos,
            jogos (
              id,
              time_casa,
              time_fora,
              gols_casa,
              gols_fora,
              data_jogo
            )
          `)
          .eq('user_id', id); // Garante que só traz os palpites DELE

        if (erroPalpites) throw erroPalpites;
        
        // Faz o cast correto do retorno por conta do relacionamento do Supabase
        setPalpites((dadosPalpites as any) || []);

      } catch (err) {
        console.error("Erro ao espiar palpites:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDadosDoParticipante();
  }, [id]);

  if (carregando) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center">
        <div className="text-gray-400 font-mono animate-pulse">Carregando palpites auditados...</div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <p className="text-red-400 font-mono">Participante não encontrado.</p>
        <Link href="/ranking" className="text-sm text-blue-400 underline">Voltar para o Ranking</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 p-4 md:p-12 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Voltar e Cabeçalho */}
        <div className="space-y-4">
          <button 
            onClick={() => router.back()} 
            className="text-xs font-bold text-gray-400 hover:text-white transition flex items-center gap-1"
          >
            ← Voltar para Classificação
          </button>
          
          <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">Modo Leitura 👁️</span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Palpites de <span className="text-amber-400">{perfil.nome || 'Usuário Sem Nome'}</span>
              </h1>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-2 rounded-xl text-right">
              <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Pontuação Total</p>
              <p className="text-2xl font-black text-emerald-400 font-mono">{perfil.pontos || 0} pts</p>
            </div>
          </div>
        </div>

        {/* Listagem dos Palpites em Modo Leitura */}
        <div className="space-y-3">
          {palpites.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-xl border border-white/5 text-gray-500 text-sm">
              Este participante ainda não salvou nenhum palpite para este campeonato.
            </div>
          ) : (
            palpites.map((item) => {
              const jogo = item.jogos;
              const jogoTevePlacarReal = jogo.gols_casa !== null && jogo.gols_fora !== null;

              return (
                <div 
                  key={item.id} 
                  className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-white/10 transition"
                >
                  {/* Confronto */}
                  <div className="flex items-center gap-3 w-full md:w-2/5 justify-center md:justify-start">
                    <span className="text-sm font-bold text-gray-200">{jogo.time_casa}</span>
                    <span className="text-xs text-gray-500 font-bold px-1.5 py-0.5 bg-white/5 rounded">VS</span>
                    <span className="text-sm font-bold text-gray-200">{jogo.time_fora}</span>
                  </div>

                  {/* Placar Apostado (O Palpite do Usuário) */}
                  <div className="flex flex-col items-center bg-blue-500/5 border border-blue-500/10 px-4 py-2 rounded-lg min-w-[140px]">
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-1">Palpite Enviado</span>
                    <div className="text-lg font-black font-mono text-blue-200">
                      {item.gols_casa_palpite} x {item.gols_fora_palpite}
                    </div>
                  </div>

                  {/* Placar Oficial do Jogo */}
                  <div className="flex flex-col items-center bg-slate-900 border border-white/5 px-4 py-2 rounded-lg min-w-[140px]">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Resultado Real</span>
                    <div className="text-sm font-bold font-mono text-gray-400">
                      {jogoTevePlacarReal ? `${jogo.gols_casa} x ${jogo.gols_fora}` : '— x —'}
                    </div>
                  </div>

                  {/* Pontos que este palpite rendeu */}
                  <div className="flex flex-col items-center md:items-end min-w-[90px]">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Rendeu</span>
                    <div className={`text-base font-black font-mono ${item.pontos_ganhos > 0 ? 'text-emerald-400' : 'text-gray-600'}`}>
                      +{item.pontos_ganhos || 0} <span className="text-xs font-normal">pts</span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}