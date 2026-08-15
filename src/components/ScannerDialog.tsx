import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useScanner } from '@/contexts/ScannerProvider';
import { resolveFrontendBaseUrl } from '@/api/apiClient';
import QRCode from 'qrcode';

export default function ScannerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const scanner = useScanner();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (open && scanner.pairingToken) {
      const base = resolveFrontendBaseUrl();
      const url = `${base}/scan/${scanner.pairingToken}`;
      QRCode.toDataURL(url)
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    }
  }, [open, scanner.pairingToken]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan with your phone</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {scanner.pairingToken && qrDataUrl ? (
            <img src={qrDataUrl} alt="scan qr" />
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              {scanner.pairingToken
                ? 'Generating QR code...'
                : 'Creating scan session...'}
            </div>
          )}
          <div className="mt-3">
            Status:{' '}
            {scanner.phoneConnected
              ? 'Scanner connected ✓'
              : 'Waiting for phone'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
