'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Mail, Phone, MapPin, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectRequest {
  id: number;
  product_id: number;
  product_code: string;
  client_name: string;
  client_whatsapp: string;
  client_location: string;
  timeline_preference: string;
  measurements: Record<string, string> | null;
  additional_notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  whatsapp_message_sent: boolean;
}

export default function FashionProjectRequestsTab() {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/fashion/project-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error('[v0] Error loading project requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/fashion/project-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setRequests(requests.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r)));
      }
    } catch (error) {
      console.error('[v0] Error updating request status:', error);
    }
  };

  const handleSaveNotes = async (requestId: number) => {
    try {
      const response = await fetch(`/api/admin/fashion/project-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      if (response.ok) {
        setRequests(requests.map((r) => (r.id === requestId ? { ...r, admin_notes: adminNotes } : r)));
        setShowDetailsModal(false);
        setAdminNotes('');
      }
    } catch (error) {
      console.error('[v0] Error saving notes:', error);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.client_whatsapp.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="p-6">Loading project requests...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <Input
            placeholder="Search by client name, product code, or WhatsApp number..."
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
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {filteredRequests.length} of {requests.length} requests
        </p>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No project requests found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{request.client_name}</h3>
                        <Badge className={getStatusBadgeColor(request.status)}>
                          {getStatusIcon(request.status)} {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.product_code} - {request.client_location}</p>
                    </div>
                    <Select value={request.status} onValueChange={(newStatus) => handleStatusChange(request.id, newStatus)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Contact Details */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={`https://wa.me/${request.client_whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{request.client_location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{request.timeline_preference}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Measurements and Notes */}
                  {request.measurements && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Measurements:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.measurements}</p>
                    </div>
                  )}

                  {request.additional_notes && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Client Notes:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.additional_notes}</p>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <Dialog open={showDetailsModal && selectedRequest?.id === request.id} onOpenChange={setShowDetailsModal}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setAdminNotes(request.admin_notes || '');
                        }}
                      >
                        {request.admin_notes ? 'Edit Notes' : 'Add Notes'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Admin Notes for {request.client_name}</DialogTitle>
                      </DialogHeader>
                      <Textarea
                        placeholder="Add internal notes for tracking and follow-up..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="min-h-32"
                      />
                      <Button onClick={() => handleSaveNotes(request.id)} className="w-full">
                        Save Notes
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
