'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [nomeUsuario, setNomeUsuario] = useState('');
    const [carregando, setCarregando] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        async function verificarSessao() {
            // Verifica se o usuário está logado
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/');
                return;
            }

            // Busca os privilégios do perfil na nossa tabela customizada
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

    // Estilização utilitária para marcar a aba ativa no menu
    const linkClasse = (path: string) => `px-3 py-2 rounded-lg text-sm font-medium transition ${pathname === path ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
        }`;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            {/* Barra de Navegação Superior */}
            <nav className="bg-slate-950 border-b border-white/10 px-6 py-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">

                    {/* Logo / Título */}
                    <div className="flex items-center space-x-3">
                        <span className="text-xl">🏆</span>
                        <span className="font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                            BOLÃO COPA 2026
                        </span>
                    </div>

                    {/* Abas do Menu <Link href="/dashboard/informacoes" className={linkClasse('/dashboard/informacoes')}> Classificação</Link> *\c*/}
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/dashboard/regras" className={linkClasse('/dashboard/regras')}>📜 Regras</Link>
                                            
                        <Link href="/dashboard/grupos" className={linkClasse('/dashboard/grupos')}>Fase de Grupos</Link>
                        <Link href="/dashboard/matamata" className={linkClasse('/dashboard/matamata')}>Mata-Mata</Link>
                        <Link href="/dashboard/especiais" className={linkClasse('/dashboard/especiais')}>🔥 Especiais</Link>
                    
                        <Link href="/dashboard/ranking" className={linkClasse('/dashboard/ranking')}>Ranking</Link>

                        <Link href="/dashboard/espiar-jogo" className={linkClasse('/dashboard/espiar-jogo')}> 🕵️‍♂️ Espiar Palpites</Link>
                        

                        {/* Exibe o botão de Administração apenas se for TRUE no banco */}
                        {isAdmin && (
                            <Link href="/admin" className="px-3 py-2 rounded-lg text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition">
                                Painel Admin
                            </Link>
                        )}
                    </div>

                    {/* Informações do Perfil & Logout */}
                    <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-400">Olá, <strong className="text-gray-200">{nomeUsuario}</strong></span>
                        <button
                            onClick={handleLogout}
                            className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-md border border-red-500/20 transition"
                        >
                            Sair
                        </button>
                    </div>

                </div>
            </nav>

            {/* Conteúdo Dinâmico das Páginas */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}