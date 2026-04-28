# Property Image Buckets Implementation Guide

## Overview

This guide documents the complete implementation of property image storage buckets and file upload functionality for both admins and agents. Two separate Supabase Storage buckets have been created to organize uploads by user type and enable proper workflow control.

---

## Architecture

### Buckets

#### 1. Admin Property Images Bucket
- **Name**: `admin-property-images`
- **Purpose**: Store images uploaded by admin users
- **Folder Structure**: `properties/{propertyId}/{filename}`
- **Use Case**: Admins can upload images when creating/editing properties directly
- **File Limit**: 10MB per file
- **Allowed Types**: JPEG, PNG, WebP, GIF

#### 2. Agent Property Images Bucket
- **Name**: `agent-property-images`
- **Purpose**: Store images uploaded by agent users
- **Folder Structure**: `properties/{propertyId}/{filename}`
- **Use Case**: Agents upload images when publishing new properties
- **File Limit**: 10MB per file
- **Allowed Types**: JPEG, PNG, WebP, GIF

### Image URLs Handling

All image URLs (whether from file uploads or external links) are stored in a single `image_urls[]` column in the `properties` table:

```sql
image_urls: string[] -- Contains both uploaded file URLs and external URLs
```

This allows:
- **Mixed image sources**: Properties can have images from both uploaded files and external URLs
- **Unified display**: Same rendering logic handles all image types
- **Flexible workflow**: Users can mix upload methods

---

## Database Setup

### SQL Script
File: `scripts/create-property-image-buckets.sql`

Run this script to create the two buckets:

```bash
# The script creates:
# 1. admin-property-images bucket
# 2. agent-property-images bucket
```

**Status**: Security policies (RLS) will be added later. Currently, buckets are public.

---

## Updated Code Components

### 1. Property Image Upload Helper
**File**: `lib/property-image-upload.ts`

**Changes**:
- Added `UploadTarget` type to specify "admin" or "agent"
- `uploadPropertyImage()` now accepts `target` parameter
- `deletePropertyImage()` now accepts `target` parameter
- `uploadPropertyImages()` now accepts `target` parameter
- Increased file size limit from 5MB to 10MB

**Function Signatures**:

```typescript
// Single file upload
export async function uploadPropertyImage(
  file: File,
  target: "admin" | "agent" = "agent",
  onProgress?: (progress: number) => void
): Promise<string>

// Delete uploaded image
export async function deletePropertyImage(
  imageUrl: string,
  target: "admin" | "agent" = "agent"
): Promise<void>

// Multiple files upload
export async function uploadPropertyImages(
  files: File[],
  target: "admin" | "agent" = "agent",
  onProgress?: (progress: number) => void
): Promise<string[]>
```

### 2. Admin Properties Tab
**File**: `components/admin/tabs/PropertiesTab.tsx`

**Changes**:
- Added `uploadPropertyImage` import
- Added `uploadingFiles` state
- Added `uploadProgress` state
- Added `handleImageFileUpload()` function
- Enhanced image section with file upload button
- Upload uses `"admin"` target

**Features**:
- Paste external image URLs (existing)
- Upload image files (new)
- Progress indicator during upload
- Multiple files supported
- Mixed image sources supported

**UI Changes**:
- New "Choose Files" button in image section
- Upload progress display
- Automatic image list refresh after upload

### 3. Agent Publishing Component
**File**: `components/agent/AgentPublishNewProperties.tsx`

**Changes**:
- Updated `uploadPropertyImage()` calls to use `"agent"` target
- Image upload now goes to `agent-property-images` bucket
- Added console logging for bucket source
- Maintains existing compression workflow

---

## Usage Examples

### Admin: Upload Property Image

```typescript
// In PropertiesTab component
const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.currentTarget.files
  if (!files) return

  try {
    const fileArray = Array.from(files)
    const uploadedUrls: string[] = []

    for (let i = 0; i < fileArray.length; i++) {
      const url = await uploadPropertyImage(
        fileArray[i],
        "admin", // Upload to admin bucket
        (progress) => {
          console.log(`Upload progress: ${progress}%`)
        }
      )
      uploadedUrls.push(url)
    }

    // Add URLs to form
    setFormData(prev => ({
      ...prev,
      image_urls: [...prev.image_urls, ...uploadedUrls]
    }))
  } catch (error) {
    console.error("Upload failed:", error)
  }
}
```

### Agent: Upload Property Image

```typescript
// In AgentPublishNewProperties component
const url = await uploadPropertyImage(
  compressedFile,
  "agent", // Upload to agent bucket
  (progress) => {
    setUploadProgress(Math.round(progress))
  }
)

formData.image_urls.push(url)
```

