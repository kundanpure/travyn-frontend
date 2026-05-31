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
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-3xl bg-zinc-950 border border-white/10 relative shadow-2xl shadow-emerald-500/10">
      <div 
        id="qr-reader" 
        ref={scannerRef} 
        className="
          w-full h-full text-white 
          [&>div]:!border-none [&>div]:!bg-transparent
          [&_video]:w-full [&_video]:h-auto [&_video]:object-cover [&_video]:rounded-3xl
          [&_button]:px-6 [&_button]:py-2.5 [&_button]:bg-emerald-500 hover:[&_button]:bg-emerald-600 [&_button]:rounded-xl [&_button]:text-white [&_button]:font-semibold [&_button]:my-3 [&_button]:transition-all
          [&_select]:w-[90%] [&_select]:p-3 [&_select]:bg-zinc-900 [&_select]:text-white [&_select]:rounded-xl [&_select]:border [&_select]:border-white/10 [&_select]:my-3 [&_select]:outline-none [&_select]:mx-auto [&_select]:block
          [&_a]:hidden
          [&_span]:!text-zinc-400 [&_span]:text-sm
        " 
      />
      
      {/* Animated Scan Line Overlay */}
      {isScanning && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
           <div className="w-full h-full relative overflow-hidden rounded-3xl">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_20px_5px_rgba(52,211,153,0.6)] animate-[scan_2s_ease-in-out_infinite]" />
           </div>
           {/* Corner brackets */}
           <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-emerald-500 rounded-tl-xl opacity-70" />
           <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-emerald-500 rounded-tr-xl opacity-70" />
           <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-emerald-500 rounded-bl-xl opacity-70" />
           <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-emerald-500 rounded-br-xl opacity-70" />
        </div>
      )}
      
      {!isScanning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-md rounded-3xl transition-all">
          <div className="text-emerald-400 mb-4 animate-bounce">
            <RefreshCw size={48} className="mx-auto" />
          </div>
          <p className="text-lg font-medium text-white tracking-wide">Scan Complete</p>
          <p className="text-sm text-zinc-400 mt-2">Processing your Aadhaar...</p>
        </div>
      )}
    </div>
  );
}
