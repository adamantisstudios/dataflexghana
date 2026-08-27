import { type NextRequest, NextResponse } from "next/server"
import {
  badRequest,
  notInChannel,
  readJson,
  requireChannelHost,
  rowBelongsToChannel,
  serverError,
  str,
} from "../host-guard"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ channelId: string }> }

const FORMATS = new Set(["plain", "latex"])
const ANSWERS = new Set(["A", "B", "C", "D", "E"])

const fmt = (v: unknown): string => {
  const f = str(v) || "plain"
  return FORMATS.has(f) ? f : "plain"
}

/** Host list of quizzes, including hidden answers. */
export async function GET(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const { data, error } = await db
      .from("qa_posts")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, qa: data || [] })
  } catch (error) {
    return serverError("qa GET", error)
  }
}

/** Create a multiple-choice quiz. Options A–D are required, E is optional. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db, agentId, agentName } = guard.ctx

  try {
    const body = await readJson(request)
    const question = str(body.question)
    const optionA = str(body.option_a)
    const optionB = str(body.option_b)
    const optionC = str(body.option_c)
    const optionD = str(body.option_d)
    const optionE = str(body.option_e)
    const correct = str(body.correct_answer).toUpperCase()

    if (!question) return badRequest("Question is required")
    if (!optionA || !optionB || !optionC || !optionD) {
      return badRequest("Options A, B, C and D are required")
    }
    if (!ANSWERS.has(correct)) return badRequest("correct_answer must be A, B, C, D or E")
    if (correct === "E" && !optionE) return badRequest("Option E is empty but marked as the answer")

    const { data, error } = await db
      .from("qa_posts")
      .insert({
        channel_id: channelId,
        author_id: agentId,
        author_name: agentName,
        question,
        question_format: fmt(body.question_format),
        option_a: optionA,
        option_a_format: fmt(body.option_a_format),
        option_b: optionB,
        option_b_format: fmt(body.option_b_format),
        option_c: optionC,
        option_c_format: fmt(body.option_c_format),
        option_d: optionD,
        option_d_format: fmt(body.option_d_format),
        option_e: optionE || null,
        option_e_format: fmt(body.option_e_format),
        correct_answer: correct,
        explanation: str(body.explanation) || null,
        explanation_format: fmt(body.explanation_format),
        is_revealed: body.is_revealed === true,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, qa: data })
  } catch (error) {
    return serverError("qa POST", error)
  }
}

/** Reveal or hide the answer. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const body = await readJson(request)
    const qaId = str(body.qa_id)
    if (!qaId) return badRequest("qa_id is required")
    if (!(await rowBelongsToChannel(db, "qa_posts", qaId, channelId))) return notInChannel()

    if (body.is_revealed === undefined) return badRequest("is_revealed is required")

    const { data, error } = await db
      .from("qa_posts")
      .update({ is_revealed: body.is_revealed === true })
      .eq("id", qaId)
      .eq("channel_id", channelId)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, qa: data })
  } catch (error) {
    return serverError("qa PATCH", error)
  }
}

/** `?mode=permanent` hard-deletes; the default hides the quiz from members. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const qaId = str(request.nextUrl.searchParams.get("qaId"))
    const mode = str(request.nextUrl.searchParams.get("mode")) || "soft"
    if (!qaId) return badRequest("qaId query param is required")
    if (!(await rowBelongsToChannel(db, "qa_posts", qaId, channelId))) return notInChannel()

    if (mode === "permanent") {
      const { error } = await db.from("qa_posts").delete().eq("id", qaId).eq("channel_id", channelId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, permanent: true })
    }

    const { error } = await db
      .from("qa_posts")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", qaId)
      .eq("channel_id", channelId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, permanent: false })
  } catch (error) {
    return serverError("qa DELETE", error)
  }
}
