import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient, resolveApiBaseUrl } from '@/api/apiClient';

type ScanMode = 'ORDER' | 'PRODUCT' | 'NONE';

interface ScannerCtx {
  connectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
  scanSessionId?: string | null;
  pairingToken?: string | null;
  phoneConnected: boolean;
  scanMode: ScanMode;
  lastScannedBarcode?: string | null;
  lastScannedProduct?: any | null;
  startScanSession: () => Promise<{ id: string; pairingToken: string }>;
  stopScanSession: () => Promise<void>;
  setScanMode: (m: ScanMode) => void;
  clearLastScannedState: () => void;
}

const Ctx = createContext<ScannerCtx | null>(null);

export const useScanner = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useScanner must be used within ScannerProvider');
  return ctx;
};

export const ScannerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'
  >('DISCONNECTED');
  const [scanSessionId, setScanSessionId] = useState<string | null>(null);
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('NONE');
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(
    null,
  );
  const [lastScannedProduct, setLastScannedProduct] = useState<any | null>(
    null,
  );
  // Client-side debounce map: sessionId -> { barcode: lastTs }
  const lastProcessedRef = React.useRef<Record<string, Record<string, number>>>(
    {},
  );

  useEffect(() => {
    // create socket when provider mounts if access token available
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setConnectionStatus('CONNECTING');
    const s = io(resolveApiBaseUrl().replace('/api', ''), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket'],
    });
    s.on('connect', () => {
      setConnectionStatus('CONNECTED');
    });
    s.on('disconnect', () => setConnectionStatus('DISCONNECTED'));
    s.on('scanner.connected', (p: any) => setPhoneConnected(true));
    s.on('scanner.disconnected', (p: any) => setPhoneConnected(false));
    s.on('scanner.product_found', (p: any) => {
      // client-side debounce to avoid rapid duplicates
      const session = p.sessionId as string;
      const barcode = p.barcode as string;
      const cooldown = Number(import.meta.env.VITE_SCAN_DEBOUNCE_SECONDS ?? 2);
      const now = Date.now();
      if (!lastProcessedRef.current[session])
        lastProcessedRef.current[session] = {};
      const last = lastProcessedRef.current[session][barcode] ?? 0;
      if (now - last < cooldown * 1000) return;
      lastProcessedRef.current[session][barcode] = now;
      setLastScannedBarcode(barcode);
      setLastScannedProduct(p.product);
    });
    s.on('scanner.product_not_found', (p: any) => {
      const session = p.sessionId as string;
      const barcode = p.barcode as string;
      const cooldown = Number(import.meta.env.VITE_SCAN_DEBOUNCE_SECONDS ?? 2);
      const now = Date.now();
      if (!lastProcessedRef.current[session])
        lastProcessedRef.current[session] = {};
      const last = lastProcessedRef.current[session][barcode] ?? 0;
      if (now - last < cooldown * 1000) return;
      lastProcessedRef.current[session][barcode] = now;
      setLastScannedBarcode(barcode);
      setLastScannedProduct(null);
    });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, []);

  const clearLastScannedState = useCallback(() => {
    setLastScannedBarcode(null);
    setLastScannedProduct(null);
  }, []);

  const setScanModeSafe = useCallback((m: ScanMode) => {
    setScanMode(m);
    if (m === 'NONE') clearLastScannedState();
  }, [clearLastScannedState]);

  const startScanSession = useCallback(async () => {
    if (scanSessionId && pairingToken) {
      return { id: scanSessionId, pairingToken };
    }

    setPhoneConnected(false);
    clearLastScannedState();
    const { data } = await apiClient.post('/scan-sessions');
    setScanSessionId(data.id);
    setPairingToken(data.pairingToken);
    if (socket && data.id) {
      socket.emit('scanner.join', { sessionId: data.id });
    }
    return { id: data.id, pairingToken: data.pairingToken };
  }, [clearLastScannedState, pairingToken, scanSessionId, socket]);

  const stopScanSession = useCallback(async () => {
    if (!scanSessionId) return;
    try {
      await apiClient.delete(`/scan-sessions/${scanSessionId}`);
    } finally {
      if (socket) socket.emit('scanner.leave', { sessionId: scanSessionId });
      setScanSessionId(null);
      setPairingToken(null);
      setPhoneConnected(false);
      setScanMode('NONE');
      clearLastScannedState();
    }
  }, [clearLastScannedState, scanSessionId, socket]);

  const value = useMemo(
    () => ({
      connectionStatus,
      scanSessionId,
      pairingToken,
      phoneConnected,
      scanMode,
      lastScannedBarcode,
      lastScannedProduct,
      startScanSession,
      stopScanSession,
      setScanMode: setScanModeSafe,
      clearLastScannedState,
    }),
    [
      connectionStatus,
      scanSessionId,
      pairingToken,
      phoneConnected,
      scanMode,
      lastScannedBarcode,
      lastScannedProduct,
      startScanSession,
      stopScanSession,
      setScanModeSafe,
      clearLastScannedState,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
