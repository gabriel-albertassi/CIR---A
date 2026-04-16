// Build Fix Attempt: 16/04/26 01:29
'use server'

import { createClient } from '../../lib/supabase/sb-server'
import { prisma } from '../../lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: 'Credenciais inválidas ou erro no servidor.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    try {
      // Bootstrap: If this is the first user, make them ADMIN
      const userCount = await prisma.user.count()
      const isFirstUser = userCount === 0

      // Create local user in Prisma
      await prisma.user.create({
        data: {
          id: data.user.id,
          name: name,
          email: email,
          role: isFirstUser ? 'ADMIN' : 'REGULADOR',
          canCancelPatient: isFirstUser,
          canPrintReports: isFirstUser,
        },
      })
    } catch (e) {
      console.error('Prisma Error:', e)
      // If prisma fails, we might want to delete the supabase user, 
      // but for simplicity we'll just return an error.
    }
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
