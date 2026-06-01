/**
 * UX CHOICE: Slide-over Drawer (Sheet, right side)
 * Client is a personal, dense record — contact info, date of birth, address,
 * and sensitive medical notes. A drawer keeps the table visible on the left
 * (useful when quickly scanning multiple clients) and gives enough vertical
 * space to render multi-line fields like address and notes without feeling
 * cramped in a modal.
 */
import type { Client } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/format';
import { DetailDrawer } from './DetailDrawer';
import { DetailField } from './DetailField';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Phone, Mail, MapPin, Calendar, FileText, Clock } from 'lucide-react';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ClientSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ClientDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  isLoading?: boolean;
}

export function ClientDetailDrawer({
  open,
  onOpenChange,
  client,
  isLoading = false,
}: ClientDetailDrawerProps) {
  const fullName = client
    ? `${client.prenom} ${client.nom}`.trim()
    : 'Client';

  const memberSince = client
    ? `Membre depuis le ${formatDate(client.createdAt)}`
    : undefined;

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={fullName}
      subtitle={memberSince}
    >
      {isLoading || !client ? (
        <ClientSkeleton />
      ) : (
        <>
          {/* Identity */}
          <div>
            <SectionHeading icon={User} label="Identité" />
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Prénom" value={client.prenom} />
              <DetailField label="Nom" value={client.nom} />
              <div className="col-span-2">
                <DetailField
                  label="Date de naissance"
                  value={
                    client.dateNaissance
                      ? formatDate(client.dateNaissance)
                      : null
                  }
                />
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Contact */}
          <div>
            <SectionHeading icon={Phone} label="Contact" />
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Téléphone" value={client.telephone} />
              <DetailField label="Email" value={client.email} />
            </div>
          </div>

          <div className="border-t" />

          {/* Address */}
          <div>
            <SectionHeading icon={MapPin} label="Adresse" />
            <DetailField
              label="Adresse complète"
              value={client.adresse}
              preWrap
            />
          </div>

          {/* Notes */}
          {client.notes && (
            <>
              <div className="border-t" />
              <div>
                <SectionHeading icon={FileText} label="Notes médicales" />
                <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {client.notes}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="border-t" />

          {/* Meta */}
          <div>
            <SectionHeading icon={Clock} label="Métadonnées" />
            <DetailField
              label="Enregistré le"
              value={formatDateTime(client.createdAt)}
            />
          </div>
        </>
      )}
    </DetailDrawer>
  );
}
