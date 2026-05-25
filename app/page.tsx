'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    // Autenticação direta no Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error) {
      setErro('Usuário ou senha incorretos. Verifique suas credenciais.');
      setCarregando(false);
    } else {
      // Redireciona o participante para o painel principal
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-blue-900 to-slate-950 flex flex-col items-center justify-center p-4">
      {/* Container com efeito Glassmorphism */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
        
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Bolão Oficial 2026
          </span>
          <h1 className="text-3xl font-black text-white mt-3 tracking-tight">
            COPA DO MUNDO
          </h1>
          <p className="text-blue-200 text-xs mt-2 font-medium">
            Insira suas credenciais para dar seus palpites
          </p>
        </div>

        {/* Formulário de Acesso */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-2 tracking-wider">
              E-mail do Participante
            </label>
            <input 
              type="email" 
              required 
              disabled={carregando}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-2 tracking-wider">
              Senha
            </label>
            <input 
              type="password" 
              required 
              disabled={carregando}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {/* Erro de Autenticação */}
          {erro && (
            <div className="text-red-300 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 font-medium">
              {erro}
            </div>
          )}

          {/* Botão */}
          <button 
            type="submit" 
            disabled={carregando}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-900/30 transition transform active:scale-95 disabled:opacity-50 disabled:transform-none"
          >
            {carregando ? 'Verificando...' : 'Entrar no Bolão'}
          </button>
        </form>
      </div>

      <span className="text-[10px] text-white/40 mt-6 tracking-wide font-mono">
        Bolão da familia e amigos ! 2026
      </span>
    </div>
  );
}