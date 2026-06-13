'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Jogo {
  id: number;
  time_casa: string;
  time_fora: string;
  gols_casa: number | null;
  gols_fora: number | null;
  grupo: string;
  data_formatada?: string; // Injetado dinamicamente
}

interface PalpiteParticipante {
  id_perfil: string;
  nome_participante: string;
  palpite_casa: string | number | null;
  palpite_fora: string | number | null;
  pontos_ganhos: number | null;
}

// 🗓️ Calendário Oficial Normalizado da sua Aplicação
const CALENDARIO_OFICIAL_COMPLETO = [
  { confronto: 'mexico x africa do sul', data: '11/06', rodada: '1ª Rodada' },
  { confronto: 'coreia do sul x republica tcheca', data: '11/06', rodada: '1ª Rodada' },
  { confronto: 'canada x bosnia', data: '12/06', rodada: '1ª Rodada' },
  { confronto: 'eua x paraguai', data: '12/06', rodada: '1ª Rodada' },
  { confronto: 'catar x suica', data: '13/06', rodada: '1ª Rodada' },
  { confronto: 'brasil x marrocos', data: '13/06', rodada: '1ª Rodada' },
  { confronto: 'haiti x escocia', data: '13/06', rodada: '1ª Rodada' },
  { confronto: 'australia x turquia', data: '13/06', rodada: '1ª Rodada' },
  { confronto: 'alemanha x curacao', data: '14/06', rodada: '1ª Rodada' },
  { confronto: 'costa do marfim x equador', data: '14/06', rodada: '1ª Rodada' },
  { confronto: 'holanda x japao', data: '14/06', rodada: '1ª Rodada' },
  { confronto: 'suecia x tunisia', data: '14/06', rodada: '1ª Rodada' },
  { confronto: 'espanha x cabo verde', data: '15/06', rodada: '1ª Rodada' },
  { confronto: 'arabia saudita x uruguai', data: '15/06', rodada: '1ª Rodada' },
  { confronto: 'belgica x egito', data: '15/06', rodada: '1ª Rodada' },
  { confronto: 'ira x nova zelandia', data: '15/06', rodada: '1ª Rodada' },
  { confronto: 'austria x jordania', data: '16/06', rodada: '1ª Rodada' },
  { confronto: 'franca x senegal', data: '16/06', rodada: '1ª Rodada' },
  { confronto: 'iraque x noruega', data: '16/06', rodada: '1ª Rodada' },
  { confronto: 'argentina x argelia', data: '16/06', rodada: '1ª Rodada' },
  { confronto: 'portugal x rd do congo', data: '17/06', rodada: '1ª Rodada' },
  { confronto: 'inglaterra x croacia', data: '17/06', rodada: '1ª Rodada' },
  { confronto: 'gana x panama', data: '17/06', rodada: '1ª Rodada' },
  { confronto: 'uzbequistao x colombia', data: '17/06', rodada: '1ª Rodada' },
  { confronto: 'republica tcheca x africa do sul', data: '18/06', rodada: '2ª Rodada' },
  { confronto: 'suica x bosnia', data: '18/06', rodada: '2ª Rodada' },
  { confronto: 'canada x catar', data: '18/06', rodada: '2ª Rodada' },
  { confronto: 'mexico x coreia do sul', data: '18/06', rodada: '2ª Rodada' },
  { confronto: 'turquia x paraguai', data: '19/06', rodada: '2ª Rodada' },
  { confronto: 'eua x australia', data: '19/06', rodada: '2ª Rodada' },
  { confronto: 'escocia x marrocos', data: '19/06', rodada: '2ª Rodada' },
  { confronto: 'brasil x haiti', data: '19/06', rodada: '2ª Rodada' },
  { confronto: 'tunisia x japao', data: '20/06', rodada: '2ª Rodada' },
  { confronto: 'holanda x suecia', data: '20/06', rodada: '2ª Rodada' },
  { confronto: 'alemanha x costa do marfim', data: '20/06', rodada: '2ª Rodada' },
  { confronto: 'equador x curacao', data: '20/06', rounded: '2ª Rodada' },
  { confronto: 'espanha x arabia saudita', data: '21/06', rodada: '2ª Rodada' },
  { confronto: 'belgica x ira', data: '21/06', rodada: '2ª Rodada' },
  { confronto: 'uruguai x cabo verde', data: '21/06', rodada: '2ª Rodada' },
  { confronto: 'nova zelandia x egito', data: '21/06', rodada: '2ª Rodada' },
  { confronto: 'argentina x austria', data: '22/06', rodada: '2ª Rodada' },
  { confronto: 'franca x iraque', data: '22/06', rodada: '2ª Rodada' },
  { confronto: 'noruega x senegal', data: '22/06', rodada: '2ª Rodada' },
  { confronto: 'jordania x argelia', data: '22/06', rodada: '2ª Rodada' },
  { confronto: 'portugal x uzbequistao', data: '23/06', rodada: '2ª Rodada' },
  { confronto: 'inglaterra x gana', data: '23/06', rodada: '2ª Rodada' },
  { confronto: 'panama x croacia', data: '23/06', rodada: '2ª Rodada' },
  { antiquado: 'colombia x rd do congo', confronto: 'colombia x rd do congo', data: '23/06', rodada: '2ª Rodada' },
  { confronto: 'suica x canada', data: '24/06', rodada: '3ª Rodada' },
  { confronto: 'bosnia x catar', data: '24/06', rodada: '3ª Rodada' },
  { confronto: 'escocia x brasil', data: '24/06', rodada: '3ª Rodada' },
  { confronto: 'marrocos x haiti', data: '24/06', rodada: '3ª Rodada' },
  { confronto: 'republica tcheca x mexico', data: '24/06', rodada: '3ª Rodada' },
  { confronto: 'africa do sul x coreia do sul', data: '24/06', rodada: '3ª Rodada' },
  { confronto: 'equador x alemanha', data: '25/06', rodada: '3ª Rodada' },
  { confronto: 'curacao x costa do marfim', data: '25/06', rodada: '3ª Rodada' },
  { confronto: 'japao x suecia', data: '25/06', rodada: '3ª Rodada' },
  { confronto: 'tunisia x holanda', data: '25/06', rodada: '3ª Rodada' },
  { confronto: 'turquia x eua', data: '25/06', rodada: '3ª Rodada' },
  { confronto: 'paraguai x australia', data: '25/06', rodada: '3ª Rodada' },
  { confronto: 'noruega x franca', data: '26/06', rodada: '3ª Rodada' },
  { confronto: 'senegal x iraque', data: '26/06', rodada: '3ª Rodada' },
  { confronto: 'cabo verde x arabia saudita', data: '26/06', rodada: '3ª Rodada' },
  { confronto: 'uruguai x espanha', data: '26/06', rodada: '3ª Rodada' },
  { confronto: 'egito x ira', data: '26/06', rodada: '3ª Rodada' },
  { confronto: 'nova zelandia x belgica', data: '26/06', rodada: '3ª Rodada' },
  { confronto: 'panama x inglaterra', data: '27/06', rodada: '3ª Rodada' },
  { confronto: 'croacia x gana', data: '27/06', rodada: '3ª Rodada' },
  { confronto: 'colombia x portugal', data: '27/06', rodada: '3ª Rodada' },
  { confronto: 'rd do congo x uzbequistao', data: '27/06', rodada: '3ª Rodada' },
  { confronto: 'argelia x austria', data: '27/06', rodada: '3ª Rodada' },
  { confronto: 'jordania x argentina', data: '27/06', rodada: '3ª Rodada' }
];

