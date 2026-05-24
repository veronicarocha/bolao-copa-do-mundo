import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useMercado() {
    const [mercadoAberto, setMercadoAberto] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [carregandoMercado, setCarregandoMercado] = useState(true);

    useEffect(() => {
        async function checkStatus() {
            try {
                // Busca a data limite
                const { data: config } = await supabase.from('configuracoes').select('data_limite_palpites').maybeSingle();
                if (config?.data_limite_palpites) {
                    setMercadoAberto(new Date() < new Date(config.data_limite_palpites));
                }

                // Busca se é admin
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: perfil } = await supabase.from('perfis').select('is_admin').eq('id', user.id).maybeSingle();
                    if (perfil) setIsAdmin(perfil.is_admin);
                }
            } catch (err) {
                console.error("Erro ao verificar mercado:", err);
            } finally {
                setCarregandoMercado(false);
            }
        }
        checkStatus();
    }, []);

    const apenasLeitura = !mercadoAberto && !isAdmin;

    return { mercadoAberto, isAdmin, apenasLeitura, carregandoMercado };
}