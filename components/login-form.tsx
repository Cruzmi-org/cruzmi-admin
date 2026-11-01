'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { IconAlertCircle, IconBrandGoogle, IconLoader2 } from '@tabler/icons-react'
import { signIn, signInWithGoogle, type SignInState } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState: SignInState = { error: null }

export function LoginForm({ initialError }: { initialError?: string | null }) {
  const [state, formAction, isPending] = useActionState(signIn, initialState)
  const error = state.error ?? initialError

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <IconAlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <form action={signInWithGoogle}>
        <GoogleButton />
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou avec email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <IconLoader2 className="h-4 w-4 animate-spin" />}
          Se connecter
        </Button>
      </form>
    </div>
  )
}

function GoogleButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="outline" className="w-full" disabled={pending}>
      {pending ? (
        <IconLoader2 className="h-4 w-4 animate-spin" />
      ) : (
        <IconBrandGoogle className="h-4 w-4" />
      )}
      Continuer avec Google
    </Button>
  )
}
