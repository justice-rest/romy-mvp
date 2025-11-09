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
          'absolute top-0 right-0 p-3 flex justify-between items-center z-10 backdrop-blur-sm lg:backdrop-blur-none bg-background/80 lg:bg-transparent transition-[width] duration-200 ease-linear',
          open ? 'md:w-[calc(100%-var(--sidebar-width))]' : 'md:w-full',
          'w-full'
        )}
      >
        {/* This div can be used for a logo or title on the left if needed */}
        <div></div>

        <div className="flex items-center gap-2">
          {!user && (
            <NavigationMenu />
          )}
          <UserProfile user={user} />
        </div>
      </header>
      <InstallationModal
        open={isInstallationModalOpen}
        onOpenChange={setIsInstallationModalOpen}
      />
    </TooltipProvider>
  )
}

export default Header
