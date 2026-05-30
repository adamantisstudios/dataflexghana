import { createClient } from "@supabase/supabase-js"
import { enhancedCandidateSearch, buildCandidatesIndex } from "@/lib/enhanced-search-engine"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get("id")
    const searchQuery = searchParams.get("query")

    const supabaseUrl = process.env.CANDIDATES_SUPABASE_URL
    const supabaseKey = process.env.CANDIDATES_SUPABASE_KEY


    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Missing Supabase credentials. Please set CANDIDATES_SUPABASE_URL and CANDIDATES_SUPABASE_KEY")
      return Response.json({ message: "Database configuration error - missing credentials" }, { status: 500 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey)

    // If specific candidate requested
    if (candidateId) {
      const { data, error } = await supabase.from("form_responses").select("*").eq("id", candidateId).single()

      if (error) {
        console.error("[v0] Supabase error:", error)
        return Response.json({ message: "Candidate not found" }, { status: 404 })
      }

      return Response.json({ candidate: data })
    }

    // Get all candidates
    const { data, error } = await supabase.from("form_responses").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Supabase error:", error)
      return Response.json({ message: error.message || "Failed to fetch candidates" }, { status: 400 })
    }


    let filteredData = data || []
    if (searchQuery) {
      try {
        const index = buildCandidatesIndex(filteredData)
        const searchResults = enhancedCandidateSearch(index, searchQuery, { topK: 36, minScore: 0 })
        filteredData = searchResults.map((result) => result.candidate)
      } catch (searchError) {
        console.error("[v0] Search error:", searchError)
      }
    }

    return Response.json({ candidates: filteredData })
  } catch (error) {
    console.error("[v0] API error:", error)
    return Response.json({ message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}
