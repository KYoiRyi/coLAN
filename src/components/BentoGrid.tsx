"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/Card"
import { cn } from "@/lib/utils"

interface BentoGridProps {
  children: React.ReactNode
  className?: string
}

interface BentoCardProps {
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  animate?: boolean
  as?: keyof JSX.IntrinsicElements
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 p-4",
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        "auto-rows-[120px]",
        className
      )}
    >
      {children}
    </div>
  )
}

export function BentoCard({
  children,
  className,
  size = "md",
  animate = true,
  as: Component = "div"
}: BentoCardProps) {
  const sizeClasses = {
    sm: "col-span-1 row-span-1",
    md: "col-span-1 row-span-1 md:col-span-1",
    lg: "col-span-1 row-span-1 md:col-span-2 lg:col-span-2",
    xl: "col-span-1 row-span-1 md:col-span-2 lg:col-span-3",
    full: "col-span-1 row-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4"
  }

  const MotionComponent = motion[Component as keyof typeof motion] as any

  const cardContent = (
    <Card className={cn(
      "bento-card cursor-pointer",
      "relative overflow-hidden group",
      sizeClasses[size],
      className
    )}>
      <CardContent className="h-full p-6 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10 w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  )

  if (animate) {
    return (
      <MotionComponent
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: Math.random() * 0.1 }}
        whileHover={{ scale: 1.02 }}
        className="h-full"
      >
        {cardContent}
      </MotionComponent>
    )
  }

  return <div className="h-full">{cardContent}</div>
}

// Specific Bento card components for different content types
interface BentoStatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  className?: string
}

export function BentoStatCard({
  title,
  value,
  description,
  icon,
  size = "md",
  className
}: BentoStatCardProps) {
  return (
    <BentoCard size={size} className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </h3>
          <p className="text-2xl font-bold text-foreground mb-1">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-primary opacity-80">
            {icon}
          </div>
        )}
      </div>
    </BentoCard>
  )
}

interface BentoActionCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  onClick?: () => void
  size?: "sm" | "md" | "lg" | "xl" | "full"
  className?: string
}

export function BentoActionCard({
  title,
  description,
  icon,
  onClick,
  size = "md",
  className
}: BentoActionCardProps) {
  return (
    <BentoCard size={size} className={className} onClick={onClick}>
      <div className="text-center">
        {icon && (
          <div className="mb-3 flex justify-center text-primary">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </BentoCard>
  )
}