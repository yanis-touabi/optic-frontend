import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function MobileScanner() {
  const { token } = useParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mobileToken, setMobileToken] = useState<string | null>(null);
  const [barcode, setBarcode] = useState('');
  const [status, setStatus] = useState('Initializing');
  const [lastResult, setLastResult] = useState<any | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastSentRef = useRef<Record<string, number>>({});
  const audioContextRef = useRef<AudioContext | null>(null);

  const playScanSound = () => {
    try {
      const AudioCtor =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return;

      const audioContext = audioContextRef.current ?? new AudioCtor();
      audioContextRef.current = audioContext;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.0001;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const now = audioContext.currentTime;
      gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      oscillator.start(now);
      oscillator.stop(now + 0.18);
    } catch (e) {
      console.warn('Scan sound not available', e);
    }
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await apiClient.get(`/scan-sessions/verify/${token}`);
        setSessionId(res.data.id);
        setStatus('Ready to pair');
      } catch (e) {
        setStatus('Invalid or expired token');
      }
    })();
  }, [token]);

  const exchange = async () => {
    if (!token) return;
    const { data } = await apiClient.post('/scan-sessions/exchange', {
      pairingToken: token,
    });
    setMobileToken(data.mobileToken);
    setSessionId(data.sessionId);
    setStatus('Paired — starting camera...');
  };

  const startCamera = async (mToken: string, sid: string) => {
    if (!videoRef.current) {
      setStatus('Camera element not ready yet');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('This browser does not support camera access');
      return;
    }

    try {
      const codeReader = new BrowserMultiFormatReader();
      readerRef.current = codeReader;
      setStatus('Requesting camera permission...');

      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      await codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result, err) => {
          if (result) {
            const text = result.getText();
            const now = Date.now();
            const cooldown = Number(
              import.meta.env.VITE_SCAN_DEBOUNCE_SECONDS ?? 2,
            );
            const last = lastSentRef.current[text] ?? 0;
            if (now - last < cooldown * 1000) return;
            lastSentRef.current[text] = now;
            try {
              setStatus(`Scanned ${text} — sending...`);
              playScanSound();
              const res = await apiClient.post(
                `/scan-sessions/${sid}/scans`,
                { barcode: text },
                { headers: { Authorization: `Bearer ${mToken}` } },
              );
              setLastResult(res.data);
              setStatus(
                res.data.found
                  ? 'Product found — ready'
                  : 'Product not found — ready',
              );
            } catch (e: any) {
              setStatus(e.message ?? 'Error sending scan');
            }
          }
        },
      );
    } catch (e: any) {
      console.error('Camera access failed', e);
      setStatus(
        'Camera not available or permission denied. On mobile, allow camera access and use the same Wi‑Fi network.',
      );
    }
  };

  useEffect(() => {
    if (!mobileToken || !sessionId) return;

    const start = async () => {
      await new Promise((resolve) =>
        requestAnimationFrame(() => resolve(undefined)),
      );
      if (!videoRef.current) {
        setStatus('Camera element not ready yet');
        return;
      }
      await startCamera(mobileToken, sessionId);
    };

    start();
  }, [mobileToken, sessionId]);

  useEffect(() => {
    return () => {
      try {
        readerRef.current?.reset();
      } catch (e) {}
    };
  }, []);

  const submitBarcode = async () => {
    if (!sessionId || !mobileToken) return;
    try {
      playScanSound();
      const res = await apiClient.post(
        `/scan-sessions/${sessionId}/scans`,
        { barcode },
        { headers: { Authorization: `Bearer ${mobileToken}` } },
      );
      setStatus(
        res.data.found ? 'Product found — ready' : 'Product not found — ready',
      );
      setBarcode('');
    } catch (e: any) {
      setStatus(e.message ?? 'Error');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold">Mobile Scanner</h2>
      <p>Status: {status}</p>
      {!mobileToken && sessionId && (
        <button className="btn" onClick={exchange}>
          Pair with session
        </button>
      )}
      {mobileToken && (
        <div className="mt-4">
          <video ref={videoRef} className="w-full h-auto bg-black" />
          <div className="mt-2">
            Last:{' '}
            {lastResult?.found
              ? JSON.stringify(lastResult.product?.nom)
              : lastResult?.found === false
                ? 'Not found'
                : '—'}
          </div>
        </div>
      )}
      <div className="mt-4">
        <label>Manual barcode fallback</label>
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="w-full border p-2"
        />
        <button onClick={submitBarcode} className="mt-2 btn">
          Send
        </button>
      </div>
    </div>
  );
}
