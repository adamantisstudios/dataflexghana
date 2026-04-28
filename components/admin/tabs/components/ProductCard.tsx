'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ProductCardProps {
  id: number;
  product_name: string;
  product_code: string;
  description: string;
  base_price: number;
  category_name: string;
  commission_amount: number;
  fabric_cost_included: boolean;
  image_urls?: string[];
  onEdit: (product: any) => void;
  onDelete: (id: number) => void;
  onImageClick?: () => void;
}

export default function ProductCard({
  id,
  product_name,
  product_code,
  description,
  base_price,
  category_name,
  commission_amount,
  fabric_cost_included,
  image_urls,
  onEdit,
  onDelete,
  onImageClick,
}: ProductCardProps) {
  return (
    <Card className="border-gray-200 hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full">
      {/* Image Section - Vertical Square Aspect Ratio */}
      <div
        className="w-full aspect-square bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative group overflow-hidden"
        onClick={onImageClick}
      >
        {image_urls && image_urls.length > 0 ? (
          <>
            <img
              src={image_urls[0]}
              alt={product_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {image_urls.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium hover:bg-black/90">
                +{image_urls.length - 1} more
              </div>
            )}
            {/* Hover overlay indicating clickable */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </>
        ) : (
          <ImageIcon className="w-12 h-12 text-gray-300" />
        )}
      </div>

      {/* Content Section */}
      <CardContent className="pt-4 flex-1 flex flex-col">
        {/* Product Info */}
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{product_name}</h3>
          <p className="text-sm text-gray-500">{product_code}</p>
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>

        {/* Badges and Details */}
        <div className="space-y-3 pt-3 border-t">
          {/* Price and Category */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">₵{base_price.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{category_name}</p>
            </div>
          </div>

          {/* Commission and Fabric Badges */}
          <div className="space-y-2 pt-2">
            {commission_amount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                <p className="text-xs text-green-700 font-medium">Commission</p>
                <p className="text-lg font-bold text-green-700">₵{commission_amount.toFixed(2)}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {fabric_cost_included && (
                <Badge className="bg-blue-100 text-blue-800 border border-blue-300 flex-1 justify-center">
                  Fabric Included
                </Badge>
              )}
              {image_urls && image_urls.length > 0 && (
                <Badge className="bg-purple-100 text-purple-800 border border-purple-300 flex-1 justify-center">
                  {image_urls.length} Image{image_urls.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 mt-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onEdit({
                id,
                product_name,
                product_code,
                description,
                base_price,
                category_id: 1, // Will be filled from parent
                commission_amount,
                fabric_cost_included,
                image_urls,
              })
            }
            className="flex-1"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="flex-1">
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete Product?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{product_name}&quot; and all its data.
              </AlertDialogDescription>
              <div className="flex gap-2 justify-end">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
