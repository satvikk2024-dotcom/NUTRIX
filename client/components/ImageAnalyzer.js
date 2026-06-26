import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, SwitchCamera } from 'lucide-react';

export default function ImageAnalyzer({ onResult, onClose }) {
  const [mode, setMode] = useState('choose');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not access camera. Try uploading an image instead.');
      }
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleCameraMode = () => {
    setMode('camera');
    startCamera();
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1];
    setPreview(dataUrl);
    stopCamera();
    sendImage(base64, 'image/jpeg');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(',')[1];
      const mediaType = file.type || 'image/jpeg';
      setPreview(dataUrl);
      setMode('preview');
      sendImage(base64, mediaType);
    };
    reader.readAsDataURL(file);
  };

  const sendImage = async (base64, mediaType) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5055/api/v1/food/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Analysis failed');
      onResult(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze image. Is Ollama running?');
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    setPreview(null);
    setError('');
    setMode('choose');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <h2 className="text-white font-bold text-lg">Analyze Food</h2>
        <button onClick={() => { stopCamera(); onClose(); }} className="text-white/70 hover:text-white p-2">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Choose Mode */}
        {mode === 'choose' && (
          <div className="space-y-4 w-full max-w-sm">
            <p className="text-white/60 text-center text-sm mb-6">
              Take a photo or upload an image of food to get nutrition info
            </p>
            <button
              onClick={handleCameraMode}
              className="w-full flex items-center gap-4 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition"
            >
              <Camera size={24} />
              <div className="text-left">
                <p className="font-bold">Take Photo</p>
                <p className="text-sm text-blue-200">Use your camera to capture food</p>
              </div>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-4 p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition"
            >
              <Upload size={24} />
              <div className="text-left">
                <p className="font-bold">Upload Image</p>
                <p className="text-sm text-slate-400">Choose from your gallery</p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* Camera View */}
        {mode === 'camera' && !preview && (
          <div className="w-full max-w-lg relative">
            {cameraError ? (
              <div className="bg-red-900/40 border border-red-700 rounded-2xl p-6 text-center">
                <p className="text-red-300 text-sm mb-4">{cameraError}</p>
                <button onClick={retry} className="text-blue-400 text-sm font-bold">
                  Go back
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-2xl border-2 border-blue-500/30"
                />
                <button
                  onClick={capturePhoto}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-blue-500 shadow-lg active:scale-90 transition-transform"
                >
                  <div className="w-12 h-12 bg-white rounded-full mx-auto" />
                </button>
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Preview / Loading / Error */}
        {preview && (
          <div className="w-full max-w-sm space-y-4">
            <img src={preview} alt="Food preview" className="w-full rounded-2xl shadow-lg" />
            {loading && (
              <div className="flex items-center justify-center gap-3 p-4 bg-blue-900/30 rounded-xl">
                <div className="w-5 h-5 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
                <p className="text-blue-300 text-sm font-medium">Analyzing food with AI...</p>
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-700 rounded-xl">
                <p className="text-red-300 text-sm mb-3">{error}</p>
                <button
                  onClick={retry}
                  className="flex items-center gap-2 text-blue-400 text-sm font-bold"
                >
                  <RefreshCw size={14} /> Try again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
