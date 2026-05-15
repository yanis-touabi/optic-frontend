import Barcode from 'react-barcode';
import type { Client, Ordonnance } from '@/lib/types';
import { formatDate } from '@/lib/format';

const fmt = (n?: number, d = 2) =>
  n === undefined || n === null || Number.isNaN(n) ? '' : n.toFixed(d);

interface Props {
  ord: Ordonnance;
  client?: Client;
  store?: any;
}

const Header = ({ store }: { store?: any }) => {
  const getLogoUrl = () => {
    if (!store?.logoUrl) return null;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');
    return `${base}/${store.logoUrl}`;
  };

  return (
    <div className="flex items-start gap-4">
      {getLogoUrl() && (
        <img src={getLogoUrl()!} alt="Logo" className="h-12 w-12 object-contain" />
      )}
      <div>
        <div className="text-2xl font-bold tracking-tight uppercase">
          {store?.name || 'OPTISHOP'}
        </div>
        <div className="text-[10px] text-gray-700 leading-tight mt-1 whitespace-pre-line">
          Magasin d'Optique
          {store?.address && <><br />{store.address}</>}
          {store?.telephone && <><br />Tél: {store.telephone}</>}
        </div>
      </div>
    </div>
  );
};

const ClientInfo = ({ client, ord }: Props) => (
  <div className="grid grid-cols-2 gap-6 mb-4 text-[12px]">
    <div>
      <div>
        <span className="font-semibold">Client :</span>{' '}
        {client ? `${client.prenom} ${client.nom}` : ''}
      </div>
      <div>
        <span className="font-semibold">Tél :</span> {client?.telephone || ''}
      </div>
      {client?.dateNaissance && (
        <div>
          <span className="font-semibold">Né(e) le :</span>{' '}
          {formatDate(client.dateNaissance)}
        </div>
      )}
    </div>
    <div className="text-right">
      <div>
        <span className="font-semibold">Médecin :</span> {ord.nomMedecin || ''}
      </div>
      <div>
        <span className="font-semibold">Prescription :</span>{' '}
        {formatDate(ord.datePrescription)}
      </div>
      <div>
        <span className="font-semibold">Expiration :</span>{' '}
        {formatDate(ord.dateExpiration)}
      </div>
    </div>
  </div>
);

const RowOD = ({
  ord,
  label,
  vals,
}: {
  ord: Ordonnance;
  label: string;
  vals: {
    sph?: number;
    cyl?: number;
    axe?: number;
    add?: number;
    prisme?: number;
    base?: string;
  };
}) => (
  <tr>
    <td className="border border-black px-1 py-1 font-semibold bg-gray-50">
      {label}
    </td>
    <td className="border border-black px-1 py-1">{fmt(vals.sph)}</td>
    <td className="border border-black px-1 py-1">{fmt(vals.cyl)}</td>
    <td className="border border-black px-1 py-1">
      {vals.axe ?? ''}
      {vals.axe !== undefined ? '°' : ''}
    </td>
    <td className="border border-black px-1 py-1">{fmt(vals.add)}</td>
    <td className="border border-black px-1 py-1">{fmt(vals.prisme)}</td>
    <td className="border border-black px-1 py-1">{vals.base ?? ''}</td>
  </tr>
);

