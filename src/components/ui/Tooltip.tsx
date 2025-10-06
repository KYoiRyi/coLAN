"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tooltipVariants = cva(
  "z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm animate-in fade-in-0 zoom-in-95",
  {
    variants: {
      variant: {
        default: "bg-popover text-popover-foreground border-border",
        primary: "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-purple-400/30 shadow-lg",
        success: "bg-green-500/90 text-white border-green-400/30",
        warning: "bg-orange-500/90 text-white border-orange-400/30",
        error: "bg-red-500/90 text-white border-red-400/30",
        info: "bg-blue-500/90 text-white border-blue-400/30"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> &
    VariantProps<typeof tooltipVariants> & {
      showShortcut?: boolean
      shortcut?: string
    }
>(({ className, variant, sideOffset = 4, showShortcut, shortcut, children, ...props }, ref) => {
  const displayShortcut = showShortcut && shortcut ? (
    <span className="ml-2 text-xs opacity-75 font-mono bg-white/20 px-1 py-0.5 rounded">
      {shortcut}
    </span>
  ) : null

  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(tooltipVariants({ variant }), className)}
      {...props}
    >
      {children}
      {displayShortcut}
      <TooltipPrimitive.Arrow className="fill-current" />
    </TooltipPrimitive.Content>
  )
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  tooltipVariants,
}

// Enhanced tooltip component with keyboard shortcut support
export interface TooltipWithShortcutProps {
  children: React.ReactNode
  content: React.ReactNode
  shortcut?: string
  variant?: VariantProps<typeof tooltipVariants>['variant']
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delayDuration?: number
  skipDelayDuration?: number
  disableHoverableContent?: boolean
}

export function TooltipWithShortcut({
  children,
  content,
  shortcut,
  variant = "primary",
  side = "top",
  align = "center",
  delayDuration = 500,
  skipDelayDuration = 300,
  disableHoverableContent = false,
}: TooltipWithShortcutProps) {
  return (
    <TooltipProvider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      <Tooltip disableHoverableContent={disableHoverableContent}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent variant={variant} side={side} align={align} showShortcut={!!shortcut} shortcut={shortcut}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Simple tooltip wrapper for easy usage
export function SimpleTooltip({
  children,
  content,
  side = "top",
  align = "center"
}: {
  children: React.ReactNode
  content: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} align={align}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}