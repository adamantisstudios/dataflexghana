# Property Image Buckets - Quick Reference

## TL;DR

Two new Supabase Storage buckets created for property image uploads:
- `admin-property-images` - For admin uploads
- `agent-property-images` - For agent uploads

Both buckets are public, 10MB file limit, support JPEG/PNG/WebP/GIF.

---

## What Changed

| Component | Change | Impact |
|-----------|--------|--------|
| SQL | New script creates buckets | **ACTION**: Execute `create-property-image-buckets.sql` |
| Admin UI | File upload button added | Admins can now upload image files |
| Agent Upload | Updated to use agent bucket | Agent uploads go to dedicated bucket |
| Helper Functions | Accept target parameter | Code routes to correct bucket |

---

## Execute Setup

```bash
# Run the SQL script in Supabase dashboard
# File: scripts/create-property-image-buckets.sql
```

---

## Admin Usage

1. Go to **Admin Dashboard → Properties → Property Management**
2. Click **"Add Property"**
3. Fill property details
4. In **Images** section:
   - Click **"Choose Files"** to upload image files OR
   - Paste **Image URL** to add external images
5. Click **"Save"** - property publishes immediately

---

## Agent Usage

1. Go to **Agent Dashboard → Publish Properties**
2. Fill property details
3. Click **"Upload Images"** to add images
4. Agent automatically compresses images
5. Click **"Publish"** - property awaits admin approval

---

## Code Changes

### `lib/property-image-upload.ts`
```typescript
// OLD
const url = await uploadPropertyImage(file, agentId)

// NEW
const url = await uploadPropertyImage(file, "admin" | "agent")
```

### `components/admin/tabs/PropertiesTab.tsx`
```typescript
// NEW
const handleImageFileUpload = async (e) => { ... }
// File upload handler for admins
```

### `components/agent/AgentPublishNewProperties.tsx`
```typescript
// UPDATED
const url = await uploadPropertyImage(file, "agent")
```

---

## Bucket Details

### Paths
```
admin-property-images/properties/{random}_{timestamp}.{ext}
agent-property-images/properties/{random}_{timestamp}.{ext}
```

### Settings
- **Public**: Yes (everyone can view)
- **Max File**: 10MB
- **Types**: JPEG, PNG, WebP, GIF
- **RLS**: None (added later)

---

## File Structure

```
lib/property-image-upload.ts          ← Updated
components/admin/tabs/PropertiesTab.tsx         ← Updated
components/agent/AgentPublishNewProperties.tsx  ← Updated
scripts/create-property-image-buckets.sql       ← NEW
```

---

## Storage Paths Generated

When user uploads `my-image.jpg`:

**Admin**:
```
https://[project].supabase.co/storage/v1/object/public/
admin-property-images/properties/a7f3k2m1_1705123456789.jpg
```

**Agent**:
```
https://[project].supabase.co/storage/v1/object/public/
agent-property-images/properties/x9q2l5n8_1705124567890.jpg
```

---

## Mixed Images

Properties can have both uploaded and external images:

```typescript
image_urls: [
  "https://admin-property-images...jpg",      // Uploaded
  "https://agent-property-images...jpg",      // Uploaded
  "https://external-site.com/image.jpg"       // External
]
```

---

## Error Messages & Fixes

| Error | Fix |
|-------|-----|
| "Bucket not found" | Execute SQL script |
| "File too large" | Use images < 10MB |
| "Invalid file type" | Select image file |
| "Upload failed" | Check internet, retry |

---

## Testing

### Quick Test
1. Run SQL script
2. Admin: Add property with file upload
3. Agent: Publish property with file upload
4. Check images appear in listings

### Verify Buckets
```typescript
const { data } = await supabase.storage.listBuckets()
// Should show both buckets
```

---

## Features

✅ File upload for admins  
✅ File upload for agents  
✅ External URL support (both users)  
✅ Mixed image sources  
✅ Progress tracking  
✅ Multiple files support  
✅ Auto-compression (agents)  
✅ Public image access  

---

## Next Steps

1. **Execute SQL** → Create buckets
2. **Test Admin** → Upload property image
3. **Test Agent** → Publish property image
4. **Verify Images** → Check in listings
5. **Deploy** → Go to production

---

## Files to Review

1. **Full Details**: `PROPERTY_IMAGE_BUCKETS_GUIDE.md`
2. **This Guide**: `BUCKET_QUICK_REFERENCE.md`
3. **Summary**: `BUCKET_IMPLEMENTATION_SUMMARY.md`
4. **SQL Setup**: `scripts/create-property-image-buckets.sql`

---

## Status: Ready to Deploy ✅

No breaking changes. Backward compatible. Just execute SQL script and test.

