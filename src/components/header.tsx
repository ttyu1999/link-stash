"use client"

import type React from "react"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { BookmarkIcon, LoaderIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { saveUrl } from "@/lib/actions"
import { toast } from "sonner"

export function Header() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      toast.error("請輸入網址")
      return
    }

    setIsLoading(true)

    try {
      await saveUrl(url.trim())
      toast.success("網址保存成功！")
      setUrl("")

      queryClient.invalidateQueries({ queryKey: ["notes"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失敗")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 max-w-6xl">
        {/* 品牌標題 */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <BookmarkIcon className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <SparklesIcon className="h-2 w-2 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Link Stash
            </h1>
            <p className="text-sm text-slate-500 font-medium">AI 驅動的智慧收藏</p>
          </div>
        </div>

        {/* 添加網址表單 */}
        <form onSubmit={handleSubmit} className="hidden md:flex items-center gap-3">
          <div className="relative">
            <Input
              placeholder="貼上網址，AI 自動分析..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="w-80 h-12 pl-4 pr-4 bg-white/60 backdrop-blur-sm border-white/30 focus:border-blue-300 focus:ring-blue-200 rounded-xl shadow-sm"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={isLoading || !url.trim()}
            className="h-12 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <>
                <LoaderIcon className="h-4 w-4 animate-spin" />
                分析中
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </form>
      </div>
    </header>
  )
}
