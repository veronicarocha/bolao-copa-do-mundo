'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; 

export default function TesteConexao() {
  const [status, setStatus] = useState<'carregando' | 'sucesso' | 'erro'>('carregando');
  const [mensagem, setMensagem] = useState('Conectando ao Supabase...');

  useEffect(() => {
    async function testarBanco() {
      try {
        // Tenta ler a tabela de configuração que inserimos via SQL
        const { data, error } = await supabase
          .from('sistema_config')
          .select('mercado_aberto')
          .single();

        if (error) {
          setStatus('erro');
          setMensagem(`Erro na query: ${error.message}`);
        } else {
          setStatus('sucesso');
          setMensagem(`Conectado com sucesso! O mercado está: ${data.mercado_aberto ? 'ABERTO' : 'FECHADO'}`);
        }
      } catch (err: any) {
        setStatus('erro');
        setMensagem(`Erro inesperado de rede: ${err.message}`);
      }
    }

    testarBanco();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl text-center">
        <h1 className="text-xl font-bold mb-4">Teste de Conexão com o Supabase</h1>
        
        <div className={`p-4 rounded-lg font-mono text-sm ${
          status === 'carregando' ? 'bg-blue-900/30 text-blue-300 border border-blue-500/30' :
          status === 'sucesso' ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30' :
          'bg-red-900/30 text-red-300 border border-red-500/30'
        }`}>
          {mensagem}
        </div>

        {status === 'erro' && (
          <p className="text-xs text-gray-400 mt-4">
            Dica: Verifique se as chaves no arquivo <code className="bg-black/40 px-1 py-0.5 rounded text-red-400">.env.local</code> não contêm espaços, aspas ou quebras de linha adicionais.
          </p>
        )}
      </div>
    </div>
  );
}