"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Users, MessageSquare, Home, Settings } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

export function Layout({ children, title }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigationItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: Users, label: "Rooms", href: "/rooms" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b bg-white/80 dark:bg-black/80 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gradient">
            {title || "coLAN"}
          </h1>
        </div>
        <ThemeSwitcher />
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 h-full w-64"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                navigationItems={navigationItems}
                onClose={() => setSidebarOpen(false)}
                mobile={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar navigationItems={navigationItems} />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="hidden lg:flex items-center justify-between p-6 border-b bg-white/80 dark:bg-black/80 backdrop-blur-lg">
            <h1 className="text-2xl font-bold text-gradient">
              {title || "coLAN"}
            </h1>
            <ThemeSwitcher />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

interface SidebarProps {
  navigationItems: Array<{
    icon: React.ElementType
    label: string
    href: string
  }>
  onClose?: () => void
  mobile?: boolean
}

function Sidebar({ navigationItems, onClose, mobile = false }: SidebarProps) {
  return (
    <div className={cn(
      "h-full glassmorphism border-r border-white/20 dark:border-white/10",
      mobile ? "w-64" : "w-72"
    )}>
      <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-white/10">
        <h2 className="text-xl font-bold text-gradient">coLAN</h2>
        {mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 transition-all duration-200",
              "hover:scale-[1.02] hover:bg-white/20 dark:hover:bg-white/10"
            )}
            onClick={mobile ? onClose : undefined}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/20 dark:border-white/10">
        <div className="text-sm text-muted-foreground">
          <p>LAN Collaboration</p>
          <p className="text-xs">Connect • Share • Collaborate</p>
        </div>
      </div>
    </div>
  )
}