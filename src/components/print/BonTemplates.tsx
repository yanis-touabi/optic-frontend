import Barcode from "react-barcode";
import type { Client, Commande, Ordonnance } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/format";

const fmt = (n?: number, d = 2) =>
  n === undefined || n === null || Number.isNaN(n) ? "" : n.toFixed(d);

const fmtPrice = (n: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

interface Props {
  cmd: Commande;
  client?: Client;
  ord?: Ordonnance;
}

const Header = () => (
  <div>
    <div className="text-2xl font-bold tracking-tight">OPTISHOP</div>
    <div className="text-xs text-gray-700 leading-tight mt-1">
      Magasin d'Optique<br />
      123 Rue de la Vue, Alger<br />
      Tél: 021 00 00 00 · contact@optishop.dz
    </div>
  </div>
);

const hasPrescription = (ord?: Ordonnance) => {
  if (!ord) return false;
  return [
    ord.odSphere, ord.odCylindre, ord.odAxe, ord.odAddition, ord.odPrisme, ord.odBase,
    ord.ogSphere, ord.ogCylindre, ord.ogAxe, ord.ogAddition, ord.ogPrisme, ord.ogBase,
  ].some((v) => v !== undefined && v !== null && v !== "");
};

const PrescriptionTable = ({ ord }: { ord?: Ordonnance }) => (
  <table className="w-full border-collapse text-[11px] mb-4">
    <thead>
      <tr className="bg-gray-100">
        <th className="border border-black px-1 py-1 w-12"></th>
        {["Sph","Cyl","Axe","Add","Prisme","Base"].map((h) => <th key={"od"+h} className="border border-black px-1 py-1">{h}</th>)}
        <th className="border border-black px-1 py-1 w-12"></th>
        {["Sph","Cyl","Axe","Add","Prisme","Base"].map((h) => <th key={"og"+h} className="border border-black px-1 py-1">{h}</th>)}
      </tr>
    </thead>
    <tbody className="text-center">
      <tr>
        <td className="border border-black px-1 py-1 font-semibold bg-gray-50">OD<br/>Loin</td>
        <td className="border border-black px-1 py-1">{fmt(ord?.odSphere)}</td>
        <td className="border border-black px-1 py-1">{fmt(ord?.odCylindre)}</td>
        <td className="border border-black px-1 py-1">{ord?.odAxe ?? ""}{ord?.odAxe !== undefined ? "°" : ""}</td>
        <td className="border border-black px-1 py-1">{fmt(ord?.odAddition)}</td>
        <td className="border border-black px-1 py-1">{fmt(ord?.odPrisme)}</td>
        <td className="border border-black px-1 py-1">{ord?.odBase ?? ""}</td>
        <td className="border border-black px-1 py-1 font-semibold bg-gray-50">OG<br/>Loin</td>
        <td className="border border-black px-1 py-1">{fmt(ord?.ogSphere)}</td>
        <td className="border border-black px-1 py-1">{fmt(ord?.ogCylindre)}</td>
        <td className="border border-black px-1 py-1">{ord?.ogAxe ?? ""}{ord?.ogAxe !== undefined ? "°" : ""}</td>
        <td className="border border-black px-1 py-1">{fmt(ord?.ogAddition)}</td>
        <td className="border border-black px-1 py-1">{fmt(ord?.ogPrisme)}</td>
        <td className="border border-black px-1 py-1">{ord?.ogBase ?? ""}</td>
      </tr>
      <tr>
        <td className="border border-black px-1 py-1 font-semibold bg-gray-50">Interm</td>
        <td className="border border-black px-1 py-1" colSpan={6}></td>
        <td className="border border-black px-1 py-1 font-semibold bg-gray-50">Interm</td>
        <td className="border border-black px-1 py-1" colSpan={6}></td>
      </tr>
      <tr>
        <td className="border border-black px-1 py-1 font-semibold bg-gray-50">Près</td>
        <td className="border border-black px-1 py-1" colSpan={6}></td>
        <td className="border border-black px-1 py-1 font-semibold bg-gray-50">Près</td>
        <td className="border border-black px-1 py-1" colSpan={6}></td>
      </tr>
    </tbody>
  </table>
);

const ItemsTable = ({ cmd, padRows = 0 }: { cmd: Commande; padRows?: number }) => (
  <table className="w-full border-collapse text-[12px] mb-4">
    <thead>
      <tr className="bg-gray-100">
        <th className="border border-black px-2 py-1.5 text-left">Désignation</th>
        <th className="border border-black px-2 py-1.5 w-16 text-center">Qté</th>
        <th className="border border-black px-2 py-1.5 w-28 text-right">P.U.</th>
        <th className="border border-black px-2 py-1.5 w-32 text-right">Prix</th>
      </tr>
    </thead>
    <tbody>
      {cmd.lignes.map((l) => (
        <tr key={l.id}>
          <td className="border border-black px-2 py-1.5">{l.designation}</td>
          <td className="border border-black px-2 py-1.5 text-center">{l.quantite}</td>
          <td className="border border-black px-2 py-1.5 text-right">{fmtPrice(l.prixUnitaire)}</td>
          <td className="border border-black px-2 py-1.5 text-right">{fmtPrice(l.quantite * l.prixUnitaire)}</td>
        </tr>
      ))}
      {Array.from({ length: Math.max(0, padRows - cmd.lignes.length) }).map((_, i) => (
        <tr key={`e${i}`}>
          <td className="border border-black px-2 py-1.5">&nbsp;</td>
          <td className="border border-black px-2 py-1.5"></td>
          <td className="border border-black px-2 py-1.5"></td>
          <td className="border border-black px-2 py-1.5"></td>
        </tr>
      ))}
      <tr>
        <td colSpan={3} className="border border-black px-2 py-1.5 text-right font-semibold">TOTAL</td>
        <td className="border border-black px-2 py-1.5 text-right font-bold">{fmtPrice(cmd.montantTotal)} DZD</td>
      </tr>
    </tbody>
  </table>
);

export function BonClassique({ cmd, client, ord }: Props) {
  return (
    <div className="font-sans text-[13px] text-black">
      <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
        <Header />
        <div className="text-center">
          <Barcode value={String(cmd.numero)} height={40} width={1.5} fontSize={12} margin={0} displayValue={false} />
          <div className="font-mono text-sm mt-1">· {cmd.numero} ·</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold">Reçu</div>
          <div className="text-xs text-gray-600 mt-1">N° {cmd.numero}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-4 text-[12px]">
        <div>
          <div><span className="font-semibold">Prescripteur :</span> {ord?.nomMedecin || ""}</div>
          <div><span className="font-semibold">Client :</span> {client ? `${client.prenom} ${client.nom}` : ""}</div>
          <div><span className="font-semibold">Tél :</span> {client?.telephone || ""}</div>
        </div>
        <div className="text-right">
          <div><span className="font-semibold">Date :</span> {formatDateTime(cmd.createdAt)}</div>
          <div><span className="font-semibold">Livraison prévue :</span> {formatDate(cmd.dateLivraisonPrevue)}</div>
        </div>
      </div>
      {hasPrescription(ord) && <PrescriptionTable ord={ord} />}
      <ItemsTable cmd={cmd} />
      {cmd.notes && <div className="text-[11px] mb-4"><span className="font-semibold">Notes : </span>{cmd.notes}</div>}
      <div className="grid grid-cols-2 gap-6 mt-12 text-[11px]">
        <div><div className="border-t border-black pt-1">Signature client</div></div>
        <div className="text-right"><div className="border-t border-black pt-1">Cachet & signature</div></div>
      </div>
      <div className="text-center text-[10px] text-gray-500 mt-8 border-t pt-2">Merci de votre confiance · OptiShop</div>
    </div>
  );
}

export function BonCompact({ cmd, client }: Props) {
  return (
    <div className="font-sans text-[12px] text-black">
      <div className="flex justify-between items-center mb-3 border-b border-black pb-2">
        <div className="font-bold text-lg">OPTISHOP</div>
        <div className="text-right">
          <div className="font-semibold">N° {cmd.numero}</div>
          <div className="text-[10px]">{formatDateTime(cmd.createdAt)}</div>
        </div>
      </div>
      <div className="mb-3 text-[11px]">
        <span className="font-semibold">Client :</span> {client ? `${client.prenom} ${client.nom}` : ""}
        {client?.telephone && <span> · {client.telephone}</span>}
      </div>
      <ItemsTable cmd={cmd} padRows={1} />
      {cmd.notes && <div className="text-[10px]">{cmd.notes}</div>}
      <div className="text-center text-[10px] text-gray-500 mt-6">Merci · OptiShop</div>
    </div>
  );
}

export function BonModerne({ cmd, client, ord }: Props) {
  return (
    <div className="font-sans text-[13px] text-black">
      <div className="flex justify-between items-center mb-6 -mx-10 -mt-10 px-10 py-6 print:mx-0 print:mt-0 print:px-6 print:py-4" style={{ background: "linear-gradient(135deg,#0369a1,#0ea5e9)", color: "white" }}>
        <div>
          <div className="text-3xl font-bold tracking-wide">OPTISHOP</div>
          <div className="text-xs opacity-90 mt-1">Magasin d'Optique · Alger</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-light">Bon N° {cmd.numero}</div>
          <div className="text-xs opacity-90">{formatDateTime(cmd.createdAt)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg bg-gray-50 p-3 text-[12px]">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Client</div>
          <div className="font-semibold">{client ? `${client.prenom} ${client.nom}` : ""}</div>
          <div className="text-gray-600">{client?.telephone}</div>
          <div className="text-gray-600">{client?.email}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-[12px]">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Détails</div>
          <div><span className="text-gray-500">Prescripteur :</span> {ord?.nomMedecin || "—"}</div>
          <div><span className="text-gray-500">Livraison :</span> {formatDate(cmd.dateLivraisonPrevue)}</div>
        </div>
      </div>
      {hasPrescription(ord) && <PrescriptionTable ord={ord} />}
      <ItemsTable cmd={cmd} padRows={1} />
      {cmd.notes && <div className="text-[11px] mb-4 italic text-gray-700">{cmd.notes}</div>}
      <div className="text-center text-[10px] text-gray-500 mt-6 pt-3 border-t">Merci de votre confiance · OptiShop</div>
    </div>
  );
}
