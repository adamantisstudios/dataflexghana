'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit2, Search, FileDown, X, Upload, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { uploadSalonServiceImage, deleteSalonServiceImage } from '@/lib/salon-image-upload';

interface Service {
  id: number;
  service_name: string;
  service_code: string;
  description: string;
  category_id: number;
  category_name: string;
  base_price: number;
  express_price?: number;
  duration_minutes: number;
  provider_name: string;
  provider_contact: string;
  provider_location: string;
  provider_availability: string;
  provider_social: string;
  status: string;
  image_urls?: string[];
  image_count?: number;
}

interface Category {
  id: number;
  name: string;
}

interface Booking {
  id: number;
  service_name: string;
  category_name: string;
  client_name: string;
  client_whatsapp: string;
  client_email?: string;
  location: string;
  landmark?: string;
  preferred_date: string;
  preferred_time: string;
  notes: string;
  status: string;
  created_at: string;
}

interface Referral {
  id: number;
  referrer_name: string;
  referrer_whatsapp: string;
  referrer_email?: string;
  referred_name: string;
  referred_whatsapp: string;
  service_name: string;
  location: string;
  status: string;
  notes?: string;
  created_at: string;
}

export default function SalonTab() {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const ITEMS_PER_PAGE = 12;

  const [serviceForm, setServiceForm] = useState({
    service_name: '',
    service_code: '',
    description: '',
    category_id: '',
    base_price: '',
    express_price: '',
    duration_minutes: '',
    provider_name: '',
    provider_contact: '',
    provider_location: '',
    provider_availability: '',
    provider_social: '',
    image_urls: [] as string[],
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
  });

  const toSafeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const safeParseNumber = (value: any, defaultValue: number = 0): number => {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
    fetchBookings();
    fetchReferrals();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/salon/services');
      const data = await response.json();
      setServices(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/salon/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/salon/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/salon/referrals');
      if (!response.ok) throw new Error('Failed to fetch referrals');
      const data = await response.json();
      setReferrals(data.referrals || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setReferrals([]);
    }
  };

  const handleAddService = async () => {
    if (!serviceForm.service_name || !serviceForm.category_id || !serviceForm.base_price) {
      alert('Please fill in all required fields');
      return;
    }

    const categoryIdStr = toSafeString(serviceForm.category_id).trim();

    const submitData = {
      service_name: serviceForm.service_name,
      service_code: serviceForm.service_code || `SVC-${Date.now()}`,
      description: serviceForm.description,
      category_id: parseInt(categoryIdStr),
      base_price: safeParseNumber(serviceForm.base_price),
      express_price: serviceForm.express_price ? safeParseNumber(serviceForm.express_price) : null,
      duration_minutes: safeParseNumber(serviceForm.duration_minutes, 60),
      provider_name: serviceForm.provider_name,
      provider_contact: serviceForm.provider_contact,
      provider_location: serviceForm.provider_location,
      provider_availability: serviceForm.provider_availability,
      provider_social: serviceForm.provider_social,
      image_urls: serviceForm.image_urls,
    };

    try {
      const response = await fetch('/api/salon/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const responseData = await response.json();

      if (responseData.success) {
        await fetchServices();
        setShowAddService(false);
        setServiceForm({
          service_name: '',
          service_code: '',
          description: '',
          category_id: '',
          base_price: '',
          express_price: '',
          duration_minutes: '',
          provider_name: '',
          provider_contact: '',
          provider_location: '',
          provider_availability: '',
          provider_social: '',
          image_urls: [],
        });
        alert('Service added successfully!');
      } else {
        alert(`Failed to add service: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[v0] Error adding service:', error);
      alert(`Failed to add service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditService = async () => {
    if (!editingService) return;

    try {
      const response = await fetch(`/api/salon/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingService.id,
          service_name: editingService.service_name,
          service_code: editingService.service_code,
          description: editingService.description,
          category_id: parseInt(toSafeString(editingService.category_id)),
          base_price: safeParseNumber(editingService.base_price),
          express_price: editingService.express_price ? safeParseNumber(editingService.express_price) : null,
          duration_minutes: safeParseNumber(editingService.duration_minutes, 60),
          provider_name: editingService.provider_name,
          provider_contact: editingService.provider_contact,
          provider_location: editingService.provider_location,
          provider_availability: editingService.provider_availability,
          provider_social: editingService.provider_social,
          status: editingService.status,
        }),
      });

      const responseData = await response.json();

      if (responseData.success) {
        await fetchServices();
        setEditingService(null);
        alert('Service updated successfully!');
      } else {
        alert(responseData.error || 'Failed to update service');
      }
    } catch (error) {
      console.error('[v0] Error updating service:', error);
      alert(`Failed to update service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    try {
      console.log('[v0] Deleting service:', serviceId);
      const response = await fetch(`/api/salon/services?id=${serviceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      console.log('[v0] Delete response:', data);

      if (data.success) {
        await fetchServices();
        alert('Service deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete service');
      }
    } catch (error) {
      console.error('[v0] Error deleting service:', error);
      alert('Failed to delete service');
    }
  };

  const handleDeleteBooking = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      const response = await fetch(`/api/salon/bookings?id=${bookingId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        await fetchBookings();
        alert('Booking deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const handleDeleteReferral = async (referralId: number) => {
    if (!window.confirm('Are you sure you want to delete this referral?')) return;
    try {
      const response = await fetch(`/api/salon/referrals?id=${referralId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        await fetchReferrals();
        alert('Referral deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete referral');
      }
    } catch (error) {
      console.error('Error deleting referral:', error);
      alert('Failed to delete referral');
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const response = await fetch('/api/salon/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryForm.name }),
      });

      if (response.ok) {
        fetchCategories();
        setCategoryForm({ name: '' });
        alert('Category added successfully!');
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || !files.length) return;

    setUploadingImages(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadSalonServiceImage(files[i], (progress) => {
          setUploadProgress(Math.round((i / files.length) * 100 + (progress / files.length)));
        });
        if (url) urls.push(url);
      }

      if (editingService) {
        setEditingService({ ...editingService, image_urls: [...(editingService.image_urls || []), ...urls] });
      } else {
        setServiceForm({ ...serviceForm, image_urls: [...serviceForm.image_urls, ...urls] });
      }

      setUploadingImages(false);
      setUploadProgress(0);
      alert(`${urls.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingImages(false);
      setUploadProgress(0);
      alert('Failed to upload images');
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      await deleteSalonServiceImage(imageUrl);

      if (editingService) {
        const updatedUrls = (editingService.image_urls || []).filter((url) => url !== imageUrl);
        setEditingService({
          ...editingService,
          image_urls: updatedUrls,
        });

        // Update in database
        const response = await fetch('/api/salon/services', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingService.id,
            service_name: editingService.service_name,
            service_code: editingService.service_code,
            description: editingService.description,
            category_id: editingService.category_id,
            base_price: editingService.base_price,
            express_price: editingService.express_price,
            duration_minutes: editingService.duration_minutes,
            provider_name: editingService.provider_name,
            provider_contact: editingService.provider_contact,
            provider_location: editingService.provider_location,
            provider_availability: editingService.provider_availability,
            provider_social: editingService.provider_social,
            status: editingService.status,
            image_urls: updatedUrls,
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to update image URLs in database');
        }
      } else {
        setServiceForm({
          ...serviceForm,
          image_urls: serviceForm.image_urls.filter((url) => url !== imageUrl),
        });
      }

      alert('Image removed successfully!');
    } catch (error) {
      console.error('[v0] Error deleting image:', error);
      alert('Failed to remove image');
    }
  };

  // Alias for consistency
  const handleDeleteImage = handleRemoveImage;

  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    const matchesLocation = filterLocation === 'all' || booking.location === filterLocation;
    const matchesCategory = filterCategory === 'all' || booking.category_name === filterCategory;
    return matchesStatus && matchesLocation && matchesCategory;
  });

  const filteredReferrals = referrals.filter((referral) => {
    return filterStatus === 'all' || referral.status === filterStatus;
  });

  const uniqueLocations = Array.from(new Set(bookings.map((b) => b.location).filter(Boolean)));
  const uniqueCategories = Array.from(new Set(bookings.map((b) => b.category_name).filter(Boolean)));

  const exportBookingsToCSV = () => {
    if (filteredBookings.length === 0) {
      alert('No bookings to export');
      return;
    }

    const headers = ['Client Name', 'WhatsApp', 'Email', 'Service', 'Category', 'Location', 'Preferred Date', 'Preferred Time', 'Status', 'Booking Date'];
    const rows = filteredBookings.map((booking) => [
      booking.client_name,
      booking.client_whatsapp,
      booking.client_email || 'N/A',
      booking.service_name,
      booking.category_name || 'N/A',
      booking.location,
      new Date(booking.preferred_date).toLocaleDateString('en-GB'),
      booking.preferred_time,
      booking.status,
      new Date(booking.created_at).toLocaleDateString('en-GB') + ' ' + new Date(booking.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salon-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportReferralsToCSV = () => {
    if (filteredReferrals.length === 0) {
      alert('No referrals to export');
      return;
    }

    const headers = ['Referrer Name', 'Referrer Phone', 'Referred Name', 'Referred Phone', 'Service', 'Location', 'Status', 'Date'];
    const rows = filteredReferrals.map((ref) => [
      ref.referrer_name,
      ref.referrer_whatsapp,
      ref.referred_name,
      ref.referred_whatsapp,
      ref.service_name,
      ref.location,
      ref.status,
      new Date(ref.created_at).toLocaleDateString('en-GB'),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salon-referrals-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="p-4 text-center">Loading salon data...</div>;
  }

  return (
    <div className="w-full">
      {/* Mobile-Responsive Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 h-auto p-1">
          <TabsTrigger value="services" className="text-xs md:text-sm">Services</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs md:text-sm">Categories</TabsTrigger>
          <TabsTrigger value="bookings" className="text-xs md:text-sm">Bookings</TabsTrigger>
          <TabsTrigger value="referrals" className="text-xs md:text-sm">Referrals</TabsTrigger>
        </TabsList>

        {/* SERVICES TAB */}
        <TabsContent value="services" className="space-y-6 mt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={showAddService} onOpenChange={setShowAddService}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Service</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Service Name *"
                    value={serviceForm.service_name}
                    onChange={(e) => setServiceForm({ ...serviceForm, service_name: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Service Code"
                      value={serviceForm.service_code}
                      onChange={(e) => setServiceForm({ ...serviceForm, service_code: e.target.value })}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setServiceForm({ ...serviceForm, service_code: `SVC-${Date.now()}` })}
                      className="whitespace-nowrap"
                    >
                      Generate Code
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Description"
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    className="min-h-20"
                  />

                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <Select value={toSafeString(serviceForm.category_id)} onValueChange={(value) => setServiceForm({ ...serviceForm, category_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder" disabled>Select a category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Base Price (GHS) *"
                      type="number"
                      step="0.01"
                      value={serviceForm.base_price}
                      onChange={(e) => setServiceForm({ ...serviceForm, base_price: e.target.value })}
                    />
                    <Input
                      placeholder="Express Price (GHS)"
                      type="number"
                      step="0.01"
                      value={serviceForm.express_price}
                      onChange={(e) => setServiceForm({ ...serviceForm, express_price: e.target.value })}
                    />
                  </div>

                  <Input
                    placeholder="Duration (minutes)"
                    type="number"
                    value={serviceForm.duration_minutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                  />

                  <div className="border-t pt-4">
                    <p className="font-semibold text-sm mb-3">Provider Details</p>
                    <Input
                      placeholder="Provider Name"
                      value={serviceForm.provider_name}
                      onChange={(e) => setServiceForm({ ...serviceForm, provider_name: e.target.value })}
                      className="mb-2"
                    />
                    <Input
                      placeholder="Provider Phone"
                      value={serviceForm.provider_contact}
                      onChange={(e) => setServiceForm({ ...serviceForm, provider_contact: e.target.value })}
                      className="mb-2"
                    />
                    <Input
                      placeholder="Provider Location"
                      value={serviceForm.provider_location}
                      onChange={(e) => setServiceForm({ ...serviceForm, provider_location: e.target.value })}
                      className="mb-2"
                    />
                    <Input
                      placeholder="Availability (e.g., Mon-Fri 9AM-6PM)"
                      value={serviceForm.provider_availability}
                      onChange={(e) => setServiceForm({ ...serviceForm, provider_availability: e.target.value })}
                      className="mb-2"
                    />
                    <Input
                      placeholder="Social Media Handles"
                      value={serviceForm.provider_social}
                      onChange={(e) => setServiceForm({ ...serviceForm, provider_social: e.target.value })}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-2">Service Images</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleUploadImages}
                      disabled={uploadingImages}
                      className="block w-full text-sm text-gray-500"
                    />
                    {uploadingImages && <p className="mt-2 text-sm text-blue-600">Uploading... {uploadProgress}%</p>}
                    {serviceForm.image_urls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {serviceForm.image_urls.map((url, idx) => (
                          <div key={idx} className="relative">
                            <img src={url} alt={`Service ${idx}`} className="w-full h-24 object-cover rounded" />
                            <button
                              onClick={() => handleDeleteImage(url)}
                              className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddService} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Add Service
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddService(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Services Grid */}
          {services.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                No services added yet. Click &quot;Add Service&quot; to get started.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <Card key={service.id} className="overflow-hidden">
                    {/* Service Images */}
                    <div className="relative w-full h-40 bg-gray-200 overflow-hidden">
                      <img
                        src={service.image_urls && service.image_urls.length > 0 ? service.image_urls[0] : '/placeholder-salon.jpg'}
                        alt={service.service_name}
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.src = '/placeholder-salon.jpg';
                        }}
                      />
                      {service.image_urls && service.image_urls.length > 1 && (
                        <Badge className="absolute top-2 right-2 bg-blue-600">
                          {service.image_urls.length} images
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{service.service_name}</h3>
                          <p className="text-sm text-gray-600">{service.category_name}</p>
                        </div>
                        <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                          {service.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>

                      <div className="text-sm text-gray-600">
                        <p>Price: GHS {service.base_price.toFixed(2)}</p>
                        <p>Duration: {service.duration_minutes} mins</p>
                        <p>Provider: {service.provider_name}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingService(service)}
                          className="flex-1"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="flex-1">
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                            <div className="flex gap-2">
                              <AlertDialogAction
                                onClick={() => handleDeleteService(service.id)}
                                className="bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories" className="space-y-6 mt-6">
          <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category Name *</label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g., Braiding"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddCategory} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Add Category
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddCategory(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Card key={cat.id}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* BOOKINGS TAB */}
        <TabsContent value="bookings" className="space-y-6 mt-6">
          <div className="flex flex-col md:flex-row gap-2 flex-wrap">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {uniqueLocations.map((loc, index) => (
                  <SelectItem key={`${loc}-${index}`} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((cat, index) => (
                  <SelectItem key={`${cat}-${index}`} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={exportBookingsToCSV} className="w-full md:w-auto bg-green-600 hover:bg-green-700">
              <FileDown className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-900">{booking.client_name}</h3>
                      <Badge variant={booking.status === 'pending' ? 'secondary' : 'default'}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{booking.service_name}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Phone: {booking.client_whatsapp}</p>
                    <p>Location: {booking.location}</p>
                    <p>Date: {new Date(booking.preferred_date).toLocaleDateString('en-GB')}</p>
                    <p>Time: {booking.preferred_time}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteBooking(booking.id)}
                    className="w-full"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete Booking
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* REFERRALS TAB */}
        <TabsContent value="referrals" className="space-y-6 mt-6">
          <div className="flex flex-col md:flex-row gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportReferralsToCSV} className="w-full md:w-auto bg-green-600 hover:bg-green-700">
              <FileDown className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReferrals.map((ref) => (
              <Card key={ref.id} className="border-l-4 border-l-purple-500">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-900">{ref.referrer_name}</h3>
                      <Badge variant={ref.status === 'pending' ? 'secondary' : 'default'}>
                        {ref.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Referred {ref.referred_name}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Service: {ref.service_name}</p>
                    <p>Location: {ref.location}</p>
                    <p>Referred Phone: {ref.referred_whatsapp}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(ref.created_at).toLocaleDateString('en-GB')}
                  </p>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteReferral(ref.id)}
                    className="w-full"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete Referral
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Service Dialog */}
      {editingService && (
        <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Basic Information</h3>
                <Input
                  value={editingService.service_name}
                  onChange={(e) => setEditingService({ ...editingService, service_name: e.target.value })}
                  placeholder="Service Name"
                />
                <div className="flex gap-2">
                  <Input
                    value={editingService.service_code}
                    onChange={(e) => setEditingService({ ...editingService, service_code: e.target.value })}
                    placeholder="Service Code"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingService({ ...editingService, service_code: `SVC-${Date.now()}` })}
                    className="whitespace-nowrap"
                  >
                    Generate Code
                  </Button>
                </div>
                <Textarea
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  placeholder="Description"
                  className="min-h-20"
                />
                <Select value={editingService.category_id.toString()} onValueChange={(value) => setEditingService({ ...editingService, category_id: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing & Duration */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Pricing & Duration</h3>
                <Input
                  value={editingService.base_price}
                  onChange={(e) => setEditingService({ ...editingService, base_price: parseFloat(e.target.value) })}
                  type="number"
                  step="0.01"
                  placeholder="Base Price (GHS)"
                />
                <Input
                  value={editingService.express_price || ''}
                  onChange={(e) => setEditingService({ ...editingService, express_price: e.target.value ? parseFloat(e.target.value) : undefined })}
                  type="number"
                  step="0.01"
                  placeholder="Express Price (Optional)"
                />
                <Input
                  value={editingService.duration_minutes}
                  onChange={(e) => setEditingService({ ...editingService, duration_minutes: parseInt(e.target.value) })}
                  type="number"
                  placeholder="Duration (minutes)"
                />
              </div>

              {/* Provider Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Provider Information</h3>
                <Input
                  value={editingService.provider_name}
                  onChange={(e) => setEditingService({ ...editingService, provider_name: e.target.value })}
                  placeholder="Provider Name"
                />
                <Input
                  value={editingService.provider_contact || ''}
                  onChange={(e) => setEditingService({ ...editingService, provider_contact: e.target.value })}
                  placeholder="Provider Phone"
                />
                <Input
                  value={editingService.provider_location || ''}
                  onChange={(e) => setEditingService({ ...editingService, provider_location: e.target.value })}
                  placeholder="Provider Location"
                />
                <Input
                  value={editingService.provider_availability || ''}
                  onChange={(e) => setEditingService({ ...editingService, provider_availability: e.target.value })}
                  placeholder="Availability (e.g., Mon-Fri 9AM-6PM)"
                />
                <Input
                  value={editingService.provider_social || ''}
                  onChange={(e) => setEditingService({ ...editingService, provider_social: e.target.value })}
                  placeholder="Social Media Handle"
                />
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Service Images</h3>
                {editingService.image_urls && editingService.image_urls.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {editingService.image_urls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt={`Service ${idx}`} className="w-full h-24 object-cover rounded-lg" />
                        <button
                          onClick={() => handleRemoveImage(url)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="flex-1">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleUploadImages}
                      disabled={uploadingImages}
                      className="cursor-pointer"
                    />
                  </label>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  )}
                </div>
                {uploadingImages && <p className="text-sm text-gray-600">Uploading images...</p>}
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Status</h3>
                <Select value={editingService.status} onValueChange={(value) => setEditingService({ ...editingService, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditService} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingService(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
