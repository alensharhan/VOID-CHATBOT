import * as pdfjsLib from 'pdfjs-dist';
// Vite native URL import ensures it bundles the WebWorker securely for offline caching.
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Load the massive document mathematically 
    const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Recursively parse text items natively over every single embedded structural page
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += `[Page ${pageNum}]\n${pageText}\n\n`;
    }
    
    return fullText.trim();
  } catch (error) {
    console.error("Native PDF Parsing Fatal Error:", error);
    throw new Error("Unable to parse document structurally.");
  }
}
