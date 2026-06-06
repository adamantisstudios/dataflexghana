# PDF Form Mapping and Document Generation Architecture

To achieve the automated filling of the statutory sole proprietorship forms, embedding signatures, and appending the Ghana Card images without re-creating the form from scratch, you will need a combination of frontend data capture and backend PDF manipulation.

Based on the fact that you are using a modern web stack (like Next.js/React), here is the step-by-step architecture to achieve this.

## 1. The Core Library: `pdf-lib`
For the backend processing, the best tool in the Node.js/JavaScript ecosystem for this exact task is **`pdf-lib`**. 
Unlike PDF generation tools that create PDFs from blank slates (like `pdfkit` or HTML-to-PDF converters), `pdf-lib` excels at **reading existing PDF templates**, interacting with their AcroForm fields, drawing images (like signatures), and manipulating pages.

## 2. Step-by-Step Implementation Strategy

### Step A: Prepare the Statutory PDF Template
1. Take your actual fillable statutory PDF form.
2. Ensure every field you want to fill has a unique, recognizable "Field Name". You can verify or change these using Adobe Acrobat Pro or free PDF form editors.
3. Save this blank, fillable PDF in your project (e.g., in a `public` or `assets` folder) or securely in a cloud storage bucket (like AWS S3).

### Step B: Frontend Data & Signature Capture (Agent Side)
1. **Form Data**: Collect all the text data normally via your frontend forms.
2. **Signature Capture**: Use a library like `react-signature-canvas` or `signature_pad`. These allow the user to draw their signature on a touch screen or with a mouse. Once signed, extract the signature as a **Base64 encoded PNG image**.
3. **Ghana Card Upload**: Allow the agent to upload the front and back pictures of the Ghana card. 
4. Submit all this data (JSON text, signature image string, card images) to your Next.js API route or backend server.

### Step C: Backend PDF Processing
When the agent submits the form (or when the admin requests the document), your backend will process it as follows:

1. **Load the Template**: Load the blank PDF template using `pdf-lib`.
   ```javascript
   import { PDFDocument } from 'pdf-lib';

   const pdfDoc = await PDFDocument.load(templateBytes);
   const form = pdfDoc.getForm();
   ```

2. **Map Text Fields**: Use the data submitted by the agent to fill the fields in the PDF exactly where they belong.
   ```javascript
   form.getTextField('CompanyName').setText(data.companyName);
   form.getTextField('TIN_Number').setText(data.tinNumber);
   // ... map all other fields
   ```

3. **Inject the Signature**: 
   - Embed the Base64 signature image into the PDF document.
   - You can either draw it at specific `X` and `Y` coordinates on the page, or if your PDF has an image/button field specifically for the signature, you can replace that field with the image.
   ```javascript
   const signatureImage = await pdfDoc.embedPng(signatureBase64);
   // Example of getting a field and drawing the image over its area
   const signatureField = form.getButton('SignatureField');
   signatureField.setImage(signatureImage);
   ```

4. **Append the Ghana Card (The "White Sheet of Paper")**:
   - Add a new blank page to the end of the PDF document.
   ```javascript
   const newPage = pdfDoc.addPage([595.28, 841.89]); // Standard A4 dimensions
   ```
   - Embed the uploaded Ghana Card images (Front and Back) into the PDF.
   - Draw them onto this new blank page, scaling them appropriately so they both fit neatly on the page, simulating a printed white sheet.
   ```javascript
   const cardFrontImg = await pdfDoc.embedJpg(cardFrontBytes);
   newPage.drawImage(cardFrontImg, { x: 50, y: 500, width: 400, height: 250 });
   ```

5. **Flatten the Document (Crucial)**: 
   - To prevent the admin (or anyone else) from accidentally editing the fields after downloading, you should "flatten" the form. This permanently burns the text and images into the document, making it a standard read-only PDF.
   ```javascript
   form.flatten();
   ```

### Step D: Delivery to Admin
1. Serialize the modified PDF into a byte array.
   ```javascript
   const pdfBytes = await pdfDoc.save();
   ```
2. You can either:
   - Save it to your cloud storage and link it to the agent's submission record in your database.
   - Serve it directly via an API endpoint so when the admin clicks "Download", it returns the file with `Content-Type: application/pdf` and triggers a browser download.

## Summary of Tools Needed
- **Backend**: `pdf-lib` (for reading the template, mapping fields, injecting images, and appending pages).
- **Frontend Signature**: `react-signature-canvas` (or a similar canvas drawing tool).
- **Frontend File Upload**: Standard HTML file inputs or a dropzone library for the Ghana Card images.

This approach gives you **pixel-perfect accuracy** on the government statutory forms, ensures the signature is placed exactly in the designated box, and keeps everything (including the ID cards) neatly bundled in a single, uneditable PDF file ready for the admin to print.
