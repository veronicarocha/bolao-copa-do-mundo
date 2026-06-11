'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Jogo {
  id: string;
  time_casa: string;
  time_fora: string;
  gols_casa: number | null;
  gols_fora: number | null;
  grupo: string;
}

interface PalpiteJogo {
  id: string;
  palpite_casa: number;
  palpite_fora: number;
  pontos_ganhos: number;
  jogos: Jogo;
}

interface Perfil {
  nome: string;
  pontos: number;
}

// 🧮 Função de Higienização e Equivalência de Países (Ordem Corrigida)
function removerAcentos(str: string): string {
  if (!str) return '';
  
  // 1. Passa tudo para minúsculo primeiro
  let texto = str.toLowerCase();

  // 2. Remove acentos e caracteres especiais de forma bruta
  const de = "áàâãäéèêëíìîïóòôõöúùûüçñ";
  const para = "aaaaaeeeeiiiiooooouuuucn";
  for (let i = 0; i < de.length; i++) {
    texto = texto.split(de[i]).join(para[i]);
  }

  // 3. Remove caracteres residuais
  texto = texto.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();

  // 4. Mapeia as equivalências agora que o texto está 100% limpo e sem acentos
  if (texto === 'ri do ira') return 'ira';
  if (texto === 'tchequia') return 'republica tcheca';
  if (texto === 'curacao' || texto === 'curacau') return 'curacao';
  
  return texto;
}

