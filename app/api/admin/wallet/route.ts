import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  calculateWalletBalance,
  getAgentWalletSummary,
  createAdminReversal,
  createAdminAdjustment,
  getUnifiedTransactionHistory
} from '@/lib/earnings-calculator'
import {
  processSecureWithdrawalPayout,
  validateAgentMoneyFlowIntegrity,
  synchronizeWalletBalance
} from '@/lib/withdrawal-security-fix'
import {
  syncAgentWalletBalance,
  validateAgentWalletIntegrity
} from '@/lib/wallet-balance-sync'

// GET - Get wallet information for an agent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agent_id = searchParams.get('agent_id')
    const action = searchParams.get('action')

    if (!agent_id) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'summary':
        // Get comprehensive wallet summary
        const [balance, summary, transactions] = await Promise.all([
          calculateWalletBalance(agent_id),
          getAgentWalletSummary(agent_id),
          getUnifiedTransactionHistory(agent_id)
        ])

        return NextResponse.json({
          success: true,
          data: {
            balance,
            summary,
            recent_transactions: transactions.slice(0, 10) // Last 10 transactions
          }
        })

      case 'transactions':
        // Get complete transaction history
        const allTransactions = await getUnifiedTransactionHistory(agent_id)
        
        return NextResponse.json({
          success: true,
          data: {
            transactions: allTransactions
          }
        })

      case 'validate':
        // Validate wallet system integrity for this agent
        const currentBalance = await calculateWalletBalance(agent_id)
        
        // Get stored balance from agents table for comparison
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('wallet_balance')
          .eq('id', agent_id)
          .single()

        if (agentError) {
          return NextResponse.json(
            { success: false, error: 'Failed to fetch agent data' },
            { status: 500 }
          )
        }

        const storedBalance = agentData.wallet_balance || 0
        const discrepancy = Math.abs(currentBalance - storedBalance)

        return NextResponse.json({
          success: true,
          data: {
            calculated_balance: currentBalance,
            stored_balance: storedBalance,
            discrepancy,
            has_discrepancy: discrepancy > 0.01,
            status: discrepancy > 0.01 ? 'inconsistent' : 'consistent'
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action specified' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('Error in admin wallet GET:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch wallet data' },
      { status: 500 }
    )
  }
}