export function OrdonnanceClassique({ ord, client, store }: Props) {
  return (
    <div className="font-sans text-[13px] text-black">
      <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
        <Header store={store} />
        <div className="text-right">
          <div className="text-xl font-semibold">Ordonnance</div>
          <Barcode
            value={ord.id.slice(0, 10)}
            height={36}
            width={1.4}
            fontSize={10}
            margin={0}
            displayValue={false}
          />
        </div>
      </div>
      <ClientInfo ord={ord} client={client} />
      <table className="w-full border-collapse text-[11px] mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-1 py-1 w-16">Œil</th>
            {['Sph', 'Cyl', 'Axe', 'Add', 'Prisme', 'Base'].map((h) => (
              <th key={h} className="border border-black px-1 py-1">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-center">
          <RowOD
            ord={ord}
            label="OD"
            vals={{
              sph: ord.odSphere,
              cyl: ord.odCylindre,
              axe: ord.odAxe,
              add: ord.odAddition,
              prisme: ord.odPrisme,
              base: ord.odBase,
            }}
          />
          <RowOD
            ord={ord}
            label="OG"
            vals={{
              sph: ord.ogSphere,
              cyl: ord.ogCylindre,
              axe: ord.ogAxe,
              add: ord.ogAddition,
              prisme: ord.ogPrisme,
              base: ord.ogBase,
            }}
          />
        </tbody>
      </table>
      <div className="grid grid-cols-2 gap-6 text-[12px] mb-4">
        <div className="flex gap-3">
          <span>
            <span className="font-semibold">Écart OD :</span>{' '}
            {fmt(ord.ecartOd, 1)}
          </span>
          <span>
            <span className="font-semibold">Hauteur :</span>{' '}
            {fmt(ord.hauteurOd, 1)}
          </span>
        </div>
        <div className="flex gap-3 justify-end">
          <span>
            <span className="font-semibold">Écart OG :</span>{' '}
            {fmt(ord.ecartOg, 1)}
          </span>
          <span>
            <span className="font-semibold">Hauteur :</span>{' '}
            {fmt(ord.hauteurOg, 1)}
          </span>
        </div>
      </div>
      {ord.distancePupillaire !== undefined && (
        <div className="text-[12px] mb-2">
          <span className="font-semibold">Distance pupillaire :</span>{' '}
          {ord.distancePupillaire} mm
        </div>
      )}
      {ord.notes && (
        <div className="text-[11px] mb-4">
          <span className="font-semibold">Notes : </span>
          {ord.notes}
        </div>
      )}
      <div className="grid grid-cols-2 gap-6 mt-16 text-[11px]">
        <div></div>
        <div className="text-right">
          <div className="border-t border-black pt-1">Signature & cachet</div>
        </div>
      </div>
    </div>
  );
}

export function OrdonnanceCompact({ ord, client, store }: Props) {
  return (
    <div className="font-sans text-[12px] text-black">
      <div className="flex justify-between items-center mb-3 border-b border-black pb-2">
        <div className="font-bold text-lg">{store?.name?.toUpperCase() || 'OPTISHOP'} — Ordonnance</div>
        <div className="text-right text-[10px]">
          {formatDate(ord.datePrescription)}
        </div>
      </div>
      <div className="mb-3 text-[11px]">
        <span className="font-semibold">
          {client ? `${client.prenom} ${client.nom}` : ''}
        </span>
        {client?.telephone && <span> · {client.telephone}</span>}
        {ord.nomMedecin && <span> · Dr {ord.nomMedecin}</span>}
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-1 py-1 w-12"></th>
            {['Sph', 'Cyl', 'Axe', 'Add'].map((h) => (
              <th key={h} className="border border-black px-1 py-1">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-center">
          <tr>
            <td className="border border-black px-1 py-1 font-semibold">OD</td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.odSphere)}
            </td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.odCylindre)}
            </td>
            <td className="border border-black px-1 py-1">{ord.odAxe ?? ''}</td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.odAddition)}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-1 font-semibold">OG</td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.ogSphere)}
            </td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.ogCylindre)}
            </td>
            <td className="border border-black px-1 py-1">{ord.ogAxe ?? ''}</td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.ogAddition)}
            </td>
          </tr>
        </tbody>
      </table>
      {ord.notes && <div className="text-[10px] mt-3">{ord.notes}</div>}
    </div>
  );
}

