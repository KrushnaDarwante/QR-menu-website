/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  X,
  AlertCircle,
  CheckCircle2,
  Upload,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import jsQR from 'jsqr';
import { extractTokenFromQrData } from '../../core/token-extractor.ts';
import { Table } from '../../types/index.ts';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (token: string) => void;
  availableTables: Table[];
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  availableTables,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let mediaStream: MediaStream | null = null;
    let animationFrameId: number;
    let isCancelled = false;

    const startCamera = async () => {
      setCameraError(null);
      setIsScanning(true);

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraError('Camera access is not supported by your browser.');
        setIsScanning(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        mediaStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          requestScanFrame();
        }
      } catch (err: any) {
        setHasCamera(false);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Please allow camera access in your browser settings or select a sample table below.'
            : 'Camera could not be started in this environment. Use the sample table buttons or paste a QR link below.'
        );
        setIsScanning(false);
      }
    };

    const requestScanFrame = () => {
      animationFrameId = requestAnimationFrame(scanVideoFrame);
    };

    const scanVideoFrame = () => {
      if (isCancelled) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            const token = extractTokenFromQrData(code.data);
            if (token) {
              handleDetectedToken(token);
              return; // stop scanning loop on success
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(scanVideoFrame);
    };

    startCamera();

    return () => {
      isCancelled = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const handleDetectedToken = (token: string) => {
    setScannedFeedback(`Valid Table Token Found: ${token.slice(0, 16)}...`);
    setTimeout(() => {
      onScanSuccess(token);
      onClose();
    }, 400);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    const token = extractTokenFromQrData(manualInput);
    if (!token) {
      setManualError('No valid table token found in the input. Expected "qrd_tbl_..." or full table URL.');
      return;
    }
    handleDetectedToken(token);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          const token = extractTokenFromQrData(code.data);
          if (token) {
            handleDetectedToken(token);
            return;
          }
        }
        setManualError('No QR code could be decoded from this image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Scanner Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="qr-scanner-title" className="text-base font-bold text-white tracking-tight">
                Scan Table QR Code
              </h2>
              <p className="text-xs text-neutral-400">Point your camera at the tabletop stand</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close scanner dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Video Stream Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {scannedFeedback ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-base font-bold text-white">QR Token Detected!</h3>
              <p className="text-xs text-emerald-300 font-mono">{scannedFeedback}</p>
              <p className="text-xs text-neutral-400">Setting dining context to this table...</p>
            </div>
          ) : hasCamera && !cameraError ? (
            <div className="relative aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Graphic with glowing corners */}
              <div className="absolute inset-8 pointer-events-none">
                {/* 4 Corner Markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-500 rounded-br-lg" />

                {/* Laser scan line */}
                <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#f59e0b] animate-pulse" />
              </div>

              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="text-[11px] font-semibold text-neutral-300 bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm border border-neutral-700/60">
                  Align QR code inside corners
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-white">Camera Offline or Restricted</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Manual Input or Sample Table Quick Select */}
          <div className="space-y-4 pt-1">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800" />
              </div>
              <span className="relative bg-neutral-900 px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Or Select Table Stand to Simulate Scan
              </span>
            </div>

            {/* Quick Demo Table Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {availableTables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleDetectedToken(t.qrToken)}
                  className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-center space-y-1 transition-all group"
                  title={`Simulate scanning Table ${t.tableNumber}`}
                >
                  <QrCode className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 mx-auto transition-colors" />
                  <span className="block text-xs font-mono font-bold text-white">
                    T{t.tableNumber}
                  </span>
                  <span className="block text-[9px] text-neutral-500 uppercase font-mono">
                    {t.status.slice(0, 4)}
                  </span>
                </button>
              ))}
            </div>

            {/* Manual QR Link or Token Paste Input */}
            <form onSubmit={handleManualSubmit} className="space-y-2 pt-2">
              <label htmlFor="qr-token-input" className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                Enter QR URL or Token Manually
              </label>
              <div className="flex gap-2">
                <input
                  id="qr-token-input"
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. https://.../?token=qrd_tbl_... or qrd_tbl_..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-colors"
                >
                  Verify
                </button>
              </div>

              {manualError && (
                <p className="text-[11px] text-rose-400 font-medium">{manualError}</p>
              )}
            </form>

            {/* Upload QR Image file */}
            <div className="pt-2 flex justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="qr-image-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-neutral-400 hover:text-white flex items-center space-x-1.5 transition-colors py-1 px-3 rounded-lg hover:bg-neutral-800"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload QR Image File to Scan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted 128-bit table tokens</span>
          </span>
          <button
            onClick={onClose}
            className="text-neutral-300 hover:text-white font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
