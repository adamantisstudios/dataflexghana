import React, { useState, useEffect } from 'react';
import {
  getWithdrawals,
  getWithdrawalById,
  updateWithdrawalStatus,
  getWithdrawalsByStatus,
  getWithdrawalStats
} from '../../lib/withdrawals';
import { toast } from 'react-hot-toast';

const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      let data;

      if (statusFilter === 'all') {
        data = await getWithdrawals();
      } else {
        data = await getWithdrawalsByStatus(statusFilter);
      }

      setWithdrawals(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      setProcessingId(id);

      // For approval/rejection, show modal for notes
      if (status === 'approved' || status === 'rejected') {
        setSelectedWithdrawal(id);
        setShowModal(true);
        return;
      }

      // CRITICAL FIX: Handle "paid" status properly
      if (status === 'paid') {
        // Show confirmation dialog for paid status
        const confirmed = window.confirm(
          'Are you sure you want to mark this withdrawal as PAID? This action will permanently remove the money from the agent\'s available balance and cannot be undone.'
        );

        if (!confirmed) {
          setProcessingId(null);
          return;
        }
      }

      // For other status updates including "paid"
      const updated = await updateWithdrawalStatus(id, status, 'admin-user-id');

      // Update local state
      setWithdrawals(prev =>
        prev.map(w => w.id === id ? { ...w, ...updated } : w)
      );

      // CRITICAL FIX: Show appropriate success message for paid status
      if (status === 'paid') {
        toast.success(`Withdrawal marked as PAID successfully. Money has been permanently removed from agent's available balance.`);
      } else {
        toast.success(`Withdrawal ${status} successfully`);
      }

      fetchWithdrawals(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update withdrawal status');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmStatusUpdate = async () => {
    if (!selectedWithdrawal) return;

    try {
      setProcessingId(selectedWithdrawal);

      const status = adminNotes.toLowerCase().includes('reject') ? 'rejected' : 'approved';

      const updated = await updateWithdrawalStatus(
        selectedWithdrawal,
        status,
        'admin-user-id',
        adminNotes
      );

      setWithdrawals(prev =>
        prev.map(w => w.id === selectedWithdrawal ? { ...w, ...updated } : w)
      );

      toast.success(`Withdrawal ${status} successfully`);

      // Reset modal
      setShowModal(false);
      setSelectedWithdrawal(null);
      setAdminNotes('');
      fetchWithdrawals();
    } catch (error) {
      console.error('Error confirming status update:', error);
      toast.error('Failed to update withdrawal status');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800 font-semibold', // CRITICAL FIX: Add paid status styling
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Withdrawal Management</h2>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading withdrawals...</p>
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No withdrawals found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {withdrawal.user?.full_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {withdrawal.user?.email || 'No email'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(withdrawal.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(withdrawal.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {withdrawal.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(withdrawal.id, 'approved')}
                            disabled={processingId === withdrawal.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {processingId === withdrawal.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(withdrawal.id, 'rejected')}
                            disabled={processingId === withdrawal.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {processingId === withdrawal.id ? 'Processing...' : 'Reject'}
                          </button>
                        </>
                      )}
                      {withdrawal.status === 'approved' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(withdrawal.id, 'paid')}
                            disabled={processingId === withdrawal.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 font-semibold"
                          >
                            {processingId === withdrawal.id ? 'Processing...' : 'Mark as Paid'}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(withdrawal.id, 'completed')}
                            disabled={processingId === withdrawal.id}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            {processingId === withdrawal.id ? 'Processing...' : 'Complete'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for admin notes */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Withdrawal Status</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Add notes about this status change..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedWithdrawal(null);
                  setAdminNotes('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                disabled={processingId === selectedWithdrawal}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {processingId === selectedWithdrawal ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagement;
