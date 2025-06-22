"use client"

import { useQuery } from "@tanstack/react-query"
import { BookmarkIcon, TagIcon, FolderIcon, TrendingUpIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getNotes, getCategories } from "@/lib/actions"

interface Note {
  id: string
  title: string
  description: string | null
  category: string | null
  tags: string[]
  createdAt: Date
}

export function Stats() {
  const { data: notes = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: () => getNotes(),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  })

  const totalNotes = notes.length
  const totalCategories = categories.length
  const allTags = notes.flatMap((note: Note) => note.tags)
  const uniqueTags = [...new Set(allTags)].length
  const thisWeekNotes = notes.filter((note: Note) => {
    const noteDate = new Date(note.createdAt)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return noteDate > weekAgo
  }).length

  const stats = [
    {
      title: "總筆記",
      value: totalNotes,
      icon: BookmarkIcon,
      gradient: "from-blue-500 to-cyan-500",
      change: "+12%",
    },
    {
      title: "智慧分類",
      value: totalCategories,
      icon: FolderIcon,
      gradient: "from-emerald-500 to-teal-500",
      change: "+8%",
    },
    {
      title: "標籤系統",
      value: uniqueTags,
      icon: TagIcon,
      gradient: "from-purple-500 to-pink-500",
      change: "+15%",
    },
    {
      title: "本週新增",
      value: thisWeekNotes,
      icon: TrendingUpIcon,
      gradient: "from-orange-500 to-red-500",
      change: "+23%",
    },
  ]

  return (
    <Card className="relative overflow-hidden bg-white/70 backdrop-blur-md border-white/30 shadow-lg p-0">
      {/* 裝飾性漸變背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>

      <CardContent className="relative p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat: { title: string; value: number; icon: React.ElementType; gradient: string; change: string }, index: number) => {
            const IconComponent = stat.icon
            return (
              <div
                key={stat.title}
                className="flex items-center gap-3 group"
                style={{
                  animationDelay: `${String(index * 100)}ms`,
                }}
              >
                {/* 圖標 */}
                <div
                  className={`p-2.5 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md group-hover:shadow-lg transition-shadow duration-300`}
                >
                  <IconComponent className="h-5 w-5 text-white" />
                </div>

                {/* 數據和標題 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</span>
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 truncate">{stat.title}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* 底部裝飾線 */}
        {/* <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 opacity-20"></div> */}
      </CardContent>
    </Card>
  )
}
