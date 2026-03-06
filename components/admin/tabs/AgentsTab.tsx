"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { supabase, hashPassword, type Agent } from "@/lib/supabase";
import { getCurrentAdmin } from "@/lib/auth";
import {
  Check,
  Trash2,
  RotateCcw,
  Search,
  AlertTriangle,
  Filter,
  Wallet,
  Eye,
  Download,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { getAgentCommissionSummary } from "@/lib/commission-earnings";
import { calculateWalletBalance } from "@/lib/earnings-calculator";
import { exportAgentsToCsv } from "@/lib/csv-export";
import { FloatingRefreshButton } from "@/components/admin/FloatingRefreshButton";
import { connectionManager } from "@/lib/connection-manager";
import { toast } from "sonner";

interface AgentWithWallet extends Agent {
  wallet_balance?: number;
  commission_balance?: number;
}

interface AgentsTabProps {
  getCachedData: () => AgentWithWallet[] | undefined;
  setCachedData: (data: AgentWithWallet[]) => void;
}

const AgentsTab = memo(function AgentsTab({ getCachedData, setCachedData }: AgentsTabProps) {
  const [agents, setAgents] = useState<AgentWithWallet[]>([]);
  const [totalAgents, setTotalAgents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState("");
  const [agentsFilterAdmin, setAgentsFilterAdmin] = useState("All Agents");
  const [currentAgentsPage, setCurrentAgentsPage] = useState(1);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentWithWallet | null>(null);
  const [agentPasswordReset, setAgentPasswordReset] = useState("");
  const [clearDataType, setClearDataType] = useState<"day" | "month">("day");
  const [loadingEarnings, setLoadingEarnings] = useState<Set<string>>(new Set());
  const [clearDataOptions, setClearDataOptions] = useState({
    dataOrders: true,
    referrals: false,
    withdrawals: false,
  });
  const itemsPerPage = 12;
  const admin = getCurrentAdmin();
  const agentsListRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (agentsListRef.current) {
      agentsListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePageChange = async (page: number) => {
    setCurrentAgentsPage(page);
    scrollToTop();
    await loadAgentsPage(page, agentSearchTerm, agentsFilterAdmin);
  };

  // Load earnings for visible agents on-demand
  const loadEarningsForAgents = useCallback(
    async (agentsToLoad: AgentWithWallet[]) => {
      const agentsNeedingEarnings = agentsToLoad.filter(
        (agent) => !agent.wallet_balance || !agent.commission_balance
      );

      if (agentsNeedingEarnings.length === 0) return;

      for (const agent of agentsNeedingEarnings) {
        setLoadingEarnings((prev) => new Set(prev).add(agent.id));
      }

      try {
        for (const agent of agentsNeedingEarnings) {
          try {
            const liveWalletBalance = await calculateWalletBalance(agent.id);
            const commissionSummary = await getAgentCommissionSummary(agent.id);
            const availableCommissions = commissionSummary.availableForWithdrawal;

            setAgents((prev) => {
              const updated = prev.map((a) =>
                a.id === agent.id
                  ? {
                      ...a,
                      wallet_balance: liveWalletBalance,
                      commission_balance: availableCommissions,
                    }
                  : a
              );
              setCachedData(updated);
              return updated;
            });
          } catch (error) {
            console.error(`[v0] Error calculating earnings for agent ${agent.id}:`, error);
          } finally {
            setLoadingEarnings((prev) => {
              const newSet = new Set(prev);
              newSet.delete(agent.id);
              return newSet;
            });
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error("[v0] Error loading earnings batch:", error);
      }
    },
    [setCachedData]
  );

  // Load agents with pagination (only 12 at a time)
  const loadAgentsPage = useCallback(
    async (page: number, searchTerm: string, statusFilter: string) => {
      setIsLoadingPage(true);
      try {
        let query = supabase
          .from("agents")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });

        if (statusFilter === "Approved") {
          query = query.eq("isapproved", true);
        } else if (statusFilter === "Pending") {
          query = query.eq("isapproved", false);
        }

        if (searchTerm && searchTerm.trim()) {
          query = query.or(
            `full_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,momo_number.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%`
          );
          query = query.limit(100);
        } else {
          const offset = (page - 1) * itemsPerPage;
          query = query.range(offset, offset + itemsPerPage - 1);
        }

        const { data: agentsData, error: agentsError, count } = await query;

        if (agentsError) throw agentsError;

        let agentList = (agentsData || []) as AgentWithWallet[];

        if (statusFilter === "Wallet Balance") {
          agentList = agentList.sort((a, b) => {
            const balanceA = a.wallet_balance || 0;
            const balanceB = b.wallet_balance || 0;
            return balanceB - balanceA;
          });
        }

        let paginatedAgents = agentList;
        let totalCount = agentList.length;
        if (searchTerm && searchTerm.trim()) {
          const offset = (page - 1) * itemsPerPage;
          paginatedAgents = agentList.slice(offset, offset + itemsPerPage);
          totalCount = agentList.length;
        } else {
          totalCount = count || 0;
        }

        setAgents(paginatedAgents);
        setTotalAgents(totalCount);

        if (paginatedAgents.length > 0) {
          await loadEarningsForAgents(paginatedAgents);
        }
      } catch (error) {
        console.error("[v0] Error loading agents page:", error);
        toast.error("Failed to load agents data.");
      } finally {
        setIsLoadingPage(false);
      }
    },
    [itemsPerPage, loadEarningsForAgents]
  );

  useEffect(() => {
    const loadInitialAgents = async () => {
      const cachedData = getCachedData();
      if (cachedData && cachedData.length > 0) {
        setAgents(cachedData);
        setLoading(false);
        return;
      }
      try {
        await loadAgentsPage(1, "", agentsFilterAdmin);
      } catch (error) {
        console.error("[v0] Error loading initial agents:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialAgents();
  }, [getCachedData, loadAgentsPage, agentsFilterAdmin]);

  // Handle search and filter changes - reload page 1 with new filters
  useEffect(() => {
    if (loading) return;
    setCurrentAgentsPage(1);
    const debounceTimer = setTimeout(() => {
      loadAgentsPage(1, agentSearchTerm, agentsFilterAdmin);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [agentSearchTerm, agentsFilterAdmin, loadAgentsPage, loading]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      " - " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const approveAgent = async (agentId: string) => {
    try {
      const { error } = await supabase.from("agents").update({ isapproved: true }).eq("id", agentId);
      if (error) throw error;
      const updatedAgents = agents.map((agent) =>
        agent.id === agentId ? { ...agent, isapproved: true } : agent
      );
      setAgents(updatedAgents);
      setCachedData(updatedAgents);
    } catch (error) {
      console.error("Error approving agent:", error);
      alert("Failed to approve agent");
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from("agents").delete().eq("id", agentId);
      if (error) throw error;
      const updatedAgents = agents.filter((agent) => agent.id !== agentId);
      setAgents(updatedAgents);
      setCachedData(updatedAgents);
    } catch (error) {
      console.error("Error deleting agent:", error);
      alert("Failed to delete agent");
    }
  };

  const handleExportToCsv = async () => {
    try {
      if (agents.length === 0) {
        toast.error("No agents to export");
        return;
      }

      const { data: allAgents, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!allAgents || allAgents.length === 0) {
        toast.error("No agents found to export");
        return;
      }

      const agentsForExport = await Promise.all(
        allAgents.map(async (agent) => {
          try {
            const walletBalance = await calculateWalletBalance(agent.id);
            const commissionSummary = await getAgentCommissionSummary(agent.id);
            return {
              id: agent.id,
              full_name: agent.full_name || "N/A",
              phone_number: agent.phone_number || "N/A",
              momo_number: agent.momo_number || "N/A",
              region: agent.region || "N/A",
              created_at: agent.created_at,
              isapproved: agent.isapproved,
              wallet_balance: walletBalance,
              commission_balance: commissionSummary.availableForWithdrawal || 0,
            };
          } catch (err) {
            console.warn("Error fetching balances for agent:", agent.id, err);
            return {
              id: agent.id,
              full_name: agent.full_name || "N/A",
              phone_number: agent.phone_number || "N/A",
              momo_number: agent.momo_number || "N/A",
              region: agent.region || "N/A",
              created_at: agent.created_at,
              isapproved: agent.isapproved,
              wallet_balance: agent.wallet_balance || 0,
              commission_balance: 0,
            };
          }
        })
      );

      const timestamp = new Date().toISOString().split("T")[0];
      exportAgentsToCsv(agentsForExport, `agents-list-${timestamp}.csv`);
      toast.success(`Exported ${agentsForExport.length} agents to CSV`);
    } catch (error) {
      console.error("[v0] Error exporting agents to CSV:", error);
      toast.error("Failed to export agents");
    }
  };

  const resetAgentPassword = async () => {
    if (!selectedAgent || !agentPasswordReset) return;
    try {
      const passwordHash = await hashPassword(agentPasswordReset);
      const { error } = await supabase
        .from("agents")
        .update({ password_hash: passwordHash })
        .eq("id", selectedAgent.id);
      if (error) throw error;
      alert(`Password reset successfully for ${selectedAgent.full_name}`);
      setShowAgentDialog(false);
      setAgentPasswordReset("");
      setSelectedAgent(null);
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to reset password");
    }
  };

  const clearData = async () => {
    if (
      !confirm(
        `Are you sure you want to clear selected data from ${
          clearDataType === "day" ? "today" : "this month"
        }? This will remove records from the admin dashboard but preserve agent historical data and processed commissions. This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const now = new Date();
      let cutoffDate: Date;
      if (clearDataType === "day") {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      const promises = [];
      const clearedTypes = [];
      if (clearDataOptions.dataOrders) {
        promises.push(
          supabase
            .from("data_orders")
            .delete()
            .in("status", ["completed", "confirmed", "canceled"])
            .eq("commission_paid", true)
            .lt("created_at", cutoffDate.toISOString())
        );
        clearedTypes.push("processed data orders");
      }
      if (clearDataOptions.referrals) {
        promises.push(
          supabase
            .from("referrals")
            .delete()
            .in("status", ["completed", "confirmed", "canceled"])
            .eq("commission_paid", true)
            .lt("created_at", cutoffDate.toISOString())
        );
        clearedTypes.push("processed referrals");
      }
      if (clearDataOptions.withdrawals) {
        promises.push(
          supabase
            .from("withdrawals")
            .delete()
            .in("status", ["paid", "rejected"])
            .lt("requested_at", cutoffDate.toISOString())
        );
        clearedTypes.push("completed withdrawals");
      }
      if (promises.length === 0) {
        alert("Please select at least one data type to clear.");
        return;
      }
      const results = await Promise.all(promises);
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        console.error("Errors during admin data cleanup:", errors);
        throw new Error("Some data could not be cleared");
      }
      const totalCleared = results.reduce((sum, result) => sum + (result.count || 0), 0);
      alert(
        `Successfully cleared ${totalCleared} admin records (${clearedTypes.join(", ")}) from ${
          clearDataType === "day" ? "today" : "this month"
        }. Agent historical data and wallet balances remain intact.`
      );
      setShowClearDialog(false);
      window.location.reload();
    } catch (error) {
      console.error("Error during admin data cleanup:", error);
      alert("Failed to clear admin data. Please check your selection and try again.");
    }
  };

  const openAgentDialog = (agent: AgentWithWallet) => {
    setSelectedAgent(agent);
    setShowAgentDialog(true);
  };

  const unapproveAgent = async (agentId: string) => {
    try {
      const { error } = await supabase.from("agents").update({ isapproved: false }).eq("id", agentId);
      if (error) throw error;
      const updatedAgents = agents.map((agent) =>
        agent.id === agentId ? { ...agent, isapproved: false } : agent
      );
      setAgents(updatedAgents);
      setCachedData(updatedAgents);
    } catch (error) {
      console.error("Error unapproving agent:", error);
      alert("Failed to unapprove agent");
    }
  };

  const handleCompleteRefresh = useCallback(async () => {
    console.log("Performing complete refresh...");
    try {
      await connectionManager.forceReconnect();
      await loadAgentsPage(currentAgentsPage, agentSearchTerm, agentsFilterAdmin);
      console.log("Complete refresh successful");
    } catch (error) {
      console.error("Complete refresh failed:", error);
    }
  }, [currentAgentsPage, agentSearchTerm, agentsFilterAdmin, loadAgentsPage]);

  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;
    const getVisiblePages = () => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const maxVisible = isMobile ? 3 : 5;
      if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      const end = Math.min(totalPages, start + maxVisible - 1);
      const adjustedStart = Math.max(1, end - maxVisible + 1);
      return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i);
    };
    const visiblePages = getVisiblePages();
    return (
      <div className="flex justify-center mt-4 sm:mt-6">
        <Pagination>
          <PaginationContent className="gap-1 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  if (currentPage > 1) onPageChange(currentPage - 1);
                }}
                className={`${
                  currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
            {visiblePages.map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => onPageChange(pageNum)}
                  isActive={currentPage === pageNum}
                  className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => {
                  if (currentPage < totalPages) onPageChange(currentPage + 1);
                }}
                className={`${
                  currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-emerald-800">Agent Management</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="Search agents..."
              value={agentSearchTerm}
              onChange={(e) => setAgentSearchTerm(e.target.value)}
              className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <Select value={agentsFilterAdmin} onValueChange={setAgentsFilterAdmin}>
            <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Agents">All Agents</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Wallet Balance">Wallet Balance</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleExportToCsv}
            variant="outline"
            className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 whitespace-nowrap bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => setShowClearDialog(true)}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 whitespace-nowrap"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Admin Cleanup
          </Button>
        </div>
      </div>

      {/* Agents List - Redesigned Cards */}
      <div ref={agentsListRef} className="space-y-4">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <CardContent className="p-4">
              {/* Header: Name + Status Badge */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">{agent.full_name}</h3>
                <Badge
                  className={
                    agent.isapproved
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-amber-100 text-amber-700 border-amber-200"
                  }
                >
                  {agent.isapproved ? "Approved" : "Pending"}
                </Badge>
              </div>

              {/* Balance Cards - Side by Side */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Wallet Balance */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center gap-1.5 text-blue-700 mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs font-medium">Wallet Balance</span>
                  </div>
                  <p className="text-lg font-bold text-blue-800">
                    ₵{agent.wallet_balance?.toFixed(2) || "0.00"}
                  </p>
                </div>

                {/* Commission Balance */}
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center gap-1.5 text-green-700 mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs font-medium">Commission Balance</span>
                  </div>
                  <p className="text-lg font-bold text-green-800">
                    ₵{agent.commission_balance?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              {/* Contact Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Phone:</span> {agent.phone_number}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">MoMo:</span> {agent.momo_number}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Region:</span> {agent.region}
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Joined:</span> {formatTimestamp(agent.created_at)}
                </div>
              </div>

              {/* Action Buttons - 2x2 grid on mobile, 4 in a row on larger screens */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-gray-100">
                <Link href={`/admin/agents/${agent.id}`} passHref>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </Link>
                {!agent.isapproved ? (
                  <Button
                    size="sm"
                    onClick={() => approveAgent(agent.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unapproveAgent(agent.id)}
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Unapprove
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAgentDialog(agent)}
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteAgent(agent.id)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoadingPage && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      )}

      <PaginationControls
        currentPage={currentAgentsPage}
        totalPages={Math.ceil(totalAgents / itemsPerPage)}
        onPageChange={handlePageChange}
      />

      <FloatingRefreshButton onRefresh={handleCompleteRefresh} showConnectionStatus={true} />

      {/* Reset Password Dialog */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>Reset Agent Password</DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agentName" className="text-right">
                  Agent Name
                </Label>
                <Input
                  type="text"
                  id="agentName"
                  value={selectedAgent.full_name}
                  className="col-span-3"
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newPassword" className="text-right">
                  New Password
                </Label>
                <Input
                  type="password"
                  id="newPassword"
                  value={agentPasswordReset}
                  onChange={(e) => setAgentPasswordReset(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={resetAgentPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto p-4 sm:p-6">
          <DialogHeader className="text-center space-y-3">
            <DialogTitle className="text-lg sm:text-xl font-semibold">Admin Data Cleanup</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Label htmlFor="clearDataType" className="block text-sm font-medium text-gray-700">
              Time Range
            </Label>
            <Select value={clearDataType} onValueChange={setClearDataType}>
              <SelectTrigger className="w-full h-12 text-sm sm:text-base">
                <SelectValue placeholder="Select Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <div
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                  setClearDataOptions((prev) => ({ ...prev, dataOrders: !prev.dataOrders }))
                }
              >
                <input
                  type="checkbox"
                  checked={clearDataOptions.dataOrders}
                  onChange={() => {}}
                  className="form-checkbox h-5 w-5 text-emerald-600"
                />
                <Label className="text-sm sm:text-base text-gray-700 flex-1">Data Orders</Label>
              </div>
              <div
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                  setClearDataOptions((prev) => ({ ...prev, referrals: !prev.referrals }))
                }
              >
                <input
                  type="checkbox"
                  checked={clearDataOptions.referrals}
                  onChange={() => {}}
                  className="form-checkbox h-5 w-5 text-emerald-600"
                />
                <Label className="text-sm sm:text-base text-gray-700 flex-1">Referrals</Label>
              </div>
              <div
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                  setClearDataOptions((prev) => ({ ...prev, withdrawals: !prev.withdrawals }))
                }
              >
                <input
                  type="checkbox"
                  checked={clearDataOptions.withdrawals}
                  onChange={() => {}}
                  className="form-checkbox h-5 w-5 text-emerald-600"
                />
                <Label className="text-sm sm:text-base text-gray-700 flex-1">Withdrawals</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={clearData}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Clear Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default AgentsTab;