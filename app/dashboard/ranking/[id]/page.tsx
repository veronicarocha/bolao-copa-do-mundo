'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

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

function removerAcentos(str: string): string {
  if (!str) return '';
  let texto = str.toLowerCase();
  const de = "áàâãäéèêëíìîïóòôõöúùûüçñ";
  const para = "aaaaaeeeeiiiiooooouuuucn";
  for (let i = 0; i < de.length; i++) {
    texto = texto.split(de[i]).join(para[i]);
  }
  return texto.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
}

const CALENDARIO_OFICIAL_COMPLETO = [
  { confronto: 'mexico x africa do sul', data: '11/06' },
  { confronto: 'coreia do sul x republica tcheca', data: '11/06' },
  { confronto: 'canada x bosnia', data: '12/06' },
  { confronto: 'eua x paraguai', data: '12/06' },
  { confronto: 'catar x suica', data: '13/06' },
  { confronto: 'brasil x marrocos', data: '13/06' },
  { confronto: 'haiti x escocia', data: '13/06' },
  { confronto: 'australia x turquia', data: '13/06' },
  { confronto: 'alemanha x curacao', data: '14/06' },
  { confronto: 'costa do marfim x equador', data: '14/06' },
  { confronto: 'holanda x japao', data: '14/06' },
  { confronto: 'suecia x tunisia', data: '14/06' },
  { confronto: 'espanha x cabo verde', data: '15/06' },
  { confronto: 'arabia saudita x uruguai', data: '15/06' },
  { confronto: 'belgica x egito', data: '15/06' },
  { confronto: 'ira x nova zelandia', data: '15/06' },
  { confronto: 'austria x jordania', data: '16/06' },
  { confronto: 'franca x senegal', data: '16/06' },
  { confronto: 'iraque x noruega', data: '16/06' },
  { confronto: 'argentina x argelia', data: '16/06' },
  { confronto: 'portugal x rd do congo', data: '17/06' },
  { confronto: 'inglaterra x croacia', data: '17/06' },
  { confronto: 'gana x panama', data: '17/06' },
  { confronto: 'uzbequistao x colombia', data: '17/06' },
  { confronto: 'republica tcheca x africa do sul', data: '18/06' },
  { confronto: 'suica x bosnia', data: '18/06' },
  { confronto: 'canada x catar', data: '18/06' },
  { confronto: 'mexico x coreia do sul', data: '18/06' },
  { confronto: 'turquia x paraguai', data: '19/06' },
  { confronto: 'eua x australia', data: '19/06' },
  { confronto: 'escocia x marrocos', data: '19/06' },
  { confronto: 'brasil x haiti', data: '19/06' },
  { confronto: 'tunisia x japao', data: '20/06' },
  { confronto: 'holanda x suecia', data: '20/06' },
  { confronto: 'alemanha x costa do marfim', text: '20/06' },
  { confronto: 'equador x curacao', data: '20/06' },
  { confronto: 'espanha x arabia saudita', data: '21/06' },
  { confronto: 'belgica x ira', data: '21/06' },
  { confronto: 'uruguai x cabo verde', data: '21/06' },
  { confronto: 'nova zelandia x egito', data: '21/06' },
  { confronto: 'argentina x austria', data: '22/06' },
  { confronto: 'franca x iraque', data: '22/06' },
  { confronto: 'noruega x senegal', data: '22/06' },
  { confronto: 'jordania x argelia', data: '22/06' },
  { confronto: 'portugal x uzbequistao', data: '23/06' },
  { confronto: 'inglaterra x gana', data: '23/06' },
  { confronto: 'panama x croacia', data: '23/06' },
  { confronto: 'colombia x rd do congo', data: '23/06' },
  { confronto: 'suica x canada', data: '24/06' },
  { confronto: 'bosnia x catar', data: '24/06' },
  { confronto: 'escocia x brasil', data: '24/06' },
  { confronto: 'marrocos x haiti', data: '24/06' },
  { confronto: 'republica tcheca x mexico', data: '24/06' },
  { confronto: 'africa do sul x coreia do sul', data: '24/06' },
  { confronto: 'equador x alemanha', data: '25/06' },
  { confronto: 'curacao x costa do marfim', data: '25/06' },
  { confronto: 'japao x suecia', data: '25/06' },
  { confronto: 'tunisia x holanda', data: '25/06' },
  { confronto: 'turquia x eua', data: '25/06' },
  { confronto: 'paraguai x australia', data: '25/06' },
  { confronto: 'noruega x franca', data: '26/06' },
  { confronto: 'senegal x iraque', data: '26/06' },
  { confronto: 'cabo verde x arabia saudita', data: '26/06' },
  { confronto: 'uruguai x espanha', data: '26/06' },
  { confronto: 'egito x ira', data: '26/06' },
  { confronto: 'nova zelandia x belgica', data: '26/06' },
  { confronto: 'panama x inglaterra', data: '27/06' },
  { confronto: 'croacia x gana', data: '27/06' },
  { confronto: 'colombia x portugal', data: '27/06' },
  { confronto: 'rd do congo x uzbequistao', data: '27/06' },
  { confronto: 'argelia x austria', data: '27/06' },
  { confronto: 'jordania x argentina', data: '27/06' }
];

