'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Eye, Code, FileText, FileVideo, FileAudio, Image as ImageIcon, File } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface FilePreviewProps {
  fileInfo: {
    original_name: string
    url: string
    filename: string
  }
  username?: string
  timestamp?: string
  isOwn?: boolean
}

const FilePreview: React.FC<FilePreviewProps> = ({ fileInfo, username, timestamp, isOwn }) => {
  const [showPreview, setShowPreview] = useState(false)
  const [codeContent, setCodeContent] = useState<string>('')
  const [loadingCode, setLoadingCode] = useState(false)

  const fileName = fileInfo.original_name
  // Get server base URL dynamically
  const getServerUrl = () => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol
      const hostname = window.location.hostname
      const port = window.location.port || (hostname === 'localhost' ? '3000' : '')
      const portStr = port ? `:${port}` : ''
      return `${protocol}//${hostname}${portStr}`
    }
    return ''
  }

  const fileUrl = fileInfo.url.startsWith('http')
    ? fileInfo.url
    : `${getServerUrl()}${fileInfo.url}`
  const fileExtension = fileName.split('.').pop()?.toLowerCase()

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'].includes(fileExtension || '')
  const isVideo = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'wmv', 'flv'].includes(fileExtension || '')
  const isAudio = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(fileExtension || '')
  const isCode = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml', 'yaml', 'yml', 'md', 'sql', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'r', 'sh', 'bat', 'ps1'].includes(fileExtension || '')

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-4 w-4" />
    if (isVideo) return <FileVideo className="h-4 w-4" />
    if (isAudio) return <FileAudio className="h-4 w-4" />
    if (isCode) return <Code className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getFileTypeColor = () => {
    if (isImage) return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    if (isVideo) return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
    if (isAudio) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
    if (isCode) return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
    return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
  }

  const loadCodeContent = async () => {
    if (!isCode || codeContent) return

    setLoadingCode(true)
    try {
      const response = await fetch(fileUrl)
      const text = await response.text()
      setCodeContent(text)
    } catch (error) {
      console.error('Failed to load file content:', error)
    } finally {
      setLoadingCode(false)
    }
  }

  const handlePreviewClick = () => {
    if (isImage || isVideo || isAudio) {
      setShowPreview(true)
    } else if (isCode) {
      loadCodeContent()
      setShowPreview(true)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getSyntaxLanguage = () => {
    const langMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'r': 'r',
      'sh': 'bash',
      'bat': 'batch',
      'ps1': 'powershell'
    }
    return langMap[fileExtension || ''] || 'text'
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {!isOwn && username && (
          <div className="flex flex-col items-center min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <div className={`flex flex-col max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && username && (
            <span className="text-xs text-muted-foreground mb-1 px-1">{username}</span>
          )}

          <motion.div
            className={`rounded-lg border-2 p-3 backdrop-blur-sm ${getFileTypeColor()} ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'}`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="flex items-center gap-2 mb-2">
              {getFileIcon()}
              <span className="font-medium text-sm truncate">{fileName}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviewClick}
                className="flex items-center gap-1 px-2 py-1 bg-background/50 hover:bg-background/70 rounded transition-colors text-xs"
              >
                <Eye className="h-3 w-3" />
                Preview
              </button>

              <a
                href={fileUrl}
                download={fileName}
                className="flex items-center gap-1 px-2 py-1 bg-background/50 hover:bg-background/70 rounded transition-colors text-xs"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            </div>
          </motion.div>

          {timestamp && (
            <span className="text-xs text-muted-foreground mt-1 px-1">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-background border-2 border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-background/80 hover:bg-background border border-border rounded-full backdrop-blur-sm transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {getFileIcon()}
                  <h3 className="text-lg font-semibold truncate">{fileName}</h3>
                </div>

                <div className="max-h-[70vh] overflow-auto">
                  {isImage && (
                    <img
                      src={fileUrl}
                      alt={fileName}
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  )}

                  {isVideo && (
                    <video
                      src={fileUrl}
                      controls
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  )}

                  {isAudio && (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <FileAudio className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <audio
                          src={fileUrl}
                          controls
                          className="w-full max-w-md"
                        />
                      </div>
                    </div>
                  )}

                  {isCode && (
                    <div className="rounded-lg overflow-hidden">
                      {loadingCode ? (
                        <div className="flex items-center justify-center p-8">
                          <div className="text-center">
                            <Code className="h-16 w-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
                            <p className="text-muted-foreground">Loading code...</p>
                          </div>
                        </div>
                      ) : codeContent ? (
                        <SyntaxHighlighter
                          language={getSyntaxLanguage()}
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          {codeContent}
                        </SyntaxHighlighter>
                      ) : (
                        <div className="flex items-center justify-center p-8">
                          <div className="text-center">
                            <Code className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Failed to load code content</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!isImage && !isVideo && !isAudio && !isCode && (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                        <a
                          href={fileUrl}
                          download={fileName}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Download File
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FilePreview