export function OrdonnanceDetaille({ ord, client, store }: Props) {
  return (
    <div className="font-sans text-[13px] text-black">
      <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
        <Header store={store} />
        <div className="text-right">
          <div className="text-xl font-semibold">Ordonnance détaillée</div>
          <div className="text-xs text-gray-600 mt-1">
            {formatDate(ord.datePrescription)}
          </div>
        </div>
      </div>
      <ClientInfo ord={ord} client={client} />
      <table className="w-full border-collapse text-[11px] mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-1 py-1 w-12"></th>
            {['Sph', 'Cyl', 'Axe', 'Add', 'Prisme', 'Base'].map((h) => (
              <th key={'od' + h} className="border border-black px-1 py-1">
                {h}
              </th>
            ))}
            <th className="border border-black px-1 py-1 w-12"></th>
            {['Sph', 'Cyl', 'Axe', 'Add', 'Prisme', 'Base'].map((h) => (
              <th key={'og' + h} className="border border-black px-1 py-1">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-center">
          <tr>
            <td className="border border-black px-1 py-1 font-semibold bg-gray-50">
              OD
              <br />
              Loin
            </td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.odSphere)}
            </td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.odCylindre)}
            </td>
            <td className="border border-black px-1 py-1">{ord.odAxe ?? ''}</td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.odAddition)}
            </td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.odPrisme)}
            </td>
            <td className="border border-black px-1 py-1">
              {ord.odBase ?? ''}
            </td>
            <td className="border border-black px-1 py-1 font-semibold bg-gray-50">
              OG
              <br />
              Loin
            </td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.ogSphere)}
            </td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.ogCylindre)}
            </td>
            <td className="border border-black px-1 py-1">{ord.ogAxe ?? ''}</td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.ogAddition)}
            </td>
            <td className="border border-black px-1 py-1">
              {fmt(ord.ogPrisme)}
            </td>
            <td className="border border-black px-1 py-1">
              {ord.ogBase ?? ''}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-1 font-semibold bg-gray-50">
              Interm
            </td>
            <td className="border border-black px-1 py-1" colSpan={6}></td>
            <td className="border border-black px-1 py-1 font-semibold bg-gray-50">
              Interm
            </td>
            <td className="border border-black px-1 py-1" colSpan={6}></td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-1 font-semibold bg-gray-50">
              Près
            </td>
            <td className="border border-black px-1 py-1" colSpan={6}></td>
            <td className="border border-black px-1 py-1 font-semibold bg-gray-50">
              Près
            </td>
            <td className="border border-black px-1 py-1" colSpan={6}></td>
          </tr>
        </tbody>
      </table>
      <div className="grid grid-cols-2 gap-6 text-[12px] mb-4">
        <div className="flex gap-4">
          <span>
            <span className="font-semibold">Écart</span>{' '}
            <span className="border border-black px-3 py-0.5 ml-1 inline-block min-w-[40px]">
              {fmt(ord.ecartOd, 1)}
            </span>
          </span>
          <span>
            <span className="font-semibold">Hauteur</span>{' '}
            <span className="border border-black px-3 py-0.5 ml-1 inline-block min-w-[40px]">
              {fmt(ord.hauteurOd, 1)}
            </span>
          </span>
        </div>
        <div className="flex gap-4 justify-end">
          <span>
            <span className="font-semibold">Écart</span>{' '}
            <span className="border border-black px-3 py-0.5 ml-1 inline-block min-w-[40px]">
              {fmt(ord.ecartOg, 1)}
            </span>
          </span>
          <span>
            <span className="font-semibold">Hauteur</span>{' '}
            <span className="border border-black px-3 py-0.5 ml-1 inline-block min-w-[40px]">
              {fmt(ord.hauteurOg, 1)}
            </span>
          </span>
        </div>
      </div>
      {ord.notes && (
        <div className="text-[11px] mb-4">
          <span className="font-semibold">Notes : </span>
          {ord.notes}
        </div>
      )}
      <div className="grid grid-cols-2 gap-6 mt-12 text-[11px]">
        <div></div>
        <div className="text-right">
          <div className="border-t border-black pt-1">Signature & cachet</div>
        </div>
      </div>
    </div>
  );
}
