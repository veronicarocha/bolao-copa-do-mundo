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

  // Função para lidar com o clique dos curiosos
  const lidarComCuriosidade = () => {
    alert('Ainda não curioso(a)...  mas verá em breve : )');
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
    <div className="min-h-screen w-full bg-slate-900 p-6 md:p-12 text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Ranking & Participantes</h1>
            <p className="text-sm text-gray-400 mt-2">
              A bola ainda não rolou! Confira quem já garantiu a vaga no bolão.
            </p>
          </div>
          <div className="bg-black/30 border border-white/5 px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total de Inscritos</p>
            <p className="text-2xl font-black text-emerald-400">{perfis.length}</p>
          </div>
        </div>

        {/* Tabela de Participantes */}
        <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-white/5 text-xs uppercase tracking-wider text-gray-400 border-b border-white/10">
                  <th className="p-4 font-semibold w-24 text-center">Posição</th>
                  <th className="p-4 font-semibold">Participante</th>
                  <th className="p-4 font-semibold text-center w-32">Pontos</th>
                  <th className="p-4 font-semibold text-center w-40">Palpites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {perfis.map((p, index) => (
                  <tr key={p.id} className="hover:bg-white/5 transition group">
                    
                    {/* Posição */}
                    <td className="p-4 font-mono text-gray-500 text-center">
                      {index + 1}º
                    </td>
                    
                    {/* Nome do Participante */}
                    <td className="p-4 font-bold text-gray-200">
                      {p.nome || 'Participante sem nome'}
                    </td>
                    
                    {/* Pontos */}
                    <td className="p-4 text-center font-black text-emerald-500/40">
                      0 <span className="text-[10px] text-emerald-600/50 uppercase">pts</span>
                    </td>
                    
                    {/* Ação: Botão com Alerta */}
                    <td className="p-4 text-center">
                      <button
                        onClick={lidarComCuriosidade}
                        className="inline-block text-[11px] font-bold text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-2 rounded-lg hover:bg-blue-500/10 transition active:scale-95 cursor-pointer outline-none"
                      >
                        🔍 Ver Palpites
                      </button>
                    </td>

                  </tr>
                ))}

                {/* Empty State */}
                {perfis.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-500 font-mono text-sm">
                      Nenhum participante encontrado na base de dados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}