const ORDEM_CATEGORIAS_ESPECIAIS = [
  'artilheiro_geral', 'craque_copa', 'melhor_goleiro', 'craque_final', 'lider_assistencias',
  'total_gols', 'total_vermelhos', 'primeiro_gol_brasil', 'artilheiro_brasil', 'melhor_ataque',
  'melhor_defesa', 'arbitro_final', 'primeiro_gol_copa', 'mais_cartoes_selecao',
  'menos_cartoes_selecao', 'primeiro_zero_a_zero'
];

const LISTA_GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// 🎯 MAPA CORRIGIDO: Baseado estritamente na árvore estrutural correta de "image_24e79e.png"
const MAPA_DEPENDENCIAS: Record<string, { casa: string; fora: string }> = {
  'J89': { casa: 'J74', fora: 'J77' },
  'J90': { casa: 'J73', fora: 'J75' },
  'J93': { casa: 'J83', fora: 'J84' },
  'J94': { casa: 'J81', fora: 'J82' },
  'J91': { casa: 'J76', fora: 'J78' },
  'J92': { casa: 'J79', fora: 'J80' },
  'J95': { casa: 'J86', fora: 'J88' },
  'J96': { casa: 'J85', fora: 'J87' },
  
  // Quartas dependem do avanço das oitavas reais mapeadas acima
  'J97': { casa: 'J89', fora: 'J90' },
  'J98': { casa: 'J93', fora: 'J94' },
  'J99': { casa: 'J91', fora: 'J92' },
  'J100': { casa: 'J95', fora: 'J96' },
  
  // Semifinais e Finais encadeadas
  'J101': { casa: 'J97', fora: 'J98' },
  'J102': { casa: 'J99', fora: 'J100' },
  'J104': { casa: 'J101', fora: 'J102' }
};

