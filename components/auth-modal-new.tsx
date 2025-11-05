'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

import { useIsMobile } from '@/hooks/use-mobile'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type AuthMode = 'sign-in' | 'sign-up'

/**
 * Google OAuth icon
 */
const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

/**
 * Google Sign In Button Component
 */
interface GoogleSignInButtonProps {
  loading: boolean
  setLoading: (loading: boolean) => void
  mode: AuthMode
}

const GoogleSignInButton = ({
  loading,
  setLoading,
  mode
}: GoogleSignInButtonProps) => {
  const handleGoogleAuth = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/oauth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      if (error) throw error
    } catch (error: unknown) {
      console.error('Google auth error:', error)
      setLoading(false)
    }
  }

  return (
    <button
      className="relative w-full h-12 text-sm font-normal bg-muted/50 hover:bg-muted transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-start px-4 gap-3 group"
      disabled={loading}
      onClick={handleGoogleAuth}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <GoogleIcon className="w-5 h-5" />
        )}
      </div>
      <span className="text-foreground/80 group-hover:text-foreground transition-colors">
        {mode === 'sign-in' ? 'Sign in with Google' : 'Sign up with Google'}
      </span>
    </button>
  )
}

/**
 * Email/Password Form Component
 */
interface EmailPasswordFormProps {
  mode: AuthMode
  onSuccess: () => void
}

const EmailPasswordForm = ({ mode, onSuccess }: EmailPasswordFormProps) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'sign-up') {
        if (password !== repeatPassword) {
          setError('Passwords do not match')
          setIsLoading(false)
          return
        }

        const avatarUrl = `https://api.dicebear.com/9.x/dylan/svg?seed=${encodeURIComponent(email)}&backgroundColor=00A5E4`

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: name,
              avatar_url: avatarUrl
            }
          }
        })
        if (error) throw error
        // Show verification dialog
        setError(null)
        setShowVerifyDialog(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        router.push('/')
        router.refresh()
        onSuccess()
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'sign-up' && (
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="h-11"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <PasswordInput
          id="password"
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="h-11"
        />
      </div>
      {mode === 'sign-up' && (
        <div className="space-y-2">
          <Label htmlFor="repeat-password" className="text-sm font-medium">
            Repeat Password
          </Label>
          <PasswordInput
            id="repeat-password"
            type="password"
            placeholder="••••••••"
            required
            value={repeatPassword}
            onChange={e => setRepeatPassword(e.target.value)}
            className="h-11"
          />
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full h-11" disabled={isLoading}>
        {isLoading
          ? mode === 'sign-in'
            ? 'Signing in...'
            : 'Creating account...'
          : mode === 'sign-in'
            ? 'Sign In'
            : 'Sign Up'}
      </Button>
    </form>

    <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Verify your email address</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              We&apos;ve sent a verification email to <strong>{email}</strong>.
            </p>
            <p>
              Please check your inbox and click the verification link to activate your account.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={() => {
            setShowVerifyDialog(false)
            onSuccess()
          }}>
            Got it
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

/**
 * Main Authentication Modal Component
 */
export function AuthModalNew({ open, onOpenChange }: AuthModalProps) {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const isMobile = useIsMobile()

  const content = (
    <>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-foreground mb-1">
          {mode === 'sign-in' ? 'Sign in to continue' : 'Create an account'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === 'sign-in'
            ? 'Welcome back! Sign in to access your account'
            : 'Get started with a new account'}
        </p>
      </div>

      {/* Google OAuth */}
      <div className="space-y-2 mb-4">
        <GoogleSignInButton
          loading={googleLoading}
          setLoading={setGoogleLoading}
          mode={mode}
        />
      </div>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-background text-muted-foreground">or</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <EmailPasswordForm mode={mode} onSuccess={() => onOpenChange(false)} />

      {/* Mode Toggle */}
      <div className="mt-6">
        <p className="text-sm text-center text-muted-foreground">
          {mode === 'sign-in' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('sign-up')}
                className="text-foreground font-medium hover:underline underline-offset-4"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('sign-in')}
                className="text-foreground font-medium hover:underline underline-offset-4"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-background text-muted-foreground">or</span>
        </div>
      </div>

      {/* Guest Option */}
      <Button
        variant="ghost"
        onClick={() => onOpenChange(false)}
        className="w-full h-10 font-normal text-sm"
      >
        Continue without account
      </Button>

      {/* Legal */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        By continuing, you accept our{' '}
        <Link
          href="/terms"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Terms
        </Link>
        {' & '}
        <Link
          href="/privacy"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Privacy Policy
        </Link>
      </p>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] px-6 pb-6">
          <DrawerHeader className="px-0 pt-4 pb-0">
            <DrawerTitle className="text-lg font-medium">
              {mode === 'sign-in' ? 'Sign in to continue' : 'Create an account'}
            </DrawerTitle>
            <p className="text-sm text-muted-foreground pt-1">
              {mode === 'sign-in'
                ? 'Welcome back! Sign in to access your account'
                : 'Get started with a new account'}
            </p>
          </DrawerHeader>
          <div className="overflow-y-auto scrollbar-hide pt-4">
            {/* Google OAuth */}
            <div className="space-y-2 mb-4">
              <GoogleSignInButton
                loading={googleLoading}
                setLoading={setGoogleLoading}
                mode={mode}
              />
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-background text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <EmailPasswordForm
              mode={mode}
              onSuccess={() => onOpenChange(false)}
            />

            {/* Mode Toggle */}
            <div className="mt-6">
              <p className="text-sm text-center text-muted-foreground">
                {mode === 'sign-in' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('sign-up')}
                      className="text-foreground font-medium hover:underline underline-offset-4"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('sign-in')}
                      className="text-foreground font-medium hover:underline underline-offset-4"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-background text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            {/* Guest Option */}
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full h-10 font-normal text-sm"
            >
              Continue without account
            </Button>

            {/* Legal */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              By continuing, you accept our{' '}
              <Link
                href="/terms"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Terms
              </Link>
              {' & '}
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] p-6 gap-0">
        {content}
      </DialogContent>
    </Dialog>
  )
}

