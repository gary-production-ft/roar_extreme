/**
 * ROAR EXTREME VOICE SERVICE
 *
 * Provides bidirectional speech capability:
 * 1. Speech-to-Text (STT) via Web Speech Recognition with multi-language support.
 * 2. Text-to-Speech (TTS) via Web Speech Synthesis with high-energy coaching tone.
 */

// Declare browser SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceService {
  private static recognition: any = null;
  private static isListening: boolean = false;

  /**
   * Check if Speech Recognition is supported in the visitor's browser.
   */
  public static isRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Check if Speech Synthesis is supported in the visitor's browser.
   */
  public static isSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Start listening for voice input.
   */
  public static startListening({
    language = 'en',
    onResult,
    onError,
    onStart,
    onEnd,
  }: {
    language?: 'en' | 'hi' | 'mr';
    onResult: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
  }) {
    if (!this.isRecognitionSupported()) {
      onError?.('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    this.stopListening();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = false;
    this.recognition.interimResults = true;

    // Map language code
    if (language === 'hi') {
      this.recognition.lang = 'hi-IN';
    } else if (language === 'mr') {
      this.recognition.lang = 'mr-IN';
    } else {
      this.recognition.lang = 'en-IN';
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      if (text) {
        onResult(text, Boolean(finalTranscript));
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      this.isListening = false;
      onError?.(event.error || 'Speech recognition failed');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      this.isListening = false;
      onError?.('Microphone access denied or busy.');
    }
  }

  /**
   * Stop active listening.
   */
  public static stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore stop error
      }
    }
    this.isListening = false;
  }

  /**
   * Speak a response aloud with an athletic, motivating coach persona.
   */
  public static speak({
    text,
    language = 'en',
    onStart,
    onEnd,
  }: {
    text: string;
    language?: 'en' | 'hi' | 'mr';
    onStart?: () => void;
    onEnd?: () => void;
  }) {
    if (!this.isSynthesisSupported()) return;

    this.stopSpeaking();

    // Strip Markdown links, symbols and bold markers for clean pronunciation
    const cleanText = text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#`~>]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Athletic coach cadence: brisk, bold, motivating
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (language === 'mr') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    // Try finding preferred natural voices
    const voices = window.speechSynthesis.getVoices();
    const langCode = utterance.lang.toLowerCase();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith(langCode.slice(0, 2)) &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural'))
    ) || voices.find((v) => v.lang.toLowerCase().startsWith(langCode.slice(0, 2)));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = (e) => {
      console.warn('TTS playback error:', e);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stop any current speech synthesis playback.
   */
  public static stopSpeaking() {
    if (this.isSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public static isSpeaking(): boolean {
    return this.isSynthesisSupported() && window.speechSynthesis.speaking;
  }
}

