/**
 * Bundle data handling utilities
 * Provides robust data cleaning and validation for bundle information
 */

import type { DataOrder } from '@/lib/supabase';

export interface BundleData {
  id: string;
  name: string;
  provider: string;
  size_gb: number;
  price: number;
  commission_rate: number;
  validity_days: number;
  description: string;
}

export interface CleanedOrder extends Omit<DataOrder, 'data_bundles'> {
  data_bundles: BundleData;
  bundle_status: 'valid' | 'missing' | 'invalid';
}

/**
 * Check if bundle data exists and is valid
 */
export function isBundleDataValid(bundle: any): bundle is BundleData {
  if (!bundle || typeof bundle !== 'object') {
    return false;
  }

  // Check required fields exist
  const requiredFields = ['id', 'name', 'provider', 'price'];
  for (const field of requiredFields) {
    if (bundle[field] === null || bundle[field] === undefined) {
      return false;
    }
  }

  // Check if this is a real bundle (not a fallback)
  if (bundle.name === 'Bundle Not Found' || bundle.name === 'Unknown Bundle') {
    return false;
  }

  // Check if price is a valid number
  if (typeof bundle.price !== 'number' || isNaN(bundle.price)) {
    return false;
  }

  return true;
}

/**
 * Get bundle display name with size and provider
 */
export function getBundleDisplayName(bundle: BundleData): string {
  // If we have valid bundle data, create a proper display name
  if (bundle && bundle.name && bundle.name !== 'Bundle Not Found' && bundle.name !== 'Unknown Bundle') {
    // If the name already includes size and provider info, use it as is
    if (bundle.name.includes('GB') && (bundle.name.includes('MTN') || bundle.name.includes('AirtelTigo') || bundle.name.includes('Telecel'))) {
      return bundle.name;
    }
    
    // If we have size and provider, format it nicely
    if (bundle.size_gb && bundle.provider) {
      return `${bundle.size_gb}GB ${bundle.provider} - ${bundle.name}`;
    }
    
    // If we only have size, include it
    if (bundle.size_gb) {
      return `${bundle.size_gb}GB - ${bundle.name}`;
    }
    
    // If we only have provider, include it
    if (bundle.provider && bundle.provider !== 'Unknown') {
      return `${bundle.provider} - ${bundle.name}`;
    }
    
    // Just return the name if it's meaningful
    return bundle.name;
  }

  // For missing or invalid bundles, try to construct something meaningful
  if (bundle && (bundle.size_gb || bundle.provider)) {
    const parts = [];
    if (bundle.size_gb) parts.push(`${bundle.size_gb}GB`);
    if (bundle.provider && bundle.provider !== 'Unknown') parts.push(bundle.provider);
    
    if (parts.length > 0) {
      return `${parts.join(' ')} Data Bundle`;
    }
  }

  // Final fallback
  return 'Data Bundle (Details Unavailable)';
}

/**
 * Create a proper fallback bundle for missing data
 */
export function createFallbackBundle(orderId?: string): BundleData {
  return {
    id: '',
    name: 'Data Bundle',
    provider: 'Unknown Provider',
    size_gb: 0,
    price: 0,
    commission_rate: 0.10,
    validity_days: 30,
    description: `Bundle information needs to be restored${orderId ? ` for order ${orderId}` : ''}`
  };
}

/**
 * Clean and validate bundle data with improved fallback handling
 */
export function cleanBundleData(bundle: any, orderId?: string): {
  data: BundleData;
  status: 'valid' | 'missing' | 'invalid';
} {
  // If bundle data is completely missing
  if (!bundle) {
    return {
      data: createFallbackBundle(orderId),
      status: 'missing'
    };
  }

  // If bundle data exists but is invalid
  if (!isBundleDataValid(bundle)) {
    // Try to salvage what we can and create a meaningful bundle
    const salvaged: BundleData = {
      id: bundle.id || '',
      name: bundle.name && bundle.name !== 'Bundle Not Found' ? bundle.name : 'Data Bundle',
      provider: bundle.provider && bundle.provider !== 'Unknown' ? bundle.provider : 'Provider Unknown',
      size_gb: typeof bundle.size_gb === 'number' && bundle.size_gb > 0 ? bundle.size_gb : 0,
      price: typeof bundle.price === 'number' && !isNaN(bundle.price) && bundle.price > 0 ? bundle.price : 0,
      commission_rate: typeof bundle.commission_rate === 'number' ? bundle.commission_rate : 0.10,
      validity_days: typeof bundle.validity_days === 'number' ? bundle.validity_days : 30,
      description: bundle.description || 'Bundle information partially available'
    };

    return {
      data: salvaged,
      status: 'invalid'
    };
  }

  // Bundle data is valid, ensure all fields are properly typed
  const cleaned: BundleData = {
    id: bundle.id,
    name: bundle.name,
    provider: bundle.provider,
    size_gb: bundle.size_gb || 0,
    price: bundle.price,
    commission_rate: bundle.commission_rate || 0.10,
    validity_days: bundle.validity_days || 30,
    description: bundle.description || `${bundle.size_gb}GB ${bundle.provider} data bundle`
  };

  return {
    data: cleaned,
    status: 'valid'
  };
}

/**
 * Clean orders data with improved bundle handling
 */
export function cleanOrdersData(orders: DataOrder[]): CleanedOrder[] {
  if (!Array.isArray(orders)) {
    return [];
  }

  return orders.map(order => {
    const { data: bundleData, status } = cleanBundleData(order.data_bundles, order.id);

    return {
      ...order,
      data_bundles: bundleData,
      bundle_status: status
    } as CleanedOrder;
  });
}

/**
 * Check if order can be updated based on bundle status
 */
export function canUpdateOrderStatus(order: CleanedOrder, newStatus: string): {
  canUpdate: boolean;
  reason?: string;
} {
  // Allow updates for valid bundles
  if (order.bundle_status === 'valid') {
    return { canUpdate: true };
  }

  // Allow certain status changes even with invalid bundles
  const allowedStatusesForInvalidBundles = ['canceled', 'failed'];
  if (allowedStatusesForInvalidBundles.includes(newStatus)) {
    return { canUpdate: true };
  }

  // Block completion of orders with missing/invalid bundles
  if (newStatus === 'completed' && order.bundle_status !== 'valid') {
    return {
      canUpdate: false,
      reason: `Cannot complete order with ${order.bundle_status} bundle data. Please fix bundle information first.`
    };
  }

  return { canUpdate: true };
}

/**
 * Get bundle validation errors for admin display
 */
export function getBundleValidationErrors(order: CleanedOrder): string[] {
  const errors: string[] = [];

  if (order.bundle_status === 'missing') {
    errors.push('Bundle data is completely missing from database');
  }

  if (order.bundle_status === 'invalid') {
    errors.push('Bundle data exists but contains invalid information');
  }

  if (order.data_bundles.name === 'Bundle Not Found') {
    errors.push('Bundle reference not found in database');
  }

  if (order.data_bundles.price === 0 && order.bundle_status !== 'valid') {
    errors.push('Bundle price is missing or invalid');
  }

  return errors;
}
