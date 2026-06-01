'use server';

import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/sb-server';
import { revalidatePath } from 'next/cache';

export async function deleteAuthorizationKey(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (dbUser?.role !== 'ADMIN') {
      return { success: false, error: 'Apenas administradores podem apagar chaves.' };
    }

    await prisma.authorizationKey.delete({
      where: { id }
    });

    revalidatePath('/relatorio-chaves');
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao apagar chave:", error);
    return { success: false, error: 'Erro interno ao apagar chave.' };
  }
}
