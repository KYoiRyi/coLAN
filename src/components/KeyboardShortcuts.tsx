"use client"

import { useEffect, useState } from 'react'
import { Key, Command, ChevronRight } from 'lucide-react'

interface Shortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  description: string
  action: () => void
  global?: boolean
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!shortcut.ctrlKey === event.ctrlKey &&
          !!shortcut.shiftKey === event.shiftKey &&
          !!shortcut.altKey === event.altKey &&
          !!shortcut.metaKey === event.metaKey
        ) {
          event.preventDefault()
          event.stopPropagation()
          shortcut.action()
          break
        }
      }
    }

    const targetElement = shortcuts.some(s => s.global) ? document : window
    targetElement.addEventListener('keydown', handleKeyDown)

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[]
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsHelp({ shortcuts, isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredShortcuts = shortcuts.filter(shortcut =>
    shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shortcut.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatKeyDisplay = (shortcut: Shortcut) => {
    const keys = []

    if (shortcut.ctrlKey) keys.push('Ctrl')
    if (shortcut.metaKey) keys.push('⌘')
    if (shortcut.shiftKey) keys.push('Shift')
    if (shortcut.altKey) keys.push('Alt')

    // Format special keys
    let displayKey = shortcut.key
    switch (shortcut.key.toLowerCase()) {
      case ' ':
        displayKey = 'Space'
        break
      case 'escape':
        displayKey = 'Esc'
        break
      case 'enter':
        displayKey = '↵'
        break
      case 'tab':
        displayKey = '⇥'
        break
      case 'delete':
        displayKey = 'Del'
        break
      case 'backspace':
        displayKey = '⌫'
        break
      case 'arrowup':
        displayKey = '↑'
        break
      case 'arrowdown':
        displayKey = '↓'
        break
      case 'arrowleft':
        displayKey = '←'
        break
      case 'arrowright':
        displayKey = '→'
        break
    }

    keys.push(displayKey.toUpperCase())
    return keys.join(' + ')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="glassmorphism-strong border-white/30 shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">键盘快捷键</h2>
                  <p className="text-sm text-muted-foreground">提高你的使用效率</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/10">
            <input
              type="text"
              placeholder="搜索快捷键..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-background/50 border border-white/20 rounded-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>

          {/* Shortcuts List */}
          <div className="p-4 overflow-y-auto max-h-[50vh] custom-scrollbar">
            <div className="space-y-4">
              {/* Global Shortcuts */}
              {filteredShortcuts.filter(s => s.global).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Command className="h-4 w-4" />
                    全局快捷键
                  </h3>
                  <div className="space-y-2">
                    {filteredShortcuts.filter(s => s.global).map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1 text-xs font-mono bg-background/50 px-2 py-1 rounded border border-white/20">
                          {formatKeyDisplay(shortcut)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Context-Specific Shortcuts */}
              {filteredShortcuts.filter(s => !s.global).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    场景快捷键
                  </h3>
                  <div className="space-y-2">
                    {filteredShortcuts.filter(s => !s.global).map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1 text-xs font-mono bg-background/50 px-2 py-1 rounded border border-white/20">
                          {formatKeyDisplay(shortcut)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
            <p className="text-xs text-muted-foreground text-center">
              提示：在任何地方按下 <kbd className="px-1 py-0.5 bg-background/50 border border-white/20 rounded text-xs">?</kbd> 查看此帮助
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Common shortcut definitions for coLAN
export const colanShortcuts = {
  global: [
    {
      key: '?',
      description: '显示键盘快捷键帮助',
      action: () => {
        // This will be overridden by the component
        console.log('Show keyboard shortcuts help')
      },
      global: true
    },
    {
      key: 'Escape',
      description: '关闭模态框或取消当前操作',
      action: () => {
        // This will be handled by the component
        console.log('Escape pressed')
      },
      global: true
    }
  ],

  login: [
    {
      key: 'Enter',
      description: '提交登录表单',
      action: () => {
        // Submit login form
        console.log('Submit login')
      }
    },
    {
      key: 'Tab',
      description: '切换输入框',
      action: () => {
        // Navigate between form fields
        console.log('Tab between fields')
      }
    }
  ],

  dashboard: [
    {
      key: 'n',
      ctrlKey: true,
      description: '创建新房间',
      action: () => {
        // Open create room modal
        console.log('Create new room')
      }
    },
    {
      key: 'r',
      description: '刷新房间列表',
      action: () => {
        // Refresh rooms
        console.log('Refresh rooms')
      }
    }
  ],

  chat: [
    {
      key: 'Enter',
      description: '发送消息',
      action: () => {
        // Send message
        console.log('Send message')
      }
    },
    {
      key: 'Enter',
      shiftKey: true,
      description: '换行输入',
      action: () => {
        // Add new line to message
        console.log('New line in message')
      }
    },
    {
      key: 'u',
      description: '显示在线用户',
      action: () => {
        // Show online users
        console.log('Show online users')
      }
    },
    {
      key: 'f',
      description: '显示文件列表',
      action: () => {
        // Show files
        console.log('Show files')
      }
    },
    {
      key: 's',
      ctrlKey: true,
      description: '打开设置',
      action: () => {
        // Open settings
        console.log('Open settings')
      }
    },
    {
      key: 'l',
      description: '离开房间',
      action: () => {
        // Leave room
        console.log('Leave room')
      }
    },
    {
      key: '/',
      description: '聚焦到输入框',
      action: () => {
        // Focus message input
        console.log('Focus message input')
      }
    }
  ]
}

export type { Shortcut }