function obterDetalheFase(faseVaga: string) {
  const num = parseInt(faseVaga.replace(/\D/g, ''), 10);
  if (num >= 73 && num <= 88) return { label: "16 Avos", cor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  if (num >= 89 && num <= 96) return { label: "Oitavas", cor: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
  if (num >= 97 && num <= 100) return { label: "Quartas", cor: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
  if (num === 101 || num === 102) return { label: "Semifinal", cor: "bg-pink-500/10 text-pink-400 border-pink-500/20" };
  if (num === 103) return { label: "3º Lugar", cor: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
  if (num === 104) return { label: "Final 🏆", cor: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return { label: "Mata-Mata", cor: "bg-white/5 text-white border-white/10" };
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
          .select('nome, pontos')
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

        setPerfil({
          nome: dadosPerfil?.nome || 'Usuário Sem Nome',
          pontos: dadosPerfil?.pontos ?? 0
        });

      } catch (err) {
        console.error("Erro ao espiar palpites:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDadosDoParticipante();
  }, [id]);

  const confrontosProcessadosMM = useMemo(() => {
    const dadosMapeados: Record<string, {
      codigo: string;
      time_casa: string;
      time_fora: string;
      vencedor_escolhido: string;
      pontos_vencedor: number;
    }> = {};

    for (let i = 73; i <= 104; i++) {
      const cod = `J${i}`;
      dadosMapeados[cod] = { codigo: cod, time_casa: '', time_fora: '', vencedor_escolhido: '', pontos_vencedor: 0 };
    }

    palpitesMM.forEach(p => {
      const faseVaga = p.fase_vaga ? p.fase_vaga.trim().toUpperCase() : '';
      const baseJogo = faseVaga.split('_')[0];

      if (!dadosMapeados[baseJogo]) return;

      if (faseVaga.endsWith('_1')) {
        dadosMapeados[baseJogo].time_casa = p.selecao_escolhida || '';
      } else if (faseVaga.endsWith('_2')) {
        dadosMapeados[baseJogo].time_fora = p.selecao_escolhida || '';
      } else {
        dadosMapeados[baseJogo].vencedor_escolhido = p.selecao_escolhida || '';
        dadosMapeados[baseJogo].pontos_vencedor = p.pontos_ganhos || 0;
      }
    });

    const chavesOrdenadas = Object.keys(MAPA_DEPENDENCIAS).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    chavesOrdenadas.forEach(jogoId => {
      const dependencias = MAPA_DEPENDENCIAS[jogoId];

      if (!dadosMapeados[jogoId].time_casa) {
        const jogoAnterior = dadosMapeados[dependencias.casa];
        dadosMapeados[jogoId].time_casa = jogoAnterior && jogoAnterior.vencedor_escolhido ? jogoAnterior.vencedor_escolhido : 'A definir';
      }

      if (!dadosMapeados[jogoId].time_fora) {
        const jogoAnterior = dadosMapeados[dependencias.fora];
        dadosMapeados[jogoId].time_fora = jogoAnterior && jogoAnterior.vencedor_escolhido ? jogoAnterior.vencedor_escolhido : 'A definir';
      }
    });

    if (!dadosMapeados['J103'].time_casa) {
      const j101 = dadosMapeados['J101'];
      if (j101 && j101.vencedor_escolhido && j101.time_casa && j101.time_fora) {
        dadosMapeados['J103'].time_casa = j101.vencedor_escolhido === j101.time_casa ? j101.time_fora : j101.time_casa;
      } else {
        dadosMapeados['J103'].time_casa = 'A definir';
      }
    }

    if (!dadosMapeados['J103'].time_fora) {
      const j102 = dadosMapeados['J102'];
      if (j102 && j102.vencedor_escolhido && j102.time_casa && j102.time_fora) {
        dadosMapeados['J103'].time_fora = j102.vencedor_escolhido === j102.time_casa ? j102.time_fora : j102.time_casa;
      } else {
        dadosMapeados['J103'].time_fora = 'A definir';
      }
    }

    return Object.values(dadosMapeados).filter(j => j.time_casa || j.time_fora || j.vencedor_escolhido);
  }, [palpitesMM]);

  const palpitesGruposFiltrados = palpitesGrupos.filter((item) => {
    if (grupoSelecionado === 'TODOS') return true;
    return item.jogos?.grupo?.toUpperCase() === grupoSelecionado.toUpperCase();
  });

  return (
    <div className="min-h-screen w-full bg-slate-900 p-3 md:p-12 text-white overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Botão de Voltar */}
        <div className="flex justify-start">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs md:text-sm font-black text-gray-200 hover:text-white rounded-xl border border-white/10 shadow-md transition group focus:outline-none"
          >
            <span className="text-base transition-transform group-hover:-translate-x-1">⬅️</span>
            <span>Voltar ao Ranking</span>
          </button>
        </div>

        {/* CABEÇALHO */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4 w-full">
          <div className="flex flex-col items-center md:items-start min-w-0 w-full md:flex-1">
            <span className="text-[10px] md:text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
              Modo Leitura Auditado 👁️
            </span>
            <h1 className="text-lg md:text-2xl font-black tracking-tight text-white w-full break-words">
              Palpites de <span className="text-amber-400">{perfil?.nome}</span>
            </h1>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-xl text-center md:text-right shrink-0 w-full sm:w-auto">
            <p className="text-[9px] md:text-[10px] text-emerald-500 uppercase tracking-widest font-bold">
              Pontuação Total
            </p>
            <p className="text-xl md:text-2xl font-black text-emerald-400 font-mono">
              {perfil?.pontos} pts
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 gap-1">
          <button onClick={() => setAbaAtiva('grupos')} className={`flex-1 py-2.5 rounded-lg text-[11px] md:text-xs font-bold transition ${abaAtiva === 'grupos' ? 'bg-white/10 text-amber-400' : 'text-gray-400 hover:text-white'}`}>
            ⚽ Grupos
          </button>
          <button onClick={() => setAbaAtiva('matamata')} className={`flex-1 py-2.5 rounded-lg text-[11px] md:text-xs font-bold transition ${abaAtiva === 'matamata' ? 'bg-white/10 text-blue-400' : 'text-gray-400 hover:text-white'}`}>
            ⚡ Mata-Mata
          </button>
          <button onClick={() => setAbaAtiva('especiais')} className={`flex-1 py-2.5 rounded-lg text-[11px] md:text-xs font-bold transition ${abaAtiva === 'especiais' ? 'bg-white/10 text-purple-400' : 'text-gray-400 hover:text-white'}`}>
            🔥 Especiais
          </button>
        </div>

        {/* BARRA DE FILTRAGEM POR GRUPO */}
        {abaAtiva === 'grupos' && (
          <div className="bg-slate-950 p-2 rounded-xl border border-white/5 flex flex-wrap gap-1 items-center justify-center">
            <button
              onClick={() => setGrupoSelecionado('TODOS')}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition ${grupoSelecionado === 'TODOS' ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              TODOS
            </button>
            {LISTA_GRUPOS.map((letra) => (
              <button
                key={letra}
                onClick={() => setGrupoSelecionado(letra)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-black transition ${grupoSelecionado === letra ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 text-gray-400 hover:text-white'}`}
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
                const juego = item.jogos;
                if (!juego) return null;
                const jogoTevePlacarReal = juego.gols_casa !== null && juego.gols_fora !== null;

                const casaLimpa = removerAcentos(juego.time_casa || '');
                const foraLimpa = removerAcentos(juego.time_fora || '');

                const infoCronograma = CALENDARIO_OFICIAL_COMPLETO.find(x =>
                  x.confronto === `${casaLimpa} x ${foraLimpa}` ||
                  x.confronto === `${foraLimpa} x ${casaLimpa}`
                );

                return (
                  <div key={item.id} className="bg-slate-950 p-3.5 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-3.5 hover:border-white/10 transition">
                    <div className="flex flex-col md:flex-row items-center gap-2.5 w-full md:w-7/12 min-w-0">
                      <div className="flex items-center justify-center gap-1.5 font-mono text-[9px] md:text-[10px] w-full md:w-auto md:justify-start shrink-0">
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded font-black uppercase tracking-wider">
                          G {juego.grupo || ''}
                        </span>
                        {infoCronograma && (
                          <span className="px-1.5 py-0.5 bg-white/5 text-gray-400 rounded border border-white/5 font-medium">
                            {infoCronograma.data}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-2 w-full text-center min-w-0">
                        <span className="text-xs md:text-sm font-bold text-gray-200 truncate flex-1 text-right min-w-0">{juego.time_casa}</span>
                        <span className="text-[9px] text-gray-500 font-black px-1 py-0.5 bg-white/5 rounded shrink-0">VS</span>
                        <span className="text-xs md:text-sm font-bold text-gray-200 truncate flex-1 text-left min-w-0">{juego.time_fora}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 shrink-0 w-full md:w-auto justify-center">
                      <div className="flex flex-col items-center justify-center bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-lg min-w-[90px]">
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-0.5 text-center">Palpite</span>
                        <div className="text-sm font-black font-mono text-amber-200 text-center">{item.palpite_casa} x {item.palpite_fora}</div>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-slate-900 border border-white/5 px-3 py-1.5 rounded-lg min-w-[90px]">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 text-center">Oficial</span>
                        <div className="text-xs font-bold font-mono text-gray-400 text-center">{jogoTevePlacarReal ? `${juego.gols_casa} x ${juego.gols_fora}` : '— x —'}</div>
                      </div>
                    </div>
                    <div className="text-center md:text-right font-mono font-black text-emerald-400 text-xs md:text-sm min-w-[50px] w-full md:w-auto">+{item.pontos_ganhos || 0} pts</div>
                  </div>
                );
              })
            )
          )}

          {/* ⚡ ABA 2: MATA-MATA (CRUZAMENTOS OFICIAIS SINCRONIZADOS COM A IMAGEM) */}
          {abaAtiva === 'matamata' && (
            confrontosProcessadosMM.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl text-gray-500 text-sm border border-white/5">Nenhum palpite de mata-mata enviado.</div>
            ) : (
              <div className="space-y-3">
                {confrontosProcessadosMM.map((jogo) => {
                  const faseInfo = obterDetalheFase(jogo.codigo);

                  return (
                    <div key={jogo.codigo} className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-3.5 hover:border-white/10 transition text-center">

                      {/* Identificação da Fase */}
                      <div className="flex items-center justify-center gap-2 shrink-0 w-full md:w-auto">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 border rounded font-black uppercase tracking-wider ${faseInfo.cor}`}>
                          {faseInfo.label}
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono font-bold">[{jogo.codigo}]</span>
                      </div>

                      {/* CONFRONTOS DO MATA-MATA */}
                      <div className="flex-1 text-xs md:text-sm font-bold text-gray-200 flex items-center justify-center gap-2 w-full text-center min-w-0">
                        <span className={`px-1.5 py-0.5 rounded-lg flex-1 text-right truncate min-w-0 ${jogo.time_casa === jogo.vencedor_escolhido ? 'text-amber-400 bg-amber-400/5 border border-amber-500/20' : 'text-gray-400 bg-white/5'}`}>
                          {jogo.time_casa || 'A definir'}
                        </span>
                        <span className="text-[9px] text-gray-600 font-black shrink-0">X</span>
                        <span className={`px-1.5 py-0.5 rounded-lg flex-1 text-left truncate min-w-0 ${jogo.time_fora === jogo.vencedor_escolhido ? 'text-amber-400 bg-amber-400/5 border border-amber-500/20' : 'text-gray-400 bg-white/5'}`}>
                          {jogo.time_fora || 'A definir'}
                        </span>
                      </div>

                      {/* Vencedor Escolhido */}
                      <div className="w-full md:w-auto border-t md:border-t-0 border-white/5 pt-2.5 md:pt-0 flex flex-row items-center justify-between md:justify-end gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] text-gray-400 font-medium">Avança:</span>
                          <span className="text-[11px] md:text-xs font-black tracking-wide text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20 font-mono truncate max-w-[130px]">
                            👑 {jogo.vencedor_escolhido || 'Ninguém'}
                          </span>
                        </div>

                        <div className={`font-mono font-black text-xs px-2 py-0.5 rounded-md shrink-0 ${jogo.pontos_vencedor > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-600'}`}>
                          +{jogo.pontos_vencedor} pts
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ABA 3: ESPECIAIS */}
          {abaAtiva === 'especiais' && (
            palpitesEsp.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl text-gray-500 text-sm border border-white/5">Nenhum palpite especial enviado.</div>
            ) : (
              palpitesEsp.map((item) => (
                <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-white/5 flex justify-between items-center gap-4 hover:border-white/10 transition text-left">
                  <div className="truncate pr-4 min-w-0 flex-1">
                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-0.5 truncate">{item.pergunta_id.replace(/_/g, ' ')}</p>
                    <p className="text-xs md:text-sm font-black text-gray-200 truncate">{item.resposta_palpite || 'Em branco'}</p>
                  </div>
                  <div className="text-right font-mono font-black text-emerald-400 shrink-0 text-xs md:text-sm">+{item.pontos_ganhos || 0} pts</div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}