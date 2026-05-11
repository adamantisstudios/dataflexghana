"use client";

import { useState } from "react";
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
import { Eye, ShoppingCart } from "lucide-react";
import { VOUCHER_PRODUCTS, type EProduct } from "@/lib/voucher-products";

// ✅ Add the interface for the prop
interface VoucherProductsDisplayProps {
  onOrderProduct: (productId: number) => void;
}

export function VoucherProductsDisplay({ onOrderProduct }: VoucherProductsDisplayProps) {
  const [selectedProduct, setSelectedProduct] = useState<EProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {VOUCHER_PRODUCTS.map((product) => (
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
                  ? product.description.substring(0, 100) + "..."
                  : product.description}
              </p>

              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold text-blue-600">₵{product.price}</span>
                <span className="text-xs text-gray-500">Stock: {product.quantity}</span>
              </div>
            </CardContent>

            <CardFooter className="flex gap-2 pt-0">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => openDetailsModal(product)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              {/* ✅ Fixed: call onOrderProduct with product.id */}
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  onOrderProduct(product.id);
                  document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Order
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Modal – only text description, no image */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.title}</DialogTitle>
                <DialogDescription className="text-base mt-4 whitespace-pre-wrap leading-relaxed">
                  {selectedProduct.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center border-t pt-4">
                  <div>
                    <span className="text-3xl font-bold text-blue-600">₵{selectedProduct.price}</span>
                    <span className="text-gray-500 ml-2">per item</span>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    Stock: {selectedProduct.quantity}
                  </Badge>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      closeModal();
                      onOrderProduct(selectedProduct.id);
                      document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Order Now
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={closeModal}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}