// POST - Admin wallet management actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, agent_id, admin_id, ...params } = body

    // Validate required fields
    if (!action || !agent_id || !admin_id) {
      return NextResponse.json(
        { success: false, error: 'Action, agent_id, and admin_id are required' },
        { status: 400 }
      )
    }

    // Verify admin exists and is active
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id, name, is_active')
      .eq('id', admin_id)
      .single()

    if (adminError || !adminData || !adminData.is_active) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive admin' },
        { status: 403 }
      )
    }

    switch (action) {
      case 'reversal':
        // Create admin reversal for a specific transaction
        const { original_transaction_id, reason } = params

        if (!original_transaction_id || !reason) {
          return NextResponse.json(
            { success: false, error: 'Original transaction ID and reason are required for reversal' },
            { status: 400 }
          )
        }

        const reversalId = await createAdminReversal(
          agent_id,
          original_transaction_id,
          admin_id,
          reason
        )

        if (!reversalId) {
          return NextResponse.json(
            { success: false, error: 'Failed to create reversal transaction' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: {
            reversal_transaction_id: reversalId,
            message: 'Reversal transaction created successfully'
          }
        })

      case 'adjustment':
        // Create admin adjustment (credit or debit)
        const { amount, reason: adjustmentReason, is_positive = true } = params

        if (!amount || amount <= 0 || !adjustmentReason) {
          return NextResponse.json(
            { success: false, error: 'Valid amount and reason are required for adjustment' },
            { status: 400 }
          )
        }

        const adjustmentId = await createAdminAdjustment(
          agent_id,
          amount,
          admin_id,
          adjustmentReason,
          is_positive
        )

        if (!adjustmentId) {
          return NextResponse.json(
            { success: false, error: 'Failed to create adjustment transaction' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: {
            adjustment_transaction_id: adjustmentId,
            message: `${is_positive ? 'Credit' : 'Debit'} adjustment created successfully`
          }
        })

      // CRITICAL FIX: Add wallet reset functionality
      case 'reset_wallet':
        const { confirm_reset } = params

        if (!confirm_reset) {
          return NextResponse.json(
            { success: false, error: 'Confirmation required for wallet reset' },
            { status: 400 }
          )
        }

        try {
          // Get current wallet balance
          const currentBalance = await calculateWalletBalance(agent_id)

          if (currentBalance > 0) {
            // Create a deduction transaction to zero out the wallet
            const resetTransactionId = await createAdminAdjustment(
              agent_id,
              currentBalance,
              admin_id,
              'Admin wallet reset - zeroing balance',
              false // is_positive = false (deduction)
            )

            if (!resetTransactionId) {
              throw new Error('Failed to create wallet reset transaction')
            }
          }

          // Update the agent's stored wallet balance to 0
          const { error: updateError } = await supabase
            .from('agents')
            .update({ 
              wallet_balance: 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', agent_id)

          if (updateError) {
            throw new Error(`Failed to update agent wallet balance: ${updateError.message}`)
          }

          // Log the reset action
          await supabase
            .from('admin_actions')
            .insert({
              admin_id,
              action_type: 'wallet_reset',
              target_type: 'agent',
              target_id: agent_id,
              details: {
                previous_balance: currentBalance,
                new_balance: 0,
                reason: 'Admin wallet reset',
                reset_transaction_id: currentBalance > 0 ? resetTransactionId : null
              }
            })

          return NextResponse.json({
            success: true,
            data: {
              previous_balance: currentBalance,
              new_balance: 0,
              reset_transaction_id: currentBalance > 0 ? resetTransactionId : null,
              message: `Wallet reset successfully. Previous balance: GH₵${currentBalance.toFixed(2)}`
            }
          })

        } catch (error) {
          console.error('Error resetting wallet:', error)
          return NextResponse.json(
            { success: false, error: `Failed to reset wallet: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
          )
        }

      // CRITICAL FIX: Add commission reset functionality
      case 'reset_commission':
        const { confirm_commission_reset } = params

        if (!confirm_commission_reset) {
          return NextResponse.json(
            { success: false, error: 'Confirmation required for commission reset' },
            { status: 400 }
          )
        }

        try {
          // Get all commission-related transactions
          const { data: commissionTransactions, error: commissionError } = await supabase
            .from('wallet_transactions')
            .select('id, amount, transaction_type, status')
            .eq('agent_id', agent_id)
            .eq('transaction_type', 'commission_deposit')
            .eq('status', 'approved')

          if (commissionError) {
            throw new Error(`Failed to fetch commission transactions: ${commissionError.message}`)
          }

          const totalCommissions = commissionTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0

          if (totalCommissions > 0) {
            // Create a reversal transaction for all commissions
            const commissionResetId = await createAdminAdjustment(
              agent_id,
              totalCommissions,
              admin_id,
              'Admin commission reset - reversing all commission deposits',
              false // is_positive = false (deduction)
            )

            if (!commissionResetId) {
              throw new Error('Failed to create commission reset transaction')
            }

            // Log the commission reset action
            await supabase
              .from('admin_actions')
              .insert({
                admin_id,
                action_type: 'commission_reset',
                target_type: 'agent',
                target_id: agent_id,
                details: {
                  total_commissions_reversed: totalCommissions,
                  commission_transactions_count: commissionTransactions?.length || 0,
                  reason: 'Admin commission reset',
                  reset_transaction_id: commissionResetId
                }
              })

            return NextResponse.json({
              success: true,
              data: {
                total_commissions_reversed: totalCommissions,
                commission_transactions_count: commissionTransactions?.length || 0,
                reset_transaction_id: commissionResetId,
                message: `Commission reset successfully. Reversed GH₵${totalCommissions.toFixed(2)} in commissions`
              }
            })
          } else {
            return NextResponse.json({
              success: true,
              data: {
                total_commissions_reversed: 0,
                commission_transactions_count: 0,
                message: 'No commissions found to reset'
              }
            })
          }

        } catch (error) {
          console.error('Error resetting commissions:', error)
          return NextResponse.json(
            { success: false, error: `Failed to reset commissions: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
          )
        }

      // CRITICAL FIX: Add comprehensive transaction reversal
      case 'reverse_transaction':
        const { transaction_id, reversal_reason } = params

        if (!transaction_id || !reversal_reason) {
          return NextResponse.json(
            { success: false, error: 'Transaction ID and reversal reason are required' },
            { status: 400 }
          )
        }

        try {
          // Get the original transaction details
          const { data: originalTransaction, error: fetchError } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('id', transaction_id)
            .single()

          if (fetchError || !originalTransaction) {
            return NextResponse.json(
              { success: false, error: 'Transaction not found' },
              { status: 404 }
            )
          }

          // Verify the transaction belongs to the specified agent
          if (originalTransaction.agent_id !== agent_id) {
            return NextResponse.json(
              { success: false, error: 'Transaction does not belong to the specified agent' },
              { status: 400 }
            )
          }

          // Check if transaction is already reversed
          const { data: existingReversal, error: reversalCheckError } = await supabase
            .from('wallet_transactions')
            .select('id')
            .eq('source_id', transaction_id)
            .eq('transaction_type', 'admin_reversal')
            .single()

          if (!reversalCheckError && existingReversal) {
            return NextResponse.json(
              { success: false, error: 'Transaction has already been reversed' },
              { status: 400 }
            )
          }

          // Create the reversal transaction
          const reversalTransactionId = await createAdminReversal(
            agent_id,
            transaction_id,
            admin_id,
            reversal_reason
          )

          if (!reversalTransactionId) {
            throw new Error('Failed to create reversal transaction')
          }

          return NextResponse.json({
            success: true,
            data: {
              original_transaction_id: transaction_id,
              reversal_transaction_id: reversalTransactionId,
              original_amount: originalTransaction.amount,
              original_type: originalTransaction.transaction_type,
              message: `Transaction reversed successfully. Amount: GH₵${originalTransaction.amount.toFixed(2)}`
            }
          })

        } catch (error) {
          console.error('Error reversing transaction:', error)
          return NextResponse.json(
            { success: false, error: `Failed to reverse transaction: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
          )
        }

      case 'sync_balance':
        // Sync stored balance with calculated balance
        const calculatedBalance = await calculateWalletBalance(agent_id)

        const { error: updateError } = await supabase
          .from('agents')
          .update({ wallet_balance: calculatedBalance })
          .eq('id', agent_id)

        if (updateError) {
          return NextResponse.json(
            { success: false, error: 'Failed to sync balance' },
            { status: 500 }
          )
        }

        // Log the sync action
        await supabase
          .from('admin_actions')
          .insert({
            admin_id,
            action_type: 'balance_sync',
            target_type: 'agent',
            target_id: agent_id,
            details: {
              old_balance: params.old_balance || 0,
              new_balance: calculatedBalance,
              reason: 'Admin balance synchronization'
            }
          })

        return NextResponse.json({
          success: true,
          data: {
            new_balance: calculatedBalance,
            message: 'Balance synchronized successfully'
          }
        })

      // CRITICAL FIX: Add secure withdrawal processing
      case 'process_withdrawal':
        const { withdrawal_id, payout_reference } = params

        if (!withdrawal_id) {
          return NextResponse.json(
            { success: false, error: 'Withdrawal ID is required' },
            { status: 400 }
          )
        }

        console.log('🔒 Processing secure withdrawal via admin wallet API:', { withdrawal_id, admin_id })

        try {
          const result = await processSecureWithdrawalPayout(withdrawal_id, admin_id, payout_reference)

          if (result.success) {
            return NextResponse.json({
              success: true,
              data: {
                message: result.message,
                transaction_id: result.transactionId
              }
            })
          } else {
            return NextResponse.json(
              { 
                success: false, 
                error: result.error || 'Failed to process withdrawal securely',
                details: result.message
              },
              { status: 500 }
            )
          }
        } catch (withdrawalError: any) {
          console.error('❌ Error in secure withdrawal processing:', withdrawalError)
          return NextResponse.json(
            { 
              success: false, 
              error: 'Secure withdrawal processing failed',
              details: withdrawalError.message || 'Unknown error'
            },
            { status: 500 }
          )
        }

      case 'validate_integrity':
        // Enhanced integrity validation using new security functions
        try {
          const [walletIntegrity, moneyFlowIntegrity] = await Promise.all([
            validateAgentWalletIntegrity(agent_id),
            validateAgentMoneyFlowIntegrity(agent_id)
          ])

          return NextResponse.json({
            success: true,
            data: {
              wallet_integrity: walletIntegrity,
              money_flow_integrity: moneyFlowIntegrity,
              overall_valid: walletIntegrity.isValid && moneyFlowIntegrity.isValid,
              recommendations: [
                ...walletIntegrity.recommendations,
                ...moneyFlowIntegrity.recommendations
              ]
            }
          })
        } catch (integrityError: any) {
          console.error('❌ Error validating integrity:', integrityError)
          return NextResponse.json(
            { success: false, error: `Integrity validation failed: ${integrityError.message}` },
            { status: 500 }
          )
        }

      case 'sync_wallet_balance':
        // Enhanced wallet balance synchronization
        try {
          const syncResult = await syncAgentWalletBalance(agent_id)
          
          return NextResponse.json({
            success: syncResult.success,
            data: {
              message: syncResult.message,
              old_balance: syncResult.oldBalance,
              new_balance: syncResult.newBalance,
              difference: syncResult.difference,
              transaction_count: syncResult.transactionCount
            }
          })
        } catch (syncError: any) {
          console.error('❌ Error syncing wallet balance:', syncError)
          return NextResponse.json(
            { success: false, error: `Wallet sync failed: ${syncError.message}` },
            { status: 500 }
          )
        }

      case 'bulk_validation':
        // Validate wallet system integrity for multiple agents
        const { agent_ids } = params

        if (!agent_ids || !Array.isArray(agent_ids)) {
          return NextResponse.json(
            { success: false, error: 'Agent IDs array is required for bulk validation' },
            { status: 400 }
          )
        }

        const validationResults = []

        for (const agentId of agent_ids) {
          try {
            const [calculatedBalance, agentData] = await Promise.all([
              calculateWalletBalance(agentId),
              supabase
                .from('agents')
                .select('wallet_balance, name')
                .eq('id', agentId)
                .single()
            ])

            if (agentData.error) {
              validationResults.push({
                agent_id: agentId,
                status: 'error',
                error: 'Agent not found'
              })
              continue
            }

            const storedBalance = agentData.data.wallet_balance || 0
            const discrepancy = Math.abs(calculatedBalance - storedBalance)

            validationResults.push({
              agent_id: agentId,
              agent_name: agentData.data.name,
              calculated_balance: calculatedBalance,
              stored_balance: storedBalance,
              discrepancy,
              has_discrepancy: discrepancy > 0.01,
              status: discrepancy > 0.01 ? 'inconsistent' : 'consistent'
            })
          } catch (error) {
            validationResults.push({
              agent_id: agentId,
              status: 'error',
              error: error.message
            })
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            validation_results: validationResults,
            summary: {
              total_agents: agent_ids.length,
              consistent: validationResults.filter(r => r.status === 'consistent').length,
              inconsistent: validationResults.filter(r => r.status === 'inconsistent').length,
              errors: validationResults.filter(r => r.status === 'error').length
            }
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action specified' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('Error in admin wallet POST:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process admin wallet action' },
      { status: 500 }
    )
  }
}

// PUT - Update wallet transaction status (admin approval/rejection)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_id, status, admin_id, admin_notes } = body

    // Validate required fields
    if (!transaction_id || !status || !admin_id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID, status, and admin ID are required' },
        { status: 400 }
      )
    }

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be either approved or rejected' },
        { status: 400 }
      )
    }

    // Verify admin exists and is active
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id, name, is_active')
      .eq('id', admin_id)
      .single()

    if (adminError || !adminData || !adminData.is_active) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive admin' },
        { status: 403 }
      )
    }

    // Update transaction status
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('wallet_transactions')
      .update({
        status,
        admin_notes,
        processed_at: new Date().toISOString()
      })
      .eq('id', transaction_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update transaction status' },
        { status: 500 }
      )
    }

    // Log the admin action
    await supabase
      .from('admin_actions')
      .insert({
        admin_id,
        action_type: 'transaction_status_update',
        target_type: 'wallet_transaction',
        target_id: transaction_id,
        details: {
          old_status: 'pending',
          new_status: status,
          admin_notes,
          transaction_type: updatedTransaction.transaction_type,
          amount: updatedTransaction.amount
        }
      })

    return NextResponse.json({
      success: true,
      data: {
        transaction: updatedTransaction,
        message: `Transaction ${status} successfully`
      }
    })

  } catch (error: any) {
    console.error('Error in admin wallet PUT:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update transaction' },
      { status: 500 }
    )
  }
}
