'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

// Lista estrita oficial para garantir que todas as seleções apareçam na tabela fixa
const TODAS_SELECOES = [
  'África do Sul', 'Alemanha', 'Arábia Saudita', 'Argélia', 'Argentina', 'Austrália', 'Áustria',
  'Bélgica', 'Bósnia', 'Brasil', 'Cabo Verde', 'Canadá', 'Catar', 'Colômbia', 'Coreia do Sul',
  'Costa do Marfim', 'Croácia', 'Curaçao', 'Egito', 'Equador', 'Escócia', 'Espanha', 'EUA',
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
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');

  function removerAcentos(str: string): string {
    if (!str) return '';
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  useEffect(() => {
    async function processarMatrizGlobal() {
      try {
        setCarregando(true);

        // 1. Carrega perfis para resolver nomes em memória
        const { data: perfis } = await supabase.from('perfis').select('id, nome');
        const mapaNomes = new Map(perfis?.map(p => [p.id, p.nome || 'Sem Nome']));

        // 2. Carrega todos os palpites salvos no mata-mata
        const { data: palpites } = await supabase
          .from('palpites_matamata')
          .select('user_id, fase_vaga, selecao_escolhida')
          .not('selecao_escolhida', 'is', null);

        // Inicializa a estrutura da matriz vazia para TODAS as 48 seleções
        const matrizInicial: MatrizApostas = {};
        TODAS_SELECOES.forEach(pais => {
          matrizInicial[pais] = { mm16: [], oitavas: [], quartas: [], semi: [], finalistas: [], campeao: [] };
        });

        // Criamos um mapa de busca rápida por aproximação textual de strings normalizadas
        const mapaPaisesOficiais = new Map(TODAS_SELECOES.map(p => [removerAcentos(p), p]));

        // 3. Distribui os palpites aplicando a lógica de árvore estrutural direta (J104 = Campeão)
        palpites?.forEach(p => {
          const palpiteLimpo = removerAcentos(p.selecao_escolhida);
          const paisOficial = mapaPaisesOficiais.get(palpiteLimpo);
          
          if (paisOficial && matrizInicial[paisOficial]) {
            const nomeApostador = mapaNomes.get(p.user_id) || 'Usuário Sem Nome';
            const fase = p.fase_vaga ? p.fase_vaga.trim().toLowerCase() : '';
            const numJogo = parseInt(fase.replace(/[^\d]/g, ''), 10);

            if (isNaN(numJogo)) return;

            // 🌟 SE ESTÁ NO J104: É o Campeão do usuário! Ele ganha o título e herda toda a árvore para trás
            if (numJogo === 104) {
              matrizInicial[paisOficial].campeao.push(nomeApostador);
              matrizInicial[paisOficial].finalistas.push(nomeApostador);
              matrizInicial[paisOficial].semi.push(nomeApostador);
              matrizInicial[paisOficial].quartas.push(nomeApostador);
              matrizInicial[paisOficial].oitavas.push(nomeApostador);
              matrizInicial[paisOficial].mm16.push(nomeApostador);
            }
            // 🌟 SE ESTÁ NO J103: Jogo de 3º lugar garante que o time chegou até a Semifinal
            else if (numJogo === 103) {
              matrizInicial[paisOficial].semi.push(nomeApostador);
              matrizInicial[paisOficial].quartas.push(nomeApostador);
              matrizInicial[paisOficial].oitavas.push(nomeApostador);
              matrizInicial[paisOficial].mm16.push(nomeApostador);
            } 
            // 🌟 SE ESTÁ NOS JOGOS DA SEMI (J101 ou J102)
            else if (numJogo === 101 || numJogo === 102) {
              matrizInicial[paisOficial].semi.push(nomeApostador);
              matrizInicial[paisOficial].quartas.push(nomeApostador);
              matrizInicial[paisOficial].oitavas.push(nomeApostador);
              matrizInicial[paisOficial].mm16.push(nomeApostador);
            } 
            // 🌟 SE ESTÁ NOS JOGOS DAS QUARTAS (J97 a J100)
            else if (numJogo >= 97 && numJogo <= 100) {
              matrizInicial[paisOficial].quartas.push(nomeApostador);
              matrizInicial[paisOficial].oitavas.push(nomeApostador);
              matrizInicial[paisOficial].mm16.push(nomeApostador);
            } 
            // 🌟 CASE 5: SE ESTÁ NOS JOGOS DAS OITAVAS (J89 a J96) - Avançou para as Quartas
            else if (numJogo >= 89 && numJogo <= 96) {
              matrizInicial[paisOficial].quartas.push(nomeApostador);
              matrizInicial[paisOficial].oitavas.push(nomeApostador);
              matrizInicial[paisOficial].mm16.push(nomeApostador);
            } 
            // 🌟 CASE 6: SE ESTÁ NOS JOGOS DOS 16 AVOS (J73 a J88) - Garante presença nos 16 Avos E nas Oitavas!
            else if (numJogo >= 73 && numJogo <= 88) {
              matrizInicial[paisOficial].oitavas.push(nomeApostador);
              matrizInicial[paisOficial].mm16.push(nomeApostador);
            }
          }
        });

        // Remove duplicados de nomes na mesma célula e ordena em ordem alfabética
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
  }, []);

  // Filtro de pesquisa em tempo real na tela
  const selecoesFiltradas = TODAS_SELECOES.filter(pais => 
    removerAcentos(pais).includes(removerAcentos(termoBusca))
  );

  return (
    <div className="min-h-screen w-full bg-slate-900 p-4 md:p-8 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">Mapa Completo de Apostas 🧭</span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Raio-X de Escolhas do <span className="text-amber-400">Mata-Mata</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">Lista de todas as seleções da Copa e quem confiou nelas em cada estágio da competição.</p>
          </div>

          <input
            type="text"
            placeholder="🔍 Filtrar país..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full md:w-64 bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold focus:border-amber-500 outline-none text-white placeholder-gray-500 transition"
          />
        </div>

        {carregando ? (
          <div className="p-12 text-center text-gray-400 font-mono text-xs animate-pulse">
            Montando tabela comparativa estrutural...
          </div>
        ) : (
          <div className="space-y-4">
            {selecoesFiltradas.map((pais) => {
              const dados = matriz[pais];
              if (!dados) return null;

              const totalApostasTime = dados.mm16.length + dados.oitavas.length + dados.quartas.length + dados.semi.length + dados.finalistas.length + dados.campeao.length;

              return (
                <div 
                  key={pais} 
                  className={`p-4 rounded-2xl border transition grid grid-cols-1 xl:grid-cols-12 gap-4 items-start ${
                    totalApostasTime > 0 
                      ? 'bg-slate-950/70 border-white/5 hover:border-white/10' 
                      : 'bg-slate-950/20 border-white/5 opacity-40 hover:opacity-60'
                  }`}
                >
                  {/* Nome da Seleção (Fixo) */}
                  <div className="xl:col-span-2 flex flex-col justify-center py-1">
                    <span className="text-sm font-black text-white tracking-wide">{pais}</span>
                    <span className="text-[10px] font-mono text-gray-500 mt-0.5">{totalApostasTime} indicações totais</span>
                  </div>

                  {/* Grid de Fases */}
                  <div className="xl:col-span-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    
                    {/* Célula Generica para renderizar os blocos */}
                    <BlocoFase titulo="16 Avos (5 pts)" apostadores={dados.mm16} cor="border-emerald-500/20 text-emerald-400 bg-emerald-500/5" />
                    <BlocoFase titulo="Oitavas (10 pts)" apostadores={dados.oitavas} cor="border-blue-500/20 text-blue-400 bg-blue-500/5" />
                    <BlocoFase titulo="Quartas (20 pts)" apostadores={dados.quartas} cor="border-purple-500/20 text-purple-400 bg-purple-500/5" />
                    <BlocoFase titulo="Semi (25 pts)" apostadores={dados.semi} cor="border-pink-500/20 text-pink-400 bg-pink-500/5" />
                    <BlocoFase titulo="Finalistas (30 pts)" apostadores={dados.finalistas} cor="border-orange-500/20 text-orange-400 bg-orange-500/5" />
                    <BlocoFase titulo="🏆 Campeão (30 pts)" apostadores={dados.campeao} cor="border-amber-500/30 text-amber-400 bg-amber-400/10 font-black" />

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

// Subcomponente interno para manter o layout limpo e legível
function BlocoFase({ titulo, apostadores, cor }: { titulo: string, apostadores: string[], cor: string }) {
  return (
    <div className={`p-2 rounded-xl border flex flex-col gap-1 min-h-[68px] ${cor}`}>
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{titulo}</span>
      {apostadores.length === 0 ? (
        <span className="text-[10px] font-mono text-gray-600 italic mt-auto">—</span>
      ) : (
        <div className="text-[11px] font-semibold tracking-tight text-gray-300 space-y-0.5 max-h-[80px] overflow-y-auto scrollbar-thin mt-1">
          {apostadores.map(nome => (
            <div key={nome} className="truncate">👤 {nome}</div>
          ))}
        </div>
      )}
    </div>
  );
}