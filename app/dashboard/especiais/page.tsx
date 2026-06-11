'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMercado } from '@/lib/useMercado'; // <-- Importando o Hook

const PERGUNTAS_ESPECIAIS = [
  { id: 'artilheiro_geral', label: '⚽ Artilheiro da Copa:', pts: 40, placeholder: 'Nome do jogador' },
  { id: 'craque_copa', label: '👑 Craque da Copa (Bola de Ouro):', pts: 40, placeholder: 'Nome do jogador' },
  { id: 'melhor_goleiro', label: '🧤 Melhor Goleiro (Luva de Ouro):', pts: 40, placeholder: 'Nome do jogador' },
  { id: 'craque_final', label: '🏅 Craque da Final (Homem do Jogo):', pts: 30, placeholder: 'Nome do jogador' },
  { id: 'lider_assistencias', label: '🎯 Líder de Assistências (Garçom):', pts: 30, placeholder: 'Nome do jogador' },
  { id: 'total_gols', label: '⚽ Total de GOLS na Copa (104 jogos):', pts: 25, placeholder: 'Ex: 280' },
  { id: 'total_vermelhos', label: '🟥 Total de CARTÕES VERMELHOS na Copa:', pts: 20, placeholder: 'Ex: 12' },
  { id: 'primeiro_gol_brasil', label: '🇧🇷 1º Jogador a marcar gol pelo Brasil:', pts: 20, placeholder: 'Nome do jogador' },
  { id: 'artilheiro_brasil', label: '🇧🇷 Artilheiro do Brasil na Copa:', pts: 20, placeholder: 'Nome do jogador' },
  { id: 'melhor_ataque', label: '🔥 Melhor Ataque da Copa:', pts: 20, placeholder: 'Ex: Espanha' },
  { id: 'melhor_defesa', label: '🛡️ Melhor Defesa da Copa:', pts: 20, placeholder: 'Ex: Itália' },
  { id: 'arbitro_final', label: '🏁 Árbitro da Grande Final:', pts: 20, placeholder: 'Nome do árbitro' },
  { id: 'primeiro_gol_copa', label: '🏃‍♂️ Jogador a marcar o 1º gol da Copa:', pts: 20, placeholder: 'Nome do jogador' },
  { id: 'mais_cartoes_selecao', label: '🟨 Seleção com MAIS cartões na Copa:', pts: 15, placeholder: 'Ex: Uruguai' },
  { id: 'menos_cartoes_selecao', label: '🕊️ Seleção com MENOS cartões (Fair Play):', pts: 15, placeholder: 'Ex: Japão' },
  { id: 'primeiro_zero_a_zero', label: '🚫 Primeiro jogo a terminar em 0 a 0:', pts: 15, placeholder: 'Ex: Grupo A - Jogo 2' }
];

export default function PalpitesEspeciais() {
  // Consumindo a lógica centralizada do Hook
  const { apenasLeitura, carregandoMercado } = useMercado();

  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregarEspeciais() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Buscar apenas os palpites especiais já salvos do usuário
          const { data } = await supabase.from('palpites_especiais').select('*').eq('user_id', user.id);
          const mapa: Record<string, string> = {};
          data?.forEach(item => { 
            mapa[item.pergunta_id] = item.resposta_palpite || ''; 
          });
          setRespostas(mapa);
        }
      } catch (err) {
        console.error('Erro ao carregar Especiais:', err);
      } finally {
        setCarregandoDados(false);
      }
    }
    carregarEspeciais();
  }, []);

  const handleInputChange = (pId: string, valor: string) => {
    if (apenasLeitura) return;
    setRespostas(prev => ({ ...prev, [pId]: valor }));
  };

  const handleSalvar = async () => {
    if (apenasLeitura) {
      alert('O mercado de palpites especiais está fechado!');
      return;
    }

    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Sessão expirada. Faça login novamente.');
      setSalvando(false);
      return;
    }

    // Formata os inserts apenas para os campos preenchidos
    const inserts = Object.entries(respostas)
      .filter(([_, resp]) => resp.trim() !== '')
      .map(([pId, resp]) => ({
        user_id: user.id,
        pergunta_id: pId,
        resposta_palpite: resp
      }));

    if (inserts.length === 0) {
      alert('Preencha pelo menos uma resposta antes de salvar.');
      setSalvando(false);
      return;
    }

    const { error } = await supabase.from('palpites_especiais').upsert(inserts, { onConflict: 'user_id,pergunta_id' });

    setSalvando(false);
    
    // Tratamento de erro RLS (Mesmo da página de grupos e mata-mata)
    if (error) {
      if (error.code === '42501') {
        alert('Acesso negado: O mercado foi fechado e não é mais possível alterar palpites.');
      } else {
        alert(`Erro ao salvar palpites especiais: ${error.message}`);
      }
    } else {
      alert('Seus palpites especiais (Power Picks) foram salvos!');
    }
  };

  // Trava a tela de loading enquanto o mercado ou os dados estão sendo buscados
  if (carregandoDados || carregandoMercado) {
    return <div className="p-8 text-center text-gray-400 font-mono text-sm">Carregando Power Picks...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">🔥 Palpites Especiais</h1>
          <p className="text-sm text-gray-400 mt-1">
            Preencha os seus grandes palpites da Copa. Atenção aos pontos bônus de cada categoria!
          </p>
          <p className="text-sm text-amber-400 font-semibold mt-1">
           Boa sorte ...
          </p>
        </div>
        <button
          onClick={handleSalvar}
          disabled={apenasLeitura || salvando}
          className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-bold shadow-lg transition transform active:scale-95 ${
            apenasLeitura 
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-950/20'
          }`}
        >
          {salvando ? 'Salvando...' : apenasLeitura ? '🔒 Mercado Fechado' : '💾 Salvar Meus Especiais'}
        </button>
      </div>

      {/* Grid de Perguntas */}
      <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-white/5 shadow-xl">
        {PERGUNTAS_ESPECIAIS.map(p => (
          <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5 last:border-0 last:pb-0">
            <div>
              <span className="text-base font-bold block text-gray-100">{p.label}</span>
              <span className="text-[11px] text-purple-400 font-bold uppercase tracking-wider">
                Vale {p.pts} pontos se acertar
              </span>
            </div>
            <input
              type="text"
              disabled={apenasLeitura}
              value={respostas[p.id] || ''}
              onChange={(e) => handleInputChange(p.id, e.target.value)}
              placeholder={p.placeholder}
              className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm outline-none w-full sm:w-72 font-semibold text-white focus:outline-none focus:border-purple-500 transition disabled:opacity-40 disabled:bg-slate-900"
            />
          </div>
        ))}
      </div>
    </div>
  );
}