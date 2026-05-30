// Generates a PDF from a DOM element using html2pdf.js (jsPDF + html2canvas).
import html2pdf from 'html2pdf.js';

export async function downloadElementAsPdf(el: HTMLElement, filename: string) {
  const originalMinHeight = el.style.minHeight;
  const originalWidth = el.style.width;
  const originalBoxShadow = el.style.boxShadow;
  const originalBorder = el.style.border;
  const originalBorderRadius = el.style.borderRadius;

  // Temporarily adjust container styles to match A4 boundaries
  // and prevent extra empty space from creating a blank page.
  el.style.minHeight = 'auto';
  el.style.width = '210mm';
  el.style.boxShadow = 'none';
  el.style.border = 'none';
  el.style.borderRadius = '0';

  const opts: Record<string, unknown> = {
    margin: 0, // No PDF-level margins; the element's internal 15mm padding handles margins.
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 800, // Forces a stable 800px width layout viewport to avoid responsive wrapping or clipping
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  };

  try {
    // html2pdf type defs are incomplete; cast to any for fluent API.
    await (
      html2pdf() as unknown as {
        set: (o: unknown) => {
          from: (e: HTMLElement) => { save: () => Promise<void> };
        };
      }
    )
      .set(opts)
      .from(el)
      .save();
  } finally {
    // Restore original styles for on-screen preview fidelity
    el.style.minHeight = originalMinHeight;
    el.style.width = originalWidth;
    el.style.boxShadow = originalBoxShadow;
    el.style.border = originalBorder;
    el.style.borderRadius = originalBorderRadius;
  }
}
