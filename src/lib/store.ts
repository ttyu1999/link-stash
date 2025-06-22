import { create } from 'zustand'

interface AppState {
  // 搜尋和篩選
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  selectedTags: string[]
  setSelectedTags: (tags: string[]) => void
  
  // 排序
  sortBy: 'createdAt' | 'title'
  setSortBy: (sortBy: 'createdAt' | 'title') => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
  
  // UI 狀態
  isAddingNote: boolean
  setIsAddingNote: (isAdding: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // 搜尋和篩選
  searchQuery: '',
  setSearchQuery: (query) => { set({ searchQuery: query }); },
  selectedCategories: [],
  setSelectedCategories: (categories) => { set({ selectedCategories: categories }); },
  selectedTags: [],
  setSelectedTags: (tags) => { set({ selectedTags: tags }); },
  
  // 排序
  sortBy: 'createdAt',
  setSortBy: (sortBy) => { set({ sortBy }); },
  sortOrder: 'desc',
  setSortOrder: (order) => { set({ sortOrder: order }); },
  
  // UI 狀態
  isAddingNote: false,
  setIsAddingNote: (isAdding) => { set({ isAddingNote: isAdding }); },
})) 