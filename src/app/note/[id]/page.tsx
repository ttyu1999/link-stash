"use client"

import { notFound } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { use } from "react"
import {
  ExternalLinkIcon,
  ArrowLeftIcon,
  CalendarIcon,
  TagIcon,
  LinkIcon,
  FolderIcon,
  SparklesIcon,
  CopyIcon,
  Share2Icon,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getNote } from "@/lib/actions"
import { toast } from "sonner"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function NotePage({ params }: PageProps) {
  const { id } = use(params)
  const {
    data: note,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["note", id],
    queryFn: () => getNote(id),
    retry: 1,
  })

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("網址已複製到剪貼板")
    } catch {
      toast.error("複製失敗")
    }
  }

  const handleShare = async () => {
    if (!note) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: note.description || "",
          url: note.url,
        })
      } catch (err) {
        // 用戶取消分享，不顯示錯誤
      }
    } else {
      handleCopyUrl(note.url)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="mt-6 text-slate-600 font-medium text-lg">載入筆記詳情...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !note) {
    notFound()
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-y-auto">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 頂部導航 */}
        <div className="flex flex-wrap gap-2 items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="lg"
            asChild
            className="bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 rounded-xl shadow-sm"
          >
            <Link href="/">
              <ArrowLeftIcon className="h-5 w-5" />
              返回列表
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleCopyUrl(note.url)}
              className="bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 rounded-xl shadow-sm"
            >
              <CopyIcon className="h-4 w-4" />
              複製網址
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleShare}
              className="bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 rounded-xl shadow-sm"
            >
              <Share2Icon className="h-4 w-4" />
              分享
            </Button>
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <a href={note.url} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon className="h-4 w-4" />
                查看原文
              </a>
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* 主要內容卡片 */}
          <Card className="relative overflow-hidden bg-white/70 backdrop-blur-md border-white/30 shadow-xl">
            {/* 裝飾性漸變 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>

            <CardHeader className="relative pb-6">
              <div className="flex items-start gap-6">
                {/* 網站圖標 */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <LinkIcon className="h-8 w-8 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <CardTitle className="text-3xl font-bold text-slate-900 mb-4 leading-tight">{note.title}</CardTitle>

                  {/* 元數據 */}
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="font-medium">
                        {new Date(note.createdAt).toLocaleDateString("zh-TW", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <ExternalLinkIcon className="h-4 w-4" />
                      <a
                        href={note.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors duration-200 font-medium"
                      >
                        {new URL(note.url).hostname}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            {note.description && (
              <CardContent className="relative">
                <div className="bg-slate-50/60 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 text-yellow-500" />
                    AI 生成摘要
                  </h3>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-700 leading-relaxed text-base">{note.description}</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 分類和標籤卡片 */}
          {(note.category || note.tags.length > 0) && (
            <Card className="bg-white/70 backdrop-blur-md border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <TagIcon className="h-5 w-5 text-purple-600" />
                  分類與標籤
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {note.category && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      智慧分類
                    </h4>
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg transition-shadow duration-200 text-sm px-4 py-2">
                      <FolderIcon className="h-4 w-4" />
                      {note.category}
                    </Badge>
                  </div>
                )}

                {note.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      相關標籤
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {note.tags.map((tag, index) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors duration-200 text-sm px-4 py-2"
                          style={{
                            animationDelay: `${index * 100}ms`,
                          }}
                        >
                          <TagIcon className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 網址詳情卡片 */}
          <Card className="bg-white/70 backdrop-blur-md border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-blue-600" />
                網址資訊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50/60 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-600 mb-1">完整網址</p>
                    <p className="text-slate-800 font-mono text-sm break-all">{note.url}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyUrl(note.url)}
                    className="ml-4 hover:bg-white/60 rounded-lg"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
