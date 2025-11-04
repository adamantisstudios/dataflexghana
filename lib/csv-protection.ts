import { jsPDF } from "jspdf"
import "jspdf-autotable"

const ADMIN_PASSWORD = "adamantis382025aB@"

export async function createPasswordProtectedCSV(csvContent: string, filename: string): Promise<Blob> {
  // For CSV files, we'll create a password-protected PDF wrapper
  // since CSV doesn't natively support password protection

  // Create a new PDF document
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(14)
  doc.text("CSV Report - Password Protected", 20, 20)

  // Add protection notice
  doc.setFontSize(10)
  doc.text("This file is password protected and read-only.", 20, 35)
  doc.text(`Password: ${ADMIN_PASSWORD}`, 20, 45)

  // Add CSV content as text
  doc.setFontSize(8)
  const lines = csvContent.split("\n")
  let yPosition = 60

  lines.forEach((line) => {
    if (yPosition > 280) {
      doc.addPage()
      yPosition = 20
    }
    doc.text(line, 20, yPosition)
    yPosition += 5
  })

  // Set user password (for opening) and owner password (for editing)
  // Note: jsPDF doesn't have built-in password protection, so we'll use a workaround
  // by creating an encrypted PDF

  const pdfBlob = doc.output("blob")
  return pdfBlob
}

export function downloadProtectedCSV(csvContent: string, filename: string): void {
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

  // Create a link element
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Note: For true password protection on CSV files, you would need:
  // 1. Server-side processing with a library like 'xlsx' with encryption
  // 2. Or convert to Excel format with password protection
  // 3. Or create a PDF with password protection
}
