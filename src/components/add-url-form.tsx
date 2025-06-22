"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { PlusIcon, LoaderIcon, LinkIcon, XIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { saveUrl } from "@/lib/actions"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"

export function AddUrlForm() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { searchQuery, selectedCategories } = useAppStore()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      toast.error("請輸入網址")
      return
    }

    setIsLoading(true)

    try {
      const result = await saveUrl(url.trim())
      toast.success("網址保存成功！AI 正在分析內容...")
      setUrl("")
      setIsExpanded(false)

      queryClient.invalidateQueries({ queryKey: ["notes"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失敗")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50">
        {!isExpanded ? (
          <div className="relative group">
            {/* 背景光暈效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

            <Button
              onClick={() => setIsExpanded(true)}
              size="lg"
              className="relative w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group"
            >
              <PlusIcon className="h-7 w-7 group-hover:rotate-90 transition-transform duration-300" />
            </Button>

            {/* 提示文字 */}
            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-slate-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                添加新網址
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          </div>
        ) : (
          <Card className="w-96 shadow-2xl border-0 bg-white/90 backdrop-blur-md p-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <LinkIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">添加網址</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <SparklesIcon className="h-3 w-3" />
                      AI 自動分析內容
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    placeholder="貼上網址，AI 將自動分析..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isLoading}
                    className="h-12 bg-white/60 backdrop-blur-sm border-white/30 focus:border-blue-300 focus:ring-blue-200 rounded-xl"
                  />
                  {url && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isLoading || !url.trim()}
                    className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isLoading ? (
                      <>
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4" />
                        保存
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsExpanded(false)}
                    className="h-11 px-4 bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 rounded-xl"
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
