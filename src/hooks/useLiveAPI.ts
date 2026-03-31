import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface UseLiveAPIProps {
  apiKey: string;
  systemInstruction?: string;
  voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  onMessage?: (message: LiveServerMessage) => void;
  onTranscript?: (text: string, isUser: boolean) => void;
}

export const useLiveAPI = ({ apiKey, systemInstruction, voiceName = 'Zephyr', onMessage, onTranscript }: UseLiveAPIProps) => {
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);

  const startLiveAPI = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Ensure user has selected an API key for Live API
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      // Use the most up-to-date API key
      const currentApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
      if (!currentApiKey) {
        throw new Error("API Key not found");
      }

      const ai = new GoogleGenAI({ apiKey: currentApiKey });

      // Setup Playback Context (24kHz for Gemini Live API)
      const playbackContext = new AudioContext({ sampleRate: 24000 });
      playbackContextRef.current = playbackContext;
      nextPlayTimeRef.current = playbackContext.currentTime;

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          systemInstruction: systemInstruction || "You are a helpful assistant.",
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: async () => {
            try {
              // Setup Microphone Capture (16kHz for Gemini Live API input)
              const audioContext = new AudioContext({ sampleRate: 16000 });
              audioContextRef.current = audioContext;

              if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Tu navegador no soporta el acceso al micrófono o estás en un entorno no seguro (HTTP).");
              }

              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              streamRef.current = stream;

              const source = audioContext.createMediaStreamSource(stream);

              const workletCode = `
                class PCMProcessor extends AudioWorkletProcessor {
                  process(inputs, outputs) {
                    const input = inputs[0];
                    if (input && input.length > 0) {
                      const channelData = input[0];
                      const pcm16 = new Int16Array(channelData.length);
                      for (let i = 0; i < channelData.length; i++) {
                        let s = Math.max(-1, Math.min(1, channelData[i]));
                        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                      }
                      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
                    }
                    
                    // Output silence to keep the node running without echoing
                    const output = outputs[0];
                    if (output && output.length > 0) {
                      for (let i = 0; i < output[0].length; i++) {
                        output[0][i] = 0;
                      }
                    }
                    return true;
                  }
                }
                registerProcessor('pcm-processor', PCMProcessor);
              `;
              const blob = new Blob([workletCode], { type: 'application/javascript' });
              const workletUrl = URL.createObjectURL(blob);
              
              await audioContext.audioWorklet.addModule(workletUrl);
              const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
              workletNodeRef.current = workletNode;

              workletNode.port.onmessage = (e) => {
                const buffer = new Uint8Array(e.data);
                let binary = '';
                const chunkSize = 0x8000;
                for (let i = 0; i < buffer.length; i += chunkSize) {
                  binary += String.fromCharCode.apply(null, Array.from(buffer.subarray(i, i + chunkSize)));
                }
                const base64 = btoa(binary);
                
                sessionPromise.then(session => {
                  session.sendRealtimeInput({
                    audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                  });
                });
              };

              source.connect(workletNode);
              workletNode.connect(audioContext.destination);
              
              setIsLive(true);
              setIsConnecting(false);
            } catch (err: any) {
              console.error("Error setting up audio:", err.message || err);
              setError("No se pudo acceder al micrófono. Por favor, asegúrate de dar permisos en tu navegador.");
              stopLiveAPI();
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (onMessage) onMessage(message);

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(source => {
                try { source.stop(); } catch (e) {}
              });
              activeSourcesRef.current = [];
              if (playbackContextRef.current) {
                nextPlayTimeRef.current = playbackContextRef.current.currentTime;
              }
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && playbackContextRef.current) {
              const ctx = playbackContextRef.current;
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const pcm16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(pcm16.length);
              for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / 32768.0;
              }
              
              const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
              audioBuffer.getChannelData(0).set(float32);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.onended = () => {
                activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
              };
              activeSourcesRef.current.push(source);
              
              if (nextPlayTimeRef.current < ctx.currentTime) {
                nextPlayTimeRef.current = ctx.currentTime;
              }
              source.start(nextPlayTimeRef.current);
              nextPlayTimeRef.current += audioBuffer.duration;
            }
          },
          onclose: () => {
            stopLiveAPI();
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            setError(err.message || "An error occurred with the Live API.");
            stopLiveAPI();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Error starting Live API:", err);
      setError(err.message || "Failed to start Live API");
      setIsConnecting(false);
    }
  }, [apiKey, systemInstruction, voiceName, onMessage, onTranscript]);

  const stopLiveAPI = useCallback(() => {
    setIsLive(false);
    setIsConnecting(false);

    if (sessionRef.current) {
      sessionRef.current.then((session: any) => {
        try { session.close(); } catch (e) {}
      });
      sessionRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }

    activeSourcesRef.current = [];
  }, []);

  return {
    isLive,
    isConnecting,
    error,
    startLiveAPI,
    stopLiveAPI
  };
};
