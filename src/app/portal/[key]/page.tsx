import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { SiteBuilder } from '@/components/SiteBuilder';

export default async function PortalPage({ params }: { params: { key: string } }) {
  const { key } = await params;

  // Busca o site pela chave
  const { data: site, error } = await supabase
    .from('biosites')
    .select('*')
    .eq('editKey', key)
    .single();

  if (error || !site) {
    return (
        <div className="min-h-screen flex items-center justify-center p-5 text-center">
            <h1 className="text-2xl font-bold text-red-600">Chave de acesso inválida ou expirada.</h1>
        </div>
    );
  }

  // Renderiza o SiteBuilder com modo edit
  // NOTA: Precisaremos ajustar SiteBuilder para aceitar o modo 'portal' ou editar
  return (
    <div className='min-h-screen bg-slate-50'>
        <SiteBuilder mode="edit" initialSite={site} onSave={async (updatedSite) => {
            // Lógica de salvamento específico para portal
            await supabase.from('biosites').update(updatedSite).eq('id', site.id);
            alert('Alterações salvas com sucesso!');
        }} />
    </div>
  );
}
