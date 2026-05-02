'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronLeft, ChevronRight, Search, MessageCircle, UserPlus, Sparkles, Zap, Clock, ChevronDown } from 'lucide-react';
import { ImageModal } from '@/components/ui/image-modal';
import AgentRegistrationNotification from '@/components/AgentRegistrationNotification';

interface Product {
  id: number;
  product_name: string;
  product_code: string;
  description: string;
  category_id: number;
  category_name: string;
  base_price: number;
  fabric_cost_included: boolean;
  completion_time: string;
  express_charge: number;
  commission_amount: number;
  image_urls?: string[];
  image_paths?: string[];
  status: string;
}

interface Category {
  id: number;
  name: string;
}

export default function FashionAvenuePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<number, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [selectedImageProduct, setSelectedImageProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  // Ref for scrolling to top of product grid
  const productGridRef = useRef<HTMLDivElement>(null);

  const [requestForm, setRequestForm] = useState({
    client_name: '',
    client_location: '',
    client_contact_number: '',
    timeline_preference: '',
    measurements: '',
    additional_notes: '',
  });

  const [referralForm, setReferralForm] = useState({
    referrer_name: '',
    referrer_whatsapp: '',
    friend_whatsapp: '',
  });

  // Hero slides - will be updated with actual product images
  const heroSlides = products.slice(0, 3).map((product) => ({
    id: product.id,
    title: product.product_name,
    subtitle: product.description.substring(0, 60) + (product.description.length > 60 ? '...' : ''),
    image: product.image_urls?.[0] || '/placeholder-fashion.jpg',
    price: `GHS ${product.base_price}`,
  }));

  // Fallback hero slides if no products
  const displayHeroSlides = heroSlides.length > 0 ? heroSlides : [
    {
      id: 0,
      title: 'Elegant Fashion Designs',
      subtitle: 'Professional custom designs for every occasion',
      image: '/placeholder-fashion.jpg',
      price: 'Custom Pricing',
    },
  ];

  // Load products and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/fashion/products?limit=1000'),
          fetch('/api/fashion/categories'),
        ]);

        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.data || []);
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

  // Handle request project submission
  const handleRequestProject = async () => {
    if (!requestForm.client_name || !requestForm.client_contact_number || !selectedProduct) {
      alert('Please fill in all required fields (Name, WhatsApp, Measurements)');
      return;
    }

    try {
      const response = await fetch('/api/fashion/project-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          product_code: selectedProduct.product_code,
          product_name: selectedProduct.product_name,
          client_name: requestForm.client_name,
          client_location: requestForm.client_location || 'Not specified',
          client_whatsapp: requestForm.client_contact_number,
          timeline_preference: requestForm.timeline_preference || 'Not specified',
          measurements: requestForm.measurements,
          additional_notes: requestForm.additional_notes,
        }),
      });

      const data = await response.json();
      if (data.success && data.data.whatsappUrl) {
        window.open(data.data.whatsappUrl, '_blank');
        setShowRequestModal(false);
        setRequestForm({
          client_name: '',
          client_location: '',
          client_contact_number: '',
          timeline_preference: '',
          measurements: '',
          additional_notes: '',
        });
        alert('Project request saved! Message sent to WhatsApp.');
      } else {
        alert('Error: ' + (data.error || 'Failed to save request'));
      }
    } catch (error) {
      console.error('[v0] Error:', error);
      alert('Failed to process request');
    }
  };

  // Handle referral submission
  const handleReferral = async () => {
    if (!referralForm.referrer_name || !referralForm.referrer_whatsapp || !referralForm.friend_whatsapp || !selectedProduct) {
      alert('Please fill in all required fields (Your Name, Your WhatsApp, Friend WhatsApp)');
      return;
    }

    try {
      console.log('[v0] Sending referral with data:', {
        referrer_name: referralForm.referrer_name,
        referrer_whatsapp: referralForm.referrer_whatsapp,
        friend_whatsapp: referralForm.friend_whatsapp,
        product_id: selectedProduct.id,
        product_name: selectedProduct.product_name,
        product_code: selectedProduct.product_code,
      });

      const response = await fetch('/api/fashion/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrer_name: referralForm.referrer_name,
          referrer_whatsapp: referralForm.referrer_whatsapp,
          friend_whatsapp: referralForm.friend_whatsapp,
          product_id: selectedProduct.id,
          product_name: selectedProduct.product_name,
          product_code: selectedProduct.product_code,
        }),
      });

      const data = await response.json();
      console.log('[v0] Referral response:', data);

      if (data.success && data.data?.whatsappUrl) {
        window.open(data.data.whatsappUrl, '_blank');
        
        setTimeout(() => {
          if (data.data?.adminNotificationUrl) {
            window.open(data.data.adminNotificationUrl, '_blank');
          }
        }, 1000);

        setShowReferralModal(false);
        setReferralForm({
          referrer_name: '',
          referrer_whatsapp: '',
          friend_whatsapp: '',
        });
        alert('✅ Referral saved! WhatsApp messages sent to friend and admin.');
      } else {
        console.error('[v0] Referral error:', data.error || 'Unknown error');
        alert('Error: ' + (data.error || 'Failed to save referral'));
      }
    } catch (error) {
      console.error('[v0] Exception during referral:', error);
      alert('Failed to process referral: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || product.category_id.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Image carousel helper
  const getProductImage = (product: Product) => {
    const index = currentImageIndices[product.id] || 0;
    const images = product.image_urls || product.image_paths || [];
    return images[index] || '/placeholder-fashion.jpg';
  };

  const handlePrevImage = (e: React.MouseEvent, productId: number, totalImages: number) => {
    e.stopPropagation();
    setCurrentImageIndices({
      ...currentImageIndices,
      [productId]: (currentImageIndices[productId] || 0) === 0 ? totalImages - 1 : (currentImageIndices[productId] || 0) - 1,
    });
  };

  const handleNextImage = (e: React.MouseEvent, productId: number, totalImages: number) => {
    e.stopPropagation();
    setCurrentImageIndices({
      ...currentImageIndices,
      [productId]: ((currentImageIndices[productId] || 0) + 1) % totalImages,
    });
  };

  const slide = displayHeroSlides[currentSlide];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Enhanced Hero Carousel */}
      <section className="relative h-96 md:h-[600px] overflow-hidden mt-16 bg-gray-900">
        {slide.image && (
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="relative h-full flex items-center justify-center text-center text-white px-4">
          <div className="max-w-3xl">
            <div className="mb-6 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400 tracking-widest">FEATURED DESIGN</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance leading-tight">{slide.title}</h1>
            <p className="text-lg md:text-xl text-gray-200 mb-6 leading-relaxed">{slide.subtitle}</p>
            {'price' in slide && <p className="text-3xl md:text-4xl font-bold mb-8 text-amber-400">{slide.price}</p>}
            <Button size="lg" className="bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-700 hover:to-amber-600 shadow-lg">
              Explore Collection
            </Button>
          </div>
        </div>

        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + displayHeroSlides.length) % displayHeroSlides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % displayHeroSlides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {displayHeroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 rounded-full ${index === currentSlide ? 'bg-amber-400 w-8 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/60'}`}
            />
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        {/* Search and Filter Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Fashion Collection</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our curated selection of elegant, custom-designed fashion pieces for every occasion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-input bg-background hover:bg-muted focus:bg-background transition-colors"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-12 border-input bg-background">
                <SelectValue placeholder="Select Category" />
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
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Showing <span className="font-semibold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> of <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
          </p>
        </div>

        {/* Products Grid – wrapped in a ref for scroll target */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="text-muted-foreground mt-4">Loading elegant designs...</p>
            </div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div ref={productGridRef}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {filteredProducts
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((product) => (
              <Card key={product.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-border/50 hover:border-border bg-card">
                <CardContent className="p-0">
                  {/* Image Carousel with Enhanced Styling */}
                  <div 
                    className="relative aspect-square overflow-hidden bg-muted cursor-pointer group/image"
                    onClick={() => {
                      setSelectedImageProduct(product);
                      setSelectedImageIndex(currentImageIndices[product.id] || 0);
                      setShowImageModal(true);
                    }}
                  >
                    {(product.image_urls?.length || product.image_paths?.length || 0) > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={getProductImage(product)}
                          alt={product.product_name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover/image:opacity-100 transition-opacity text-sm font-medium">Click to view</span>
                        </div>
                        
                        {((product.image_urls?.length || product.image_paths?.length || 0) > 1) && (
                          <>
                            <button
                              onClick={(e) => handlePrevImage(e, product.id, product.image_urls?.length || product.image_paths?.length || 1)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white p-2 rounded-full z-10 transition-all duration-200"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => handleNextImage(e, product.id, product.image_urls?.length || product.image_paths?.length || 1)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white p-2 rounded-full z-10 transition-all duration-200"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                              {(currentImageIndices[product.id] || 0) + 1} / {product.image_urls?.length || product.image_paths?.length || 0}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Image width={48} height={48} src="/placeholder-fashion.jpg" alt="No image" className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No image available</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-1">{product.product_name}</h3>
                        <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded w-fit">{product.product_code}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border/50">
                      {product.commission_amount > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <p className="text-xs text-green-700 font-medium mb-1">Earn Commission</p>
                          <p className="text-2xl font-bold text-green-700">GHS {product.commission_amount.toFixed(2)}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-sm">Base Price</span>
                        <span className="text-2xl font-bold text-primary">GHS {product.base_price.toFixed(2)}</span>
                      </div>

                      {!product.fabric_cost_included && (
                        <div className="text-xs text-warning bg-warning/10 border border-warning/20 p-2.5 rounded">
                          Note: Fabric cost not included in base price
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-border/30">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Completion</p>
                            <p className="font-semibold text-foreground">{product.completion_time}</p>
                          </div>
                        </div>

                        {product.express_charge > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Express</p>
                              <p className="font-semibold text-foreground">+GHS {product.express_charge.toFixed(2)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Category</span>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{product.category_name}</Badge>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-4">
                      <Dialog open={showDetailsModal && selectedProduct?.id === product.id} onOpenChange={setShowDetailsModal}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedProduct(product)}
                            variant="secondary"
                            className="w-full"
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>{product.product_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                            <div className="text-sm space-y-1">
                              <p><strong>Category:</strong> {product.category_name}</p>
                              <p><strong>Base Price:</strong> GHS {product.base_price.toFixed(2)}</p>
                              <p><strong>Express Charge:</strong> GHS {product.express_charge.toFixed(2)}</p>
                              <p><strong>Timeline:</strong> {product.completion_time}</p>
                              <p><strong>Fabric Included:</strong> {product.fabric_cost_included ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showRequestModal && selectedProduct?.id === product.id} onOpenChange={setShowRequestModal}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedProduct(product)}
                            className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 font-semibold"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Request Project
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Request Fashion Design Project</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Your Full Name *"
                              value={requestForm.client_name}
                              onChange={(e) => setRequestForm({ ...requestForm, client_name: e.target.value })}
                            />
                            <Input
                              placeholder="Your Location *"
                              value={requestForm.client_location}
                              onChange={(e) => setRequestForm({ ...requestForm, client_location: e.target.value })}
                            />
                            <Input
                              placeholder="WhatsApp Contact Number (with country code) *"
                              value={requestForm.client_contact_number}
                              onChange={(e) => setRequestForm({ ...requestForm, client_contact_number: e.target.value })}
                            />
                            <Input
                              placeholder="Timeline Preference (e.g., 2 weeks)"
                              value={requestForm.timeline_preference}
                              onChange={(e) => setRequestForm({ ...requestForm, timeline_preference: e.target.value })}
                            />
                            <div className="space-y-3">
                              <Collapsible className="border rounded-lg p-3 bg-slate-50">
                                <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-sm hover:text-primary transition-colors">
                                  <span>📏 Measurement Guide (Tap to expand)</span>
                                  <ChevronDown className="w-4 h-4" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-4 space-y-3 text-xs">
                                  <div className="space-y-2">
                                    <p className="font-semibold text-slate-700">How to Take Measurements:</p>
                                    <ul className="space-y-1 text-slate-600">
                                      <li>• <strong>Neck:</strong> Base of neck where collar sits</li>
                                      <li>• <strong>Bust/Chest:</strong> Around the fullest part</li>
                                      <li>• <strong>Under Bust:</strong> Directly under, around ribcage</li>
                                      <li>• <strong>Waist:</strong> Around narrowest part, above belly button</li>
                                      <li>• <strong>Hip:</strong> Around fullest part of hips and buttocks</li>
                                      <li>• <strong>Thigh:</strong> Around fullest part of one thigh</li>
                                      <li>• <strong>Upper Arm:</strong> Around fullest part of arm</li>
                                      <li>• <strong>Shoulder to Waist:</strong> From top of shoulder to natural waist</li>
                                      <li>• <strong>Shoulder to Floor:</strong> From shoulder straight down to floor</li>
                                      <li>• <strong>Shoulder Width:</strong> Across back from shoulder edge to edge</li>
                                      <li>• <strong>Inner Arm Length:</strong> From armpit down to wrist</li>
                                    </ul>
                                  </div>
                                  <div className="pt-2 border-t">
                                    <p className="font-semibold text-slate-700 mb-2">Tips for Accuracy:</p>
                                    <ul className="space-y-1 text-slate-600">
                                      <li>✓ Use a soft measuring tape</li>
                                      <li>✓ Wear fitted clothes or underwear</li>
                                      <li>✓ Stand straight and relax</li>
                                      <li>✓ Keep tape snug but not tight</li>
                                      <li>✓ Measure twice for accuracy</li>
                                      <li>✓ Ask someone to assist if possible</li>
                                    </ul>
                                  </div>
                                  <div className="pt-2 border-t">
                                    <p className="text-slate-600 italic">📝 Format: List measurements in inches or cm (e.g., Bust: 36 inches, Waist: 28 inches)</p>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                              <Textarea
                                placeholder="Paste or type your measurements here *"
                                value={requestForm.measurements}
                                onChange={(e) => setRequestForm({ ...requestForm, measurements: e.target.value })}
                                className="min-h-24 text-xs"
                              />
                              <p className="text-xs text-slate-500 italic">💡 Don&apos;t worry if you don&apos;t have exact measurements! Our fashion team will contact you to discuss your size and preferences.</p>
                            </div>
                            <Textarea
                              placeholder="Additional notes or requests"
                              value={requestForm.additional_notes}
                              onChange={(e) => setRequestForm({ ...requestForm, additional_notes: e.target.value })}
                              className="min-h-20"
                            />
                            <Button onClick={handleRequestProject} className="w-full bg-primary hover:bg-primary/90">
                              Send to WhatsApp
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showReferralModal && selectedProduct?.id === product.id} onOpenChange={setShowReferralModal}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedProduct(product)}
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            Refer & Earn
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Refer This Design</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Your Name *"
                              value={referralForm.referrer_name}
                              onChange={(e) => setReferralForm({ ...referralForm, referrer_name: e.target.value })}
                            />
                            <Input
                              placeholder="Your WhatsApp Number (with country code) *"
                              value={referralForm.referrer_whatsapp}
                              onChange={(e) => setReferralForm({ ...referralForm, referrer_whatsapp: e.target.value })}
                            />
                            <Input
                              placeholder="Friend's WhatsApp Number (with country code) *"
                              value={referralForm.friend_whatsapp}
                              onChange={(e) => setReferralForm({ ...referralForm, friend_whatsapp: e.target.value })}
                            />
                            <Button onClick={handleReferral} className="w-full bg-primary hover:bg-primary/90">
                              Send Referral
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>

            {/* Pagination Controls with scroll-to-top */}
            {Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) > 1 && (
              <div className="flex items-center justify-between mt-12 pt-8 border-t border-border/30">
                <div className="text-sm text-muted-foreground">
                  Page <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
                  <span className="font-semibold text-foreground">{Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = Math.max(1, currentPage - 1);
                      setCurrentPage(newPage);
                      productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    disabled={currentPage === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = Math.min(Math.ceil(filteredProducts.length / ITEMS_PER_PAGE), currentPage + 1);
                      setCurrentPage(newPage);
                      productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    disabled={currentPage === Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No products found matching your criteria.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImageProduct && (
        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          images={selectedImageProduct.image_urls || selectedImageProduct.image_paths || []}
          currentIndex={selectedImageIndex}
          onIndexChange={setSelectedImageIndex}
          alt={selectedImageProduct.product_name}
        />
      )}

      <Footer />

      {/* Agent Registration Notification */}
      <AgentRegistrationNotification />
    </div>
  );
}