"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface InstallationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InstallationModal({ open, onOpenChange }: InstallationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Founders, with You!
          </DialogTitle>
          <DialogDescription className="text-center">
            Let us help you get started with Rōmy
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* SF Installation Option */}
          <div className="p-6 bg-muted/50 rounded-xl border border-border">
            <h3 className="font-medium text-lg mb-2 text-foreground">
              Are you a NGO based in the US?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our Founders will come to your office or house for a hands-on
              installation session / demo!
            </p>
            <Button
              onClick={() => {
                window.open("https://cal.com/getromy/30min", "_blank", "noopener,noreferrer")
                onOpenChange(false)
              }}
              className="w-full"
              variant="default"
            >
              Yes, we're in the US! 🌁
            </Button>
          </div>

          {/* Divider */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Not in SF? No problem!
            </p>
            <Button
              onClick={() => {
                window.open("https://cal.com/getromy/30min", "_blank", "noopener,noreferrer")
                onOpenChange(false)
              }}
              variant="outline"
              className="w-full"
            >
              Schedule Virtual Installation 💻
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
