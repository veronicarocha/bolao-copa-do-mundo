'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

const TODAS_SELECOES = [
  'África do Sul', 'Alemanha', 'Arábia Saudita', 'Argélia', 'Argentina', 'Austrália', 'Áustria',
  'Bélgica', 'Bósnia', 'Brasil', 'Cabo Verde', 'Canadá', 'Catar', 'Colômbia', 'Coreia do Sul',
  'Costa do Marfim', 'Croácia', 'Curaçao', 'Egito', 'Equador', 'Escócia', 'Espanha', 'Estados Unidos',
  'França', 'Gana', 'Holanda', 'Haiti', 'Inglaterra', 'Irã', 'Iraque', 'Japão', 'Jordânia',
  'Marrocos', 'México', 'Noruega', 'Nova Zelândia', 'Panamá', 'Paraguai', 'Portugal',
  'RD do Congo', 'República Tcheca', 'Senegal', 'Suécia', 'Suíça', 'Tunísia', 'Turquia',
  'Uruguai', 'Uzbequistao'
].sort((a, b) => a.localeCompare(b));

interface MatrizApostas {
  [selecao: string]: {
    mm16: string[];
    oitavas: string[];
    quartas: string[];
    semi: string[];
    finalistas: string[];
    campeao: string[];
  }
}

