import * as pdfjsLib from 'pdfjs-dist';
// Vite native URL import ensures it bundles the WebWorker securely for offline caching.
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextFromPDF(file) {
  const ERROR_MSG = `[SYSTEM NOTIFICATION: The user attached a PDF file named '${file.name}', but no readable text could be mathematically extracted from it. It is likely a scanned image without OCR, encrypted, or structurally corrupted. You MUST politely inform the user that you cannot read the contents of this PDF and explain that they need to provide a text-searchable version.]`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    // Load the massive document mathematically 
    const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    let totalValidChars = 0;
    
    // Recursively parse text items natively over every single embedded structural page
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items.map(item => item.str).join(' ');
      totalValidChars += pageText.replace(/\s/g, '').length;
      fullText += `[Page ${pageNum}]\n${pageText}\n\n`;
    }
    
    // If the PDF contains fundamentally zero readable character tokens (e.g. flat scanned images)
    if (totalValidChars < 10) {
      return ERROR_MSG;
    }
    
    return fullText.trim();
  } catch (error) {
    console.error("Native PDF Parsing Fatal Error:", error);
    return ERROR_MSG;
  }
}
