"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { SearchIcon, FilterIcon, SortAscIcon, SortDescIcon, XIcon, ChevronDownIcon, SparklesIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MultipleSelector, { type Option } from "@/components/ui/multiple-selector"
import { useAppStore } from "@/lib/store"
import { getCategories, getNotes } from "@/lib/actions"

interface Note {
  id: string
  title: string
  description: string | null
  category: string | null
  tags: string[]
  createdAt: Date
}

export function SearchAndFilter() {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategories,
    setSelectedCategories,
    selectedTags,
    setSelectedTags,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  } = useAppStore()

  const [isExpanded, setIsExpanded] = useState(false)
  const [localSearchInput, setLocalSearchInput] = useState(searchQuery)
  const [isSticky, setIsSticky] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchInput)
    }, 300) // 300ms delay

    return () => { clearTimeout(timer); }
  }, [localSearchInput, setSearchQuery])

  // Sync with external search query changes
  useEffect(() => {
    setLocalSearchInput(searchQuery)
  }, [searchQuery])

  // Intersection Observer to detect sticky state
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting)
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '-96px 0px 0px 0px' // 24px (top-24) * 4 = 96px
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [])

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  })

  const { data: allNotes = [] } = useQuery({
    queryKey: ["notes-for-tags", selectedCategories],
    queryFn: () => getNotes(undefined, selectedCategories.length > 0 ? selectedCategories : undefined),
    staleTime: 5 * 60 * 1000,
  })

  const tags = useMemo(() => {
    const tagCounts = new Map<string, number>()
    allNotes.forEach((note: Note) => {
      note.tags.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [allNotes])

  const categoryOptions: Option[] = categories
    .filter((cat): cat is { name: string; count: number } => cat.name !== null)
    .map((cat) => ({
      value: cat.name,
      label: `${cat.name} (${cat.count.toString()})`,
    }))

  const tagOptions: Option[] = tags.map((tag: { name: string; count: number }) => ({
    value: tag.name,
    label: `${tag.name} (${tag.count.toString()})`,
  }))

  const selectedCategoryOptions: Option[] = selectedCategories.map((cat: string) => ({
    value: cat,
    label: cat,
  }))

  const selectedTagOptions: Option[] = selectedTags.map((tag: string) => ({
    value: tag,
    label: tag,
  }))

  const handleCategoryChange = (options: Option[]) => {
    const newCategories = options.map((opt) => opt.value)
    setSelectedCategories(newCategories)
    
    // 當分類改變時，清除可能無效的標籤選擇
    // 這樣確保標籤篩選只包含新分類下實際存在的標籤
    if (selectedTags.length > 0) {
      setSelectedTags([])
    }
  }

  const handleTagChange = (options: Option[]) => {
    setSelectedTags(options.map((opt) => opt.value))
  }

  const clearFilters = () => {
    setLocalSearchInput("")
    setSearchQuery("")
    setSelectedCategories([])
    setSelectedTags([])
  }

  const hasFilters = searchQuery || selectedCategories.length > 0 || selectedTags.length > 0
  const hasActiveFilters = selectedCategories.length > 0 || selectedTags.length > 0

  return (
    <>
      {/* Sticky detection sentinel */}
      <div ref={sentinelRef} className="h-px m-0!"></div>
      
      <div className={`ml-auto space-y-6 sticky top-2 z-40 transition-all duration-300 max-w-6xl relative ${isSticky ? 'py-0 md:w-1/2' : 'w-full'}`}>
        {/* 搜尋區域 */}
        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur-xl transition-all duration-300 ${isSticky ? 'opacity-50' : ''}`}></div>
          <div className={`relative bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl shadow-lg transition-all duration-300 ${
            isSticky ? 'p-0 bg-white/90' : 'p-6'
          }`}>
            {/* 標題區域 - sticky 時隱藏 */}
            <div className={`flex items-center gap-3 transition-all duration-300 ${
              isSticky ? 'mb-0 opacity-0 h-0 overflow-hidden' : 'opacity-100 mb-4'
            }`}>
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <SearchIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">智慧搜尋</h2>
              <SparklesIcon className="h-4 w-4 text-yellow-500" />
            </div>

            <div className="relative">
              <SearchIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 transition-all duration-300 ${
                isSticky ? 'h-4 w-4' : 'h-5 w-5'
              }`} />
              <Input
                placeholder="搜尋標題、描述或內容..."
                value={localSearchInput}
                onChange={(e) => { setLocalSearchInput(e.target.value); }}
                className={`pl-12 pr-64 text-base! bg-white/60 border-white/30 focus:border-blue-300 focus:ring-blue-200 rounded-xl transition-all duration-300 ${
                  isSticky ? 'h-12' : 'h-14'
                }`}
              />

              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className={`px-3 text-slate-500 hover:text-slate-700 hover:bg-white/50 rounded-lg transition-all duration-300 ${
                      isSticky ? 'h-6 text-xs' : 'h-8'
                    }`}
                  >
                    <XIcon className={`transition-all duration-300 ${isSticky ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    {!isSticky && '清除'}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsExpanded(!isExpanded); }}
                  className={`h-8 px-3 rounded-lg transition-all duration-300 ${
                    hasActiveFilters
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:from-blue-600 hover:to-indigo-700 hover:text-white"
                      : isExpanded
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                  }`}
                >
                  <FilterIcon className={`transition-all duration-300 ${isSticky ? 'h-3 w-3' : 'h-4 w-4'} ${hasActiveFilters ? "text-white" : ""}`} />
                  {!isSticky && '篩選'}
                  {hasActiveFilters && (
                    <span className={`ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full transition-all duration-300 ${
                      isSticky ? 'text-xs' : ''
                    }`}>
                      {selectedCategories.length + selectedTags.length}
                    </span>
                  )}
                  <ChevronDownIcon className={`ml-1 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""} ${
                    isSticky ? 'h-3 w-3' : 'h-4 w-4'
                  }`} />
                </Button>
              </div>
            </div>

                    {/* 進階篩選 */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className={`space-y-6 mt-4 ${isSticky ? 'absolute top-full left-0 right-0 z-50' : ''}`}>
            <div className={`backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg relative z-10 ${
              isSticky ? 'bg-white/95 border-t-0' : 'bg-white/60'
            }`}>
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <FilterIcon className="h-5 w-5 text-blue-600" />
                進階篩選選項
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 分類篩選 */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    分類篩選
                  </label>
                  <MultipleSelector
                    value={selectedCategoryOptions}
                    onChange={handleCategoryChange}
                    options={categoryOptions}
                    placeholder="選擇分類..."
                    emptyIndicator={<p className="text-center text-base leading-10 text-slate-500">找不到分類</p>}
                    className="shadow-sm bg-white/60 backdrop-blur-sm border-white/30 rounded-xl"
                  />
                </div>

                {/* 標籤篩選 */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    標籤篩選
                  </label>
                  <MultipleSelector
                    value={selectedTagOptions}
                    onChange={handleTagChange}
                    options={tagOptions}
                    placeholder="選擇標籤..."
                    emptyIndicator={<p className="text-center text-base leading-10 text-slate-500">找不到標籤</p>}
                    className="shadow-sm bg-white/60 backdrop-blur-sm border-white/30 rounded-xl"
                  />
                </div>
              </div>

              {/* 排序控制 */}
              <div className="flex items-center gap-4 pt-6 mt-6 border-t border-white/30">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  排序方式
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] shadow-sm bg-white/60 backdrop-blur-sm border-white/30 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">建立時間</SelectItem>
                    <SelectItem value="title">標題</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSortOrder(sortOrder === "desc" ? "asc" : "desc"); }}
                  className="h-9 bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 rounded-xl shadow-sm"
                >
                  {sortOrder === "desc" ? (
                    <>
                      <SortDescIcon className="h-4 w-4" />
                      降序
                    </>
                  ) : (
                    <>
                      <SortAscIcon className="h-4 w-4" />
                      升序
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
          </div>
        </div>
      </div>  
    </>
  )
}
