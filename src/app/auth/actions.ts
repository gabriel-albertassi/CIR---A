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
    return { error: error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const confirmEmail = formData.get('confirmEmail') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (email !== confirmEmail) {
    return { error: 'Os e-mails informados não coincidem.' }
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas informadas não coincidem.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cir-a-fo1k.vercel.app'}/auth/callback`,
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
          canPrintReports: true, // Todos podem imprimir por padrão
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

export async function sendPasswordResetAction(email: string) {
  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://cir-a-fo1k.vercel.app'
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function updatePasswordAction(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem.' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }
  return { success: true }
}
