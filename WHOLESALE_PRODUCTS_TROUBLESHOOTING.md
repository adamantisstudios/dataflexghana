# Wholesale Products Upload - Fixed Issues & Setup Guide

## Issue Summary

The issue was: **"TypeError: onProgress is not a function"** when uploading wholesale product images. Products were appearing as "unpublished" in the admin wholesale management section, but the underlying problem was the image upload failure.

## Root Cause Analysis

### Problem 1: Missing Library Files
The project was missing two critical library files:
- `/lib/wholesale-image-upload.ts` - Image upload utility
- `/lib/wholesale.ts` - Wholesale product operations

### Problem 2: Incorrect Function Signature
The `uploadWholesaleProductImage` function had:
1. **Optional `onProgress` parameter that wasn't being handled as optional**
2. **Inconsistent callback signature expectations** between components
3. **No error handling for when onProgress is undefined**

### Problem 3: Mismatched Implementation
- The admin ProductManagement component was calling the function differently than the agent publish-products page
- Progress calculations were inconsistent
- No proper validation for callback types

## Fixed Files

### 1. Created `/lib/wholesale-image-upload.ts`
This new file provides:
- `uploadWholesaleProductImage(file, agentId?, onProgress?)` - Upload single image
- `uploadWholesaleProductImages(files, agentId, onProgress?)` - Upload multiple images
- `deleteWholesaleProductImage(imageUrl)` - Delete images
- Proper error handling and validation
- Optional agentId parameter for flexibility

**Key fixes:**
```typescript
export async function uploadWholesaleProductImage(
  file: File,
  agentId?: string,  // Now optional
  onProgress?: (progress: number) => void  // Optional callback
): Promise<string> {
  try {
    // ... validation code ...
    
    // Safe callback invocation
    if (onProgress && typeof onProgress === "function") {
      onProgress(100)
    }
    
    return publicUrl
  } catch (error) {
    console.error(`[v0] Error in uploadWholesaleProductImage:`, error)
    throw error
  }
}
```

### 2. Created `/lib/wholesale.ts`
This new file provides:
- `WholesaleProduct` interface
- `WHOLESALE_CATEGORIES` constant
- `createWholesaleProduct()` - Create new products
- `getAllWholesaleProducts()` - Get all products with filtering
- `updateWholesaleProduct()` - Update products
- `deleteWholesaleProduct()` - Delete products
- `publishWholesaleProduct()` - Publish/unpublish
- `searchWholesaleProducts()` - Search functionality
- `getWholesaleProductStats()` - Analytics

### 3. Updated `/app/agent/publish-products/page.tsx`
Fixed the image upload handler to properly use the callback:

```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // ... setup code ...
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    try {
      const progressCallback = (progress: number) => {
        setUploadProgress(Math.round(((i + progress / 100) / files.length) * 100))
      }
      const url = await uploadWholesaleProductImage(file, agent.id, progressCallback)
      uploadedUrls.push(url)
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error)
      toast.error(`Failed to upload ${file.name}`)
    }
  }
}
```

### 4. Updated `/components/admin/wholesale/ProductManagement.tsx`
Fixed the file upload handler for admin panel:

```typescript
const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // ... setup code ...
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const uploadedUrl = await uploadWholesaleProductImage(file, undefined, (progress) => {
      setUploadProgress(Math.round(((i + progress / 100) / files.length) * 100))
    })
    
    setFormData((prev) => ({
      ...prev,
      image_urls: [...prev.image_urls, uploadedUrl],
    }))
  }
}
```

## How to Deploy These Fixes

### Step 1: Verify Files Exist
Ensure these files are now present:
- `/lib/wholesale-image-upload.ts` ✅
- `/lib/wholesale.ts` ✅

### Step 2: Clear Browser Cache
Clear localStorage and session storage:
```javascript
localStorage.clear()
sessionStorage.clear()
```

### Step 3: Test Image Upload
1. Log in as an agent with `can_publish_products = true`
2. Go to `/agent/publish-products`
3. Upload product images - should work without errors
4. Submit product - appears in admin as "unpublished"
5. Admin reviews and publishes - product becomes visible

### Step 4: Verify Admin Workflow
1. Log in as admin
2. Go to admin `/admin/wholesale` (or equivalent)
3. See unpublished products
4. Edit product details
5. Click publish button
6. Product becomes active

## Testing Checklist

- [ ] Image uploads complete without "onProgress is not a function" error
- [ ] Upload progress bar shows accurate percentage (0-100%)
- [ ] Multiple images upload in sequence
- [ ] Products appear in admin as "unpublished"
- [ ] Admin can toggle publish status
- [ ] Published products are visible to agents/users
- [ ] Image URLs are properly stored in database
- [ ] Product deletion removes images from storage

## Debugging Tips

### If uploads still fail:
1. Check browser console for detailed error messages
2. Verify Supabase bucket "wholesale-products" exists
3. Check bucket permissions allow public reads
4. Verify file size is under 5MB
5. Ensure file is a valid image format

### If products don't appear as unpublished:
1. Verify `wholesale_products` table has `is_active` column (default: false)
2. Check `can_publish_products` column exists in `agents` table
3. Verify agent has `can_publish_products = true`

### If admin can't see unpublished products:
1. Check admin has proper permissions in database
2. Verify RLS policies allow admin reads
3. Check SQL error logs in Supabase dashboard

## Related Documentation

- See `PUBLISH_PERMISSION_SETUP.md` for publish permission configuration
- See `scripts/add-publish-permission-column.sql` for database schema
- See `app/api/admin/agents/[id]/publish-permission/route.ts` for API endpoints

## Performance Notes

- Large image uploads (>3MB) may take 10-30 seconds
- Progress callbacks fire approximately every 100KB
- Parallel uploads limited to sequential processing to prevent rate limiting
- Images cached with 1-hour TTL in Supabase

## Security Considerations

- File validation: Only image/* MIME types accepted
- File size limit: 5MB maximum per image
- Unique filenames: Prevents file overwrites
- Public URLs: Images are publicly readable (intended for product catalog)
- Admin verification: Only admins can publish products

## Support

For issues:
1. Check this troubleshooting guide first
2. Review error messages in browser console
3. Check Supabase logs for storage errors
4. Verify network connectivity
5. Check database RLS policies in Supabase dashboard
