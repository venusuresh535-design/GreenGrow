import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, Upload, AlertCircle, Sparkles } from 'lucide-react';
import { processAndCompressImage, ProcessedImage } from '../../utils/imageUtils';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (processed: ProcessedImage) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopStream();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser. Please upload a photo from your files.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      // Fallback: try default camera without facingMode constraint
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
        }
      } catch (fallbackErr: any) {
        setCameraError(
          fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError'
            ? 'Camera permission denied. Please allow camera access in your browser settings, or select a photo from your device.'
            : 'Could not access camera. Please choose a photo from your gallery.'
        );
      }
    }
  }, [stopStream]);

  useEffect(() => {
    if (isOpen && !capturedPreview) {
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, capturedPreview, startCamera, stopStream]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    try {
      setIsProcessing(true);
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          try {
            const processed = await processAndCompressImage(blob);
            setCapturedPreview(processed);
            stopStream();
          } catch (err) {
            console.error('Failed to process captured photo:', err);
          } finally {
            setIsProcessing(false);
          }
        },
        'image/jpeg',
        0.9
      );
    } catch (err) {
      console.error('Capture error:', err);
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const processed = await processAndCompressImage(file);
      setCapturedPreview(processed);
      stopStream();
    } catch (err: any) {
      alert(err.message || 'Failed to process selected image.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedPreview) {
      onPhotoCaptured(capturedPreview);
      handleClose();
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    startCamera(facingMode);
  };

  const handleClose = () => {
    stopStream();
    setCapturedPreview(null);
    setCameraError(null);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-forest-600 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm md:text-base leading-tight">
                Crop &amp; Plant Photo
              </h3>
              <p className="text-[11px] text-slate-400">
                Snap or upload a photo of the leaf, fruit, or pest
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Preview Area */}
        <div className="relative flex-1 min-h-[320px] md:min-h-[400px] bg-black flex items-center justify-center overflow-hidden">
          {capturedPreview ? (
            /* Still Preview After Capture */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedPreview.dataUrl}
                alt="Captured crop"
                className="max-h-[60vh] max-w-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-forest-900/90 text-forest-200 border border-forest-500/40 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs font-semibold shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-forest-400" />
                Photo ready for AI analysis
              </div>
            </div>
          ) : cameraError ? (
            /* Error & File Upload Fallback */
            <div className="p-6 text-center max-w-sm">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-white text-sm font-semibold mb-2">Camera Unavailable</p>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">{cameraError}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm rounded-2xl shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Choose Photo from Device
              </button>
            </div>
          ) : (
            /* Live Camera Feed with Viewfinder Frame */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Box */}
              <div className="pointer-events-none absolute inset-8 md:inset-12 border-2 border-dashed border-forest-400/70 rounded-2xl flex flex-col items-center justify-between p-4 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                <div className="text-[11px] font-semibold text-white/80 bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  Center sick leaf, crop, or pest here
                </div>
                <div className="text-[10px] text-white/60 bg-black/40 px-2 py-0.5 rounded-md">
                  Hold camera steady &amp; ensure good lighting
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
              <RefreshCw className="w-8 h-8 text-forest-400 animate-spin mb-2" />
              <span className="text-white text-xs font-semibold">Processing image...</span>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Action Controls Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          {capturedPreview ? (
            /* Post-capture controls */
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs font-bold transition active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-forest-600 hover:bg-forest-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-forest-900/40 transition active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Use Photo for Diagnosis
              </button>
            </>
          ) : (
            /* Live Camera Controls */
            <>
              {/* Upload from Gallery button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Select photo from files or gallery"
                className="p-3 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-2xl transition active:scale-95 flex items-center gap-1.5 text-xs font-medium"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Gallery</span>
              </button>

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={handleCapture}
                disabled={Boolean(cameraError) || isProcessing}
                aria-label="Capture crop photo"
                className="w-16 h-16 rounded-full border-4 border-white/80 bg-forest-600 hover:bg-forest-500 active:scale-90 transition flex items-center justify-center shadow-lg disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-white group-hover:scale-95 transition" />
              </button>

              {/* Flip Camera Button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                disabled={Boolean(cameraError)}
                title="Switch front/back camera"
                className="p-3 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-2xl transition active:scale-95 flex items-center gap-1.5 text-xs font-medium disabled:opacity-40"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Flip</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
