"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  Settings,
  User,
  Palette,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  X,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone,
  Globe,
  Lock,
  Mail,
  Camera
} from 'lucide-react'

interface UserSettingsProps {
  isOpen: boolean
  onClose: () => void
  username: string
  isTemporary: boolean
  onLogout: () => void
}

export default function UserSettings({ isOpen, onClose, username, isTemporary, onLogout }: UserSettingsProps) {
  const [activeTab, setActiveTab] = useState('profile')
  const [notifications, setNotifications] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('online')
  const [theme, setTheme] = useState('system')

  const tabs = [
    { id: 'profile', label: '个人资料', icon: User },
    { id: 'appearance', label: '外观设置', icon: Palette },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'privacy', label: '隐私安全', icon: Shield },
    { id: 'help', label: '帮助中心', icon: HelpCircle },
  ]

  const handleSaveSettings = () => {
    // 这里保存设置到localStorage或发送到服务器
    localStorage.setItem('user_settings', JSON.stringify({
      notifications,
      soundEnabled,
      email,
      status,
      theme
    }))
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 设置面板 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            <Card className="glassmorphism-strong border-white/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">用户设置</CardTitle>
                      <CardDescription>管理你的个人资料和应用偏好</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <div className="flex h-[600px]">
                {/* 侧边栏 */}
                <div className="w-64 border-r border-white/10 bg-gradient-to-b from-background/50 to-background/30 backdrop-blur-md">
                  <div className="p-4">
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-3 ring-4 ring-white/20">
                        <span className="text-2xl font-bold text-white">
                          {username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg">{username}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs mt-1 ${
                        isTemporary
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'bg-green-500/20 text-green-300 border border-green-500/30'
                      }`}>
                        <div className="w-2 h-2 bg-current rounded-full" />
                        {isTemporary ? '临时账户' : '永久账户'}
                      </span>
                    </div>

                    <nav className="space-y-1">
                      {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                              activeTab === tab.id
                                ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-white/20 shadow-lg'
                                : 'hover:bg-white/10 text-muted-foreground hover:text-white'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{tab.label}</span>
                          </button>
                        )
                      })}
                    </nav>
                  </div>
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {/* 个人资料 */}
                    {activeTab === 'profile' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold mb-4">个人资料</h3>

                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center ring-4 ring-white/20">
                                  <span className="text-2xl font-bold text-white">
                                    {username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center ring-2 ring-background">
                                  <Camera className="h-3 w-3 text-white" />
                                </button>
                              </div>
                              <div>
                                <p className="font-medium text-lg">{username}</p>
                                <p className="text-sm text-muted-foreground">点击更改头像</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="status">在线状态</Label>
                                <select
                                  value={status}
                                  onChange={(e) => setStatus(e.target.value)}
                                  className="w-full mt-1 px-3 py-2 bg-background/50 border border-white/20 rounded-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="online">🟢 在线</option>
                                  <option value="busy">🔴 忙碌</option>
                                  <option value="away">🟡 离开</option>
                                </select>
                              </div>

                              <div>
                                <Label htmlFor="email">邮箱地址</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="your@email.com"
                                  className="mt-1 bg-background/50 border-white/20 backdrop-blur-sm"
                                  disabled={!isTemporary}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                          <Button
                            onClick={onLogout}
                            variant="destructive"
                            className="w-full gap-2 bg-red-500/20 hover:bg-red-500/30 border-red-500/30"
                          >
                            <LogOut className="h-4 w-4" />
                            退出登录
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* 外观设置 */}
                    {activeTab === 'appearance' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold mb-4">外观设置</h3>

                          <div className="space-y-4">
                            <div>
                              <Label>主题模式</Label>
                              <div className="grid grid-cols-3 gap-2 mt-2">
                                <button
                                  onClick={() => setTheme('light')}
                                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                                    theme === 'light'
                                      ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                      : 'border-white/20 hover:bg-white/10'
                                  }`}
                                >
                                  <Sun className="h-5 w-5" />
                                  <span className="text-sm">浅色</span>
                                </button>
                                <button
                                  onClick={() => setTheme('dark')}
                                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                                    theme === 'dark'
                                      ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                      : 'border-white/20 hover:bg-white/10'
                                  }`}
                                >
                                  <Moon className="h-5 w-5" />
                                  <span className="text-sm">深色</span>
                                </button>
                                <button
                                  onClick={() => setTheme('system')}
                                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                                    theme === 'system'
                                      ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                      : 'border-white/20 hover:bg-white/10'
                                  }`}
                                >
                                  <Monitor className="h-5 w-5" />
                                  <span className="text-sm">跟随系统</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 通知设置 */}
                    {activeTab === 'notifications' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold mb-4">通知设置</h3>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">桌面通知</p>
                                <p className="text-sm text-muted-foreground">接收新消息的桌面通知</p>
                              </div>
                              <button
                                onClick={() => setNotifications(!notifications)}
                                className={`w-12 h-6 rounded-full transition-colors ${
                                  notifications ? 'bg-purple-500' : 'bg-gray-600'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                  notifications ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">声音提醒</p>
                                <p className="text-sm text-muted-foreground">新消息提示音</p>
                              </div>
                              <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={`w-12 h-6 rounded-full transition-colors ${
                                  soundEnabled ? 'bg-purple-500' : 'bg-gray-600'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 隐私安全 */}
                    {activeTab === 'privacy' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold mb-4">隐私安全</h3>

                          <div className="space-y-4">
                            <div className="p-4 border border-white/20 rounded-lg backdrop-blur-sm">
                              <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-green-500" />
                                <div>
                                  <p className="font-medium">端到端加密</p>
                                  <p className="text-sm text-muted-foreground">你的消息受到端到端加密保护</p>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 border border-white/20 rounded-lg backdrop-blur-sm">
                              <div className="flex items-center gap-3">
                                <Lock className="h-5 w-5 text-blue-500" />
                                <div>
                                  <p className="font-medium">隐私模式</p>
                                  <p className="text-sm text-muted-foreground">已启用高级隐私保护</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 帮助中心 */}
                    {activeTab === 'help' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold mb-4">帮助中心</h3>

                          <div className="space-y-3">
                            <a href="#" className="block p-4 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3">
                                <HelpCircle className="h-5 w-5 text-purple-500" />
                                <div>
                                  <p className="font-medium">使用指南</p>
                                  <p className="text-sm text-muted-foreground">了解如何使用coLAN的各个功能</p>
                                </div>
                              </div>
                            </a>

                            <a href="#" className="block p-4 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-blue-500" />
                                <div>
                                  <p className="font-medium">联系我们</p>
                                  <p className="text-sm text-muted-foreground">遇到问题？发送邮件给我们</p>
                                </div>
                              </div>
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 p-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5 backdrop-blur-xl">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    版本 1.0.0 • © 2024 coLAN
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose} className="border-white/20 hover:bg-white/10">
                      取消
                    </Button>
                    <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                      保存设置
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}