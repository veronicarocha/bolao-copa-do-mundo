'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona automaticamente para a aba padrão (Fase de Grupos)
    router.push('/dashboard/grupos');
  }, [router]);

  return null;
}