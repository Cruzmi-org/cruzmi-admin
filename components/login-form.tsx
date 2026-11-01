'use client'

import { useActionState } from 'react'
import { IconAlertCircle, IconLoader2 } from '@tabler/icons-react'
import { signIn, type SignInState } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState: SignInState = { error: null }

export function LoginForm({ initialError }: { initialError?: string | null }) {
  const [state, formAction, isPending] = useActionState(signIn, initialState)
  const error = state.error ?? initialError

  return (
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

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <IconAlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <IconLoader2 className="h-4 w-4 animate-spin" />}
        Se connecter
      </Button>
    </form>
  )
}
