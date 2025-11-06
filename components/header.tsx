'use client'

import React, { useState } from 'react'
import Link from 'next/link'

import { User } from '@supabase/supabase-js'
import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

import { useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { Button } from './ui/button'
import { InstallationModal } from './installation'
import { NavigationMenu, UserProfile } from './user-profile'

interface HeaderProps {
  user: User | null
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const { open } = useSidebar()
  const [isInstallationModalOpen, setIsInstallationModalOpen] = useState(false)

  return (
    <TooltipProvider>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-30 flex justify-between items-center p-3 transition-colors duration-200',
          'bg-background',
          user && !open && 'pl-16 md:pl-3'
        )}
      >
        {/* Left side */}
        <div className="flex items-center gap-3">
          {!user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-lg bg-accent hover:bg-accent/80 group transition-all hover:scale-105 pointer-events-auto"
                  >
                    <Plus size={16} className="group-hover:rotate-90 transition-all" />
                    <span className="text-sm ml-1.5 group-hover:block hidden animate-in fade-in duration-300">
                      New
                    </span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                Start a new chat
              </TooltipContent>
            </Tooltip>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsInstallationModalOpen(true)}
            className="rounded-lg hover:bg-accent/50 transition-all hover:scale-105 pointer-events-auto"
          >
            Founders
          </Button>
        </div>

        {/* Right side - Navigation Menu for unauthenticated users */}
        {!user && (
          <div className="flex items-center gap-1 ml-auto">
            <NavigationMenu />
            <UserProfile user={user} />
          </div>
        )}
      </header>
      <InstallationModal
        open={isInstallationModalOpen}
        onOpenChange={setIsInstallationModalOpen}
      />
    </TooltipProvider>
  )
}

export default Header
