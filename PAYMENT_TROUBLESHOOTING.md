# Payment Flow Troubleshooting Guide

## Issue: WhatsApp Redirect Not Working After Payment

### Symptoms
- Payment verification completes but doesn't redirect to WhatsApp
- User stuck on payment page

### Fixes
1. **Check browser console for errors** (F12 → Console tab)
   - Look for any error messages about WhatsApp link

2. **Verify phone number in code**
   - Should be: `233242799990`
   - Without + or spaces

3. **Test WhatsApp link manually**
   - Visit: `https://wa.me/233242799990?text=Hello`
   - Should open WhatsApp

### Code Location
File: `app/agent/registration-payment/page.tsx`
Function: `verifyPaystackPayment()`
Line: ~200+

---

## Issue: Featured Videos Not Playing in Modal

### Symptoms
- Modal opens but video doesn't play
- Black screen in modal

### Fixes
1. **Check video file paths**
   ```
   /testimonials/agent0.mp4
   /testimonials/agent2.mp4
   ```

2. **Verify video files exist** in `public/testimonials/`
   - If missing, add them or use placeholder

3. **Check browser video support**
   - Works in Chrome, Firefox, Safari
   - Mobile browsers should support MP4

### Code Location
File: `app/agent/registration-payment/page.tsx`
Section: `featuredTestimonies` array (lines ~60+)

---

## Issue: Social Proof Earnings Not Displaying

### Symptoms
- Earnings stories section blank or misaligned
- Text not visible

### Fixes
1. **Check browser zoom** (should be 100%)

2. **Clear browser cache**
   - Ctrl+Shift+Delete (Windows/Linux)
   - Cmd+Shift+Delete (Mac)

3. **Check if CSS loaded properly**
   - Look at DevTools → Elements tab
   - Verify Tailwind classes applied

### Code Location
File: `app/agent/registration-payment/page.tsx`
Section: "Real Earnings Proof with Varied Stories" (lines ~367+)

---

## Issue: Exit Warning Not Appearing

### Symptoms
- Can leave payment page without warning
- beforeunload event not firing

### Fixes
1. **Check useEffect dependency array**
   - Should include `verifyingPayment` and `agentId`

2. **Test in different browser**
   - Some browsers restrict beforeunload

3. **Ensure page is interactive**
   - Warning only shows on active payment page
   - Not during payment verification

### Code Location
File: `app/agent/registration-payment/page.tsx`
Function: `useEffect` for beforeunload (lines ~107+)

---

## Issue: Payment Page Loads Slowly

### Symptoms
- Page takes long time to render
- Images loading slowly

### Fixes
1. **Optimize video file sizes**
   - Compress thumbnails
   - Use optimized video formats

2. **Check image paths**
   - All thumbnail images should exist in `/public/testimonials/`

3. **Use Next.js Image component**
   - Already implemented in featured videos
   - Provides automatic optimization

---

## Issue: WhatsApp Message Text Gets Cut Off

### Symptoms
- Message appears truncated in WhatsApp
- Special characters display as ???

### Fixes
1. **Check URL encoding**
   - `encodeURIComponent()` should handle special chars
   - Should be already done in code

2. **Reduce message length if needed**
   - WhatsApp has character limits
   - Current message ~800 characters (should be fine)

3. **Test special characters**
   - Emojis: ✅ 🎉 💰 etc should work
   - Symbols: ₵ (Ghana Cedi) should work

### Code Location
File: `app/agent/registration-payment/page.tsx`
Function: `verifyPaystackPayment()` 
Variable: `whatsappMessage` (lines ~145-200)

---

## Issue: Modal Close Button Not Working

### Symptoms
- Can't close video modal
- X button unresponsive

### Fixes
1. **Check z-index stacking**
   - Modal should have z-50
   - Button should be clickable

2. **Test on mobile**
   - Tap close button (not click)
   - Ensure button area is large enough

3. **Verify closeVideoModal function**
   - Should set `showVideo` to false
   - Should clear `currentVideo`

