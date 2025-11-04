'use client'

import { useRef, useState } from 'react'

import { HugeiconsIcon } from '@hugeicons/react'
import { DocumentAttachmentIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

const allowedImageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const allowedOtherTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv' // .csv
]

const isAllowedFileType = (file: File) =>
  allowedImageTypes.includes(file.type) || allowedOtherTypes.includes(file.type)

export function FileUploadButton({
  onFileSelect
}: {
  onFileSelect: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files).slice(0, 3)

    const validFiles = fileArray.filter(isAllowedFileType)
    const rejected = fileArray.filter(f => !isAllowedFileType(f))

    if (rejected.length > 0) {
      toast.error(
        'Some files were not accepted: ' + rejected.map(f => f.name).join(', ')
      )
    }

    if (validFiles.length > 0) {
      onFileSelect(validFiles)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <TooltipProvider>
      <div
        onDragOver={e => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-full',
          isDragging && 'ring-2 ring-blue-500 ring-offset-2'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.csv"
          hidden
          multiple
          onChange={e => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="group rounded-full transition-colors duration-200 !size-8 border-0 !shadow-none hover:!bg-primary/30 hover:!border-0"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <span className="block">
                <HugeiconsIcon icon={DocumentAttachmentIcon} size={16} />
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={6}
            className="border-0 bg-primary text-primary-foreground py-2 px-3 !shadow-none"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[11px] text-primary-foreground">Attach File</span>
              <span className="text-[10px] text-primary-foreground/70 leading-tight">
                Upload an image, PDF, Excel, or CSV file
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
