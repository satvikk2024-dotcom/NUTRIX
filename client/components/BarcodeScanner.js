// /components/BarcodeScanner.js
import React, { useState } from 'react';
import { useZxing } from 'react-zxing';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { X, Zap, ZapOff, Keyboard } from 'lucide-react';

// Limit to formats found on food packaging — fewer readers per frame means
// faster, more frequent decode attempts, which helps catch a sharp frame
// while the camera is still focusing.
const SCAN_HINTS = new Map([
  [DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
  ]],
]);

// Ask for a higher-res feed and (where supported) continuous autofocus,
// which is the usual fix for blurry close-up barcode shots on phones.
const SCAN_CONSTRAINTS = {
  audio: false,
  video: {
    facingMode: 'environment',
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    advanced: [{ focusMode: 'continuous' }],
  },
};

const BarcodeScanner = ({ onResult, onClose }) => {
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [refocusing, setRefocusing] = useState(false);

  const { ref, torch } = useZxing({
    constraints: SCAN_CONSTRAINTS,
    hints: SCAN_HINTS,
    timeBetweenDecodingAttempts: 100,
    onDecodeResult(result) {
      // Once a barcode is found, send it to the parent page
      onResult(result.getText());
    },
    onError(err) {
      const name = err && err.name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setError('Could not access the camera — it may be in use by another app.');
      } else if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
        setError("Couldn't start the camera with the required settings.");
      } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access needs a secure connection (HTTPS) or localhost. Use manual entry below instead.');
      } else {
        setError('Unable to start the camera. You can enter the barcode manually below.');
      }
    },
  });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (code) onResult(code);
  };

  // Nudge the camera to refocus — helps when the autofocus locks onto the
  // background instead of a close-up barcode.
  const handleTapToFocus = async () => {
    const stream = ref.current?.srcObject;
    const track = stream?.getVideoTracks?.()[0];
    if (!track) return;
    setRefocusing(true);
    try {
      await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
    } catch {
      try {
        await track.applyConstraints({ advanced: [{ focusMode: 'single-shot' }] });
      } catch {
        // Focus control unsupported on this device/browser — ignore.
      }
    }
    setTimeout(() => setRefocusing(false), 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 text-white">
        <h2 className="text-xl font-bold">Scan Barcode</h2>
        <div className="flex items-center gap-2">
          {torch.isAvailable && (
            <button
              onClick={() => (torch.isOn ? torch.off() : torch.on())}
              className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"
              title={torch.isOn ? 'Turn off flashlight' : 'Turn on flashlight'}
            >
              {torch.isOn ? <ZapOff size={24} /> : <Zap size={24} />}
            </button>
          )}
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Camera Viewport */}
      <div
        onClick={handleTapToFocus}
        className={`relative w-full max-w-md aspect-[3/4] bg-black rounded-2xl overflow-hidden border-2 shadow-2xl transition-colors cursor-pointer ${refocusing ? 'border-white' : 'border-gray-700'
          }`}
      >
        <video ref={ref} className="w-full h-full object-cover" muted playsInline autoPlay />

        {/* Scanning Line Animation */}
        <div className="absolute inset-0 border-2 border-blue-500/50 m-8 rounded-lg pointer-events-none flex items-center justify-center">
          <div className="w-full h-0.5 bg-blue-500 animate-pulse"></div>
        </div>

        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
            <p className="text-red-400 text-center text-sm font-medium">{error}</p>
          </div>
        )}
      </div>

      <p className="mt-6 text-gray-400 text-center text-sm">
        Point your camera at a food barcode.<br />
        Hold ~10–15cm away. If it looks blurry, tap the frame to refocus.
      </p>

      {/* Manual Entry Fallback */}
      <div className="mt-4 w-full max-w-md">
        <button
          onClick={() => setShowManual((s) => !s)}
          className="mx-auto flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white transition"
        >
          <Keyboard size={16} /> Enter barcode manually
        </button>

        {showManual && (
          <form onSubmit={handleManualSubmit} className="mt-3 flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. 7622300336738"
              className="flex-1 h-12 px-4 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-5 h-12 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition"
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
