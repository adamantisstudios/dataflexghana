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
import { Plus, Trash2, Edit2, Search, Image as ImageIcon, FileUp, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { uploadFashionProductImage, deleteFashionProductImage } from '@/lib/fashion-image-upload';
import ProductCard from './components/ProductCard';
import { ImageModal } from '@/components/ui/image-modal';

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
  estimated_timeline_days?: number;
  express_charge: number;
  commission_amount: number;
  status: string;
  image_urls?: string[];
  image_count?: number;
}

interface Category {
  id: number;
  name: string;
}

interface Referral {
  id: number;
  referrer_name: string;
  product_name: string;
  commission_amount_locked: number;
  status: string;
  created_at: string;
}

export default function FashionAvenueTab() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [selectedImageProduct, setSelectedImageProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  const [productForm, setProductForm] = useState({
    product_name: '',
    product_code: '',
    description: '',
    category_id: '',
    base_price: '',
    fabric_cost_included: true,
    completion_time: '',
    express_charge: '',
    commission_amount: '',
    image_urls: [] as string[],
  });

  const [newImageUrl, setNewImageUrl] = useState('');

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  // Helper: safely convert any value to a string (prevents null/undefined errors)
  const toSafeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  // Helper: safely parse number, returns default if invalid
  const safeParseNumber = (value: any, defaultValue: number = 0): number => {
    const num = parseFloat(toSafeString(value));
    return isNaN(num) ? defaultValue : num;
  };

  // Helper: Parse completion_time from string format (e.g., "10 days" or "10-14 days" -> "10")
  const parseCompletionTime = (value: any): string => {
    const str = toSafeString(value);
    if (!str) return '';
    // Extract first number from string
    const match = str.match(/\d+/);
    return match ? match[0] : '';
  };

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, referralsRes] = await Promise.all([
        fetch('/api/fashion/products?limit=100'),
        fetch('/api/fashion/categories'),
        fetch('/api/admin/fashion/referrals'),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.data || []);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.data || []);
      }

      if (referralsRes.ok) {
        const data = await referralsRes.json();
        setReferrals(data.data || []);
      }
    } catch (error) {
      console.error('[v0] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync form state when editingProduct changes (fixes data persistence bug)
  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        product_name: toSafeString(editingProduct.product_name),
        product_code: toSafeString(editingProduct.product_code),
        description: toSafeString(editingProduct.description),
        category_id: toSafeString(editingProduct.category_id),
        base_price: toSafeString(editingProduct.base_price),
        fabric_cost_included: editingProduct.fabric_cost_included,
        completion_time: parseCompletionTime(editingProduct.completion_time || editingProduct.estimated_timeline_days),
        express_charge: toSafeString(editingProduct.express_charge),
        commission_amount: toSafeString(editingProduct.commission_amount),
        image_urls: editingProduct.image_urls || [],
      });
      setNewImageUrl('');
    }
  }, [editingProduct]);

  const handleAddProduct = async () => {
    // --- Convert all form fields to safe strings first ---
    const productName = toSafeString(productForm.product_name).trim();
    const productCode = toSafeString(productForm.product_code).trim();
    const description = toSafeString(productForm.description).trim();
    const categoryIdStr = toSafeString(productForm.category_id).trim();
    const basePriceStr = toSafeString(productForm.base_price).trim();
    const expressChargeStr = toSafeString(productForm.express_charge).trim();
    const commissionAmountStr = toSafeString(productForm.commission_amount).trim();
    const completionTime = toSafeString(productForm.completion_time).trim();

    // --- Validation ---
    if (!productName) {
      alert('Product name is required');
      return;
    }
    // Product code is auto-generated for new products, but required for edits
    if (!editingProduct && !productCode) {
      alert('Product code is required for edits');
      return;
    }
    if (!categoryIdStr) {
      alert('Please select a category');
      return;
    }
    if (!basePriceStr) {
      alert('Base price is required');
      return;
    }

    // Parse category_id to integer
    const categoryIdNum = parseInt(categoryIdStr, 10);
    if (isNaN(categoryIdNum)) {
      alert('Invalid category selected');
      return;
    }

    // Parse base_price
    const basePriceNum = parseFloat(basePriceStr);
    if (isNaN(basePriceNum)) {
      alert('Base price must be a valid number');
      return;
    }

    // Optional numeric fields: default to 0 if empty/invalid
    const expressChargeNum = safeParseNumber(expressChargeStr, 0);
    const commissionAmountNum = safeParseNumber(commissionAmountStr, 0);

    // Build final payload (product_code will be auto-generated if not provided for new products)
    const payload = {
      product_name: productName,
      ...(productCode && { product_code: productCode }),
      description: description,
      category_id: categoryIdNum,
      base_price: basePriceNum,
      fabric_cost_included: productForm.fabric_cost_included,
      completion_time: completionTime,
      express_charge: expressChargeNum,
      commission_amount: commissionAmountNum,
      image_urls: productForm.image_urls,
    };

    try {
      const url = editingProduct ? `/api/admin/fashion/products/${editingProduct.id}` : '/api/admin/fashion/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (response.ok) {
        await loadData();
        setShowAddProduct(false);
        setEditingProduct(null);
        resetProductForm();
        alert('Product saved successfully!');
      } else {
        alert(`Failed to save product: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[v0] Error in handleAddProduct:', error);
      alert(`Failed to save product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const response = await fetch('/api/admin/fashion/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryForm.name.trim(), description: categoryForm.description.trim() }),
      });

      if (response.ok) {
        await loadData();
        setShowAddCategory(false);
        setCategoryForm({ name: '', description: '' });
      } else {
        alert('Failed to create category');
      }
    } catch (error) {
      console.error('[v0] Error creating category:', error);
      alert('Failed to create category');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      const response = await fetch(`/api/admin/fashion/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('[v0] Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleEditProduct = (product: Product) => {
    // Set editing product - useEffect will sync the form automatically
    setEditingProduct(product);
    setShowAddProduct(true);
  };

  const resetProductForm = () => {
    setProductForm({
      product_name: '',
      product_code: '',
      description: '',
      category_id: '',
      base_price: '',
      fabric_cost_included: true,
      completion_time: '',
      express_charge: '',
      commission_amount: '',
      image_urls: [],
    });
    setEditingProduct(null);
    setNewImageUrl('');
  };

  const generateProductCode = () => {
    const categoryIdStr = toSafeString(productForm.category_id);
    if (!categoryIdStr) {
      alert('Please select a category first');
      return;
    }

    const categoryPrefixes: { [key: string]: string } = {
      '1': 'TRAD',
      '2': 'CASU',
      '3': 'EVEN',
      '4': 'ACCE',
      '5': 'CUST',
    };

    const prefix = categoryPrefixes[categoryIdStr] || 'FASH';
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    const code = `${prefix}-${dateStr}-${random}`;
    setProductForm({ ...productForm, product_code: code });
  };

  const addImageUrl = () => {
    const trimmedUrl = newImageUrl.trim();
    if (trimmedUrl && !productForm.image_urls.includes(trimmedUrl)) {
      setProductForm({
        ...productForm,
        image_urls: [...productForm.image_urls, trimmedUrl],
      });
      setNewImageUrl('');
    }
  };

  const removeImageUrl = (index: number) => {
    setProductForm({
      ...productForm,
      image_urls: productForm.image_urls.filter((_, i) => i !== index),
    });
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || []);
    const target = e.currentTarget;
    if (!files.length) return;

    setUploadingImages(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const uploadedUrl = await uploadFashionProductImage(file, (progress) => {
            setUploadProgress(Math.round(((i + progress / 100) / files.length) * 100));
          });
          setProductForm((prev) => ({
            ...prev,
            image_urls: [...prev.image_urls, uploadedUrl],
          }));
        } catch (error) {
          console.error('[v0] Error uploading image:', error);
          alert(`Error uploading image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (target) {
        target.value = '';
      }
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
    }
  };

  const handleMarkReferralConverted = async (referralId: number) => {
    try {
      const response = await fetch(`/api/admin/fashion/referrals/${referralId}/convert`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadData();
      } else {
        alert('Failed to update referral');
      }
    } catch (error) {
      console.error('[v0] Error updating referral:', error);
      alert('Failed to update referral');
    }
  };

  const handleMarkCommissionPaid = async (referralId: number) => {
    try {
      const response = await fetch(`/api/admin/fashion/referrals/${referralId}/pay-commission`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadData();
      } else {
        alert('Failed to mark commission as paid');
      }
    } catch (error) {
      console.error('[v0] Error marking commission as paid:', error);
      alert('Failed to mark commission as paid');
    }
  };

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.product_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading Fashion Avenue...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger value="products" className="data-[state=active]:bg-white">
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-white">
            Categories ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="referrals" className="data-[state=active]:bg-white">
            Referrals ({referrals.length})
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4 mt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500"
              />
            </div>
            <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetProductForm();
                    setEditingProduct(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {editingProduct ? 'Edit Product' : 'Create New Product'}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                        <Input
                          placeholder="e.g., Classic Evening Dress"
                          value={productForm.product_name}
                          onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                          className="border-gray-300 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Code *</label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Auto-generate or enter custom"
                            value={productForm.product_code}
                            onChange={(e) => setProductForm({ ...productForm, product_code: e.target.value })}
                            className="border-gray-300 focus:border-blue-500"
                          />
                          <Button type="button" variant="outline" onClick={generateProductCode}>
                            Generate
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                        <Textarea
                          placeholder="Describe the product, materials, design details..."
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          className="min-h-24 border-gray-300 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category & Pricing */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-gray-900">Category & Pricing</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                        <Select value={productForm.category_id} onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}>
                          <SelectTrigger className="border-gray-300 focus:border-blue-500">
                            <SelectValue placeholder="Select..." />
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (GHS) *</label>
                        <Input
                          type="number"
                          placeholder="250.00"
                          value={productForm.base_price}
                          onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })}
                          step="0.01"
                          className="border-gray-300 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Express Charge (GHS)</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={productForm.express_charge}
                          onChange={(e) => setProductForm({ ...productForm, express_charge: e.target.value })}
                          step="0.01"
                          className="border-gray-300 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Commission (GHS)</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={productForm.commission_amount}
                          onChange={(e) => setProductForm({ ...productForm, commission_amount: e.target.value })}
                          step="0.01"
                          className="border-gray-300 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                        <Input
                          placeholder="e.g., 10-14 days"
                          value={productForm.completion_time}
                          onChange={(e) => setProductForm({ ...productForm, completion_time: e.target.value })}
                          className="border-gray-300 focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={productForm.fabric_cost_included}
                            onChange={(e) => setProductForm({ ...productForm, fabric_cost_included: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm font-medium text-gray-700">Fabric included</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Images Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-gray-900">Product Images</h3>

                    {/* Upload Input */}
                    <div>
                      <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <div className="flex flex-col items-center gap-2">
                          <FileUp className="w-5 h-5 text-gray-500" />
                          <span className="text-sm text-gray-600">Click to upload images</span>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          disabled={uploadingImages}
                          className="hidden"
                        />
                      </label>
                      {uploadingImages && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{uploadProgress}% uploaded</p>
                        </div>
                      )}
                    </div>

                    {/* URL Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Or paste image URL..."
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                        className="border-gray-300 focus:border-blue-500"
                      />
                      <Button type="button" variant="outline" onClick={addImageUrl}>
                        Add
                      </Button>
                    </div>

                    {/* Image Preview */}
                    {productForm.image_urls.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Uploaded Images ({productForm.image_urls.length})</p>
                        <div className="grid grid-cols-3 gap-3">
                          {productForm.image_urls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`Product ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => removeImageUrl(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 border-t pt-6">
                    <Button
                      type="button"
                      onClick={handleAddProduct}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={uploadingImages}
                    >
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddProduct(false);
                        resetProductForm();
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Products Grid with Pagination */}
          {filteredProducts.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="pt-12 pb-12 text-center">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No products found</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Pagination Info */}
              <div className="text-sm text-gray-600 mb-4">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filteredProducts
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      id={product.id}
                      product_name={product.product_name}
                      product_code={product.product_code}
                      description={product.description}
                      base_price={product.base_price}
                      category_name={product.category_name}
                      commission_amount={product.commission_amount || 0}
                      fabric_cost_included={product.fabric_cost_included}
                      image_urls={product.image_urls}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                      onImageClick={() => {
                        setSelectedImageProduct(product);
                        setSelectedImageIndex(0);
                        setShowImageModal(true);
                      }}
                    />
                  ))}
              </div>

              {/* Pagination Controls */}
              {Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredProducts.length / ITEMS_PER_PAGE), currentPage + 1))}
                      disabled={currentPage === Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4 mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                    <Input
                      placeholder="e.g., Traditional Wear"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <Textarea
                      placeholder="Category description..."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="min-h-20 border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddCategory} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Create Category
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddCategory(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="border-gray-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {products.filter((p) => p.category_id === category.id).length} products
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4 mt-6">
          {referrals.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-gray-500">No referrals yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <Card key={referral.id} className="border-gray-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{referral.referrer_name}</h3>
                        <p className="text-sm text-gray-600">{referral.product_name}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-2">₵{(referral.commission_amount_locked ?? 0).toFixed(2)}</p>
                      </div>
                      <Badge variant={referral.status === 'pending' ? 'secondary' : 'default'}>
                        {referral.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {referral.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkReferralConverted(referral.id)}
                        >
                          Mark Converted
                        </Button>
                      )}
                      {referral.status === 'converted' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkCommissionPaid(referral.id)}
                        >
                          Pay Commission
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Modal */}
      {selectedImageProduct && (
        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          images={selectedImageProduct.image_urls || []}
          currentIndex={selectedImageIndex}
          onIndexChange={setSelectedImageIndex}
          alt={selectedImageProduct.product_name}
        />
      )}
    </div>
  );
}
