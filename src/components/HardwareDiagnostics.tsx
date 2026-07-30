import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Mic, RefreshCw, CheckCircle2, AlertCircle, Play, Square, Settings2 } from 'lucide-react';

export default function HardwareDiagnostics() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      // Try to prompt for permissions to get full labels
      // We try separately in case one hardware is missing or blocked
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (err) {
        // Combined media access failed, trying separately
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (vErr) {
          // Video access failed
        }
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (aErr) {
          // Audio access failed
        }
      }

      const deviceList = await navigator.mediaDevices.enumerateDevices();
      setDevices(deviceList);
      
      const videoDevice = deviceList.find(d => d.kind === 'videoinput');
      const audioDevice = deviceList.find(d => d.kind === 'audioinput');
      
      if (videoDevice && !selectedCamera) setSelectedCamera(videoDevice.deviceId);
      if (audioDevice && !selectedMic) setSelectedMic(audioDevice.deviceId);
      
      setError(null);
    } catch (err) {
      setError('Media detection failed. Please check permissions or hardware connection.');
    }
  }, [selectedCamera, selectedMic]);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  const stopTesting = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsTestingCamera(false);
    setIsTestingMic(false);
    setMicLevel(0);
  };

  const testCamera = async () => {
    stopTesting();
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera ? { exact: selectedCamera } : undefined }
      });
      setStream(videoStream);
      setIsTestingCamera(true);
    } catch (err) {
      setError('Failed to access camera.');
    }
  };

  const testMic = async () => {
    stopTesting();
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedMic ? { exact: selectedMic } : undefined }
      });
      setStream(audioStream);
      setIsTestingMic(true);

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(audioStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!audioStream.active) return;
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicLevel(average);
        requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      setError('Failed to access microphone.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
      <div className="border-b border-gray-100 dark:border-slate-800 pb-3 flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings2 size={18} className="text-indigo-600" />
            Hardware Diagnostics
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Test and select input devices for clinical document capture and voice records.</p>
        </div>
        <button 
          onClick={refreshDevices}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 transition-colors"
          title="Refresh devices"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Camera size={14} /> Camera Input
            </label>
            {isTestingCamera && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
          </div>
          
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500"
          >
            {devices.filter(d => d.kind === 'videoinput').map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
              </option>
            ))}
            {devices.filter(d => d.kind === 'videoinput').length === 0 && (
              <option value="">No camera detected</option>
            )}
          </select>

          <div className="relative aspect-video bg-slate-100 dark:bg-slate-850 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            {isTestingCamera && stream ? (
              <video 
                autoPlay 
                playsInline 
                muted
                ref={el => { if (el) el.srcObject = stream; }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <Camera size={32} className="text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">Preview Disabled</p>
              </div>
            )}
          </div>

          <button
            onClick={isTestingCamera ? stopTesting : testCamera}
            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isTestingCamera 
                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            {isTestingCamera ? <Square size={14} /> : <Play size={14} />}
            {isTestingCamera ? 'Stop Preview' : 'Test Camera'}
          </button>
        </div>

        {/* Microphone Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Mic size={14} /> Audio Input
            </label>
            {isTestingMic && <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>}
          </div>

          <select
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500"
          >
            {devices.filter(d => d.kind === 'audioinput').map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
              </option>
            ))}
            {devices.filter(d => d.kind === 'audioinput').length === 0 && (
              <option value="">No microphone detected</option>
            )}
          </select>

          <div className="h-24 bg-slate-100 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-4 gap-3">
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-75" 
                style={{ width: `${Math.min(100, (micLevel / 100) * 100)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-widest uppercase">
              {isTestingMic ? 'Input Level: Active' : 'Mic Check Required'}
            </p>
          </div>

          <button
            onClick={isTestingMic ? stopTesting : testMic}
            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isTestingMic 
                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {isTestingMic ? <Square size={14} /> : <Play size={14} />}
            {isTestingMic ? 'Stop Test' : 'Test Microphone'}
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-50 dark:border-slate-850 flex items-center gap-2">
        <CheckCircle2 size={16} className="text-emerald-500" />
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium italic">
          System automatically selects high-fidelity hardware by default for EHR record capture.
        </p>
      </div>
    </div>
  );
}
