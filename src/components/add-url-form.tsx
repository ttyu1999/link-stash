"use client"

import { useState, useRef, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, LoaderIcon, LinkIcon, XIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form"
import { saveUrl } from "@/lib/actions"
import { toast } from "sonner"

const formSchema = z.object({
  url: z.string().url({ message: "請輸入有效的網址" }),
})

export function AddUrlForm() {
  const [isExpanded, setIsExpanded] = useState(false)
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  })
  const {
    formState: { isSubmitting },
  } = form

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus()
    }
  }, [isExpanded])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await saveUrl(values.url)
      toast.success("網址保存成功！AI 正在分析內容...")
      form.reset()
      setIsExpanded(false)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["stats"] }),
      ])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "保存失敗"
      form.setError("url", { type: "manual", message: errorMessage })
    }
  }

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50">
        {!isExpanded ? (
          <div className="relative group">
            {/* 背景光暈效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

            <Button
              onClick={() => {
                setIsExpanded(true)
              }}
              size="lg"
              className="relative w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group"
            >
              <PlusIcon className="h-7 w-7 group-hover:rotate-90 transition-transform duration-300" />
            </Button>

            {/* 提示文字 */}
            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-slate-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                添加新網址
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          </div>
        ) : (
          <Card className="w-96 shadow-2xl border-0 bg-white/90 backdrop-blur-md p-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <LinkIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">添加網址</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <SparklesIcon className="h-3 w-3" />
                      AI 自動分析內容
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false)
                  }}
                  className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              <Form {...form}>
                <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              ref={inputRef}
                              placeholder="貼上網址，AI 將自動分析..."
                              disabled={isSubmitting}
                              className="h-12 bg-white/60 backdrop-blur-sm border-white/30 focus:border-blue-300 focus:ring-blue-200 rounded-xl"
                            />
                            {field.value && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderIcon className="h-4 w-4 animate-spin" />
                          分析中...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-4 w-4" />
                          保存
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsExpanded(false)
                      }}
                      className="h-11 px-4 bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 rounded-xl"
                    >
                      取消
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
