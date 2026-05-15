'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Search, Sparkles, PenTool, ArrowUp } from 'lucide-react';
import AgentRegistrationNotification from '@/components/AgentRegistrationNotification';
import { useFashionCache } from '@/hooks/useFashionCache';

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
  const router = useRouter();
  const { getCache, setCache, isCached } = useFashionCache();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const productGridRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ----- Scroll-to-top button visibility -----
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ★ New: Scroll to top when the page mounts (covers back navigation)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // ----- Smooth scroll on page change -----
  useEffect(() => {
    if (productGridRef.current) {
      productGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  // Build hero slides from first 3 products (with fallback)
  const heroSlides = products.slice(0, 3).map((product) => ({
    id: product.id,
    title: product.product_name,
    subtitle: product.description?.substring(0, 60) + (product.description?.length > 60 ? '...' : '') || '',
    image: product.image_urls?.[0] || product.image_paths?.[0] || '/placeholder-fashion.jpg',
    price: `GH₵ ${product.base_price?.toFixed(2) ?? '0.00'}`,
  }));

  const displayHeroSlides = heroSlides.length > 0 ? heroSlides : [
    {
      id: 0,
      title: 'Elegant Fashion Designs',
      subtitle: 'Professional custom designs for every occasion',
      image: '/placeholder-fashion.jpg',
      price: 'Custom Pricing',
    },
  ];

  // Load data with caching
  useEffect(() => {
    const loadData = async () => {
      try {
        const cached = getCache();
        if (cached && isCached) {
          console.log('[v0] Using cached fashion data');
          setProducts(cached.products);
          setCategories(cached.categories);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/fashion/products?limit=1000'),
          fetch('/api/fashion/categories'),
        ]);
        if (!productsRes.ok) throw new Error('Failed to load products');
        if (!categoriesRes.ok) throw new Error('Failed to load categories');

        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        const products = productsData.data || [];
        const categories = categoriesData.data || [];

        setProducts(products);
        setCategories(categories);

        setCache(products, categories);
      } catch (err: any) {
        console.error('[v0] Data loading error:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredProducts = products.filter((product) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      product.product_name?.toLowerCase().includes(searchLower) ||
      product.product_code?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower);
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || product.category_id.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const slide = displayHeroSlides[currentSlide];
  const goToProduct = (id: number) => router.push(`/fashion-avenue/${id}`);

  const handleSubmitDesign = () => {
    const phone = '233246827049';
    const message = encodeURIComponent('I want to submit my custom design for a sewing project.');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Carousel */}
      <section className="relative h-[50vh] md:h-[70vh] overflow-hidden mt-16 bg-gray-900">
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance leading-tight">{slide.title}</h1>
            <p className="text-lg md:text-xl text-gray-200 mb-6 leading-relaxed">{slide.subtitle}</p>
            {'price' in slide && <p className="text-3xl md:text-4xl font-bold mb-8 text-amber-400">{slide.price}</p>}
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-700 hover:to-amber-600 shadow-lg"
              onClick={() => {
                const product = products.find(p => p.id === slide.id);
                if (product) goToProduct(product.id);
              }}
            >
              Explore This Design
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
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide ? 'bg-amber-400 w-8 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Submit Your Design Button */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex justify-end">
        <Button
          onClick={handleSubmitDesign}
          className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
        >
          <PenTool className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
          Submit Your Design
          <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        {/* Category Pills */}
        <div className="mb-10">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('')}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                selectedCategory === ''
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id.toString())}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat.id.toString()
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, code, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 border-input bg-background hover:bg-muted focus:bg-background transition-colors"
          />
        </div>

        <p className="text-sm text-muted-foreground text-center mb-8">
          Showing <span className="font-semibold text-foreground">{Math.min(filteredProducts.length, currentPage * ITEMS_PER_PAGE)}</span> of{' '}
          <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
        </p>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-2">⚠️ {error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div ref={productGridRef}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((product) => (
                  <Card
                    key={product.id}
                    className="group cursor-pointer overflow-hidden border-0 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                    onClick={() => goToProduct(product.id)}
                  >
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <Image
                          src={product.image_urls?.[0] || product.image_paths?.[0] || '/placeholder-fashion.jpg'}
                          alt={product.product_name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {(product.image_urls?.length ?? 0) > 0 && (
                          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full w-7 h-7 flex items-center justify-center shadow-md group-hover:bg-white transition-colors">
                            <span className="text-[10px] font-bold text-gray-800">+{(product.image_urls?.length ?? 0)}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                          <span className="text-white text-xs font-medium">Tap to view</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 flex flex-col gap-1.5">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                          {product.product_name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-mono">{product.product_code}</span>
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
                            {product.category_name}
                          </Badge>
                        </div>
                        <div className="flex items-end justify-between mt-1 pt-1.5 border-t border-gray-100">
                          <div>
                            <p className="text-[11px] text-gray-400 leading-none mb-0.5">Price</p>
                            <p className="text-base font-bold text-amber-600 leading-none">
                              GH₵ {(product.base_price ?? 0).toFixed(2)}
                            </p>
                          </div>
                          {(product.commission_amount ?? 0) > 0 && (
                            <div className="text-right">
                              <p className="text-[11px] text-green-500 leading-none mb-0.5">Commission</p>
                              <p className="text-sm font-bold text-green-600 leading-none">
                                +GH₵ {(product.commission_amount ?? 0).toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Pagination */}
            {Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) > 1 && (
              <div className="flex items-center justify-between mt-12 pt-8 border-t border-border/30">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={currentPage === Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No products found.</p>
            <p className="text-sm text-muted-foreground mt-2">Try a different search or category.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Floating Scroll‑to‑Top Button */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      <Footer />
      <AgentRegistrationNotification />
    </div>
  );
}