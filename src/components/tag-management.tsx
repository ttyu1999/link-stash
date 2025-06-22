"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  TagIcon,
  EditIcon,
  TrashIcon,
  MergeIcon,
  SearchIcon,
  TrendingUpIcon,
  CheckIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { getTags, renameTag, mergeTags, deleteTag } from "@/lib/actions"
import { toast } from "sonner"

interface Tag {
  name: string
  count: number
}

export function TagManagement() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tagToRename, setTagToRename] = useState<Tag | null>(null)
  const [newTagName, setNewTagName] = useState("")
  const [mergeTargetName, setMergeTargetName] = useState("")

  // 使用 useQuery 獲取標籤資料
  const {
    data: tags = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
    staleTime: 5 * 60 * 1000, // 5分鐘緩存
  })

  // 篩選標籤
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 處理選擇標籤
  const handleTagSelect = (tagName: string, checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedTags([...selectedTags, tagName])
    } else {
      setSelectedTags(selectedTags.filter((t) => t !== tagName))
    }
  }

  // 全選/全不選
  const handleSelectAll = () => {
    if (selectedTags.length === filteredTags.length) {
      setSelectedTags([])
    } else {
      setSelectedTags(filteredTags.map((tag) => tag.name))
    }
  }

  // 重命名標籤
  const handleRename = async () => {
    if (!tagToRename || !newTagName.trim()) return

    try {
      await renameTag(tagToRename.name, newTagName.trim())
      toast.success(`標籤「${tagToRename.name}」已重命名為「${newTagName.trim()}」`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tags"] }),
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["notes-for-tags"] }),
      ])
      setRenameDialogOpen(false)
      setTagToRename(null)
      setNewTagName("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "重命名失敗")
    }
  }

  // 合併標籤
  const handleMerge = async () => {
    if (selectedTags.length === 0 || !mergeTargetName.trim()) return

    try {
      const result = await mergeTags(selectedTags, mergeTargetName.trim())
      toast.success(`已將 ${selectedTags.length.toString()} 個標籤合併到「${mergeTargetName.trim()}」，更新了 ${result.updatedCount.toString()} 筆記錄`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tags"] }),
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["notes-for-tags"] }),
      ])
      setMergeDialogOpen(false)
      setSelectedTags([])
      setMergeTargetName("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "合併失敗")
    }
  }

  // 刪除標籤
  const handleDelete = async () => {
    if (selectedTags.length === 0) return

    try {
      for (const tagName of selectedTags) {
        await deleteTag(tagName)
      }
      toast.success(`已刪除 ${selectedTags.length.toString()} 個標籤`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tags"] }),
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["notes-for-tags"] }),
      ])
      setDeleteDialogOpen(false)
      setSelectedTags([])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "刪除失敗")
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-md border-white/30 shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/70 backdrop-blur-md border-white/30 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <p className="text-red-600">載入標籤失敗</p>
            <Button onClick={() => void refetch()} variant="outline">
              重試
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-white/70 backdrop-blur-md border-white/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-purple-600" />
            標籤管理
            <Badge variant="secondary" className="ml-2">
              {tags.length.toString()} 個標籤
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 搜尋和批量操作 */}
          <div className="space-y-4">
            {/* 搜尋框 */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="搜尋標籤名稱..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                }}
                className="pl-10 bg-white/60 border-white/30 focus:border-purple-300 focus:ring-purple-200"
              />
            </div>

            {/* 批量操作 */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="bg-white/60"
              >
                <CheckIcon className="h-4 w-4" />
                {selectedTags.length === filteredTags.length ? "全不選" : "全選"}
              </Button>

              {selectedTags.length > 0 && (
                <>
                  <Badge variant="secondary" className="px-3 py-1">
                    已選擇 {selectedTags.length.toString()} 個標籤
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMergeDialogOpen(true)
                    }}
                    className="bg-white/60 text-blue-600 hover:bg-blue-50"
                  >
                    <MergeIcon className="h-4 w-4" />
                    合併標籤
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeleteDialogOpen(true)
                    }}
                    className="bg-white/60 text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    刪除標籤
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 標籤列表 */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTags.map((tag) => (
              <div
                key={tag.name}
                className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-white/30 hover:bg-white/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <Checkbox
                      id={`tag-${tag.name}`}
                      checked={selectedTags.includes(tag.name)}
                      onCheckedChange={(checked) => {
                        handleTagSelect(tag.name, checked)
                      }}
                      className="mr-3"
                    />
                    <label htmlFor={`tag-${tag.name}`} className="font-medium text-slate-800 cursor-pointer">
                      {tag.name}
                    </label>
                  </div>

                  {/* 標籤數量 */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-sm text-slate-500 gap-1">
                      <TrendingUpIcon className="h-4 w-4" />
                      <span>{tag.count.toString()}</span>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTagToRename(tag)
                          setNewTagName(tag.name)
                          setRenameDialogOpen(true)
                        }}
                        className="h-8 w-8 p-0 hover:bg-slate-100"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTags.length === 0 && (
            <div className="text-center py-8 text-slate-600">
              {searchQuery ? "找不到符合條件的標籤" : "尚未有任何標籤"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 重命名標籤對話框 */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名標籤</DialogTitle>
            <DialogDescription>
              將標籤「{tagToRename?.name}」重命名，此操作將更新所有相關筆記。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={newTagName}
              onChange={(e) => {
                setNewTagName(e.target.value)
              }}
              placeholder="輸入新標籤名稱"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false)
              }}
            >
              取消
            </Button>
            <Button onClick={() => void handleRename()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 合併標籤對話框 */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>合併標籤</DialogTitle>
            <DialogDescription>
              將 {selectedTags.length.toString()} 個選定標籤合併到一個新標籤或現有標籤中。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              <strong>將合併：</strong> {selectedTags.join(", ")}
            </p>
            <Input
              value={mergeTargetName}
              onChange={(e) => {
                setMergeTargetName(e.target.value)
              }}
              placeholder="輸入目標標籤名稱"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMergeDialogOpen(false)
              }}
            >
              取消
            </Button>
            <Button onClick={() => void handleMerge()}>合併</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除標籤確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除 {selectedTags.length.toString()} 個選定標籤嗎？此操作將從所有筆記中移除這些標籤，且無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedTags([])
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 