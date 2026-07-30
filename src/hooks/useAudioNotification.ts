import { useCallback, useEffect, useRef } from 'react';

// Frequencies for our synthesized sounds
const FREQUENCIES = {
  success: [440, 554, 659], // A major chord
  offline: [300, 250],      // Descending
  online: [250, 300, 400],  // Ascending
  error: [200, 150]
};

export function useAudioNotification() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const playSound = useCallback((type: keyof typeof FREQUENCIES) => {
    const isEnabled = localStorage.getItem('ehr_audio_notifications_enabled') === 'true';
    if (!isEnabled) return;

    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const freqs = FREQUENCIES[type];
    const duration = 0.15;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type === 'offline' || type === 'error' ? 'triangle' : 'sine';
    
    // Play sequence
    let startTime = ctx.currentTime;
    freqs.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, startTime + (i * duration));
    });

    // Volume envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05); // low volume
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + (freqs.length * duration));

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (freqs.length * duration));
  }, [initAudio]);

  return { playSound, initAudio };
}
