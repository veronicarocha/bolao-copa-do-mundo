'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Lista oficial revisada para compatibilidade total com o cadastro
const TODAS_SELECOES_COPA = [
  'África do Sul', 'Alemanha', 'Arábia Saudita', 'Argélia', 'Argentina', 'Austrália', 'Áustria',
  'Bélgica', 'Bósnia e Herzegovina', 'Brasil', 'Cabo Verde', 'Canadá', 'Catar', 'Colômbia', 'Coreia do Sul',
  'Costa do Marfim', 'Croácia', 'Curaçau', 'Egito', 'Equador', 'Escócia', 'Espanha', 'Estados Unidos',
  'França', 'Gana', 'Holanda', 'Haiti', 'Inglaterra', 'Irã', 'Iraque', 'Japão', 'Jordânia',
  'Marrocos', 'México', 'Noruega', 'Nova Zelândia', 'Panamá', 'Paraguai', 'Portugal',
  'RD do Congo', 'República Tcheca', 'Senegal', 'Suécia', 'Suíça', 'Tunísia', 'Turquia',
  'Uruguai', 'Uzbequistao'
].sort((a, b) => a.localeCompare(b));

export default function GerenciadorFasesAdmin() {
  const [faseAtiva, setFaseAtiva] = useState<
    'dezesseis_avos' | 'oitavas' | 'quartas' | 'semi' | 'terceiro' | 'quarto' | 'finalistas' | 'campeao'
  >('dezesseis_avos');
  const [selecoesMarcadas, setSelecoesMarcadas] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  // Limites de seleção para te ajudar a não marcar a quantidade errada de times
  const LIMITES_FASE = {
    dezesseis_avos: 32,
    oitavas: 16,
    quartas: 8,
    semi: 4,
    terceiro: 1,    // 3º colocado (25 pts)
    quarto: 1,      // 4º colocado (25 pts)
    finalistas: 1,  // 🌟 Alterado de 2 para 1: Agora armazena EXCLUSIVAMENTE a seleção do Vice-Campeão!
    campeao: 1      // Grande Campeão (70 pts)
  };

  // Mapeamento visual amigável dos nomes para evitar strings cruas na tela
  const NOMES_EXIBICAO_FASES: Record<string, string> = {
    dezesseis_avos: '16 Avos',
    oitavas: 'Oitavas',
    quartas: 'Quartas',
    semi: 'Semi',
    terceiro: '3º Lugar',
    quarto: '4º Lugar',
    finalistas: 'Vice',
    campeao: 'Campeão'
  };

  // Carrega os dados salvos no banco toda vez que você mudar de aba no admin
  useEffect(() => {
    async function carregarGabaritoFase() {
      const { data, error } = await supabase
        .from('resultados_fases_reais')
        .select('*')
        .eq('fase', faseAtiva)
        .maybeSingle();

      if (data && !error) {
        setSelecoesMarcadas(data.selecoes || []);
      } else {
        setSelecoesMarcadas([]);
      }
    }
    carregarGabaritoFase();
  }, [faseAtiva]);

  const handleAlternarSelecao = (pais: string) => {
    setSelecoesMarcadas(prev => {
      if (prev.includes(pais)) {
        return prev.filter(p => p !== pais);
      }
      // Valida o limite estrito da fase selecionada
      if (prev.length >= LIMITES_FASE[faseAtiva]) {
        alert(`Atenção: A fase ${NOMES_EXIBICAO_FASES[faseAtiva]} aceita no máximo ${LIMITES_FASE[faseAtiva]} seleção(ões) classificada(s)!`);
        return prev;
      }
      return [...prev, pais];
    });
  };

  const salvarNoBanco = async () => {
    if (selecoesMarcadas.length !== LIMITES_FASE[faseAtiva]) {
      if (!confirm(`Atenção: Você marcou ${selecoesMarcadas.length} seleção(ões), mas o esperado para esta fase são exatamente ${LIMITES_FASE[faseAtiva]}. Deseja salvar assim mesmo?`)) {
        return;
      }
    }

    setSalvando(true);
    try {
      const { error } = await supabase
        .from('resultados_fases_reais')
        .upsert({
          fase: faseAtiva,
          selecoes: selecoesMarcadas
        }, { onConflict: 'fase' });

      if (error) throw error;
      alert('🏆 Gabarito oficial da fase salvo e sincronizado com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao salvar gabarito: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-6 text-white max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-black text-amber-400">🏅 Definição de Classificados Oficiais (Mata-Mata)</h2>
        <p className="text-xs text-gray-400 mt-1">Selecione a fase e marque as seleções que garantiram a classificação no mundo real.</p>
      </div>

      {/* Abas de Fases */}
      <div className="flex flex-wrap bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
        {(Object.keys(LIMITES_FASE) as Array<keyof typeof LIMITES_FASE>).map((fase) => (
          <button
            key={fase}
            onClick={() => setFaseAtiva(fase)}
            className={`flex-1 min-w-[120px] py-2 rounded-lg text-xs font-bold transition uppercase tracking-wider ${
              faseAtiva === fase ? 'bg-amber-500 text-slate-950 font-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {NOMES_EXIBICAO_FASES[fase]} ({LIMITES_FASE[fase]})
          </button>
        ))}
      </div>

      {/* Grid Contendo a Pré-Lista Segura de Checkboxes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 bg-black/20 p-4 rounded-xl border border-white/5 max-h-[380px] overflow-y-auto scrollbar-thin">
        {TODAS_SELECOES_COPA.map((pais) => {
          const estáMarcado = selecoesMarcadas.includes(pais);
          return (
            <label
              key={pais}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-bold cursor-pointer transition select-none ${
                estáMarcado
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md'
                  : 'bg-slate-900/50 border-white/5 text-gray-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <input
                type="checkbox"
                checked={estáMarcado}
                onChange={() => handleAlternarSelecao(pais)}
                className="hidden"
              />
              <span className="text-base">{estáMarcado ? '✅' : '⬜'}</span>
              <span className="truncate">{pais}</span>
            </label>
          );
        })}
      </div>

      {/* Rodapé Informativo e Botão de Ação */}
      <div className="flex flex-col sm:flex-row justify-between items-center border-t border-white/5 pt-4 gap-4">
        <div className="text-xs text-gray-400">
          Marcados nesta fase: <strong className="text-amber-400 font-mono text-sm">{selecoesMarcadas.length}</strong> de <strong className="text-white font-mono text-sm">{LIMITES_FASE[faseAtiva]}</strong> requeridos.
        </div>
        <button
          onClick={salvarNoBanco}
          disabled={salvando}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black rounded-xl transition disabled:opacity-50 tracking-wide uppercase text-xs"
        >
          {salvando ? '🔄 Sincronizando ...' : '💾 Salvar Lista Oficial'}
        </button>
      </div>
    </div>
  );
}