import Image from 'next/image'
import { IconShieldLock } from '@tabler/icons-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/login-form'

export const metadata = { title: 'Connexion · Cruzmi Admin' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const initialError =
    error === 'forbidden'
      ? "Ce compte n'a pas accès au back-office Cruzmi."
      : error === 'oauth'
        ? 'La connexion avec Google a échoué. Réessayez.'
        : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Image
            src="/images/brand/Logo+nom-Cruzmi.svg"
            alt="Cruzmi"
            width={140}
            height={40}
            className="mx-auto mb-2 h-10 w-auto dark:invert"
            priority
          />
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <IconShieldLock className="h-5 w-5 text-muted-foreground" />
            Back-office
          </CardTitle>
          <CardDescription>Accès réservé aux administrateurs Cruzmi</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm initialError={initialError} />
        </CardContent>
      </Card>
    </main>
  )
}
