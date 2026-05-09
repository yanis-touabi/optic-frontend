import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2, Download, ZoomIn, ZoomOut } from "lucide-react";
import { useClients, useOrdonnances } from "@/lib/data";
import { OrdonnanceClassique, OrdonnanceCompact, OrdonnanceDetaille } from "@/components/print/OrdonnanceTemplates";
import { TemplateSelect } from "@/components/TemplateSelect";
import { ordonnanceTemplates, getOrdonnanceTemplate, setOrdonnanceTemplate, type OrdonnanceTemplate } from "@/lib/templates";
import { downloadElementAsPdf } from "@/lib/pdf";
import { toast } from "sonner";

export default function ImprimerOrdonnance() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: ordonnances = [], isLoading } = useOrdonnances();
  const { data: clients = [] } = useClients();
  const ord = ordonnances.find((o) => o.id === id);
  const [tpl, setTpl] = useState<OrdonnanceTemplate>(getOrdonnanceTemplate());
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (ord) document.title = `Ordonnance`; }, [ord]);

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin inline" /></div>;

  if (!ord) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Ordonnance introuvable.</p>
        <Button onClick={() => nav("/ordonnances")} className="mt-4">Retour</Button>
      </div>
    );
  }

  const client = clients.find((c) => c.id === ord.clientId);
  const onTpl = (v: string) => { setTpl(v as OrdonnanceTemplate); setOrdonnanceTemplate(v as OrdonnanceTemplate); };
  const Render = tpl === "compact" ? OrdonnanceCompact : tpl === "detaille" ? OrdonnanceDetaille : OrdonnanceClassique;

  const onDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      await downloadElementAsPdf(printRef.current, `ordonnance-${ord.id.slice(0, 8)}.pdf`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur";
      toast.error(`Échec PDF : ${msg}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 print:bg-white">
      <div className="no-print bg-card border-b px-6 py-3 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4" />Retour</Button>
        <div className="flex items-center gap-2">
          <TemplateSelect value={tpl} onChange={onTpl} options={ordonnanceTemplates} />
          <div className="flex items-center gap-1 border rounded-md">
            <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} title="Zoom -"><ZoomOut className="h-4 w-4" /></Button>
            <span className="text-xs w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))} title="Zoom +"><ZoomIn className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDownload} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Télécharger PDF
          </Button>
          <Button onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimer</Button>
        </div>
      </div>

      <div className="py-6 print:py-0 flex justify-center overflow-auto">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center", width: "210mm" }}
          className="print:!transform-none"
        >
          <div
            ref={printRef}
            className="bg-white shadow-[var(--shadow-card)] print:shadow-none print-area mx-auto"
            style={{ width: "210mm", minHeight: "297mm", padding: "15mm", boxSizing: "border-box" }}
          >
            <Render ord={ord} client={client} />
          </div>
        </div>
      </div>
    </div>
  );
}
