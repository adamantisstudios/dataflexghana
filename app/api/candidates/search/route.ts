import { createClient } from "@supabase/supabase-js"
import { enhancedCandidateSearch, buildCandidatesIndex } from "@/lib/enhanced-search-engine"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get("id")
    const searchQuery = searchParams.get("query")

    const supabaseUrl = process.env.CANDIDATES_SUPABASE_URL
    const supabaseKey = process.env.CANDIDATES_SUPABASE_KEY

    console.log("[v0] Checking environment variables...")
    console.log("[v0] URL exists:", !!supabaseUrl)
    console.log("[v0] Key exists:", !!supabaseKey)

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Missing Supabase credentials. Please set CANDIDATES_SUPABASE_URL and CANDIDATES_SUPABASE_KEY")
      return Response.json({ message: "Database configuration error - missing credentials" }, { status: 500 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey)

    // If specific candidate requested
    if (candidateId) {
      console.log("[v0] Fetching single candidate with ID:", candidateId)
      const { data, error } = await supabase.from("form_responses").select("*").eq("id", candidateId).single()

      if (error) {
        console.error("[v0] Supabase error:", error)
        return Response.json({ message: "Candidate not found" }, { status: 404 })
      }

      return Response.json({ candidate: data })
    }

    // Get all candidates
    console.log("[v0] Fetching all candidates from database...")
    const { data, error } = await supabase.from("form_responses").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Supabase error:", error)
      return Response.json({ message: error.message || "Failed to fetch candidates" }, { status: 400 })
    }

    console.log("[v0] Fetched total candidates:", data?.length || 0)

    let filteredData = data || []
    if (searchQuery) {
      console.log("[v0] Processing search query:", searchQuery)
      try {
        const index = buildCandidatesIndex(filteredData)
        const searchResults = enhancedCandidateSearch(index, searchQuery, { topK: 36, minScore: 0 })
        filteredData = searchResults.map((result) => result.candidate)
        console.log("[v0] Found", filteredData.length, "matching candidates using enhanced search")
      } catch (searchError) {
        console.error("[v0] Search error:", searchError)
        console.log("[v0] Falling back to unfiltered results")
      }
    }

    return Response.json({ candidates: filteredData })
  } catch (error) {
    console.error("[v0] API error:", error)
    return Response.json({ message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}
