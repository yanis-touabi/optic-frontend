import React from 'react';
import { Button } from '@/components/ui/button';
import { useScanner } from '@/contexts/ScannerProvider';

export default function ScannerButton({ onOpen }: { onOpen: () => void }) {
  const scanner = useScanner();
  return (
    <Button variant="outline" onClick={onOpen}>
      📱 Scan with phone
    </Button>
  );
}