function removerAcentos(str: string): string {
  if (!str) return '';
  let texto = str.toLowerCase();
  const de = "áàâãäéèêëíìîïóòôõöúùûüçñ";
  const para = "aaaaaeeeeiiiiooooouuuucn";
  for (let i = 0; i < de.length; i++) {
    texto = texto.split(de[i]).join(para[i]);
  }
  texto = texto.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
  if (texto === 'ri do ira') return 'ira';
  if (texto === 'tchequia') return 'republica tcheca';
  if (texto === 'curacao' || texto === 'curacau') return 'curacao';
  return texto;
}

export default function TelaEspiarPalpites() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [jogoSelecionadoId, setJogoSelecionadoId] = useState<number | string>('');
  const [palpitesExibidos, setPalpitesExibidos] = useState<PalpiteParticipante[]>([]);
  const [carregandoJogos, setCarregandoJogos] = useState(true);
  const [carregandoPalpites, setCarregandoPalpites] = useState(false);

  useEffect(() => {
    async function obterEOrdenarJogos() {
      try {
        setCarregandoJogos(true);
        const { data, error } = await supabase.from('jogos').select('*');
        if (error) throw error;

        const listaBase = data || [];

        // Injeta a data mapeada do calendário e indexa para ordenação cronológica estruturada
        const listaMapeada = listaBase.map((jogo: any) => {
          const casaLimpa = removerAcentos(jogo.time_casa || '');
          const foraLimpa = removerAcentos(jogo.time_fora || '');

          const infoCronograma = CALENDARIO_OFICIAL_COMPLETO.find(x => 
            x.confronto === `${casaLimpa} x ${foraLimpa}` || 
            x.confronto === `${foraLimpa} x ${casaLimpa}`
          );

          return {
            ...jogo,
            data_formatada: infoCronograma ? infoCronograma.data : 'Fase de Grupos',
            posicao_cronologica: infoCronograma ? CALENDARIO_OFICIAL_COMPLETO.indexOf(infoCronograma) : 999
          };
        });

        // Ordenação fiel ao andamento do campeonato mundial
        listaMapeada.sort((a, b) => a.posicao_cronologica - b.posicao_cronologica);
        setJogos(listaMapeada);

        if (listaMapeada.length > 0) {
          // 🧠 CAPTURA INTELIGENTE DO DIA ATUAL
          const hoje = new Date();
          const dia = String(hoje.getDate()).padStart(2, '0');
          const mes = String(hoje.getMonth() + 1).padStart(2, '0');
          const dataHojeFormatada = `${dia}/${mes}`; // Ex: "13/06"

          // Procura o primeiro confronto da lista ordenada que aconteça na data de hoje
          const jogoDeHoje = listaMapeada.find(j => j.data_formatada === dataHojeFormatada);

          if (jogoDeHoje) {
            setJogoSelecionadoId(jogoDeHoje.id);
          } else {
            // Fallback padrão se não houver jogos hoje
            setJogoSelecionadoId(listaMapeada[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao mapear cronograma analítico:', err);
      } finally {
        setCarregandoJogos(false);
      }
    }
    obterEOrdenarJogos();
  }, []);

  useEffect(() => {
    if (!jogoSelecionadoId) return;

    async function buscarPalpitesDoJogo() {
      try {
        setCarregandoPalpites(true);

        const [resPerfis, resPalpites] = await Promise.all([
          supabase.from('perfis').select('id, nome').order('nome', { ascending: true }),
          supabase.from('palpites_jogos').select('*').eq('jogo_id', jogoSelecionadoId)
        ]);

        if (resPerfis.error) throw resPerfis.error;
        if (resPalpites.error) throw resPalpites.error;

        const listaPerfis = resPerfis.data || [];
        const listaPalpites = resPalpites.data || [];

        const matrizPalpites: PalpiteParticipante[] = listaPerfis.map(perfil => {
          const palpiteUsuario = listaPalpites.find(p => p.user_id === perfil.id);
          return {
            id_perfil: perfil.id,
            nome_participante: perfil.nome || 'Sem Nome',
            palpite_casa: palpiteUsuario ? palpiteUsuario.palpite_casa : '-',
            palpite_fora: palpiteUsuario ? palpiteUsuario.palpite_fora : '-',
            pontos_ganhos: palpiteUsuario ? palpiteUsuario.pontos_ganhos : null
          };
        });

        setPalpitesExibidos(matrizPalpites);
      } catch (err) {
        console.error('Erro ao cruzar dados:', err);
      } finally {
        setCarregandoPalpites(false);
      }
    }

    buscarPalpitesDoJogo();
  }, [jogoSelecionadoId]);

  if (carregandoJogos) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-gray-400 font-mono">Carregando calendário unificado...</div>;
  }

  const jogoAtual = jogos.find(j => j.id === Number(jogoSelecionadoId));

  return (
    <div className="min-h-screen w-full bg-slate-900 p-4 md:p-12 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="border-b border-white/10 pb-6 space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-amber-400">🕵️‍♂️ Mural de Palpites por Jogo</h1>
            <p className="text-xs md:text-sm text-gray-400 font-medium">Espie os palpites e ligue o secador</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Selecione o Confronto:</label>
            <select
              value={jogoSelecionadoId}
              onChange={(e) => setJogoSelecionadoId(e.target.value)}
              className="w-full bg-slate-950 border border-white/20 py-2 px-3 rounded-xl text-white font-bold outline-none focus:border-amber-500 shadow-xl font-mono text-xs"
            >
              {jogos.map((j) => (
                <option key={j.id} value={j.id}>
                  [{j.data_formatada}] — Grupo {j.grupo}: {j.time_casa} x {j.time_fora}
                </option>
              ))}
            </select>
          </div>
        </div>

        {jogoAtual && (
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-lg gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
              📅 {jogoAtual.data_formatada} — Placar Oficial Grupo {jogoAtual.grupo}
            </span>
            <div className="flex items-center gap-6 text-xl font-black mt-1">
              <span>{jogoAtual.time_casa}</span>
              <span className="text-2xl text-amber-400 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                {jogoAtual.gols_casa ?? '-'} x {jogoAtual.gols_fora ?? '-'}
              </span>
              <span>{jogoAtual.time_fora}</span>
            </div>
          </div>
        )}

        <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-900 z-10 shadow-lg border-b border-white/10">
                <tr className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                  <th className="p-4 pl-6">Participante (A-Z)</th>
                  <th className="p-4 text-center w-40">Palpite Inserido</th>
                  <th className="p-4 text-center w-32">Pontos Obtidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {carregandoPalpites ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500 font-mono text-xs">
                      Buscando registros na base...
                    </td>
                  </tr>
                ) : (
                  palpitesExibidos.map((p) => (
                    <tr key={p.id_perfil} className="hover:bg-white/5 transition text-sm">
                      <td className="p-4 pl-6 font-bold text-gray-200">{p.nome_participante}</td>
                      <td className="p-4 text-center font-black text-base text-amber-400">
                        <span className="bg-black/30 px-3 py-1 rounded-lg border border-white/5 inline-block min-w-[70px] font-mono">
                          {p.palpite_casa} x {p.palpite_fora}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {p.pontos_ganhos !== null ? (
                          <span className={`font-mono font-black text-xs px-2.5 py-1 rounded-md ${
                            p.pontos_ganhos === 15 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                              : p.pontos_ganhos === 5 
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                              : 'bg-white/5 text-gray-500'
                          }`}>
                            +{p.pontos_ganhos} pts
                          </span>
                        ) : (
                          <span className="text-gray-600 font-mono text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}