// 🗓️ Calendário Oficial Normalizado
const CALENDARIO_OFICIAL_COMPLETO = [
  // 1ª Rodada
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
  
  // 2ª Rodada
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
  { confronto: 'equador x curacao', data: '20/06', rodada: '2ª Rodada' },
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
  { confronto: 'colombia x rd do congo', data: '23/06', rodada: '2ª Rodada' },
  
  // 3ª Rodada
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

const ORDEM_CATEGORIAS_ESPECIAIS = [
  'artilheiro_geral', 'craque_copa', 'melhor_goleiro', 'craque_final', 'lider_assistencias',
  'total_gols', 'total_vermelhos', 'primeiro_gol_brasil', 'artilheiro_brasil', 'melhor_ataque',
  'melhor_defesa', 'arbitro_final', 'primeiro_gol_copa', 'mais_cartoes_selecao',
  'menos_cartoes_selecao', 'primeiro_zero_a_zero'
];

const LISTA_GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function traduzirFaseVaga(faseVaga: string) {
  const numeroJogo = parseInt(faseVaga.replace(/\D/g, ''), 10);
  if (numeroJogo >= 73 && numeroJogo <= 88) return { fase: "Fase de 32", detalhe: `Jogo ${numeroJogo}` };
  if (numeroJogo >= 89 && numeroJogo <= 96) return { fase: "Oitavas de Final", detalhe: `Jogo ${numeroJogo}` };
  if (numeroJogo >= 97 && numeroJogo <= 100) return { fase: "Quartas de Final", detalhe: `Jogo ${numeroJogo}` };
  if (numeroJogo === 101 || numeroJogo === 102) return { fase: "Semifinal", detalhe: `Jogo ${numeroJogo}` };
  if (numeroJogo === 103) return { fase: "Disputa do 3º Lugar", detalhe: "3º Lugar" };
  if (numeroJogo === 104) return { fase: "Grande Final", detalhe: "Final 🏆" };
  return { fase: "Mata-Mata", detalhe: faseVaga };
}

export default function VisualizarPalpites() {
  const { id } = useParams();
  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [palpitesGrupos, setPalpitesGrupos] = useState<PalpiteJogo[]>([]);
  const [palpitesMM, setPalpitesMM] = useState<any[]>([]);
  const [palpitesEsp, setPalpitesEsp] = useState<any[]>([]);

  const [abaAtiva, setAbaAtiva] = useState<'grupos' | 'matamata' | 'especiais'>('grupos');
  const [grupoSelecionado, setGrupoSelecionado] = useState<string>('TODOS');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function carregarDadosDoParticipante() {
      try {
        const { data: dadosPerfil, error: erroPerfil } = await supabase
          .from('perfis')
          .select('nome')
          .eq('id', id)
          .maybeSingle();

        if (erroPerfil) throw erroPerfil;

        const { data: dadosGrupos, error: erroGrupos } = await supabase
          .from('palpites_jogos')
          .select(`
            id, palpite_casa, palpite_fora, pontos_ganhos,
            jogos:jogo_id (id, time_casa, time_fora, gols_casa, gols_fora, grupo)
          `)
          .eq('user_id', id);

        if (erroGrupos) throw erroGrupos;
        const grupos = (dadosGrupos as any) || [];
        
        // 🛠️ Ordenação Cronológica de Duplo Sentido
        const gruposOrdenados = grupos.sort((a: any, b: any) => {
          const casaA = removerAcentos(a.jogos?.time_casa || '');
          const foraA = removerAcentos(a.jogos?.time_fora || '');
          const casaB = removerAcentos(b.jogos?.time_casa || '');
          const foraB = removerAcentos(b.jogos?.time_fora || '');
          
          const indexA = CALENDARIO_OFICIAL_COMPLETO.findIndex(x => 
            x.confronto === `${casaA} x ${foraA}` || x.confronto === `${foraA} x ${casaA}`
          );
          const indexB = CALENDARIO_OFICIAL_COMPLETO.findIndex(x => 
            x.confronto === `${casaB} x ${foraB}` || x.confronto === `${foraB} x ${casaB}`
          );
          
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
        setPalpitesGrupos(gruposOrdenados);

        const { data: dadosMM } = await supabase.from('palpites_matamata').select('*').eq('user_id', id);
        setPalpitesMM(dadosMM || []);

        const { data: dadosEsp } = await supabase.from('palpites_especiais').select('*').eq('user_id', id);
        const esp = dadosEsp || [];

        const espOrdenados = esp.sort((a: any, b: any) => {
          const indexA = ORDEM_CATEGORIAS_ESPECIAIS.indexOf(a.pergunta_id);
          const indexB = ORDEM_CATEGORIAS_ESPECIAIS.indexOf(b.pergunta_id);
          return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        });
        setPalpitesEsp(espOrdenados);

        // 🧮 SOMA DINÂMICA EM MEMÓRIA
        let somaTotal = 0;
        grupos.forEach((p: any) => somaTotal += Number(p.pontos_ganhos || 0));
        (dadosMM || []).forEach((p: any) => somaTotal += Number(p.pontos_ganhos || 0));
        esp.forEach((p: any) => somaTotal += Number(p.pontos_ganhos || 0));

        setPerfil({
          nome: dadosPerfil?.nome || 'Usuário Sem Nome',
          pontos: somaTotal
        });

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
        <div className="text-gray-400 font-mono animate-pulse">Carregando auditoria de palpites...</div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <p className="text-red-400 font-mono">Participante não encontrado.</p>
        <button onClick={() => router.back()} className="text-sm text-blue-400 underline">Voltar para o Ranking</button>
      </div>
    );
  }

  const palpitesGruposFiltrados = palpitesGrupos.filter((item) => {
    if (grupoSelecionado === 'TODOS') return true;
    return item.jogos?.grupo?.toUpperCase() === grupoSelecionado.toUpperCase();
  });

  return (
    <div className="min-h-screen w-full bg-slate-900 p-4 md:p-12 text-white">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Voltar e Cabeçalho */}
        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sm font-black text-gray-200 hover:text-white rounded-xl border border-white/10 shadow-md transition group focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <span className="text-base transition-transform group-hover:-translate-x-1">⬅️</span>
            <span>Voltar para o Ranking Geral</span>
          </button>

          <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">Modo Leitura Auditado 👁️</span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Palpites de <span className="text-amber-400">{perfil.nome}</span>
              </h1>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-2 rounded-xl text-right shrink-0">
              <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Pontuação Total</p>
              <p className="text-2xl font-black text-emerald-400 font-mono">{perfil.pontos} pts</p>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 gap-1">
          <button onClick={() => setAbaAtiva('grupos')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${abaAtiva === 'grupos' ? 'bg-white/10 text-amber-400' : 'text-gray-400 hover:text-white'}`}>
            ⚽ Fase de Grupos
          </button>
          <button onClick={() => setAbaAtiva('matamata')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${abaAtiva === 'matamata' ? 'bg-white/10 text-blue-400' : 'text-gray-400 hover:text-white'}`}>
            ⚡ Mata-Mata
          </button>
          <button onClick={() => setAbaAtiva('especiais')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${abaAtiva === 'especiais' ? 'bg-white/10 text-purple-400' : 'text-gray-400 hover:text-white'}`}>
            🔥 Especiais
          </button>
        </div>

        {/* BARRA DE FILTRAGEM POR GRUPO */}
        {abaAtiva === 'grupos' && (
          <div className="bg-slate-950 p-2 rounded-xl border border-white/5 flex flex-wrap gap-1 items-center justify-center">
            <button
              onClick={() => setGrupoSelecionado('TODOS')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wider transition ${grupoSelecionado === 'TODOS' ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              TODOS
            </button>
            <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />
            {LISTA_GRUPOS.map((letra) => (
              <button
                key={letra}
                onClick={() => setGrupoSelecionado(letra)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition ${grupoSelecionado === letra ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 text-gray-400 hover:text-white'}`}
              >
                {letra}
              </button>
            ))}
          </div>
        )}

        {/* CONTEÚDO DAS ABAS */}
        <div className="space-y-3">
          {abaAtiva === 'grupos' && (
            palpitesGruposFiltrados.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl text-gray-500 text-sm border border-white/5">
                Nenhum palpite encontrado para o Grupo {grupoSelecionado}.
              </div>
            ) : (
              palpitesGruposFiltrados.map((item) => {
                const jogo = item.jogos;
                if (!jogo) return null;
                const jogoTevePlacarReal = jogo.gols_casa !== null && jogo.gols_fora !== null;

                // 🛠️ Busca Bidirecional com Higienização de Países Corrigida
                const casaLimpa = removerAcentos(jogo.time_casa || '');
                const foraLimpa = removerAcentos(jogo.time_fora || '');

                const infoCronograma = CALENDARIO_OFICIAL_COMPLETO.find(x => 
                  x.confronto === `${casaLimpa} x ${foraLimpa}` || 
                  x.confronto === `${foraLimpa} x ${casaLimpa}`
                );

                return (
                  <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-white/10 transition">
                    <div className="flex items-center gap-2.5 w-full md:w-5/12 justify-between md:justify-start">
                      
                      {/* Metadados (Grupo + Data) */}
                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded font-black uppercase tracking-wider">
                          {jogo.grupo || ''}
                        </span>
                        {infoCronograma && (
                          <span className="px-1.5 py-0.5 bg-white/5 text-gray-400 rounded border border-white/5 font-medium">
                            {infoCronograma.data}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 truncate justify-end md:justify-start w-full">
                        <span className="text-sm font-bold text-gray-200 truncate">{jogo.time_casa}</span>
                        <span className="text-[10px] text-gray-500 font-black px-1.5 py-0.5 bg-white/5 rounded shrink-0">VS</span>
                        <span className="text-sm font-bold text-gray-200 truncate">{jogo.time_fora}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 shrink-0">
                      <div className="flex flex-col items-center bg-amber-500/5 border border-amber-500/10 px-4 py-2 rounded-lg min-w-[120px]">
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-1">Palpite</span>
                        <div className="text-lg font-black font-mono text-amber-200">{item.palpite_casa} x {item.palpite_fora}</div>
                      </div>
                      <div className="flex flex-col items-center bg-slate-900 border border-white/5 px-4 py-2 rounded-lg min-w-[120px]">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Oficial</span>
                        <div className="text-sm font-bold font-mono text-gray-400 mt-0.5">{jogoTevePlacarReal ? `${jogo.gols_casa} x ${jogo.gols_fora}` : '— x —'}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono font-black text-emerald-400 min-w-[60px]">+{item.pontos_ganhos || 0} pts</div>
                  </div>
                );
              })
            )
          )}

          {/* ABA 2: MATA MATA */}
          {abaAtiva === 'matamata' && (
            palpitesMM.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl text-gray-500 text-sm border border-white/5">Nenhum palpite de mata-mata enviado.</div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const confrontosAgrupados: Record<string, { componentes: string[]; vencedor?: string; pontos?: number }> = {};
                  palpitesMM.forEach((item) => {
                    const idVaga = item.fase_vaga;
                    const baseVaga = idVaga.split('_')[0];
                    if (!confrontosAgrupados[baseVaga]) confrontosAgrupados[baseVaga] = { componentes: [] };

                    if (idVaga.endsWith('_1') || idVaga.endsWith('_2')) {
                      if (item.selecao_escolhida) confrontosAgrupados[baseVaga].componentes.push(item.selecao_escolhida);
                    } else {
                      confrontosAgrupados[baseVaga].vencedor = item.selecao_escolhida;
                      confrontosAgrupados[baseVaga].pontos = item.pontos_ganhos;
                    }
                  });

                  return Object.entries(confrontosAgrupados)
                    .sort((a, b) => parseInt(a[0].replace(/\D/g, ''), 10) - parseInt(b[0].replace(/\D/g, ''), 10))
                    .map(([codigoJogo, dados]) => {
                      const info = traduzirFaseVaga(codigoJogo);
                      const vencedor = dados.vencedor;
                      const timesNoConfronto = Array.from(new Set(dados.componentes));

                      return (
                        <div key={codigoJogo} className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition">
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded font-bold uppercase tracking-wider">{info.fase}</span>
                            <span className="text-xs text-gray-500 font-mono">[{info.detalhe}]</span>
                          </div>
                          
                          {/* 🛠️ Removemos permanentemente o aviso cinza de "Chaveamento não preenchido" daqui */}
                          <div className="text-xs text-gray-400 sm:text-center flex-1">
                            {timesNoConfronto.length > 0 ? (
                              <p>Confronto simulado: <span className="text-gray-200 font-bold">{timesNoConfronto.join(' x ')}</span></p>
                            ) : (
                              <p className="text-gray-500">Disputa pela vaga das <span className="text-blue-400 font-medium">{info.fase}</span></p>
                            )}
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t border-white/5 sm:border-0 pt-2 sm:pt-0">
                            <div className="text-sm">
                              <span className="text-gray-400 text-xs mr-1">Apostou em:</span>
                              <span className="text-amber-400 font-black tracking-wide bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/15">{vencedor || 'Ninguém'}</span>
                            </div>
                            <div className="font-mono font-black text-emerald-400 shrink-0">+{dados.pontos || 0} pts</div>
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            )
          )}

          {/* ABA 3: ESPECIAIS */}
          {abaAtiva === 'especiais' && (
            palpitesEsp.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl text-gray-500 text-sm border border-white/5">Nenhum palpite especial enviado.</div>
            ) : (
              palpitesEsp.map((item) => (
                <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-white/5 flex justify-between items-center gap-4 hover:border-white/10 transition">
                  <div className="truncate pr-4">
                    <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-1">{item.pergunta_id.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-black text-gray-200 truncate">{item.resposta_palpite || 'Em branco'}</p>
                  </div>
                  <div className="text-right font-mono font-black text-emerald-400 shrink-0">+{item.pontos_ganhos || 0} pts</div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}