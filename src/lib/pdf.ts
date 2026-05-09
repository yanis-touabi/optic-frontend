// Generates a PDF from a DOM element using html2pdf.js (jsPDF + html2canvas).
import html2pdf from "html2pdf.js";

export async function downloadElementAsPdf(el: HTMLElement, filename: string) {
  const opts: Record<string, unknown> = {
    margin: [10, 10, 10, 10],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"] },
  };
  // html2pdf type defs are incomplete; cast to any for fluent API.
  await (html2pdf() as unknown as { set: (o: unknown) => { from: (e: HTMLElement) => { save: () => Promise<void> } } })
    .set(opts)
    .from(el)
    .save();
}
