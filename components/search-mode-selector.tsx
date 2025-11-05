'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  AiBrain02Icon,
  AtomicPowerIcon,
  DashboardSpeed01Icon
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { DATA_TYPE_CONFIGS, DataType,RESEARCH_TYPE_CONFIGS } from '@/lib/config/research-types'
import { SEARCH_MODE_CONFIGS } from '@/lib/config/search-modes'
import { ModelType } from '@/lib/types/model-type'
import { SearchMode } from '@/lib/types/search'
import { cn } from '@/lib/utils'
import { getCookie, setCookie } from '@/lib/utils/cookies'

import { Button } from './ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface SearchModeSelectorProps {
  onResearchTypeClick?: (category: string) => void
  onDataTypesChange?: (selectedDataTypes: DataType[]) => void
}

export function SearchModeSelector({ onResearchTypeClick, onDataTypesChange }: SearchModeSelectorProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('quick')
  const [modelType, setModelType] = useState<ModelType>('speed')
  const [open, setOpen] = useState(false)
  const [selectedDataTypes, setSelectedDataTypes] = useState<DataType[]>([])

  // Load saved preferences
  useEffect(() => {
    const savedMode = getCookie('searchMode')
    if (savedMode && ['quick', 'adaptive'].includes(savedMode)) {
      setSearchMode(savedMode as SearchMode)
    } else if (savedMode) {
      // Clean up invalid cookie value
      setCookie('searchMode', 'quick')
      setSearchMode('quick')
    }

    const savedType = getCookie('modelType')
    if (savedType && ['speed', 'quality'].includes(savedType)) {
      setModelType(savedType as ModelType)
    }
  }, [])

  const selectedModeConfig = useMemo(
    () => SEARCH_MODE_CONFIGS.find(config => config.value === searchMode),
    [searchMode]
  )

  const handleModeSelect = useCallback((mode: SearchMode) => {
    setSearchMode(mode)
    setCookie('searchMode', mode)
    setOpen(false)
  }, [])

  const handleModelTypeToggle = useCallback(() => {
    const newType: ModelType = modelType === 'speed' ? 'quality' : 'speed'
    setModelType(newType)
    setCookie('modelType', newType)
  }, [modelType])

  const handleDataTypeToggle = useCallback((dataType: DataType) => {
    setSelectedDataTypes(prev => {
      const newSelection = prev.includes(dataType)
        ? prev.filter(dt => dt !== dataType)
        : [...prev, dataType]
      onDataTypesChange?.(newSelection)
      return newSelection
    })
  }, [onDataTypesChange])

  const isQualityMode = modelType === 'quality'

  return (
    <TooltipProvider>
      <div className="flex items-center bg-background border border-accent/50 rounded-lg !gap-1 !py-1 !px-0.75 h-8">
        {/* Search Mode Selector (Quick/Adaptive) */}
        <Popover open={open} onOpenChange={setOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  aria-expanded={open}
                  size="sm"
                  className={cn(
                    'flex items-center gap-1.5 !m-0 !px-1.5 h-6 !rounded-md transition-all cursor-pointer',
                    'bg-accent text-foreground hover:bg-accent/80'
                  )}
                >
                  {selectedModeConfig && (
                    <>
                      <HugeiconsIcon 
                        icon={searchMode === 'quick' ? DashboardSpeed01Icon : AiBrain02Icon} 
                        size={16} 
                        color="currentColor" 
                        strokeWidth={2} 
                      />
                      <ChevronsUpDown className="size-3 opacity-50" />
                    </>
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className="max-w-[220px] p-2 bg-primary text-primary-foreground border-0"
              sideOffset={4}
            >
              {selectedModeConfig && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="p-0.5 rounded bg-background/20">
                      <HugeiconsIcon
                        icon={searchMode === 'quick' ? DashboardSpeed01Icon : AiBrain02Icon}
                        size={14}
                        className="text-primary-foreground"
                        strokeWidth={2}
                      />
                    </div>
                    <p className="font-semibold text-xs text-primary-foreground">{selectedModeConfig.label} Active</p>
                  </div>
                  <p className="text-[11px] leading-snug text-primary-foreground/80">
                    {selectedModeConfig.description}
                  </p>
                  <p className="text-[10px] text-primary-foreground/60 italic">
                    Click to switch search mode
                  </p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            className="w-[90vw] sm:w-[14em] max-w-[14em] p-0 font-sans rounded-lg bg-popover z-50 border !shadow-none"
            align="start"
            side="bottom"
            sideOffset={4}
            avoidCollisions={true}
            collisionPadding={8}
          >
            <Command className="rounded-lg">
              <CommandInput placeholder="Search modes..." className="h-9" />
              <CommandEmpty>No search mode found.</CommandEmpty>
              <CommandList className="max-h-[400px] overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <CommandGroup>
                  <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground">
                    Search Mode
                  </div>
                  {SEARCH_MODE_CONFIGS.map(config => {
                    const ModeIcon = config.value === 'quick' ? DashboardSpeed01Icon : AiBrain02Icon
                    return (
                      <CommandItem
                        key={config.value}
                        value={config.value}
                        onSelect={() => handleModeSelect(config.value)}
                        className={cn(
                          'flex items-center justify-between px-2 py-2 mb-0.5 rounded-lg text-xs',
                          'transition-all duration-200',
                          'hover:bg-accent',
                          'data-[selected=true]:bg-accent'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-4">
                          <HugeiconsIcon 
                            icon={ModeIcon} 
                            size={20} 
                            color="currentColor" 
                            strokeWidth={2} 
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium truncate text-[11px] text-foreground">
                              {config.label}
                            </span>
                            <div className="text-[9px] text-muted-foreground truncate leading-tight">
                              {config.description}
                            </div>
                          </div>
                        </div>
                        <Check
                          className={cn(
                            'ml-auto h-4 w-4',
                            searchMode === config.value ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>

                {/* Data Section */}
                <CommandGroup>
                  <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground border-t pt-2 mt-1">
                    Data (Multi-select)
                  </div>
                  {DATA_TYPE_CONFIGS.map(config => {
                    const isSelected = selectedDataTypes.includes(config.value)
                    return (
                      <CommandItem
                        key={config.value}
                        value={config.value}
                        onSelect={() => handleDataTypeToggle(config.value)}
                        className={cn(
                          'flex items-center justify-between px-2 py-2 mb-0.5 rounded-lg text-xs cursor-pointer',
                          'transition-all duration-200',
                          'hover:bg-accent',
                          'data-[selected=true]:bg-accent',
                          isSelected && 'bg-accent/50'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-4">
                          <HugeiconsIcon 
                            icon={config.icon} 
                            size={20} 
                            color="currentColor" 
                            strokeWidth={2} 
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium truncate text-[11px] text-foreground">
                              {config.label}
                            </span>
                            <div className="text-[9px] text-muted-foreground truncate leading-tight">
                              {config.description}
                            </div>
                          </div>
                        </div>
                        <Check
                          className={cn(
                            'ml-auto h-4 w-4 shrink-0',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>

                {/* Research Type Section */}
                <CommandGroup>
                  <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground border-t pt-2 mt-1">
                    Research Type
                  </div>
                  {RESEARCH_TYPE_CONFIGS.map(config => {
                    const handleClick = () => {
                      onResearchTypeClick?.(config.label)
                      setOpen(false)
                    }
                    return (
                      <CommandItem
                        key={config.value}
                        value={config.value}
                        onSelect={handleClick}
                        onClick={handleClick}
                        className={cn(
                          'flex items-center justify-between px-2 py-2 mb-0.5 rounded-lg text-xs cursor-pointer',
                          'transition-all duration-200',
                          'hover:bg-accent',
                          'data-[selected=true]:bg-accent'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <HugeiconsIcon 
                            icon={config.icon} 
                            size={20} 
                            color="currentColor" 
                            strokeWidth={2} 
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium truncate text-[11px] text-foreground">
                              {config.label}
                            </span>
                            <div className="text-[9px] text-muted-foreground truncate leading-tight">
                              {config.description}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Model Type Toggle (Speed/Quality) */}
        <Tooltip>
          <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleModelTypeToggle}
                className={cn(
                  'flex items-center gap-1.5 px-3 h-6 rounded-md transition-all',
                  isQualityMode
                    ? 'bg-accent text-foreground hover:bg-accent/80'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
              <HugeiconsIcon 
                icon={AtomicPowerIcon} 
                size={16} 
                color="currentColor" 
                strokeWidth={2} 
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            className="max-w-[220px] p-2 bg-primary text-primary-foreground border-0"
            sideOffset={4}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <div className="p-0.5 rounded bg-background/20">
                  <HugeiconsIcon
                    icon={AtomicPowerIcon}
                    size={14}
                    className="text-primary-foreground"
                    strokeWidth={2}
                  />
                </div>
                <p className="font-semibold text-xs text-primary-foreground">
                  {isQualityMode ? 'Quality Mode Active' : 'Speed Mode'}
                </p>
              </div>
              <p className="text-[11px] leading-snug text-primary-foreground/80">
                {isQualityMode 
                  ? 'Deep research with higher quality analysis' 
                  : 'Fast responses for quick queries'}
              </p>
              <p className="text-[10px] text-primary-foreground/60 italic">
                Click to switch to {isQualityMode ? 'Speed' : 'Quality'} mode
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
