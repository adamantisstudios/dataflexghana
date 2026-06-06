# Implementation Plan: Sole Proprietorship Official PDF Generation

After reviewing the codebase (specifically `dataflexghana`'s `ComplianceTab.tsx`), I understand exactly what needs to be done to achieve this data transformation exclusively for the Admin Compliance section.

## Background Context
Currently, the admin dashboard has a **Compliance** tab (`components/admin/tabs/ComplianceTab.tsx`) which lists all submitted compliance forms, such as "Sole Proprietorship". Admin can view form data in a modal, download the raw text data (`downloadFormAsText`), and download uploaded images as separate files (`downloadAllImages`).

The goal is to automatically map this data and the images into an official, fillable PDF file that the admin can download and submit to authorities.

## User Review Required

> [!IMPORTANT]
> To proceed with this implementation, I will need you to upload a blank copy of the official fillable Sole Proprietorship PDF document into the project (e.g., in the `public/` directory).
> I will also need to add `pdf-lib` to your dependencies, as it is the industry-standard tool for modifying and filling existing PDFs. Your current package `jspdf` is meant for creating documents from scratch, not filling existing official government forms.

## Proposed Changes

### 1. Install Required Library

#### [NEW] Dependencies
- Install `pdf-lib` via your package manager to enable reading and modifying existing PDF templates.

### 2. Backend API Route

#### [NEW] `app/api/admin/compliance/generate-pdf/route.ts`
We will create a new API endpoint specifically for generating this official document.
- It will accept a `submissionId`.
- Fetch the `form_submissions` data and `form_images` (Ghana Card front/back, and Signature) from Supabase.
- Load the blank template (`public/sole_proprietorship_template.pdf`).
- Use `pdf-lib` to map fields from `form_data` (like `business_name`, `tin_number`) into the exact text boxes on the official PDF.
- Embed the Signature image and place it precisely in the designated signature box.
- Append a new blank A4 page at the end of the PDF, and draw the Ghana Card Front & Back images (simulating a white sheet of paper).
- Flatten the PDF so fields become read-only.
- Return the generated PDF bytes to the client.

### 3. Frontend Admin Dashboard Updates

#### [MODIFY] `components/admin/tabs/ComplianceTab.tsx`
We will update the Compliance tab to include the download button for the official PDF.
- Inside the details modal and on the card grid, alongside the existing "Download Text" and "Download Images" buttons, add a new **"Download Official PDF"** button.
- Add a conditional check so this button only appears for Sole Proprietorship forms (`submission.form_id === "1"` or `"sole_proprietorship"`).
- Implement a `downloadOfficialPDF(submissionId)` function that triggers the new API endpoint and forces a browser download of the returned `.pdf` file.

## Verification Plan

### Manual Verification
1. Open the Admin Dashboard -> Compliance Tab.
2. Select a submitted "Sole Proprietorship" form.
3. Click the new "Download Official PDF" button.
4. Verify that the downloaded file contains the filled form fields, the signature placed correctly, and the ID cards appended on a final blank page.
