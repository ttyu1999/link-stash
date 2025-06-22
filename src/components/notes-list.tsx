"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ExternalLinkIcon,
  TrashIcon,
  CopyIcon,
  Share2Icon,
  MoreHorizontalIcon,
  CalendarIcon,
  TagIcon,
  FolderIcon,
  LinkIcon,
  SparklesIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getNotes, deleteNote } from "@/lib/actions"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Note {
  id: string
  url: string
  title: string
  description: string | null
  category: string | null
  tags: string[]
  createdAt: Date
}

const formatSafeDate = (dateValue: unknown) => {
  try {
    if (!dateValue) return "未知時間"

    const date = dateValue instanceof Date ? dateValue : new Date(dateValue as string | number | Date)

    if (isNaN(date.getTime())) {
      return "無效日期"
    }

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return "剛剛"
    if (diffMinutes < 60) return `${diffMinutes} 分鐘前`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} 小時前`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} 天前`

    return date.toLocaleDateString("zh-TW")
  } catch {
    return "時間錯誤"
  }
}

export function NotesList() {
  const { searchQuery, selectedCategories, selectedTags, sortBy, sortOrder, setSelectedCategories, setSelectedTags } =
    useAppStore()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<{ id: string; title: string } | null>(null)

  const handleTagClick = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleCategoryClick = (category: string) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const {
    data: rawNotes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notes", searchQuery, selectedCategories, selectedTags],
    queryFn: () =>
      getNotes(
        searchQuery || undefined,
        selectedCategories.length > 0 ? selectedCategories : undefined,
        selectedTags.length > 0 ? selectedTags : undefined,
      ),
    staleTime: 1000 * 60 * 5,
  })

  const notes = [...rawNotes].sort((a, b) => {
    let compareResult = 0

    switch (sortBy) {
      case "createdAt":
        compareResult = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case "title":
        compareResult = a.title.localeCompare(b.title)
        break
    }

    return sortOrder === "asc" ? compareResult : -compareResult
  })

  const handleDeleteClick = (id: string, title: string) => {
    setNoteToDelete({ id, title })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return

    try {
      await deleteNote(noteToDelete.id)
      toast.success("筆記已刪除，相關分類和標籤已自動清理")

      queryClient.invalidateQueries({ queryKey: ["notes"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["notes-for-tags"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "刪除失敗")
      refetch()
    } finally {
      setDeleteDialogOpen(false)
      setNoteToDelete(null)
    }
  }

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("網址已複製到剪貼板")
    } catch {
      toast.error("複製失敗")
    }
  }

  const handleShare = async (note: Note) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: note.description || "",
          url: note.url,
        })
      } catch {
        // 用戶取消分享，不顯示錯誤
      }
    } else {
      handleCopyUrl(note.url)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white/60 backdrop-blur-md border-white/30 shadow-lg">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-slate-200 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 rounded"></div>
                      <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-slate-200 rounded-full w-16"></div>
                      <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="bg-red-50/80 backdrop-blur-sm border-red-200">
        <AlertDescription className="text-red-800">
          {error instanceof Error ? error.message : "載入筆記失敗"}
        </AlertDescription>
      </Alert>
    )
  }

  if (!notes || !Array.isArray(notes) || notes.length === 0) {
    return (
      <Card className="bg-white/60 backdrop-blur-md border-white/30 shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <LinkIcon className="h-12 w-12 text-blue-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-800">
                {searchQuery || selectedCategories.length > 0 || selectedTags.length > 0
                  ? "沒有找到符合條件的筆記"
                  : "開始您的智慧收藏之旅"}
              </h3>
              <p className="text-slate-600 max-w-md">
                {!searchQuery && selectedCategories.length === 0 && selectedTags.length === 0
                  ? "添加您的第一個網址，讓 AI 幫您自動分類和標記"
                  : "試試調整搜尋條件或清除篩選器"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleCardClick = (noteId: string, event: React.MouseEvent) => {
    // 避免在點擊互動元素時觸發卡片導航
    const target = event.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('a') ||
      target.closest('[data-radix-collection-item]')
    ) {
      return
    }
    router.push(`/note/${noteId}`)
  }

  return (
    <>
      <div className="space-y-6">
        {notes.map((note, index) => (
          <Card
            key={note.id}
            className="group relative overflow-hidden bg-white/70 backdrop-blur-md border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
            onClick={(e) => handleCardClick(note.id, e)}
          >
            {/* 裝飾性漸變邊框 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <CardContent className="relative p-6">
              <div className="flex items-start gap-4">
                {/* 網站圖標 */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <LinkIcon className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* 主要內容 */}
                <div className="flex-1 min-w-0">
                  {/* 標題和網址 */}
                  <div className="mb-4">
                    <h3 className="font-bold text-xl leading-tight mb-2 line-clamp-2 text-slate-900 group-hover:text-blue-600 transition-colors duration-200">{note.title}</h3>
                    <a
                      href={note.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors duration-200 bg-slate-100/60 px-3 py-1 rounded-full"
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                      {new URL(note.url).hostname.replace(/^www\./, '')}
                    </a>
                  </div>

                  {/* 描述 */}
                  {note.description && (
                    <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed text-sm">{note.description}</p>
                  )}

                  {/* 標籤和分類 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {note.category && (
                      <Badge
                        variant={selectedCategories.includes(note.category) ? "default" : "secondary"}
                        className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedCategories.includes(note.category)
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCategoryClick(note.category!)
                        }}
                      >
                        <FolderIcon className="h-3 w-3" />
                        {note.category}
                      </Badge>
                    )}
                    {Array.isArray(note.tags) &&
                      note.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer transition-all duration-200 hover:scale-105 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleTagClick(tag)
                          }}
                        >
                          <TagIcon className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                  </div>

                  {/* 時間戳 */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{formatSafeDate(note.createdAt)}</span>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-all duration-200 hover:bg-white/60 hover:shadow-md rounded-xl z-10 relative"
                      >
                        <MoreHorizontalIcon className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-md border-white/30">
                      <DropdownMenuItem onClick={() => handleCopyUrl(note.url)}>
                        <CopyIcon className="h-4 w-4" />
                        複製網址
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(note)}>
                        <Share2Icon className="h-4 w-4" />
                        分享
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(note.url, "_blank")}>
                        <ExternalLinkIcon className="h-4 w-4" />
                        開啟原網頁
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(note.id, note.title)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <TrashIcon className="text-red-600 h-4 w-4" />
                        刪除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white/90 backdrop-blur-md border-white/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">確認刪除</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              確定要刪除「{noteToDelete?.title}」嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
