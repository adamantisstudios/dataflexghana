'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Search, Sparkles, Clock, MapPin, ChevronDown, Heart } from 'lucide-react';

interface Service {
  id: number;
  service_name: string;
  service_code: string;
  description: string;
  category_id: number;
  category_name: string;
  base_price: number;
  duration_minutes: number;
  provider_name: string;
  image_urls?: string[];
  status: string;
}

interface Category {
  id: number;
  name: string;
}

interface Location {
  name: string;
}

export default function SalonPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<number, number>>({});
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const [referralForm, setReferralForm] = useState({
    referrer_name: '',
    referrer_whatsapp: '',
    referrer_email: '',
    referred_name: '',
    referred_whatsapp: '',
  });

  // Accra locations - comprehensive list of all suburbs
  const accraLocations: Location[] = [
    // Central Accra
    { name: 'Abelenkpe' },
    { name: 'Abossey Okai' },
    { name: 'Accra New Town' },
    { name: 'Adabraka' },
    { name: 'Airport Residential Area' },
    { name: 'Asylum Down' },
    { name: 'Avenor' },
    { name: 'Cantonments' },
    { name: 'Christiansborg / Osu' },
    { name: 'Dzorwulu' },
    { name: 'Jamestown' },
    { name: 'Kanda' },
    { name: 'Kokomlemle' },
    { name: 'Korle Bu' },
    { name: 'Korle Gonno' },
    { name: 'Kotobabi' },
    { name: 'Kpehe' },
    { name: 'Labone' },
    { name: 'Maamobi' },
    { name: 'Ministries' },
    { name: 'North Ridge' },
    { name: 'Nyaniba' },
    { name: 'Okaishie' },
    { name: 'Osu' },
    { name: 'Osu Kinkawe' },
    { name: 'Ringway Estates' },
    { name: 'Roman Ridge' },
    { name: 'Shiabu' },
    { name: 'South La' },
    { name: 'Swalaba' },
    { name: 'Tudu' },
    { name: 'Usshertown' },
    { name: 'Victoriaborg' },
    { name: 'West Ridge' },
    // Western Accra
    { name: 'Ablekuma' },
    { name: 'Abofu' },
    { name: 'Awoshie' },
    { name: 'Bubiashie' },
    { name: 'Chorkor' },
    { name: 'Darkuman' },
    { name: 'Dansoman' },
    { name: 'Dunkonah' },
    { name: 'Gbawe' },
    { name: 'Glefe' },
    { name: 'Kaneshie' },
    { name: 'Lapaz' },
    { name: 'Lartebiokorshie' },
    { name: 'Mamprobi' },
    { name: 'Mataheko' },
    { name: 'Mpoase' },
    { name: 'New Mamprobi' },
    { name: 'Odorkor' },
    { name: 'Russia' },
    { name: 'Sabon Zongo' },
    { name: 'Santa Maria' },
    { name: 'Tesano' },
    // Northern Accra
    { name: 'Abeka' },
    { name: 'Achimota' },
    { name: 'Agbogba' },
    { name: 'Alajo' },
    { name: 'Amasaman' },
    { name: 'Apenkwa' },
    { name: 'Ashaiman' },
    { name: 'Ashongman' },
    { name: 'Ashaley Botwe' },
    { name: 'Bortianor' },
    { name: 'Christian Village' },
    { name: 'Dome' },
    { name: 'Dodowa' },
    { name: 'Gbwe' },
    { name: 'Haatso' },
    { name: 'Kwabenya' },
    { name: 'Kwashieman' },
    { name: 'Madina' },
    { name: 'Nima' },
    { name: 'Nkwatanang' },
    { name: 'North Legon' },
    { name: 'Ofankor' },
    { name: 'Oyarifa' },
    { name: 'Pantang' },
    { name: 'Pokuase' },
    { name: 'Taifa' },
    { name: 'West Legon' },
    // Eastern & Coastal Accra
    { name: 'Adenta' },
    { name: 'Adjiringanor' },
    { name: 'Airport Hills' },
    { name: 'Bawaleshie' },
    { name: 'Burma Camp' },
    { name: 'East Legon' },
    { name: 'Kpone' },
    { name: 'La' },
    { name: 'Nungua' },
    { name: 'Prampram' },
    { name: 'Sakumono' },
    { name: 'Sege' },
    { name: 'Shiashie' },
    { name: 'Spintex Road Area' },
    { name: 'Tema' },
    { name: 'Teshie' },
    { name: 'Tse Addo' },
  ];

  const [bookingForm, setBookingForm] = useState({
    client_name: '',
    client_whatsapp: '',
    location: '',
    preferred_date: '',
    preferred_time: '',
    notes: '',
  });

  // Hero slides - will use service images
  const heroSlides = services.slice(0, 3).map((service) => ({
    id: service.id,
    title: service.service_name,
    subtitle: service.description.substring(0, 60) + (service.description.length > 60 ? '...' : ''),
    image: service.image_urls?.[0] || '/placeholder-salon.jpg',
    price: `GHS ${service.base_price}`,
  }));

  const displayHeroSlides = heroSlides.length > 0 ? heroSlides : [
    {
      id: 0,
      title: 'Premium Salon & Beauty Services',
      subtitle: 'Professional beauty treatments in Accra',
      image: '/placeholder-salon.jpg',
      price: 'Custom Pricing',
    },
  ];

  // Load services and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [servicesRes, categoriesRes] = await Promise.all([
          fetch('/api/salon/services'),
          fetch('/api/salon/categories'),
        ]);

        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setServices(data.data || []);
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter services
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || !selectedCategory || service.category_id.toString() === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || !selectedLocation || service.location === selectedLocation;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);

  // Handle booking submission
  const handleBooking = async () => {
    if (!bookingForm.client_name || !bookingForm.client_whatsapp || !selectedService) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/salon/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          service_name: selectedService.service_name,
          client_name: bookingForm.client_name,
          client_whatsapp: bookingForm.client_whatsapp,
          location: bookingForm.location || 'Not specified',
          preferred_date: bookingForm.preferred_date || 'Not specified',
          preferred_time: bookingForm.preferred_time || 'Not specified',
          notes: bookingForm.notes,
        }),
      });

      const data = await response.json();
      if (data.success && data.data.whatsappUrl) {
        window.open(data.data.whatsappUrl, '_blank');
        setShowBookingModal(false);
        setBookingForm({
          client_name: '',
          client_whatsapp: '',
          location: '',
          preferred_date: '',
          preferred_time: '',
          notes: '',
        });
        alert('Booking request sent! Check your WhatsApp for confirmation.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to submit booking. Please try again.');
    }
  };

  const toggleFavorite = (serviceId: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(serviceId)) {
      newFavorites.delete(serviceId);
    } else {
      newFavorites.add(serviceId);
    }
    setFavorites(newFavorites);
  };

  const handleReferral = async () => {
    if (!referralForm.referrer_name || !referralForm.referrer_whatsapp || !referralForm.referred_name || !referralForm.referred_whatsapp || !selectedService) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/salon/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrer_name: referralForm.referrer_name,
          referrer_whatsapp: referralForm.referrer_whatsapp,
          referrer_email: referralForm.referrer_email,
          referred_name: referralForm.referred_name,
          referred_whatsapp: referralForm.referred_whatsapp,
          service_name: selectedService.service_name,
          location: referralForm.location || 'Not specified',
        }),
      });

      const data = await response.json();
      if (data.success) {
        const whatsappMessage = `Hi! I'd like to refer ${referralForm.referred_name} for ${selectedService.service_name} service. Their contact: ${referralForm.referred_whatsapp}`;
        window.open(`https://wa.me/233242799990?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
        setShowReferralModal(false);
        setReferralForm({
          referrer_name: '',
          referrer_whatsapp: '',
          referrer_email: '',
          referred_name: '',
          referred_whatsapp: '',
        });
        alert('Referral sent successfully! Thank you for the recommendation.');
      }
    } catch (error) {
      console.error('Referral error:', error);
      alert('Failed to submit referral. Please try again.');
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displayHeroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displayHeroSlides.length) % displayHeroSlides.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-foreground">Loading salon services...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with Carousel */}
      <section className="relative w-full h-96 bg-slate-100 overflow-hidden">
        <div className="relative w-full h-full">
          {displayHeroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center">
                <h1 className="text-4xl md:text-5xl font-serif text-white mb-2 text-balance">{slide.title}</h1>
                <p className="text-lg text-white/90 mb-4">{slide.subtitle}</p>
                <p className="text-2xl font-semibold text-white">{slide.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-slate-900" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors z-10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-slate-900" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {displayHeroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Search and Filters Section */}
      <section className="py-8 px-4 md:px-8 bg-background border-b">
        <div className="max-w-7xl mx-auto space-y-4">
          <h2 className="text-2xl font-serif text-foreground">Find Your Perfect Service</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <Select value={selectedLocation} onValueChange={(value) => {
              setSelectedLocation(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {accraLocations.map((loc) => (
                  <SelectItem key={loc.name} value={loc.name}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Counter */}
          <p className="text-sm text-slate-600">
            Showing {paginatedServices.length} of {filteredServices.length} services
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 px-4 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          {paginatedServices.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-lg text-slate-600">No services found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedServices.map((service) => (
                <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* Service Image */}
                  <div className="relative w-full h-48 bg-slate-200 overflow-hidden">
                    <Image
                      src={service.image_urls?.[0] || '/placeholder-salon.jpg'}
                      alt={service.service_name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <button
                      onClick={() => toggleFavorite(service.id)}
                      className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-slate-100 transition-colors z-10"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          favorites.has(service.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Category Badge */}
                    <Badge variant="secondary" className="w-fit">
                      {service.category_name}
                    </Badge>

                    {/* Service Name */}
                    <h3 className="font-semibold text-foreground text-lg line-clamp-2">
                      {service.service_name}
                    </h3>

                    {/* Duration */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration_minutes} mins</span>
                    </div>

                    {/* Price */}
                    <div className="pt-2 border-t">
                      <p className="text-lg font-semibold text-foreground mb-3">
                        GHS {service.base_price.toFixed(2)}
                      </p>

                      <Dialog open={showBookingModal && selectedService?.id === service.id} onOpenChange={(open) => {
                        setShowBookingModal(open);
                        if (!open) setSelectedService(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedService(service)}
                            className="w-full"
                          >
                            Book Now
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Book {service.service_name}</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4 py-4">
                            {/* Booking Information */}
                            <div className="bg-slate-50 p-3 rounded-lg text-sm">
                              <p className="font-semibold text-foreground">{service.service_name}</p>
                              <p className="text-slate-600">Duration: {service.duration_minutes} minutes</p>
                              <p className="font-semibold text-foreground mt-2">GHS {service.base_price.toFixed(2)}</p>
                            </div>

                            {/* Booking Form */}
                            <Input
                              placeholder="Your Name *"
                              value={bookingForm.client_name}
                              onChange={(e) => setBookingForm({ ...bookingForm, client_name: e.target.value })}
                            />

                            <Input
                              placeholder="WhatsApp Number *"
                              type="tel"
                              value={bookingForm.client_whatsapp}
                              onChange={(e) => setBookingForm({ ...bookingForm, client_whatsapp: e.target.value })}
                            />

                            <Select value={bookingForm.location} onValueChange={(value) => setBookingForm({ ...bookingForm, location: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Location" />
                              </SelectTrigger>
                              <SelectContent>
                                {accraLocations.map((loc) => (
                                  <SelectItem key={loc.name} value={loc.name}>
                                    {loc.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Input
                              placeholder="Preferred Date"
                              type="date"
                              value={bookingForm.preferred_date}
                              onChange={(e) => setBookingForm({ ...bookingForm, preferred_date: e.target.value })}
                            />

                            <Input
                              placeholder="Preferred Time"
                              type="time"
                              value={bookingForm.preferred_time}
                              onChange={(e) => setBookingForm({ ...bookingForm, preferred_time: e.target.value })}
                            />

                            <Input
                              placeholder="Additional Notes (Optional)"
                              value={bookingForm.notes}
                              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                            />

                            {/* Info Message */}
                            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                              <p className="font-semibold mb-1">How it works:</p>
                              <p>Click the button below to send your booking request via WhatsApp. Our team will confirm availability and finalize details with you.</p>
                            </div>

                            <Button onClick={handleBooking} className="w-full">
                              Send Booking via WhatsApp
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showDetailsModal && selectedService?.id === service.id} onOpenChange={(open) => {
                        setShowDetailsModal(open);
                        if (!open) setSelectedService(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedService(service)}
                            variant="secondary"
                            className="w-full mt-2"
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>{service.service_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{service.description}</p>
                            <div className="text-sm text-slate-600 space-y-1">
                              <p><strong>Category:</strong> {service.category_name}</p>
                              <p><strong>Duration:</strong> {service.duration_minutes} minutes</p>
                              <p><strong>Provider:</strong> {service.provider_name}</p>
                              <p><strong>Price:</strong> GHS {service.base_price.toFixed(2)}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Refer a Friend Button and Dialog */}
                      <Dialog open={showReferralModal && selectedService?.id === service.id} onOpenChange={(open) => {
                        setShowReferralModal(open);
                        if (!open) setSelectedService(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedService(service)}
                            variant="outline"
                            className="w-full mt-2"
                          >
                            Refer a Friend
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Refer {service.service_name}</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4 py-4">
                            {/* Service Info */}
                            <div className="bg-slate-50 p-3 rounded-lg text-sm">
                              <p className="font-semibold text-foreground">{service.service_name}</p>
                              <p className="text-slate-600">Category: {service.category_name}</p>
                              <p className="font-semibold text-foreground mt-2">GHS {service.base_price.toFixed(2)}</p>
                            </div>

                            {/* Your Information */}
                            <div className="space-y-2">
                              <p className="font-semibold text-sm text-foreground">Your Information</p>
                              <Input
                                placeholder="Your Name *"
                                value={referralForm.referrer_name}
                                onChange={(e) => setReferralForm({ ...referralForm, referrer_name: e.target.value })}
                              />
                              <Input
                                placeholder="Your WhatsApp *"
                                type="tel"
                                value={referralForm.referrer_whatsapp}
                                onChange={(e) => setReferralForm({ ...referralForm, referrer_whatsapp: e.target.value })}
                              />
                              <Input
                                placeholder="Your Email (Optional)"
                                type="email"
                                value={referralForm.referrer_email}
                                onChange={(e) => setReferralForm({ ...referralForm, referrer_email: e.target.value })}
                              />
                            </div>

                            {/* Friend Information */}
                            <div className="space-y-2">
                              <p className="font-semibold text-sm text-foreground">Friend&apos;s Information</p>
                              <Input
                                placeholder="Friend&apos;s Name *"
                                value={referralForm.referred_name}
                                onChange={(e) => setReferralForm({ ...referralForm, referred_name: e.target.value })}
                              />
                              <Input
                                placeholder="Friend&apos;s WhatsApp *"
                                type="tel"
                                value={referralForm.referred_whatsapp}
                                onChange={(e) => setReferralForm({ ...referralForm, referred_whatsapp: e.target.value })}
                              />
                            </div>

                            {/* Info Message */}
                            <div className="bg-amber-50 p-3 rounded-lg text-xs text-amber-700">
                              <p className="font-semibold mb-1">Earn rewards for referrals!</p>
                              <p>Share this service with friends and both of you get special discounts when they book.</p>
                            </div>

                            <Button onClick={handleReferral} className="w-full">
                              Send Referral via WhatsApp
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  onClick={() => setCurrentPage(page)}
                  className="min-w-10"
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
