import { useState, useEffect, useCallback } from 'react';

export type PermissionStateExtended = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface CameraConstraints {
  resolution: '1080p' | '720p' | '480p';
  aspectRatio: '16:9' | '4:3' | '1:1';
  frameRate: 60 | 30 | 15;
}

export interface DiagnosticsResult {
  permissionCheck: 'pass' | 'fail' | 'warn';
  deviceEnumeration: 'pass' | 'fail';
  mediaStreamInit: 'pass' | 'fail';
  resolutionCheck: 'pass' | 'fail';
  blackFrameCheck: 'pass' | 'fail';
  fpsCheck: 'pass' | 'fail';
  details: {
    cameraName?: string;
    resolution?: string;
    actualFps?: number;
    retriesUsed?: number;
    permissionStatus?: string;
    message?: string;
  };
}

/**
 * Capture camera stream with exponential backoff retry if resolution is 0x0 or frame is completely black.
 */
export async function captureCameraWithRetry(
  constraints: MediaStreamConstraints,
  maxRetries = 3,
  initialDelayMs = 300,
  onRetry?: (attempt: number, reason: string) => void
): Promise<{ stream: MediaStream; retriesUsed: number; resolution: { width: number; height: number }; isEmulated: boolean }> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= maxRetries) {
    try {
      attempt++;
      let stream: MediaStream;

      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } else {
        throw new Error("navigator.mediaDevices.getUserMedia not supported");
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error("No video track obtained from stream");
      }

      if (videoTrack.readyState !== 'live') {
        throw new Error(`Video track readyState is ${videoTrack.readyState}`);
      }

      // Verify actual video frame rendering dimensions & black-screen check
      const verification = await verifyStreamFrame(stream, 1500);

      if (verification.width > 0 && verification.height > 0 && !verification.isBlack) {
        return {
          stream,
          retriesUsed: attempt - 1,
          resolution: { width: verification.width, height: verification.height },
          isEmulated: false
        };
      }

      // Stop track before retrying if verification failed
      videoTrack.stop();
      const reason = verification.isBlack 
        ? "Captured video frame is completely black (initialization stall)"
        : "Captured video resolution is 0x0";
      
      if (onRetry) onRetry(attempt, reason);

      if (attempt > maxRetries) {
        break;
      }
    } catch (err: any) {
      if (onRetry) onRetry(attempt, err?.message || "Stream request error");
      if (attempt > maxRetries) {
        break;
      }
    }

    await new Promise((res) => setTimeout(res, delay));
    delay *= 2;
  }

  // Fallback: create simulated high-quality canvas stream if hardware camera stalls or is restricted in iframe
  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = 640;
  fallbackCanvas.height = 480;
  const ctx = fallbackCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('• HEALTHCARE HARDWARE EMULATION ACTIVE', 20, 40);
  }
  const emulatedStream = fallbackCanvas.captureStream(30);
  return {
    stream: emulatedStream,
    retriesUsed: maxRetries,
    resolution: { width: 640, height: 480 },
    isEmulated: true
  };
}

/**
 * Helper to test if a stream video element actually renders non-black pixels.
 */
export async function verifyStreamFrame(
  stream: MediaStream,
  timeoutMs = 1500
): Promise<{ width: number; height: number; isBlack: boolean }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;

    let resolved = false;
    const cleanup = () => {
      video.pause();
      video.srcObject = null;
      video.remove();
    };

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve({ width: 0, height: 0, isBlack: true });
      }
    }, timeoutMs);

    video.onloadedmetadata = () => {
      video.play().catch(() => {});
    };

    video.onplaying = () => {
      setTimeout(() => {
        if (resolved) return;
        const w = video.videoWidth || 0;
        const h = video.videoHeight || 0;

        if (w === 0 || h === 0) {
          clearTimeout(timer);
          resolved = true;
          cleanup();
          resolve({ width: 0, height: 0, isBlack: true });
          return;
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, 32, 32);
            const imgData = ctx.getImageData(0, 0, 32, 32).data;
            let totalLuma = 0;
            for (let i = 0; i < imgData.length; i += 4) {
              totalLuma += imgData[i] + imgData[i + 1] + imgData[i + 2];
            }
            const isBlack = totalLuma === 0;
            clearTimeout(timer);
            resolved = true;
            cleanup();
            resolve({ width: w, height: h, isBlack });
            return;
          }
        } catch (e) {
          // Ignore context errors
        }

        clearTimeout(timer);
        resolved = true;
        cleanup();
        resolve({ width: w, height: h, isBlack: false });
      }, 200);
    };
  });
}

export function useMediaDevices() {
  const [camera, setCamera] = useState<MediaDeviceInfo | null>(null);
  const [microphone, setMicrophone] = useState<MediaDeviceInfo | null>(null);
  const [status, setStatus] = useState<'idle' | 'detecting' | 'ready' | 'error'>('idle');
  const [cameraPermission, setCameraPermission] = useState<PermissionStateExtended>('unknown');
  const [micPermission, setMicPermission] = useState<PermissionStateExtended>('unknown');
  const [activeConstraints, setActiveConstraints] = useState<CameraConstraints>({
    resolution: '720p',
    aspectRatio: '16:9',
    frameRate: 30,
  });

  const checkPermissions = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions.query) {
        try {
          const camStatus = await navigator.permissions.query({ name: 'camera' as any });
          setCameraPermission(camStatus.state as PermissionStateExtended);
          camStatus.onchange = () => setCameraPermission(camStatus.state as PermissionStateExtended);
        } catch (e) {
          setCameraPermission('unknown');
        }

        try {
          const micStatus = await navigator.permissions.query({ name: 'microphone' as any });
          setMicPermission(micStatus.state as PermissionStateExtended);
          micStatus.onchange = () => setMicPermission(micStatus.state as PermissionStateExtended);
        } catch (e) {
          setMicPermission('unknown');
        }
      }
    } catch (err) {
      console.warn('Permissions API not supported or threw error:', err);
    }
  }, []);

  const detectDevices = useCallback(async () => {
    setStatus('detecting');
    await checkPermissions();
    try {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (err) {
        try { await navigator.mediaDevices.getUserMedia({ video: true }); } catch (vErr) {}
        try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (aErr) {}
      }

      await checkPermissions();

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevice = devices.find(d => d.kind === 'videoinput');
      const audioDevice = devices.find(d => d.kind === 'audioinput');

      if (videoDevice) setCamera(videoDevice);
      if (audioDevice) setMicrophone(audioDevice);

      setStatus('ready');
    } catch (err) {
      setStatus('error');
    }
  }, [checkPermissions]);

  const requestPermissions = useCallback(async () => {
    try {
      setStatus('detecting');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(t => t.stop());
      await detectDevices();
      return true;
    } catch (err) {
      await checkPermissions();
      return false;
    }
  }, [detectDevices, checkPermissions]);

  useEffect(() => {
    detectDevices();
  }, [detectDevices]);

  return {
    camera,
    microphone,
    status,
    cameraPermission,
    micPermission,
    activeConstraints,
    setActiveConstraints,
    requestPermissions,
    checkPermissions,
    refresh: detectDevices
  };
}
