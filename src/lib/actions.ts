'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'

// 擷取網頁內容的介面
interface JinaData {
  title?: string;
  description?: string;
  content?: string;
  markdown?: string;
}

interface JinaApiResponse {
  code: number;
  status: string;
  data?: JinaData;
}

// 擷取網頁內容的介面
interface JinaResponse {
  title: string
  description: string
  markdown: string
}

// 從Jina AI獲取網頁內容
async function fetchWebContent(url: string): Promise<JinaResponse> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'application/json',
        ...(process.env.JINA_API_KEY && {
          'Authorization': `Bearer ${process.env.JINA_API_KEY}`
        })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`)
    }

    const data = (await response.json()) as JinaApiResponse
    console.log('🔍 Jina API 回應狀態:', data.code, data.status)
    
    // 🎯 修正數據結構：Jina API 的內容在 data.data 中
    const apiData = data.data || {}
    const extractedContent = apiData.content || apiData.markdown || ''
    
    console.log('📝 擷取的內容長度:', extractedContent.length)
    console.log('📝 內容前500字符:', extractedContent.slice(0, 500))
    
    return {
      title: apiData.title || '無標題',
      description: apiData.description || '',
      markdown: extractedContent
    }
  } catch (error) {
    console.error('Error fetching web content:', error)
    throw new Error('無法擷取網頁內容')
  }
}

// 獲取現有的分類和標籤
async function getExistingCategoriesAndTags(): Promise<{
  categories: string[]
  tags: string[]
}> {
  try {
    const [categoryData, tagData] = await Promise.all([
      // 獲取現有分類
      prisma.note.groupBy({
        by: ['category'],
        where: {
          category: { not: null }
        },
        orderBy: { _count: { category: 'desc' } }
      }),
      // 獲取現有標籤
      prisma.note.findMany({
        select: { tags: true },
        where: {
          tags: { isEmpty: false }
        }
      })
    ])

    const categories = categoryData.map((c: { category: string | null }) => c.category).filter(Boolean) as string[]
    
    // 展開所有標籤並去重
    const allTags = tagData.flatMap((note: { tags: string[] }) => note.tags)
    const uniqueTags = [...new Set(allTags)].filter(Boolean) as string[]
    
    return { categories, tags: uniqueTags }
  } catch (error) {
    console.error('Error fetching existing categories and tags:', error)
    return { categories: [], tags: [] }
  }
}

interface GroqChoice {
  message: {
    content: string;
  };
}

interface GroqApiResponse {
  choices: GroqChoice[];
}

interface AnalysisResult {
  category?: string;
  tags?: string[];
  summary?: string;
}

// 使用AI進行內容分析（分類、標籤、摘要一次完成）
async function analyzeContent(title: string, markdown: string): Promise<{ 
  category: string; 
  tags: string[]; 
  summary: string 
}> {
  console.log('🤖 開始 AI 內容分析...')
  console.log('📄 傳入內容長度:', markdown.length)
  console.log('📄 傳入內容預覽:', markdown.slice(0, 300))
  
  if (!process.env.GROQ_API_KEY) {
    console.log("GROQ_API_KEY is not set, 使用默認值");
    return { 
      category: '未分類', 
      tags: [], 
      summary: title 
    }
  }

  // 🎯 獲取現有的分類和標籤
  const { categories, tags } = await getExistingCategoriesAndTags()
  console.log('📊 現有分類:', categories)
  console.log('🏷️ 現有標籤:', tags)

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `你是一個內容分析專家，專門為個人知識庫進行精準分類。請分析網頁內容並提供：分類、標籤和摘要。

**核心原則：**
- 標籤必須非常精準，只保留最核心的 1-3 個關鍵詞
- 分類要具體明確，避免過於寬泛
- 摘要要實用且資訊豐富

**現有分類供參考：**
${categories.length > 0 ? categories.join('、') : '無'}

**現有標籤供參考：**
${tags.length > 0 ? tags.join('、') : '無'}

**分類原則：**
- 優先使用現有分類中最匹配的
- 如果沒有合適的現有分類，創建具體的新分類
- 避免「人工智慧」、「網頁開發」等過於寬泛的分類
- 使用具體技術領域：如「React開發」、「機器學習」、「資料庫設計」

**標籤原則（非常重要）：**
- 優先使用現有標籤中最匹配的
- 如果沒有合適的現有標籤，才創建新標籤
- 最多 2-3 個標籤，寧可少不要多
- 只使用文章中明確提到的核心技術、工具或概念名稱
- 避免描述性或形容詞性的標籤
- 使用具體的專有名詞，不要使用籠統的分類詞
- 如果文章沒有明確的技術重點，使用空陣列 []

**摘要要求：**
- 120-200字的實用摘要
- 重點說明文章的核心價值和主要內容
- 如果是教學，說明學到什麼
- 如果是工具，說明解決什麼問題

