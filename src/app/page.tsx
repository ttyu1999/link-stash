"use client"

import { Suspense } from "react"
import { NotesList } from "@/components/notes-list"
import { SearchAndFilter } from "@/components/search-and-filter"
import { Stats } from "@/components/stats"
import { TagManagement } from "@/components/tag-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookmarkIcon, TagIcon, BarChart3Icon } from "lucide-react"

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-y-auto">
      <main className="container mx-auto px-4 py-8 max-w-6xl">

        {/* 主要內容區域 */}
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="h-12 grid w-full grid-cols-3 bg-white/60 backdrop-blur-md border-white/30 rounded-xl shadow-lg">
            <TabsTrigger 
              value="notes" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg"
            >
              <BookmarkIcon className="h-4 w-4" />
              我的筆記
            </TabsTrigger>
            <TabsTrigger 
              value="tags" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg"
            >
              <TagIcon className="h-4 w-4" />
              標籤管理
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg"
            >
              <BarChart3Icon className="h-4 w-4" />
              詳細統計
            </TabsTrigger>
          </TabsList>

          {/* 筆記頁面 */}
          <TabsContent value="notes" className="mt-4 space-y-8 relative">
            {/* 搜尋和篩選 */}
            <SearchAndFilter />

            {/* 筆記列表 */}
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                  </div>
                  <p className="mt-4 text-slate-600 font-medium">載入中...</p>
                </div>
              }
            >
              <NotesList />
            </Suspense>
          </TabsContent>

          {/* 標籤管理頁面 */}
          <TabsContent value="tags" className="mt-8">
            <TagManagement />
          </TabsContent>

          {/* 詳細統計頁面 */}
          <TabsContent value="stats" className="mt-8">
            <div className="grid gap-6">
              <Stats />
              {/* 這裡可以添加更詳細的統計圖表 */}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
