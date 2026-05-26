'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; 

interface Perfil {
  id: string;
  nome: string;
}

export default function PaginaParticipantes() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    async function buscarParticipantes() {
      try {
        const { data, error } = await supabase
          .from('perfis')
          .select('id, nome')
          .order('nome', { ascending: true });

        if (error) throw error;
        
        setPerfis(data || []);
      } catch (err) {
        console.error("Erro ao carregar participantes:", err);
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }

    buscarParticipantes();
  }, []);

  const lidarComCuriosidade = () => {
    alert('Ainda não curioso(a)... mas verá em breve : )');
  };

  if (carregando) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center">
        <div className="p-8 text-center text-gray-400 font-mono animate-pulse">
          Buscando lista de participantes...
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center text-red-400 font-mono">
        Erro ao carregar a lista de participantes.
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 p-4 md:p-12 text-white">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        
        {/* Cabeçalho */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Ranking & Participantes</h1>
            <p className="text-xs md:text-sm text-gray-400 mt-2">
              A bola ainda não rolou! Confira quem já garantiu a vaga no bolão.
            </p>
          </div>
          <div className="bg-black/30 border border-white/5 px-4 py-2 rounded-xl text-center w-full md:w-auto">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total de Inscritos</p>
            <p className="text-2xl font-black text-emerald-400">{perfis.length}</p>
          </div>
        </div>

        {/* Lista de Participantes Responsiva (Sem Table) */}
        <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          
          {/* Cabeçalho da Lista (Oculto no mobile extremo, visível a partir do md) */}
          <div className="hidden md:flex items-center justify-between bg-white/5 border-b border-white/10 p-4 text-xs uppercase tracking-wider text-gray-400 font-semibold">
            <div className="flex gap-4 w-1/2">
              <span className="w-12 text-center">Pos</span>
              <span>Participante</span>
            </div>
            <div className="flex items-center justify-end gap-12 w-1/2 pr-4">
              <span className="w-16 text-center">Pontos</span>
              <span className="w-24 text-center">Ação</span>
            </div>
          </div>

          {/* Corpo da Lista */}
          <div className="divide-y divide-white/5">
            {perfis.map((p, index) => (
              <div key={p.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition group gap-3">
                
                {/* Esquerda: Posição e Nome */}
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  <span className="font-mono text-gray-500 text-sm md:text-base w-6 md:w-12 text-center shrink-0">
                    {index + 1}º
                  </span>
                  <span className="font-bold text-gray-200 text-sm md:text-base truncate">
                    {p.nome || 'Participante sem nome'}
                  </span>
                </div>

                {/* Direita: Pontos e Botão (Sempre visíveis graças ao shrink-0) */}
                <div className="flex items-center gap-4 md:gap-12 shrink-0">
                  <div className="text-center font-black text-emerald-500/40 text-sm md:text-base w-12 md:w-16">
                    0 <span className="text-[9px] md:text-[10px] text-emerald-600/50 uppercase">pts</span>
                  </div>
                  
                  <button
                    onClick={lidarComCuriosidade}
                    className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-[11px] font-bold text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-2 rounded-lg hover:bg-blue-500/10 transition active:scale-95 outline-none whitespace-nowrap"
                  >
                    🔍 <span className="hidden sm:inline">Ver Palpites</span>
                    <span className="inline sm:hidden">Espiar</span>
                  </button>
                </div>

              </div>
            ))}

            {/* Empty State */}
            {perfis.length === 0 && (
              <div className="p-12 text-center text-gray-500 font-mono text-sm">
                Nenhum participante encontrado na base de dados.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}