"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase-client"

export function BlogHero() {
  const [title, setTitle] = useState<string | null>(null)

  useEffect(() => {
    void supabase
      .from("blogs")
      .select("title")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.title) setTitle(data.title as string)
      })
      .catch(() => {})
  }, [])

  return (
    <section className="border-b border-gray-100 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-600 mb-3">Journal</p>
        <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl tracking-tight">DataFlex Blog</h1>
        <p className="mt-4 max-w-xl text-base text-gray-600 leading-relaxed">
          Insights, guides, and updates for agents and partners across Ghana.
          {title ? (
            <>
              {" "}
              Latest:{" "}
              <Link href="/blogs" className="text-emerald-700 hover:underline">
                {title}
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </section>
  )
}
