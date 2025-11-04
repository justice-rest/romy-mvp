'use client'

import { useState, memo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { User } from '@supabase/supabase-js'
import { LogIn, LogOut } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { AuthModalNew } from './auth-modal-new'
import { ExternalLinkItems } from './external-link-items'
import { SettingsIcon, type SettingsIconHandle } from './ui/settings'
import { ThemeSwitcher } from './theme-switcher'
import { ThemeMenuItems } from './theme-menu-items'

// Navigation Menu Component - contains all the general navigation items
const NavigationMenu = memo(() => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const settingsIconRef = useRef<SettingsIconHandle>(null)

  // Control the animation based on dropdown state
  useEffect(() => {
    if (isOpen) {
      settingsIconRef.current?.startAnimation()
    } else {
      settingsIconRef.current?.stopAnimation()
    }
  }, [isOpen])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-center hover:bg-accent hover:text-accent-foreground rounded-md transition-colors cursor-pointer !size-6 !p-0 !m-0">
              <SettingsIcon ref={settingsIconRef} size={18} />
            </div>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          Menu
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="w-[240px] z-[110] mr-5">
        <DropdownMenuItem className="cursor-pointer py-1 hover:bg-transparent!">
          <div
            className="flex items-center justify-between w-full px-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">Theme</span>
            </div>
            <ThemeSwitcher />
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ExternalLinkItems />
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

NavigationMenu.displayName = 'NavigationMenu'

// User Profile Component - focused on user authentication and account management
const UserProfile = memo(({ user }: { user: User | null }) => {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  const getInitials = (name: string, email: string | undefined) => {
    if (name && name !== 'User') {
      const names = name.split(' ')
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.split('@')[0].substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  const handleLogout = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {user ? (
        // Authenticated user - show avatar dropdown with account options
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'relative h-6 w-6 rounded-full',
                    signingOut && 'animate-pulse'
                  )}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={avatarUrl} alt={userName} />
                    <AvatarFallback>
                      {getInitials(userName, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              Account
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent className="w-60 z-[110] mr-5" align="end" forceMount>
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none truncate">
                {userName}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // Unauthenticated user - show simple sign in button
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className={cn(
                'h-7 px-2.5 text-xs rounded-md shadow-sm group',
                'hover:scale-[1.02] active:scale-[0.98] transition-transform'
              )}
              onClick={() => setAuthModalOpen(true)}
            >
              <LogIn className="size-3.5 mr-1.5" />
              <span>Sign in</span>
              <span className="ml-1.5 hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-full bg-primary-foreground/15 text-primary-foreground/90">
                Free
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={4}>
            Sign in to save progress and sync across devices
          </TooltipContent>
        </Tooltip>
      )}

      <AuthModalNew open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  )
})

UserProfile.displayName = 'UserProfile'

export { UserProfile, NavigationMenu }