### External URL: Add to Property

```typescript
// Users can still add external URLs directly
const externalUrl = "https://s1.rea.global/property.jpg"
setFormData(prev => ({
  ...prev,
  image_urls: [...prev.image_urls, externalUrl]
}))
```

---

## Workflow Comparison

### Admin Workflow (Direct Publishing)
```
1. Admin opens Properties Tab
2. Clicks "Add Property" button
3. Fills form (title, price, details)
4. Can add images via:
   - External URLs (paste link)
   - File upload (click "Choose Files")
5. Images stored in `admin-property-images` bucket
6. Clicks "Save"
7. Property published immediately
8. `is_approved = true` (admin content)
```

### Agent Workflow (With Approval)
```
1. Agent opens Publish Properties page
2. Fills form with property details
3. Uploads image files
4. Images stored in `agent-property-images` bucket
5. Clicks "Publish"
6. Property submitted for approval
7. `is_approved = false` (pending)
8. Admin reviews in Requests tab
9. Admin approves to publish live
```

---

## Database Queries

### Find Admin-Published Properties
```sql
SELECT * FROM properties
WHERE published_by_agent_id IS NULL AND is_approved = true;
```

### Find Agent-Published Properties (Pending)
```sql
SELECT * FROM properties
WHERE published_by_agent_id IS NOT NULL AND is_approved = false;
```

### Find Properties with Uploaded Images
```sql
SELECT * FROM properties
WHERE image_urls && ARRAY[
  '%admin-property-images%',
  '%agent-property-images%'
];
```

---

## File Storage Paths

### Admin Upload Path
```
admin-property-images/
  properties/
    {random_string}_{timestamp}.{ext}
    Example: properties/a7f3k2m1_1705123456789.jpg
```

### Agent Upload Path
```
agent-property-images/
  properties/
    {random_string}_{timestamp}.{ext}
    Example: properties/x9q2l5n8_1705124567890.jpg
```

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Bucket not found" | Buckets not created | Run SQL script |
| "File too large" | File > 10MB | Compress image before upload |
| "Invalid file type" | Non-image file | Select image file (JPG, PNG, WebP, GIF) |
| "Upload failed" | Network issue | Check connection and retry |
| "Permission denied" | RLS policy issue | Will be fixed when RLS added |

---

## Future Enhancements

### 1. Security (RLS Policies)
```sql
-- Admin can read/write their own images
-- Agents can read/write their own images
-- Public can read (once approved)
```

### 2. Image Optimization
- Automatic compression for large images
- Generate thumbnails
- CDN caching optimization

### 3. Batch Operations
- Bulk upload multiple properties
- Batch approve/reject with images
- Export properties with images

### 4. Image Management
- Replace uploaded image
- Reorder images
- Add image captions
- Image analytics

---

## Migration Notes

### Existing Properties
- Current properties with external URLs remain unchanged
- `image_urls` field continues to store all URL types
- No data migration required

### Backward Compatibility
- Upload functions have default `target = "agent"`
- Existing code works without changes
- Admin functionality is additive

---

## Testing Checklist

- [ ] Create buckets with SQL script
- [ ] Admin uploads single image
- [ ] Admin uploads multiple images
- [ ] Admin adds external URL
- [ ] Admin mixes upload and URL
- [ ] Agent uploads compressed image
- [ ] Agent uploads multiple images
- [ ] Delete uploaded image
- [ ] Images display in property listing
- [ ] Public can view images
- [ ] Image permissions work as expected

---

## Support & Troubleshooting

### Check Bucket Status
```typescript
// In browser console
const { data: buckets } = await supabase.storage.listBuckets()
console.log(buckets)
```

### Verify Image URL
```typescript
// Check if URL is accessible
const testUrl = "https://your-bucket.supabase.co/storage/v1/object/public/..."
fetch(testUrl).then(r => console.log(r.status))
```

### Debug Upload
```typescript
// Enable detailed logging
console.log("[v0] Upload starting:", file.name)
console.log("[v0] Target bucket:", target)
console.log("[v0] File size:", file.size)
```

---

## Configuration Summary

| Setting | Admin | Agent |
|---------|-------|-------|
| Bucket Name | `admin-property-images` | `agent-property-images` |
| File Limit | 10MB | 10MB |
| Folder Path | `properties/{id}/{name}` | `properties/{id}/{name}` |
| Public Access | True | True |
| RLS Enabled | Not yet | Not yet |
| Auto-Approval | Yes | No |

---

*Last Updated: 2024*
*Status: Implementation Complete, RLS Pending*
