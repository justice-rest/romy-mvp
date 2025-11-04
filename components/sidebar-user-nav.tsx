'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { User } from '@supabase/supabase-js'
import { ChevronUp, LogOut } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { SettingsIcon } from '@/components/ui/settings'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { ExternalLinkItems } from '@/components/external-link-items'

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

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
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className={cn(
                'h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                signingOut && 'animate-pulse'
              )}
              data-testid="user-nav-button"
            >
              <Avatar className="size-6 rounded-full">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback>
                  {getInitials(userName, user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate" data-testid="user-email">
                {userName}
              </span>
              <ChevronUp className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width)"
            data-testid="user-nav-menu"
            side="top"
          >
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none truncate">
                {userName}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            
            {/* Theme switcher */}
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
            
            {/* External links */}
            <ExternalLinkItems />
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

