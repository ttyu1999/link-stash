# **Link Stash**

個人化網頁知識庫，解決網址收藏管理的痛點。

## **專案背景**

常常看到有用的文章就分享到 LINE 或 Telegram 群組，但時間久了就找不到了。這個專案讓你能快速收藏網址，自動整理內容，並提供強大的搜尋功能。

## **核心功能**

- **一鍵儲存網址**: 快速貼上網址或透過分享功能收藏
- **自動內容擷取**: 使用 Jina AI 自動抓取網頁內容並轉為 Markdown
- **AI 智能分類**: 使用 Groq AI 自動分類和標籤化內容
- **全文搜尋**: 基於 PostgreSQL 的高效搜尋和篩選
- **簡潔閱讀**: 無干擾的閱讀模式
- **PWA 支援**: 支援分享到應用程式功能

## **技術棧**

- **前端**: Next.js 15 + React 19 + Tailwind CSS + shadcn/ui
- **後端**: Next.js Server Actions
- **資料庫**: PostgreSQL + Prisma ORM
- **狀態管理**: Zustand + Tanstack Query
- **外部服務**: 
  - Jina AI API (內容擷取)
  - Groq AI API (智能分析)

## **快速開始**

1. **安裝依賴**
   ```bash
   pnpm install
   ```

2. **設置環境變數**
   ```bash
   cp .env.example .env.local
   # 填入你的 DATABASE_URL, JINA_API_KEY, GROQ_API_KEY
   ```

3. **初始化資料庫**
   ```bash
   pnpm prisma migrate dev
   ```

4. **啟動開發伺服器**
   ```bash
   pnpm dev
   ```

## **使用方式**

1. 在首頁貼上網址
2. 系統自動擷取內容並用 AI 分類
3. 在「我的筆記」中瀏覽和搜尋
4. 使用標籤管理功能整理內容

## **架構說明**

使用者提交網址 → Jina AI 擷取內容 → Groq AI 分析分類 → 儲存到 PostgreSQL → 前端展示和搜尋

---

**Link Stash** - 讓網頁收藏變得智能且有序 🚀
