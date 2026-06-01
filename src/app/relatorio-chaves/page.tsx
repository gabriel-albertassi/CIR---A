import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/sb-server';
import ClientReportTabs from './ClientReportTabs';
import { Key } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RelatorioChavesPage() {
  // Obter usuário logado e verificar role
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;

  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    if (dbUser?.role === 'ADMIN') {
      isAdmin = true;
    }
  }

  // Buscar todas as chaves ordenadas da mais recente para a mais antiga
  const keys = await prisma.authorizationKey.findMany({
    orderBy: {
      created_at: 'desc'
    }
  });

  // Agrupar as chaves por tipo
  const tcKeys = keys.filter(k => k.type === 'TC');
  const rnmKeys = keys.filter(k => k.type === 'RNM');
  const avulsaKeys = keys.filter(k => k.type !== 'TC' && k.type !== 'RNM'); // AVULSA e GERAL

  // O componente ClientReportTabs cuidará do agrupamento por Mês/Ano na UI
  return (
    <div className="flex flex-col h-full bg-[#030914] text-white print:h-auto print:bg-white print:text-black">
      {/* Header Premium (Mesmo estilo das outras páginas) */}
      <header className="flex-shrink-0 flex items-center gap-4 px-8 py-6 border-b border-white/5 bg-[#030914]/80 backdrop-blur-md sticky top-0 z-10 print:static print:bg-white print:border-black/20">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 print:border-black/20 print:bg-transparent">
          <Key className="text-indigo-400 print:text-black" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-slate-100 print:text-black">
            Controle Geral de Chaves
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 print:text-black">
            Relatórios de Autorizações: TC, RNM e Planilha de Sobreaviso
          </p>
        </div>
      </header>

      {/* Conteúdo Principal com as Tabs */}
      <div className="flex-1 overflow-hidden print:overflow-visible print:h-auto">
        <ClientReportTabs
          tcKeys={tcKeys}
          rnmKeys={rnmKeys}
          avulsaKeys={avulsaKeys}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
