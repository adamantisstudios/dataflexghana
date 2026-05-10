'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ChevronDown, ArrowLeft, MessageCircle, UserPlus } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
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

export default function ProductDetailsPage() {
  const router = useRouter();
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

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

  useEffect(() => {
    if (!productId) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/fashion/products?id=${productId}`);
        if (res.ok) {
          const data = await res.json();
          // API returns { success: true, data: { ... } } for single product
          const productData = data.data;
          if (productData && typeof productData === 'object' && !Array.isArray(productData)) {
            // Ensure numeric fields have fallbacks
            setProduct({
              ...productData,
              base_price: productData.base_price ?? 0,
              express_charge: productData.express_charge ?? 0,
              commission_amount: productData.commission_amount ?? 0,
            });
          } else {
            console.error('Invalid product data received:', productData);
            setProduct(null);
          }
        } else {
          console.error('API error:', res.status);
          setProduct(null);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const images = product?.image_urls || product?.image_paths || [];
  const lastIndex = images.length - 1;

  const prevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? lastIndex : prev - 1));
  const nextImage = () => setCurrentImageIndex((prev) => (prev === lastIndex ? 0 : prev + 1));

  const handleRequest = async () => {
    if (!requestForm.client_name || !requestForm.client_contact_number || !product) {
      alert('Please fill in all required fields.');
      return;
    }
    try {
      const res = await fetch('/api/fashion/project-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          product_code: product.product_code,
          product_name: product.product_name,
          client_name: requestForm.client_name,
          client_location: requestForm.client_location || 'Not specified',
          client_whatsapp: requestForm.client_contact_number,
          timeline_preference: requestForm.timeline_preference || 'Not specified',
          measurements: requestForm.measurements,
          additional_notes: requestForm.additional_notes,
        }),
      });
      const data = await res.json();
      if (data.success && data.data.whatsappUrl) {
        window.open(data.data.whatsappUrl, '_blank');
        setRequestForm({ client_name: '', client_location: '', client_contact_number: '', timeline_preference: '', measurements: '', additional_notes: '' });
        alert('Request sent!');
      } else {
        alert('Error: ' + (data.error || 'Failed'));
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleReferral = async () => {
    if (!referralForm.referrer_name || !referralForm.referrer_whatsapp || !referralForm.friend_whatsapp || !product) {
      alert('Please fill in all referral fields.');
      return;
    }
    try {
      const res = await fetch('/api/fashion/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrer_name: referralForm.referrer_name,
          referrer_whatsapp: referralForm.referrer_whatsapp,
          friend_whatsapp: referralForm.friend_whatsapp,
          product_id: product.id,
          product_name: product.product_name,
          product_code: product.product_code,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.whatsappUrl) {
        window.open(data.data.whatsappUrl, '_blank');
        if (data.data?.adminNotificationUrl) setTimeout(() => window.open(data.data.adminNotificationUrl, '_blank'), 1000);
        setReferralForm({ referrer_name: '', referrer_whatsapp: '', friend_whatsapp: '' });
        alert('Referral sent!');
      } else {
        alert('Error: ' + (data.error || 'Failed'));
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-16 space-y-6">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-xl">Product not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to collection
        </button>

        {/* Image gallery + Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Image section */}
          <div className="relative aspect-[3/4] md:aspect-square overflow-hidden rounded-2xl bg-gray-100">
            {images.length > 0 ? (
              <>
                <Image
                  src={images[currentImageIndex]}
                  alt={product.product_name}
                  fill
                  className="object-cover cursor-pointer"
                  onClick={() => {
                    setModalIndex(currentImageIndex);
                    setShowImageModal(true);
                  }}
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-2 overflow-x-auto bg-black/30 backdrop-blur-sm">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 ${
                          idx === currentImageIndex ? 'border-amber-400' : 'border-transparent'
                        }`}
                      >
                        <Image src={img} alt={`Thumbnail ${idx + 1}`} width={48} height={48} className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-5">
            <Badge className="bg-amber-100 text-amber-800">{product.category_name}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold">{product.product_name}</h1>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-amber-600">
                GH₵ {(product.base_price ?? 0).toFixed(2)}
              </span>
              {(product.express_charge ?? 0) > 0 && (
                <span className="text-lg text-gray-500">
                  + GH₵ {(product.express_charge ?? 0).toFixed(2)} express
                </span>
              )}
            </div>
            {(product.commission_amount ?? 0) > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <p className="text-sm font-semibold text-emerald-700">
                  Earn GH₵ {(product.commission_amount ?? 0).toFixed(2)} Commission
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/30">
              <div>
                <p className="text-xs text-muted-foreground">Completion Time</p>
                <p className="font-semibold">{product.completion_time || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fabric Cost</p>
                <p className="font-semibold">{product.fabric_cost_included ? 'Included' : 'Not Included'}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-mono">Code: {product.product_code}</p>
          </div>
        </div>

        {/* Action forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Request Project */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-xl font-bold">Request This Design</h2>
              <Input placeholder="Your Full Name *" value={requestForm.client_name} onChange={(e) => setRequestForm({ ...requestForm, client_name: e.target.value })} />
              <Input placeholder="Your Location *" value={requestForm.client_location} onChange={(e) => setRequestForm({ ...requestForm, client_location: e.target.value })} />
              <Input placeholder="WhatsApp (with country code) *" value={requestForm.client_contact_number} onChange={(e) => setRequestForm({ ...requestForm, client_contact_number: e.target.value })} />
              <Input placeholder="Timeline (e.g. 2 weeks)" value={requestForm.timeline_preference} onChange={(e) => setRequestForm({ ...requestForm, timeline_preference: e.target.value })} />
              
              {/* Measurement Guide Section */}
              <div className="space-y-3 pt-2">
                <Collapsible className="border rounded-lg p-3 bg-slate-50">
                  <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-sm hover:text-amber-600 transition-colors">
                    <span>📏 Measurement Guide (Tap to expand)</span>
                    <ChevronDown className="w-4 h-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-3 text-xs">
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-700">How to Take Measurements:</p>
                      <ul className="space-y-1 text-slate-600 ml-2">
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
                      <ul className="space-y-1 text-slate-600 ml-2">
                        <li>✓ Use a soft measuring tape</li>
                        <li>✓ Wear fitted clothes or underwear</li>
                        <li>✓ Stand straight and relax</li>
                        <li>✓ Keep tape snug but not tight</li>
                        <li>✓ Measure twice for accuracy</li>
                        <li>✓ Ask someone to assist if possible</li>
                      </ul>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="font-semibold text-slate-700 mb-2">Example Format:</p>
                      <p className="text-slate-600 italic bg-slate-100 p-2 rounded text-xs">Bust: 36 inches, Waist: 28 inches, Hip: 38 inches, Shoulder Width: 14 inches</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <Textarea placeholder="Paste or type your measurements here *" value={requestForm.measurements} onChange={(e) => setRequestForm({ ...requestForm, measurements: e.target.value })} className="min-h-[100px] text-xs" />
                <p className="text-xs text-slate-500 italic">💡 Don&apos;t worry if you don&apos;t have exact measurements! Our fashion team will contact you to discuss your size and preferences.</p>
              </div>
              
              <Textarea placeholder="Additional Notes" value={requestForm.additional_notes} onChange={(e) => setRequestForm({ ...requestForm, additional_notes: e.target.value })} className="min-h-[80px]" />
              <Button onClick={handleRequest} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                <MessageCircle className="w-4 h-4 mr-2" /> Send Request via WhatsApp
              </Button>
            </CardContent>
          </Card>

          {/* Referral */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold">Refer This Design & Earn</h2>
                <p className="text-xs text-muted-foreground mt-1">Share with your friend and earn commission when they make a purchase!</p>
              </div>
              <Input placeholder="Your Name *" value={referralForm.referrer_name} onChange={(e) => setReferralForm({ ...referralForm, referrer_name: e.target.value })} />
              <Input placeholder="Your WhatsApp (with country code) *" value={referralForm.referrer_whatsapp} onChange={(e) => setReferralForm({ ...referralForm, referrer_whatsapp: e.target.value })} />
              <div>
                <Input placeholder="Friend's WhatsApp (with country code) *" value={referralForm.friend_whatsapp} onChange={(e) => setReferralForm({ ...referralForm, friend_whatsapp: e.target.value })} />
                <p className="text-xs text-slate-500 mt-2 italic">✓ Your friend will receive a WhatsApp message with the design details and a referral link.</p>
              </div>
              <Button onClick={handleReferral} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <UserPlus className="w-4 h-4 mr-2" /> Send Referral
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Modal for full‑screen view */}
      {product && (
        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          images={images}
          currentIndex={modalIndex}
          onIndexChange={setModalIndex}
          alt={product.product_name}
        />
      )}

      <Footer />
      <AgentRegistrationNotification />
    </div>
  );
}
