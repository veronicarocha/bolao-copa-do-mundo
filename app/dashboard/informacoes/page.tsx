'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface TimeGrupo {
  time: string;
  grupo: string;
  p: number;  // Pontos
  j: number;  // Jogos
  v: number;  // Vitórias
  e: number;  // Empates
  d: number;  // Derrotas
  sg: number; // Saldo de Gols
}

// GABARITO OFICIAL DO SORTEIO DA FIFA (48 Seleções divididas de A até L)
const COMPOSICAO_GRUPOS_FIFA: Record<string, string[]> = {
  A: ['México', 'África do Sul', 'Coreia do Sul', 'República Tcheca'],
  B: ['Canadá', 'Bósnia', 'Catar', 'Suíça'],
  C: ['Brasil', 'Marrocos', 'Haiti', 'Escócia'],
  D: ['EUA', 'Paraguai', 'Austrália', 'Turquia'],
  E: ['Alemanha', 'Curaçao', 'Costa do Marfim', 'Equador'],
  F: ['Holanda', 'Japão', 'Suécia', 'Tunísia'],
  G: ['Bélgica', 'Egito', 'Irã', 'Nova Zelândia'],
  H: ['Espanha', 'Cabo Verde', 'Arábia Saudita', 'Uruguai'],
  I: ['França', 'Senegal', 'Iraque', 'Noruega'],
  J: ['Argentina', 'Argélia', 'Áustria', 'Jordânia'],
  K: ['Portugal', 'RD do Congo', 'Uzbequistão', 'Colômbia'],
  L: ['Inglaterra', 'Croácia', 'Gana', 'Panamá']
};

export default function InformacoesCopa() {
  const [tabelas, setTabelas] = useState<Record<string, TimeGrupo[]>>({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function calcularTabela() {
      try {
        // 1. Inicializa o mapa com a estrutura estática oficial da FIFA (Garante que nenhum grupo fique vazio)
        const mapa: Record<string, Record<string, TimeGrupo>> = {};
        
        Object.entries(COMPOSICAO_GRUPOS_FIFA).forEach(([grupo, times]) => {
          mapa[grupo] = {};
          times.forEach(time => {
            mapa[grupo][time] = { time, grupo, p: 0, j: 0, v: 0, e: 0, d: 0, sg: 0 };
          });
        });

        // 2. Puxa as partidas do banco de dados para computar os placares reais
        const { data: jogos } = await supabase.from('jogos').select('*');
        
        jogos?.forEach((j: any) => {
          // Validação defensiva: Se o grupo ou time não bater com o gabarito oficial (por digitação), ignora ou cria dinamicamente
          if (!mapa[j.grupo]) mapa[j.grupo] = {};
          if (!mapa[j.grupo][j.time_casa]) {
            mapa[j.grupo][j.time_casa] = { time: j.time_casa, grupo: j.grupo, p:0, j:0, v:0, e:0, d:0, sg:0 };
          }
          if (!mapa[j.grupo][j.time_fora]) {
            mapa[j.grupo][j.time_fora] = { time: j.time_fora, grupo: j.grupo, p:0, j:0, v:0, e:0, d:0, sg:0 };
          }

          // Captura placar (Admin pode usar gols_casa/fora ou palpite_casa/fora dependendo do nome da coluna)
          const gc = j.gols_casa !== undefined ? j.gols_casa : j.palpite_casa;
          const gf = j.gols_fora !== undefined ? j.gols_fora : j.palpite_fora;

          if (gc !== null && gf !== null && gc !== undefined && gf !== undefined) {
            const tc = mapa[j.grupo][j.time_casa];
            const tf = mapa[j.grupo][j.time_fora];
            
            const golsC = parseInt(gc);
            const golsF = parseInt(gf);

            tc.j += 1;
            tf.j += 1;
            tc.sg += (golsC - golsF);
            tf.sg += (golsF - golsC);

            if (golsC > golsF) {
              tc.p += 3; tc.v += 1; tf.d += 1;
            } else if (golsC < golsF) {
              tf.p += 3; tf.v += 1; tc.d += 1;
            } else {
              tc.p += 1; tf.p += 1; tc.e += 1; tf.e += 1;
            }
          }
        });

        // 3. Ordena os 12 grupos usando critérios oficiais da FIFA (Pontos -> Vitórias -> Saldo de Gols)
        const tabelasOrdenadas: Record<string, TimeGrupo[]> = {};
        Object.keys(mapa).forEach(g => {
          tabelasOrdenadas[g] = Object.values(mapa[g]).sort((a, b) => b.p - a.p || b.v - a.v || b.sg - a.sg);
        });

        setTabelas(tabelasOrdenadas);
      } catch (err) {
        console.error('Erro ao computar tabelas:', err);
      } finally {
        setCarregando(false);
      }
    }
    calcularTabela();
  }, []);

  if (carregando) {
    return <div className="p-8 text-center text-gray-400 font-mono text-sm">Sincronizando grupos oficiais da FIFA...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <h1 className="text-3xl font-black mb-2">📊 Classificação dos Grupos</h1>
      <p className="text-sm text-gray-400 mb-8">Informações oficiais baseadas na distribuição oficial da FIFA da Copa do Mundo 2026.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(tabelas).sort().map(grupo => (
          <div key={grupo} className="bg-slate-950 p-5 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
            <h3 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 border-b border-white/10 pb-2 mb-3">
              GRUPO {grupo}
            </h3>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-gray-500 border-b border-white/5 font-bold uppercase tracking-wider">
                  <th className="pb-2 w-[45%]">Seleção</th>
                  <th className="pb-2 text-center w-[11%]">P</th>
                  <th className="pb-2 text-center w-[11%]">J</th>
                  <th className="pb-2 text-center w-[11%]">V</th>
                  <th className="pb-2 text-center w-[11%]">SG</th>
                </tr>
              </thead>
              <tbody>
                {tabelas[grupo].map((t, idx) => (
                  <tr key={t.time} className="border-b border-white/[0.02] last:border-0 hover:bg-white/[0.01]">
                    <td className="py-2.5 font-semibold text-gray-200 truncate">
                      <span className="text-gray-600 mr-1.5 text-[10px]">{idx + 1}º</span>
                      {t.time}
                    </td>
                    <td className="text-center font-black text-emerald-400 bg-emerald-500/5">{t.p}</td>
                    <td className="text-center text-gray-400">{t.j}</td>
                    <td className="text-center text-gray-400">{t.v}</td>
                    <td className={`text-center font-medium ${t.sg > 0 ? 'text-blue-400' : t.sg < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      {t.sg > 0 ? `+${t.sg}` : t.sg}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}