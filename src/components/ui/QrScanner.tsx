import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, RefreshCw } from 'lucide-react';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
}

export function QrScanner({ onScanSuccess, onScanFailure }: QrScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    if (!scannerRef.current) return;

    // Create instance optimized for high-density QR codes like Aadhaar
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10,
        // Removing qrbox completely lets it scan the full video frame, which helps immensely with dense/large QR codes.
        rememberLastUsedCamera: true,
        supportedScanTypes: [0], // 0 is Camera
        videoConstraints: {
          facingMode: "environment",
          width: { min: 1280, ideal: 1920, max: 2560 }, // Request higher resolution
          height: { min: 720, ideal: 1080, max: 1440 },
        }
      },
      /* verbose= */ false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        setIsScanning(false);
        html5QrcodeScanner.clear();
        onScanSuccess(decodedText);
      },
      (error) => {
        if (onScanFailure) {
          onScanFailure(error);
        }
      }
    );

    // Cleanup on unmount
    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [onScanSuccess, onScanFailure]);

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-[#000000] border border-white/10 relative">
      <div id="qr-reader" ref={scannerRef} className="w-full h-full text-white [&_video]:w-full [&_video]:h-auto [&_video]:object-cover" />
      
      {!isScanning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 backdrop-blur-sm">
          <div className="text-emerald-400 mb-2">
            <Camera size={48} className="mx-auto opacity-50" />
          </div>
          <p className="text-sm text-white/70">Scan Complete</p>
        </div>
      )}
    </div>
  );
}