### Code Location
File: `app/agent/registration-payment/page.tsx`
Function: `closeVideoModal()` (lines ~87-90)

---

## Issue: Payment Reference Not Including in WhatsApp

### Symptoms
- WhatsApp message missing payment reference
- Shows "undefined" instead of reference number

### Fixes
1. **Check reference parameter**
   - Must be passed from Paystack response
   - Should be available in verify function

2. **Verify API response includes reference**
   ```
   {
     success: true,
     data: {
       reference: "fl26eyeq3b",  // Should be here
       ...
     }
   }
   ```

3. **Check variable scope**
   - `reference` must be accessible in whatsappMessage string

### Code Location
File: `app/agent/registration-payment/page.tsx`
Function: `verifyPaystackPayment()`
Variable: `whatsappMessage` (line ~169)

---

## Issue: "Skip to Payment" Button on Testimonials Not Working

### Symptoms
- Button doesn't navigate to payment page
- Page doesn't update

### Fixes
1. **Check href parameter**
   - Should be: `/agent/register?step=payment`
   - Current: `/agent/register`

2. **Verify registration page handles step parameter**
   - May need to add logic to skip to payment step

3. **Use direct payment URL**
   - Alternative: Link directly to `/agent/registration-payment`
   - But requires agentId and name params

### Code Location
File: `app/testimonials/page.tsx`
Button: "Skip to Payment" (line ~248)

---

## Issue: Video Thumbnails Not Showing

### Symptoms
- Black rectangles instead of agent photos
- Images not loading

### Fixes
1. **Verify image paths**
   ```
   /testimonials/alhassan_issah.png
   /testimonials/successful-female-agent-smiling.png
   ```

2. **Check image files exist**
   - In: `public/testimonials/`
   - Format: PNG or JPG
   - Size: Optimized for web

3. **Check Image component props**
   - `fill` prop should be set
   - `className` should include `object-cover`

### Code Location
File: `app/agent/registration-payment/page.tsx`
Section: Featured Video Testimonies (lines ~383+)

---

## Quick Debug Checklist

- [ ] Open Chrome DevTools (F12)
- [ ] Go to Console tab
- [ ] Look for any red error messages
- [ ] Check Network tab for failed requests
- [ ] Verify URLs in Network tab (look for 404s)
- [ ] Check Application tab → LocalStorage (for stored references)
- [ ] Test on mobile too (different issues may appear)

---

## Common Error Messages & Solutions

### "Payment verification failed"
- Paystack API key incorrect
- Network issue connecting to Paystack
- Invalid reference number

**Solution**: Check PAYSTACK_SECRET_KEY in environment variables

### "Agent ID not found"
- RegisteredError: No agentId passed to payment page
- User skipped registration step

**Solution**: Verify registration page passes agentId in URL

### "Failed to initialize payment"
- Paystack initialization API error
- Network issue
- Invalid amount

**Solution**: Check Paystack API response in Network tab

---

## Performance Optimization Tips

1. **Compress video thumbnails**
   - Current: Use Next.js Image optimization
   - Size: Aim for <100KB each

2. **Lazy load featured videos**
   - Only load video when modal opens
   - Already implemented via `src` attribute

3. **Cache static assets**
   - Images cached by browser
   - Videos cached by CDN

4. **Monitor Core Web Vitals**
   - LCP: < 2.5s
   - FID: < 100ms
   - CLS: < 0.1

---

## Testing Commands

```bash
# Test WhatsApp link manually
open "https://wa.me/233242799990?text=Test%20message"

# Check if images accessible
curl -I https://localhost:3000/testimonials/alhassan_issah.png

# Test video files
curl -I https://localhost:3000/testimonials/agent0.mp4

# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## When to Contact Support

Contact support if:
- WhatsApp redirect doesn't work after troubleshooting
- Payment verification API returns unexpected errors
- Video files unable to load despite correct paths
- Multiple users report same issue (not isolated)

Provide:
- Browser and version
- Operating system
- Steps to reproduce
- Browser console error messages
- Network tab screenshot (with sensitive data removed)
