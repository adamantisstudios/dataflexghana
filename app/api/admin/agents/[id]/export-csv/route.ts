import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import JSZip from "jszip"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const agentId = resolvedParams.id

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    // Verify agent exists and get basic info
    const { data: agent, error: agentError } = await supabase.from("agents").select("*").eq("id", agentId).single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    console.log(`📊 Exporting CSV data for agent: ${agent.full_name} (${agent.id})`)

    // Fetch all related data
    const [walletTransactions, dataOrders, commissions, referrals, withdrawals, eOrders] = await Promise.all([
      // Wallet transactions
      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false }),

      // Data orders
      supabase
        .from("data_orders")
        .select(`
          *,
          data_bundles!fk_data_orders_bundle_id (
            name,
            provider,
            size_gb,
            price,
            commission_rate
          )
        `)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false }),

      // Commissions
      supabase
        .from("commissions")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false }),

      // Referrals
      supabase
        .from("referrals")
        .select(`
          *,
          services (
            title,
            commission_amount
          )
        `)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false }),

      // Withdrawals
      supabase
        .from("withdrawals")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false }),

      // E-commerce orders (voucher orders)
      supabase
        .from("e_orders")
        .select(`
          *,
          e_products (
            title,
            price,
            image_url
          )
        `)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false }),
    ])

    // Helper function to convert array to CSV
    const arrayToCSV = (data: any[], headers: string[]) => {
      if (!data || data.length === 0) {
        return headers.join(",") + "\n"
      }

      const csvRows = [headers.join(",")]

      data.forEach((row) => {
        const values = headers.map((header) => {
          let value = row[header]
          if (value === null || value === undefined) {
            value = ""
          } else if (typeof value === "object") {
            value = JSON.stringify(value)
          } else {
            value = String(value)
          }
          // Escape quotes and wrap in quotes if contains comma or quote
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            value = '"' + value.replace(/"/g, '""') + '"'
          }
          return value
        })
        csvRows.push(values.join(","))
      })

      return csvRows.join("\n")
    }

    // Create CSV content for each data type
    const dataOrdersCSV = arrayToCSV(
      dataOrders.data?.map((order) => ({
        id: order.id,
        agent_id: order.agent_id,
        bundle_name: order.data_bundles?.name || "N/A",
        provider: order.data_bundles?.provider || "N/A",
        size_gb: order.data_bundles?.size_gb || 0,
        price: order.data_bundles?.price || 0,
        commission_rate: order.data_bundles?.commission_rate || 0,
        commission_amount: order.commission_amount || 0,
        phone_number: order.phone_number,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
      })) || [],
      [
        "id",
        "agent_id",
        "bundle_name",
        "provider",
        "size_gb",
        "price",
        "commission_rate",
        "commission_amount",
        "phone_number",
        "status",
        "created_at",
        "updated_at",
      ],
    )

    const wholesaleOrdersCSV = arrayToCSV(
      eOrders.data?.map((order) => ({
        id: order.id,
        agent_id: order.agent_id,
        agent_name: order.agent_name,
        product_title: order.e_products?.title || "N/A",
        product_price: order.e_products?.price || 0,
        quantity: order.quantity,
        total_cost: order.total_cost,
        payment_reference: order.payment_reference,
        payment_number: order.payment_number,
        delivery_method: order.delivery_method,
        delivery_contact: order.delivery_contact,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
      })) || [],
      [
        "id",
        "agent_id",
        "agent_name",
        "product_title",
        "product_price",
        "quantity",
        "total_cost",
        "payment_reference",
        "payment_number",
        "delivery_method",
        "delivery_contact",
        "status",
        "created_at",
        "updated_at",
      ],
    )

    const referralReportCSV = arrayToCSV(
      referrals.data?.map((referral) => ({
        id: referral.id,
        agent_id: referral.agent_id,
        service_title: referral.services?.title || "N/A",
        commission_amount: referral.services?.commission_amount || 0,
        customer_name: referral.customer_name,
        customer_phone: referral.customer_phone,
        customer_email: referral.customer_email,
        status: referral.status,
        commission_paid: referral.commission_paid,
        created_at: referral.created_at,
        updated_at: referral.updated_at,
      })) || [],
      [
        "id",
        "agent_id",
        "service_title",
        "commission_amount",
        "customer_name",
        "customer_phone",
        "customer_email",
        "status",
        "commission_paid",
        "created_at",
        "updated_at",
      ],
    )

    const allHistoryCSV = arrayToCSV(
      [
        ...(walletTransactions.data?.map((tx) => ({
          type: "wallet_transaction",
          id: tx.id,
          agent_id: tx.agent_id,
          amount: tx.amount,
          transaction_type: tx.transaction_type,
          description: tx.description,
          status: tx.status,
          created_at: tx.created_at,
        })) || []),
        ...(commissions.data?.map((comm) => ({
          type: "commission",
          id: comm.id,
          agent_id: comm.agent_id,
          amount: comm.amount,
          transaction_type: "commission",
          description: `Commission: ${comm.source_type}`,
          status: comm.status,
          created_at: comm.created_at,
        })) || []),
        ...(withdrawals.data?.map((withdrawal) => ({
          type: "withdrawal",
          id: withdrawal.id,
          agent_id: withdrawal.agent_id,
          amount: withdrawal.amount,
          transaction_type: "withdrawal",
          description: `Withdrawal to ${withdrawal.momo_number}`,
          status: withdrawal.status,
          created_at: withdrawal.created_at,
        })) || []),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      ["type", "id", "agent_id", "amount", "transaction_type", "description", "status", "created_at"],
    )

    // Create ZIP file
    const zip = new JSZip()

    // Add CSV files to ZIP
    zip.file("data_orders_report.csv", dataOrdersCSV)
    zip.file("wholesale_orders_report.csv", wholesaleOrdersCSV)
    zip.file("referral_report.csv", referralReportCSV)
    zip.file("complete_history_report.csv", allHistoryCSV)

    // Add summary file
    const summaryCSV = arrayToCSV(
      [
        {
          agent_name: agent.full_name,
          agent_id: agent.id,
          phone_number: agent.phone_number,
          email: agent.email,
          region: agent.region || "N/A",
          wallet_balance: agent.wallet_balance || 0,
          total_data_orders: dataOrders.data?.length || 0,
          total_wholesale_orders: eOrders.data?.length || 0,
          total_referrals: referrals.data?.length || 0,
          total_withdrawals: withdrawals.data?.length || 0,
          export_date: new Date().toISOString(),
        },
      ],
      [
        "agent_name",
        "agent_id",
        "phone_number",
        "email",
        "region",
        "wallet_balance",
        "total_data_orders",
        "total_wholesale_orders",
        "total_referrals",
        "total_withdrawals",
        "export_date",
      ],
    )

    zip.file("agent_summary.csv", summaryCSV)

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    console.log(`✅ Successfully prepared CSV export for agent ${agent.full_name}`)

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="agent_${agent.full_name.replace(/\s+/g, "_")}_${agentId}_reports.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error exporting agent CSV data:", error)
    return NextResponse.json(
      {
        error: "Failed to export agent data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