**回覆格式（純JSON，無其他文字）：**
{
  "category": "分類名稱",
  "tags": ["核心標籤"],
  "summary": "實用摘要"
}`
          },
          {
            role: 'user',
            content: `請分析以下網頁內容：

標題：${title}

內容：
${markdown.slice(0, 3500)}

請根據現有的分類和標籤，返回JSON格式的分析結果：`
          }
        ],
        temperature: 0.3,
        max_tokens: 600
      })
    })

    console.log('Groq API 回應狀態:', response.status, response.statusText);

    if (!response.ok) {
      console.log('AI 服務暫時不可用，使用默認值')
      return { 
        category: categories.length > 0 ? categories[0] : '未分類', 
        tags: [], 
        summary: title 
      }
    }

    const data = (await response.json()) as GroqApiResponse
    console.log('AI 回復內容:', data.choices[0].message.content)
    
    let result: AnalysisResult
    try {
      let jsonContent = data.choices[0].message.content.trim()
      
      // 🎯 處理 markdown 代碼塊格式
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      console.log('🔧 清理後的 JSON 內容:', jsonContent)
      result = JSON.parse(jsonContent) as AnalysisResult
    } catch (parseError) {
      console.log('JSON 解析失敗:', parseError)
      console.log('原始內容:', data.choices[0].message.content)
      return { 
        category: categories.length > 0 ? categories[0] : '未分類', 
        tags: [], 
        summary: title 
      }
    }
    
    const analysisResult = {
      category: result.category || (categories.length > 0 ? categories[0] : '未分類'),
      tags: result.tags || [],
      summary: result.summary || title
    }

    console.log('✅ AI 分析完成:', analysisResult)
    return analysisResult
    
  } catch (error) {
    console.error('Error analyzing content:', error)
    return { 
      category: categories.length > 0 ? categories[0] : '未分類', 
      tags: [], 
      summary: title 
    }
  }
}

// 保存網址的主要函數
export async function saveUrl(url: string) {
  try {
    // 驗證URL格式
    new URL(url)

    // 檢查是否已存在
    const existing = await prisma.note.findUnique({
      where: { url }
    })

    if (existing) {
      throw new Error('此網址已存在')
    }

    // 擷取網頁內容
    const webContent = await fetchWebContent(url)
    
    // 🚀 一次性 AI 分析（分類、標籤、摘要）
    const aiAnalysis = await analyzeContent(webContent.title, webContent.markdown)

    console.log('📋 AI 分析結果:', aiAnalysis)

    // 保存到資料庫
    const note = await prisma.note.create({
      data: {
        url,
        title: webContent.title,
        description: aiAnalysis.summary, // 只儲存 AI 生成的摘要
        category: aiAnalysis.category,
        tags: aiAnalysis.tags
      }
    })

    revalidatePath('/')
    return { success: true, note }
  } catch (error) {
    console.error('Error saving URL:', error)
    throw new Error(error instanceof Error ? error.message : '保存失敗')
  }
}

// 獲取所有筆記
export async function getNotes(search?: string, categories?: string[], tags?: string[]) {
  try {
    const notes = await prisma.note.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          } : {},
          // 分類篩選：OR 邏輯（符合任一分類）
          categories && categories.length > 0 ? { 
            category: { in: categories } 
          } : {},
          // 標籤篩選：AND 邏輯（必須擁有所有選中的標籤）
          tags && tags.length > 0 ? {
            tags: { hasEvery: tags }
          } : {}
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return notes
  } catch (error) {
    console.error('Error fetching notes:', error)
    throw new Error('無法獲取筆記')
  }
}

// 獲取單個筆記
export async function getNote(id: string) {
  try {
    const note = await prisma.note.findUnique({
      where: { id }
    })

    if (!note) {
      throw new Error('筆記不存在')
    }

    return note
  } catch (error) {
    console.error('Error fetching note:', error)
    throw new Error('獲取筆記失敗')
  }
}

// 刪除筆記
export async function deleteNote(id: string) {
  try {
    // 先獲取要刪除的筆記，記錄其分類和標籤
    const noteToDelete = await prisma.note.findUnique({
      where: { id },
      select: { category: true, tags: true }
    })

    if (!noteToDelete) {
      throw new Error('筆記不存在')
    }

    // 刪除筆記
    await prisma.note.delete({
      where: { id }
    })

    // 清理孤兒分類和標籤
    await cleanupOrphanedCategoriesAndTags(noteToDelete.category, noteToDelete.tags)

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error deleting note:', error)
    throw new Error('刪除失敗')
  }
}

// 清理孤兒分類和標籤的輔助函數
async function cleanupOrphanedCategoriesAndTags(deletedCategory: string | null, deletedTags: string[]) {
  try {
    // 清理孤兒分類
    if (deletedCategory) {
      const remainingNotesWithCategory = await prisma.note.count({
        where: { category: deletedCategory }
      })
      
      if (remainingNotesWithCategory === 0) {
        // 如果沒有其他筆記使用這個分類，從 Category 表中刪除
        await prisma.category.deleteMany({
          where: { name: deletedCategory }
        })
        console.log(`🗑️ 清理孤兒分類: ${deletedCategory}`)
      }
    }

    // 清理孤兒標籤
    for (const tag of deletedTags) {
      const remainingNotesWithTag = await prisma.note.count({
        where: { tags: { has: tag } }
      })
      
      if (remainingNotesWithTag === 0) {
        // 如果沒有其他筆記使用這個標籤，從 Tag 表中刪除
        await prisma.tag.deleteMany({
          where: { name: tag }
        })
        console.log(`🗑️ 清理孤兒標籤: ${tag}`)
      }
    }
  } catch (error) {
    console.error('Error cleaning up orphaned categories and tags:', error)
    // 不拋出錯誤，因為主要的刪除操作已經成功
  }
}

// 獲取所有分類
export async function getCategories() {
  try {
    const categories = await prisma.note.groupBy({
      by: ['category'],
      _count: { category: true },
      where: {
        category: { not: null }
      },
      orderBy: { _count: { category: 'desc' } }
    })

    return categories.map((c) => ({
      name: c.category,
      count: c._count.category,
    }))
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// 獲取所有標籤及其使用次數
export async function getTags() {
  try {
    const notes = await prisma.note.findMany({
      select: { tags: true },
      where: {
        tags: { isEmpty: false }
      }
    })

    const tagCounts = new Map<string, number>()
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return []
  }
}

// 重命名標籤
export async function renameTag(oldName: string, newName: string) {
  try {
    // 檢查新名稱是否已存在
    const existingNotes = await prisma.note.findMany({
      where: { tags: { has: newName } }
    })

    if (existingNotes.length > 0) {
      throw new Error('新標籤名稱已存在')
    }

    // 找到所有使用舊標籤的筆記
    const notesWithOldTag = await prisma.note.findMany({
      where: { tags: { has: oldName } }
    })

    // 批量更新標籤
    for (const note of notesWithOldTag) {
      const updatedTags = note.tags.map(t => (t === oldName ? newName : t))
      await prisma.note.update({
        where: { id: note.id },
        data: { tags: updatedTags }
      })
    }

    revalidatePath('/')
    return { success: true, updatedCount: notesWithOldTag.length }
  } catch (error) {
    console.error('Error renaming tag:', error)
    throw new Error(error instanceof Error ? error.message : '重命名標籤失敗')
  }
}

// 合併標籤
export async function mergeTags(sourceTags: string[], targetTag: string) {
  try {
    // 找到所有使用來源標籤的筆記
    const notesWithSourceTags = await prisma.note.findMany({
      where: { tags: { hasSome: sourceTags } }
    })

    let updatedCount = 0

    // 批量更新標籤
    for (const note of notesWithSourceTags) {
      const updatedTags = [...note.tags]
      let hasChanges = false

      // 移除來源標籤，添加目標標籤
      sourceTags.forEach(sourceTag => {
        const index = updatedTags.indexOf(sourceTag)
        if (index > -1) {
          updatedTags.splice(index, 1)
          hasChanges = true
        }
      })

      // 添加目標標籤（如果不存在）
      if (!updatedTags.includes(targetTag)) {
        updatedTags.push(targetTag)
        hasChanges = true
      }

      if (hasChanges) {
        await prisma.note.update({
          where: { id: note.id },
          data: { tags: updatedTags }
        })
        updatedCount++
      }
    }

    revalidatePath('/')
    return { success: true, updatedCount }
  } catch (error) {
    console.error('Error merging tags:', error)
    throw new Error('合併標籤失敗')
  }
}

// 刪除標籤
export async function deleteTag(tagName: string) {
  try {
    const notesToUpdate = await prisma.note.findMany({
      where: {
        tags: {
          has: tagName,
        },
      },
    })

    const updatePromises = notesToUpdate.map((note) =>
      prisma.note.update({
        where: { id: note.id },
        data: {
          tags: {
            set: note.tags.filter((t) => t !== tagName),
          },
        },
      })
    )

    await Promise.all(updatePromises)

    return { success: true }
  } catch (error) {
    console.error(`Error deleting tag ${tagName}:`, error)
    throw new Error("刪除標籤失敗")
  }
}

// 更新分類
export async function updateCategory(id: string, category: string | null) {
  return prisma.note.update({
    where: { id },
    data: { category },
  })
}

// 更新標籤
export async function updateTags(id: string, tags: string[]) {
  return prisma.note.update({
    where: { id },
    data: { tags },
  })
}

 