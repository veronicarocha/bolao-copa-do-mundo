'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [carregando, setCarregando] = useState(true);
  
  // 📱 Estados para Mobile e Interação
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [subPalpitesAberto, setSubPalpitesAberto] = useState(false);
  const [subEspiarAberto, setSubEspiarAberto] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function verificarSessao() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome, is_admin')
        .eq('id', user.id)
        .single();

      if (perfil) {
        setNomeUsuario(perfil.nome);
        setIsAdmin(perfil.is_admin);
      }
      setCarregando(false);
    }
    verificarSessao();
  }, [router]);

  // 🔒 Fecha as cortinas mobile quando o usuário muda de página
  useEffect(() => {
    setMenuMobileAberto(false);
    setSubPalpitesAberto(false);
    setSubEspiarAberto(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-medium">
        Carregando painel seguro...
      </div>
    );
  }

  const linkClasse = (path: string) => 
    `px-3 py-2 rounded-lg text-sm font-medium transition block ${
      pathname === path ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`;

  const dropdownBotaoClasse = (paths: string[]) => 
    `px-3 py-2 rounded-lg text-sm font-bold transition flex items-center justify-between w-full lg:w-auto gap-1 ${
      paths.includes(pathname) ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* 🧭 Barra Superior */}
      <nav className="bg-slate-950 border-b border-white/10 px-4 md:px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Brand/Logo */}
          <div className="flex items-center space-x-2">
            <span className="text-lg md:text-xl">🏆</span>
            <span className="font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 text-sm md:text-base">
              BOLÃO COPA 2026
            </span>
          </div>

          {/* 📱 BOTÃO HAMBÚRGUER (Apenas visível em Telas Pequenas) */}
          <button 
            onClick={() => setMenuMobileAberto(!menuMobileAberto)}
            className="lg:hidden p-2 text-gray-400 hover:text-white focus:outline-none"
            aria-label="Abrir Menu"
          >
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              {menuMobileAberto ? (
                <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 01-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 01-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 011.414-1.414l4.828 4.828 4.829-4.828a1 1 0 111.414 1.414l-4.828 4.828 4.828 4.829z"/>
              ) : (
                <path fillRule="evenodd" d="M4 5h16a1 1 0 010 2H4a1 1 0 110-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2z"/>
              )}
            </svg>
          </button>

          {/* 🖥️ MENU DESKTOP (Oculto no Mobile) */}
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/dashboard/regras" className={linkClasse('/dashboard/regras')}>📜 Regras</Link>
            <Link href="/dashboard/ranking" className={linkClasse('/dashboard/ranking')}>🏆 Ranking</Link>
            
            {/* Dropdown: Meus Palpites */}
            <div className="relative group">
              <button className={dropdownBotaoClasse(['/dashboard/grupos', '/dashboard/matamata', '/dashboard/especiais'])}>
                🎯 Meus Palpites <span className="text-[10px] text-gray-500 group-hover:text-white transition">▼</span>
              </button>
              <div className="absolute left-0 mt-1 w-48 bg-slate-950 border border-white/10 rounded-xl p-1.5 shadow-2xl hidden group-hover:block z-50">
                <Link href="/dashboard/grupos" className={`${linkClasse('/dashboard/grupos')} text-xs`}>Fase de Grupos</Link>
                <Link href="/dashboard/matamata" className={`${linkClasse('/dashboard/matamata')} text-xs mt-1`}>Mata-Mata</Link>
                <Link href="/dashboard/especiais" className={`${linkClasse('/dashboard/especiais')} text-xs mt-1`}>Especiais</Link>
              </div>
            </div>

            <Link href="/dashboard/estatisticas-matamata" className={linkClasse('/dashboard/estatisticas-matamata')}>📊 Raio-X Mata-Mata</Link>
            
            {/* Dropdown: Espiar */}
            <div className="relative group">
              <button className={dropdownBotaoClasse(['/dashboard/espiar-jogo', '/dashboard/espiar-matamata', '/dashboard/espiar-especiais'])}>
                🕵️‍♂️ Espiar <span className="text-[10px] text-gray-500 group-hover:text-white transition">▼</span>
              </button>
              <div className="absolute left-0 mt-1 w-48 bg-slate-950 border border-white/10 rounded-xl p-1.5 shadow-2xl hidden group-hover:block z-50">
                <Link href="/dashboard/espiar-jogo" className={`${linkClasse('/dashboard/espiar-jogo')} text-xs`}>Espiar Palpites</Link>
                <Link href="/dashboard/espiar-matamata" className={`${linkClasse('/dashboard/espiar-matamata')} text-xs mt-1`}>Espiar Mata-Mata</Link>
                <Link href="/dashboard/espiar-especiais" className={`${linkClasse('/dashboard/espiar-especiais')} text-xs mt-1`}>Espiar Especiais</Link>
              </div>
            </div>
            
            {isAdmin && (
              <Link href="/admin" className="px-3 py-2 rounded-lg text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition">Painel Admin</Link>
            )}
          </div>

          {/* Perfil & Logout Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <span className="text-xs text-gray-400">Olá, <strong className="text-gray-200">{nomeUsuario}</strong></span>
            <button onClick={handleLogout} className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-md border border-red-500/20 transition">Sair</button>
          </div>

        </div>

        {/* 📱 GAVETA MOBILE (Aparece via slide/fade apenas no celular) */}
        {menuMobileAberto && (
          <div className="lg:hidden mt-4 pt-4 border-t border-white/10 space-y-2 text-left animate-fadeIn">
            <div className="px-3 py-1 bg-white/5 rounded-lg mb-2 flex justify-between items-center">
              <span className="text-xs text-gray-400">Logado como: <strong className="text-gray-200">{nomeUsuario}</strong></span>
            </div>

            <Link href="/dashboard/regras" className={linkClasse('/dashboard/regras')}>📜 Regras</Link>
            <Link href="/dashboard/ranking" className={linkClasse('/dashboard/ranking')}>🏆 Ranking</Link>
            
            {/* Accordion: Meus Palpites */}
            <div className="space-y-1">
              <button 
                onClick={() => setSubPalpitesAberto(!subPalpitesAberto)}
                className={dropdownBotaoClasse(['/dashboard/grupos', '/dashboard/matamata', '/dashboard/especiais'])}
              >
                <span>🎯 Meus Palpites</span>
                <span className="text-[10px] font-mono">{subPalpitesAberto ? '▲' : '▼'}</span>
              </button>
              {subPalpitesAberto && (
                <div className="bg-black/20 rounded-lg pl-4 pr-2 py-1 space-y-1">
                  <Link href="/dashboard/grupos" className={`${linkClasse('/dashboard/grupos')} text-xs`}>Fase de Grupos</Link>
                  <Link href="/dashboard/matamata" className={`${linkClasse('/dashboard/matamata')} text-xs`}>Mata-Mata</Link>
                  <Link href="/dashboard/especiais" className={`${linkClasse('/dashboard/especiais')} text-xs`}>Especiais</Link>
                </div>
              )}
            </div>

            <Link href="/dashboard/estatisticas-matamata" className={linkClasse('/dashboard/estatisticas-matamata')}>📊 Raio-x Mata-Mata</Link>

            {/* Accordion: Espiar */}
            <div className="space-y-1">
              <button 
                onClick={() => setSubEspiarAberto(!subEspiarAberto)}
                className={dropdownBotaoClasse(['/dashboard/espiar-jogo', '/dashboard/espiar-matamata', '/dashboard/espiar-especiais'])}
              >
                <span>🕵️‍♂️ Espiar</span>
                <span className="text-[10px] font-mono">{subEspiarAberto ? '▲' : '▼'}</span>
              </button>
              {subEspiarAberto && (
                <div className="bg-black/20 rounded-lg pl-4 pr-2 py-1 space-y-1">
                  <Link href="/dashboard/espiar-jogo" className={`${linkClasse('/dashboard/espiar-jogo')} text-xs`}>Espiar Palpites</Link>
                  <Link href="/dashboard/espiar-matamata" className={`${linkClasse('/dashboard/espiar-matamata')} text-xs`}>Espiar Mata-Mata</Link>
                  <Link href="/dashboard/espiar-especiais" className={`${linkClasse('/dashboard/espiar-especiais')} text-xs`}>Espiar Especiais</Link>
                </div>
              )}
            </div>

            {isAdmin && (
              <Link href="/admin" className="px-3 py-2 rounded-lg text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 block text-center">Painel Admin</Link>
            )}

            <button 
              onClick={handleLogout} 
              className="w-full mt-4 text-center px-3 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold"
            >
              🚪 Encerrar Sessão
            </button>
          </div>
        )}
      </nav>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}