export default function EstatisticasMataMata() {
  const [matriz, setMatriz] = useState<MatrizApostas>({});
  const [participantes, setParticipantes] = useState<{ id: string; nome: string }[]>([]);
  const [filtroParticipante, setFiltroParticipante] = useState<string>('todos');
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  
  // 📱 Estado para controlar qual país está expandido no ambiente mobile
  const [paisExpandidoMobile, setPaisExpandidoMobile] = useState<string | null>(null);

  function normalizarNomePais(str: string): string {
    if (!str) return '';
    let texto = str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (texto === 'eua' || texto === 'usa' || texto === 'estados unidos da america') {
      return 'estados unidos';
    }
    if (texto === 'bosnia e herzegovina' || texto === 'bosnia herzegovina') {
      return 'bosnia';
    }
    if (texto === 'coreia' || texto === 'republica da coreia') {
      return 'coreia do sul';
    }
    
    return texto;
  }

  useEffect(() => {
    async function carregarFiltros() {
      const { data } = await supabase.from('perfis').select('id, nome').order('nome', { ascending: true });
      if (data) setParticipantes(data);
    }
    carregarFiltros();
  }, []);

  useEffect(() => {
    async function processarMatrizGlobal() {
      try {
        setCarregando(true);

        const { data: perfis } = await supabase.from('perfis').select('id, nome');
        const mapaNomes = new Map(perfis?.map(p => [p.id, p.nome || 'Sem Nome']));

        let todosPalpites: any[] = [];
        let possuiMaisDados = true;
        let pagina = 0;
        const TAMANHO_LOTE = 1000;

        while (possuiMaisDados) {
          let query = supabase
            .from('palpites_matamata')
            .select('user_id, fase_vaga, selecao_escolhida')
            .range(pagina * TAMANHO_LOTE, (pagina + 1) * TAMANHO_LOTE - 1);
          
          if (filtroParticipante !== 'todos') {
            query = query.eq('user_id', filtroParticipante);
          }

          const { data: lote, error } = await query.not('selecao_escolhida', 'is', null);
          
          if (error) throw error;

          if (lote && lote.length > 0) {
            todosPalpites = [...todosPalpites, ...lote];
            pagina++;
            if (lote.length < TAMANHO_LOTE || filtroParticipante !== 'todos') {
              possuiMaisDados = false;
            }
          } else {
            possuiMaisDados = false;
          }
        }

        const matrizInicial: MatrizApostas = {};
        TODAS_SELECOES.forEach(pais => {
          matrizInicial[pais] = { mm16: [], oitavas: [], quartas: [], semi: [], finalistas: [], campeao: [] };
        });

        const mapaPaisesOficiais = new Map(TODAS_SELECOES.map(p => [normalizarNomePais(p), p]));

        todosPalpites.forEach(p => {
          const palpiteLimpo = normalizarNomePais(p.selecao_escolhida);
          const paisOficial = mapaPaisesOficiais.get(palpiteLimpo);

          if (paisOficial && matrizInicial[paisOficial]) {
            const nomeApostador = mapaNomes.get(p.user_id) || 'Usuário Sem Nome';
            const fase = p.fase_vaga ? p.fase_vaga.trim().toLowerCase() : '';
            const faseBase = fase.split('_')[0];
            const numJogo = parseInt(faseBase.replace(/[^\d]/g, ''), 10);

            if (isNaN(numJogo)) return;

            if (numJogo >= 73 && numJogo <= 88 && (fase.includes('_1') || fase.includes('_2'))) {
              matrizInicial[paisOficial].mm16.push(nomeApostador);
            }

            if (numJogo >= 73 && numJogo <= 88 && !fase.includes('_1') && !fase.includes('_2')) {
              matrizInicial[paisOficial].oitavas.push(nomeApostador);
            }

            if (numJogo >= 89 && numJogo <= 96 && !fase.includes('_1') && !fase.includes('_2')) {
              matrizInicial[paisOficial].quartas.push(nomeApostador);
            }

            if (numJogo >= 97 && numJogo <= 100 && !fase.includes('_1') && !fase.includes('_2')) {
              matrizInicial[paisOficial].semi.push(nomeApostador);
            }

            if ((numJogo === 101 || numJogo === 102) && !fase.includes('_1') && !fase.includes('_2')) {
              matrizInicial[paisOficial].finalistas.push(nomeApostador);
            }

            if (fase.includes('campeao') || (numJogo === 104 && fase === 'j104')) {
              matrizInicial[paisOficial].campeao.push(nomeApostador);
            }
          }
        });

        Object.keys(matrizInicial).forEach(pais => {
          const obj = matrizInicial[pais];
          obj.mm16 = Array.from(new Set(obj.mm16)).sort((a, b) => a.localeCompare(b));
          obj.oitavas = Array.from(new Set(obj.oitavas)).sort((a, b) => a.localeCompare(b));
          obj.quartas = Array.from(new Set(obj.quartas)).sort((a, b) => a.localeCompare(b));
          obj.semi = Array.from(new Set(obj.semi)).sort((a, b) => a.localeCompare(b));
          obj.finalistas = Array.from(new Set(obj.finalistas)).sort((a, b) => a.localeCompare(b));
          obj.campeao = Array.from(new Set(obj.campeao)).sort((a, b) => a.localeCompare(b));
        });

        setMatriz(matrizInicial);
      } catch (err) {
        console.error('Erro ao processar matriz de estatísticas:', err);
      } finally {
        setCarregando(false);
      }
    }

    processarMatrizGlobal();
  }, [filtroParticipante]);

  const togglePaisMobile = (pais: string) => {
    if (paisExpandidoMobile === pais) {
      setPaisExpandidoMobile(null);
    } else {
      setPaisExpandidoMobile(pais);
    }
  };

  const selecoesFiltradas = TODAS_SELECOES.filter(pais =>
    normalizarNomePais(pais).includes(normalizarNomePais(termoBusca))
  );

  return (
    <div className="min-h-screen w-full bg-slate-900 p-4 md:p-8 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Painel de Controle e Filtros */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Raio-X do <span className="text-amber-400">Mata-Mata</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">Monitore e audite as escolhas de fases de todas as seleções.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="flex flex-col w-full sm:w-56 text-left">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Filtrar Apostador</label>
              <select
                value={filtroParticipante}
                onChange={(e) => setFiltroParticipante(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 px-3 py-2.5 rounded-xl text-xs font-bold text-white outline-none focus:border-amber-500 cursor-pointer transition"
              >
                <option value="todos">👤 Todos os Participantes</option>
                {participantes.map(p => (
                  <option key={p.id} value={p.id}>👤 {p.nome}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col w-full sm:w-52 text-left">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Buscar Seleção</label>
              <input
                type="text"
                placeholder="Ex: Estados Unidos..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold focus:border-amber-500 outline-none text-white placeholder-gray-500 transition"
              />
            </div>
          </div>
        </div>
        
        {carregando ? (
          <div className="p-12 text-center text-gray-400 font-mono text-xs animate-pulse">
            Sincronizando e tratando dados estruturais com o banco...
          </div>
        ) : (
          <div className="space-y-3">
            {selecoesFiltradas.map((pais) => {
              const dados = matriz[pais];
              if (!dados) return null;

              const totalApostasTime = dados.mm16.length + dados.oitavas.length + dados.quartas.length + dados.semi.length + dados.finalistas.length + dados.campeao.length;
              const estaExpandido = paisExpandidoMobile === pais;

              return (
                <div
                  key={pais}
                  className={`rounded-2xl border transition flex flex-col xl:grid xl:grid-cols-12 gap-2 xl:gap-4 items-stretch xl:items-start p-3 xl:p-4 ${
                    totalApostasTime > 0
                      ? 'bg-slate-950/70 border-white/5 hover:border-white/10'
                      : 'bg-slate-950/20 border-white/5 opacity-40 hover:opacity-60'
                  }`}
                >
                  {/* Cabeçalho do Card: No mobile funciona como o botão do Accordion */}
                  <div 
                    onClick={() => togglePaisMobile(pais)}
                    className="xl:col-span-2 flex items-center justify-between xl:flex-col xl:items-start xl:justify-center py-1 text-left cursor-pointer xl:cursor-default select-none"
                  >
                    <div>
                      <span className="text-sm font-black text-white tracking-wide block">
                        {pais === 'Estados Unidos' ? 'EUA / Estados Unidos' : pais}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500 mt-0.5 block">
                        {totalApostasTime} ocorrências
                      </span>
                    </div>
                    
                    {/* Indicador visual de expansão (Seta) visível apenas no Mobile */}
                    <div className="xl:hidden text-xs font-mono text-amber-400 bg-white/5 h-7 w-7 rounded-lg flex items-center justify-center border border-white/10">
                      {estaExpandido ? '▲' : '▼'}
                    </div>
                  </div>

                  {/* Grid de Fases: Aberto nativamente no Desktop, controlado por colapso no Mobile */}
                  <div className={`xl:col-span-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-2 xl:mt-0 ${
                    estaExpandido ? 'block animate-fadeIn' : 'hidden xl:grid'
                  }`}>
                    <BlocoFase titulo="16 Avos (32)" apostadores={dados.mm16} cor="border-emerald-500/20 text-emerald-400 bg-emerald-500/5" />
                    <BlocoFase titulo="Oitavas (16)" apostadores={dados.oitavas} cor="border-blue-500/20 text-blue-400 bg-blue-500/5" />
                    <BlocoFase titulo="Quartas (8)" apostadores={dados.quartas} cor="border-purple-500/20 text-purple-400 bg-purple-500/5" />
                    <BlocoFase titulo="Semi (4)" apostadores={dados.semi} cor="border-pink-500/20 text-pink-400 bg-pink-500/5" />
                    <BlocoFase titulo="Finais (2)" apostadores={dados.finalistas} cor="border-orange-500/20 text-orange-400 bg-orange-500/5" />
                    <BlocoFase titulo="🏆 Campeão (1)" apostadores={dados.campeao} cor="border-amber-500/30 text-amber-400 bg-amber-400/10 font-black" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BlocoFase({ titulo, apostadores, cor }: { titulo: string, apostadores: string[], cor: string }) {
  return (
    <div className={`p-2.5 rounded-xl border flex flex-col gap-1 min-h-[68px] ${cor} text-left`}>
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{titulo}</span>
      {apostadores.length === 0 ? (
        <span className="text-[10px] font-mono text-gray-600 italic mt-auto">—</span>
      ) : (
        <div className="text-[11px] font-semibold tracking-tight text-gray-300 space-y-0.5 max-h-[100px] xl:max-h-[80px] overflow-y-auto scrollbar-thin mt-1">
          {apostadores.map(nome => (
            <div key={nome} className="truncate">👤 {nome}</div>
          ))}
        </div>
      )}
    </div>
  );
}