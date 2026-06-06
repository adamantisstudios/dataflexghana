const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function inspectPDF() {
  const pdfBytes = fs.readFileSync('C:\\Users\\Administrator\\Desktop\\dataflexghana-latest_upgrade\\public\\official-forms\\Form-A.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  
  const fields = form.getFields();
  console.log('--- PDF Form Fields ---');
  fields.forEach(field => {
    const type = field.constructor.name;
    const name = field.getName();
    console.log(`${type}: ${name}`);
  });
}

inspectPDF().catch(err => console.error(err));
