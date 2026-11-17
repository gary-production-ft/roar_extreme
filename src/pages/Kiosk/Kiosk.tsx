import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Settings,
  ShieldCheck,
  Eye,
  Maximize2,
  Minimize2,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { apiUrl } from '../../config/api';
import {
  loadFaceModels,
  detectSingleFaceDescriptor,
  calculateEyeAspectRatio,
  calculateHeadYawRatio,
} from '../../utils/faceRecognition';
import type { LivenessChallengeType, LivenessProof } from '../../utils/faceRecognition';

type KioskState =
  | 'initializing'
  | 'camera_error'
  | 'idle_scanning'
  | 'liveness_challenge'
  | 'verifying'
  | 'granted'
  | 'denied';

interface VerificationResult {
  decision: 'granted' | 'denied';
  reason: string;
  memberName?: string | null;
  daysRemaining?: number;
}

export const Kiosk: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isLoopActiveRef = useRef(false);

  const [state, setState] = useState<KioskState>('initializing');
  const [initMessage, setInitMessage] = useState('Initializing biometric neural network...');
  const [deviceKey, setDeviceKey] = useState(
    () => localStorage.getItem('roar_kiosk_device_key') || 'roar_kiosk_device_key_nashik_rooftop_01'
  );
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active Verification / Liveness State
  const [activeChallenge, setActiveChallenge] = useState<LivenessChallengeType>('blink');
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [cooldownCountdown, setCooldownCountdown] = useState(4);

  // Camera initialization
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return true;
    } catch (err) {
      console.error('Camera access denied or unavailable:', err);
      setState('camera_error');
      return false;
    }
  };

  // Bootstrap models and camera
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setInitMessage('Loading facial biometric models...');
        await loadFaceModels((_progress, label) => {
          if (mounted) setInitMessage(label);
        });

        if (mounted) setInitMessage('Starting HD Camera feed...');
        const camOk = await startCamera();
        if (camOk && mounted) {
          setState('idle_scanning');
        }
      } catch (err: unknown) {
        console.error('Initialization error:', err);
        if (mounted) {
          setState('camera_error');
          setInitMessage(err instanceof Error ? err.message : 'Error starting camera or face detection.');
        }
      }
    }

    init();

    return () => {
      mounted = false;
      isLoopActiveRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Main Detection & Liveness loop
  const executeScan = useCallback(async () => {
    if (!videoRef.current || isLoopActiveRef.current) return;
    if (state !== 'idle_scanning' && state !== 'liveness_challenge') return;

    isLoopActiveRef.current = true;

    try {
      const detection = await detectSingleFaceDescriptor(videoRef.current);

      if (!detection) {
        isLoopActiveRef.current = false;
        return;
      }

      // Face found! Start a quick liveness challenge if currently idle
      if (state === 'idle_scanning') {
        const challenges: LivenessChallengeType[] = ['blink', 'turn_left', 'turn_right'];
        const chosen = challenges[Math.floor(Math.random() * challenges.length)];
        setActiveChallenge(chosen);
        setChallengeProgress(0);
        setState('liveness_challenge');

        // Give user 3 seconds to complete challenge
        const startTime = Date.now();
        const initialEar = calculateEyeAspectRatio(detection.landmarks.leftEye);
        const initialYaw = calculateHeadYawRatio(detection.landmarks);

        let challengePassed = false;
        let delta = 0;

        while (Date.now() - startTime < 3500) {
          await new Promise((r) => setTimeout(r, 100));
          if (!videoRef.current) break;

          const currentDet = await detectSingleFaceDescriptor(videoRef.current);
          if (!currentDet) continue;

          if (chosen === 'blink') {
            const currentEar = calculateEyeAspectRatio(currentDet.landmarks.leftEye);
            delta = Math.abs(currentEar - initialEar);
            // Blink creates temporary sharp drop in EAR
            if (currentEar < 0.2 || delta > 0.08) {
              challengePassed = true;
              break;
            }
          } else if (chosen === 'turn_left') {
            const currentYaw = calculateHeadYawRatio(currentDet.landmarks);
            delta = Math.abs(currentYaw - initialYaw);
            if (currentYaw < 0.65 || delta > 0.3) {
              challengePassed = true;
              break;
            }
          } else if (chosen === 'turn_right') {
            const currentYaw = calculateHeadYawRatio(currentDet.landmarks);
            delta = Math.abs(currentYaw - initialYaw);
            if (currentYaw > 1.4 || delta > 0.3) {
              challengePassed = true;
              break;
            }
          }

          const elapsed = Date.now() - startTime;
          setChallengeProgress(Math.min(100, Math.round((elapsed / 3000) * 100)));
        }

        // Liveness resolution
        const livenessProof: LivenessProof = {
          passed: challengePassed,
          challenge: chosen,
          confidence: challengePassed ? 0.95 : 0.2,
          delta,
        };

        // Capture definitive descriptor
        const finalDet = await detectSingleFaceDescriptor(videoRef.current);
        const descriptorToSend = finalDet ? finalDet.descriptor : detection.descriptor;

        setState('verifying');

        // Post descriptor & liveness proof to backend
        const res = await fetch(apiUrl('/api/access/verify'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-device-key': deviceKey,
          },
          body: JSON.stringify({
            descriptor: descriptorToSend,
            livenessProof,
            deviceId: 'kiosk-main-entrance',
          }),
        });

        const data: VerificationResult = await res.json();
        setVerificationResult(data);

        if (data.decision === 'granted') {
          setState('granted');
        } else {
          setState('denied');
        }

        // Auto-reset back to scanning after 4 seconds
        let count = 4;
        setCooldownCountdown(count);
        const timer = setInterval(() => {
          count -= 1;
          setCooldownCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            setVerificationResult(null);
            setState('idle_scanning');
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Scan execution error:', err);
      setState('idle_scanning');
    } finally {
      isLoopActiveRef.current = false;
    }
  }, [state, deviceKey]);

  // Scanning loop tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state === 'idle_scanning') {
      interval = setInterval(() => {
        executeScan();
      }, 300);
    }
    return () => clearInterval(interval);
  }, [state, executeScan]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const formatReason = (reason: string) => {
    switch (reason) {
      case 'no_face_match':
        return 'Face not recognized. Please see reception.';
      case 'low_confidence':
      case 'ambiguous_match':
        return 'Low match confidence. Please realign face.';
      case 'membership_expired':
        return 'Membership has expired. Please see reception.';
      case 'payment_pending':
        return 'Payment is pending. Please see reception.';
      case 'membership_frozen':
        return 'Membership is currently frozen.';
      case 'member_blocked':
        return 'Access denied. Account is blocked.';
      case 'liveness_failed':
        return 'Liveness verification failed. Photo / screen detected.';
      case 'outside_hours':
        return 'Facility is closed. Outside operating hours (06:00 - 22:00).';
      case 'rate_limited':
        return 'Device is scanning too rapidly. Please wait.';
      default:
        return 'Access denied. Please consult studio desk.';
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#080808] text-white overflow-hidden flex flex-col font-sans select-none">
      {/* Top Status Header */}
      <header className="absolute top-0 left-0 right-0 z-30 p-4 md:p-6 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-3">
          <span className="font-heading font-black text-2xl tracking-wider text-white">
            ROAR <span className="text-[#FF5A1F]">EXTREME</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/15">
            Turnstile AI Access
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/50 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#FF5A1F]" />
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Kiosk Configuration"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Video Viewport */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        />

        {/* Biometric Scanning Reticle / Oval */}
        {state === 'idle_scanning' && (
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-64 h-80 sm:w-80 sm:h-96 rounded-[48%] border-2 border-dashed border-[#FF5A1F]/70 shadow-[0_0_50px_rgba(255,90,31,0.25)] flex items-center justify-center animate-pulse">
              <div className="w-12 h-1 bg-[#FF5A1F]/80 rounded-full animate-bounce" />
            </div>
            <p className="mt-6 text-sm font-semibold tracking-wider uppercase text-white/90 bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              Align your face inside the frame
            </p>
          </div>
        )}

        {/* Liveness Challenge Overlay */}
        {state === 'liveness_challenge' && (
          <div className="relative z-20 flex flex-col items-center bg-black/75 backdrop-blur-md px-8 py-6 rounded-3xl border border-[#FF5A1F]/50 shadow-2xl animate-fade-in max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#FF5A1F]/20 text-[#FF5A1F] flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Anti-Spoof Liveness Check</h3>
            <p className="text-xs text-[#FF5A1F] font-semibold uppercase tracking-wider mb-4">
              {activeChallenge === 'blink' && '👁️ Please Blink Both Eyes'}
              {activeChallenge === 'turn_left' && '👈 Please Turn Head Slightly Left'}
              {activeChallenge === 'turn_right' && '👉 Please Turn Head Slightly Right'}
            </p>
            {/* Progress bar */}
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#FF5A1F] h-full transition-all duration-150"
                style={{ width: `${challengeProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Verifying Spinner */}
        {state === 'verifying' && (
          <div className="relative z-20 flex flex-col items-center bg-black/80 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/20">
            <div className="w-10 h-10 border-3 border-[#FF5A1F] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs font-mono uppercase tracking-widest text-white/80">
              Verifying Membership...
            </span>
          </div>
        )}

        {/* RESULT: GRANTED (Green) */}
        {state === 'granted' && (
          <div className="absolute inset-0 z-30 bg-emerald-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 animate-scale-up">
            <div className="w-24 h-24 rounded-full bg-emerald-500 text-black flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="w-14 h-14" />
            </div>
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-300 font-bold mb-2">
              Access Granted • Entry Unlocked
            </span>
            <h1 className="text-4xl sm:text-5xl font-heading font-black text-white tracking-wide mb-3">
              {verificationResult?.memberName || 'Member'}
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/60 border border-emerald-400/40 text-emerald-200 text-sm font-semibold mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{verificationResult?.daysRemaining} days remaining in membership</span>
            </div>
            <p className="text-xs font-mono text-emerald-300/70">
              Auto-resetting in {cooldownCountdown}s...
            </p>
          </div>
        )}

        {/* RESULT: DENIED (Red) */}
        {state === 'denied' && (
          <div className="absolute inset-0 z-30 bg-rose-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 animate-scale-up">
            <div className="w-24 h-24 rounded-full bg-rose-600 text-white flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(225,29,72,0.5)]">
              <XCircle className="w-14 h-14" />
            </div>
            <span className="text-xs uppercase font-mono tracking-widest text-rose-300 font-bold mb-2">
              Access Denied
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-wide max-w-md mb-4">
              {formatReason(verificationResult?.reason || '')}
            </h1>
            <p className="text-xs font-mono text-rose-200/70">
              Auto-resetting in {cooldownCountdown}s...
            </p>
          </div>
        )}

        {/* Initializing Screen */}
        {state === 'initializing' && (
          <div className="absolute inset-0 z-40 bg-[#080808] flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-10 h-10 border-3 border-[#FF5A1F] border-t-transparent rounded-full animate-spin" />
            <h2 className="font-heading font-black text-2xl text-white tracking-wider">
              ROAR <span className="text-[#FF5A1F]">EXTREME</span> KIOSK
            </h2>
            <p className="text-xs font-mono text-white/60">{initMessage}</p>
          </div>
        )}

        {/* Camera Error Screen */}
        {state === 'camera_error' && (
          <div className="absolute inset-0 z-40 bg-[#080808] flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
              <Camera className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Camera Access Error</h2>
            <p className="text-xs text-white/60 max-w-sm">
              Please ensure your camera is plugged in, permitted in browser permissions, and not occupied by another app.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#FF5A1F] text-black font-semibold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Initialization</span>
            </button>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121212] border border-white/15 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Kiosk Terminal Configuration
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-white/60 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1">
                  Device Hardware API Key
                </label>
                <input
                  type="password"
                  value={deviceKey}
                  onChange={(e) => {
                    setDeviceKey(e.target.value);
                    localStorage.setItem('roar_kiosk_device_key', e.target.value);
                  }}
                  className="w-full bg-[#1A1A1A] border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FF5A1F]"
                />
                <p className="text-[10px] text-white/40 mt-1">
                  Must match the DEVICE_API_KEY environment variable on the server.
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-white/10">
                <a
                  href="/admin"
                  className="text-xs text-white/60 hover:text-white flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Admin</span>
                </a>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl bg-[#FF5A1F] text-black text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kiosk;
