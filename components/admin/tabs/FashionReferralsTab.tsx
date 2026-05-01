'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Gift, TrendingUp, User, Calendar, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FashionReferral {
  id: number;
  referrer_name: string;
  referrer_whatsapp: string | null;
  referrer_whatsapp_number?: string | null;
  referred_contact_whatsapp?: string | null;
  product_id: number;
  product_code: string;
  product_name: string;
  status: string;
  whatsapp_message_sent: boolean;
  created_at: string;
  commission_amount_locked?: number;
}

export default function FashionReferralsTab() {
  const [referrals, setReferrals] = useState<FashionReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/fashion/referrals-list');
      if (response.ok) {
        const data = await response.json();
        setReferrals(data.data || []);
      }
    } catch (error) {
      console.error('[v0] Error loading referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (referralId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/fashion/referrals-list/${referralId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setReferrals(referrals.map((r) => (r.id === referralId ? { ...r, status: newStatus } : r)));
      }
    } catch (error) {
      console.error('[v0] Error updating referral status:', error);
    }
  };

  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch =
      referral.referrer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.product_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'earned':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteReferral = async (referralId: number) => {
    if (!window.confirm('Are you sure you want to delete this referral?')) return;
    try {
      const response = await fetch(`/api/admin/fashion/referrals-list/${referralId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setReferrals((prev) => prev.filter((r) => r.id !== referralId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete referral');
      }
    } catch (error) {
      console.error('Error deleting referral:', error);
      alert('Failed to delete referral');
    }
  };

  const stats = {
    total: referrals.length,
    pending: referrals.filter((r) => r.status === 'pending').length,
    earned: referrals.filter((r) => r.status === 'earned').length,
    paid: referrals.filter((r) => r.status === 'paid').length,
  };

  if (loading) {
    return <div className="p-6">Loading referrals...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Earned</p>
                <p className="text-2xl font-bold text-green-600">{stats.earned}</p>
              </div>
              <Gift className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-purple-600">{stats.paid}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <Input
            placeholder="Search by referrer name, product code, or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="earned">Earned</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {filteredReferrals.length} of {referrals.length} referrals
        </p>
      </div>

      {/* Referrals List */}
      {filteredReferrals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No referrals found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReferrals.map((referral) => (
            <Card key={referral.id} className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">{referral.referrer_name}</h3>
                        <Badge className={getStatusBadgeColor(referral.status)}>
                          {referral.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{referral.product_name} ({referral.product_code})</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Select value={referral.status} onValueChange={(newStatus) => handleStatusChange(referral.id, newStatus)}>
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="earned">Earned</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteReferral(referral.id)} className="shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                    {(referral.referrer_whatsapp || referral.referrer_whatsapp_number) && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={`https://wa.me/${referral.referrer_whatsapp_number || referral.referrer_whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline"
                          title="Referrer's WhatsApp"
                        >
                          Referrer: {referral.referrer_whatsapp_number || referral.referrer_whatsapp}
                        </a>
                      </div>
                    )}
                    {referral.referred_contact_whatsapp && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={`https://wa.me/${referral.referred_contact_whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline"
                          title="Referred friend's WhatsApp"
                        >
                          Friend: {referral.referred_contact_whatsapp}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{new Date(referral.created_at).toLocaleDateString()}</span>
                    </div>
                    {referral.commission_amount_locked && (
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">GHS {referral.commission_amount_locked.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
