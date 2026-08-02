"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Loader2, ShoppingCart } from "lucide-react";
import { getAllProducts, type EProduct } from "@/lib/voucher-products";

interface VoucherProductsDisplayProps {
  onOrderProduct: (productId: string) => void;
}

export function VoucherProductsDisplay({ onOrderProduct }: VoucherProductsDisplayProps) {
  const [products, setProducts] = useState<EProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<EProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/voucher-products");
        const data = await res.json();
        if (!cancelled && res.ok && data.products?.length) {
          setProducts(data.products);
        }
      } catch {
        // fall through to hardcoded catalog
      }
      if (!cancelled) {
        setProducts((prev) => (prev.length ? prev : getAllProducts()));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openDetailsModal = (product: EProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const getCategoryBadge = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("results checker")) return "bg-green-100 text-green-800";
    if (lower.includes("admission") || lower.includes("form") || lower.includes("voucher"))
      return "bg-blue-100 text-blue-800";
    return "bg-purple-100 text-purple-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-600">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading products…
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card
            key={product.id}
            className="hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-lg line-clamp-2 flex-1">{product.title}</CardTitle>
                <Badge className={getCategoryBadge(product.title)}>
                  {product.title.toLowerCase().includes("results checker")
                    ? "Results Checker"
                    : product.title.toLowerCase().includes("admission") ||
                        product.title.toLowerCase().includes("form") ||
                        product.title.toLowerCase().includes("voucher")
                      ? "School Form"
                      : "Educational"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              <div className="relative w-full rounded-md overflow-hidden bg-gray-100 mb-4">
                <div className="aspect-video">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {product.description.length > 100
                  ? `${product.description.substring(0, 100)}...`
                  : product.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">GHS {product.price.toFixed(2)}</span>
                <span className="text-sm text-gray-500">{product.quantity} in stock</span>
              </div>
            </CardContent>

            <CardFooter className="flex gap-2 pt-0">
              <Button variant="outline" className="flex-1" onClick={() => openDetailsModal(product)}>
                <Eye className="mr-2 h-4 w-4" />
                Details
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={() => onOrderProduct(product.id)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Order
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.title}</DialogTitle>
                <DialogDescription>Full product details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative w-full rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <p className="text-gray-700">{selectedProduct.description}</p>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-2xl font-bold text-blue-600">
                    GHS {selectedProduct.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-600">{selectedProduct.quantity} available</span>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  onClick={() => {
                    onOrderProduct(selectedProduct.id);
                    closeModal();
                  }}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Order This Product
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
