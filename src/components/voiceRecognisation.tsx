"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Mic, X } from "lucide-react";

type Props = {
  value: string;
  setValue: (v: string) => void;
  disabled?: boolean;
  language?: string;
  appendMode?: boolean;
  autoCapitalize?: boolean;
  autoStopAfterSilenceMs?: number;
};

export function VoiceButton({
  value,
  setValue,
  disabled = false,
  language = "en-IN",
  appendMode = true,
  autoCapitalize = true,
  autoStopAfterSilenceMs = 2500,
}: Props) {
  const nativeSRAvailable = useMemo(() => {
    const w = typeof window !== "undefined" ? (window as any) : {};
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  }, []);

  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const autoCaps = (text: string) => {
    if (!autoCapitalize) return text;
    const cleaned = text.replace(/\s+/g, " ").trim();
    return cleaned.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (m) =>
      m.toUpperCase()
    );
  };

  const joinWithSpace = (a: string, b: string) => {
    if (!a) return b;
    if (!b) return a;
    return `${a}${/\s$/.test(a) || /^\s/.test(b) ? "" : " "}${b}`;
  };

  const baseAtStartRef = useRef<string>("");
  const appendedSoFarRef = useRef<string>("");
  const lastTranscriptAtRef = useRef<number>(0);

  useEffect(() => {
    if (!listening) return;

    if (transcript && transcript.length !== appendedSoFarRef.current.length) {
      lastTranscriptAtRef.current = Date.now();
    }

    if (!appendMode) {
      setValue(autoCaps(transcript));
      return;
    }

    const newPart = transcript.slice(appendedSoFarRef.current.length);
    if (newPart.trim().length > 0) {
      appendedSoFarRef.current += newPart;
      const combined = joinWithSpace(
        baseAtStartRef.current,
        appendedSoFarRef.current
      );
      setValue(autoCaps(combined));
    }
  }, [transcript, listening]);

  useEffect(() => {
    if (!listening || autoStopAfterSilenceMs <= 0) return;

    const id = window.setInterval(() => {
      const now = Date.now();
      const idleFor = now - lastTranscriptAtRef.current;
      if (idleFor >= autoStopAfterSilenceMs) {
        stop();
      }
    }, 300);

    return () => window.clearInterval(id);
  }, [listening, autoStopAfterSilenceMs]);

  const start = () => {
    setErrorMsg(null);

    if (!browserSupportsSpeechRecognition || !nativeSRAvailable) {
      setErrorMsg("Voice recognition not supported in this browser.");
      return;
    }
    if (!window.isSecureContext) {
      setErrorMsg("Microphone requires HTTPS (localhost is okay).");
      return;
    }

    try {
      baseAtStartRef.current = value;
      appendedSoFarRef.current = "";
      lastTranscriptAtRef.current = Date.now();

      resetTranscript();
      setShowModal(true);

      SpeechRecognition.startListening({
        continuous: true,
        interimResults: true,
        language,
      });
    } catch (e: any) {
      setShowModal(false);
      setErrorMsg(e?.message || "Could not start listening.");
    }
  };

  const stop = () => {
    try {
      SpeechRecognition.stopListening();
    } finally {
      setShowModal(false);

      const finalChunk = transcript.trim();
      if (!finalChunk) return;

      if (appendMode) {
        const combined = joinWithSpace(baseAtStartRef.current, finalChunk);
        setValue(autoCaps(combined));
      } else {
        setValue(autoCaps(finalChunk));
      }
    }
  };

  return (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes backdropFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes textGlow {
          0%, 100% {
            text-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
          }
          50% {
            text-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
          }
        }

        .modal-container {
          animation: backdropFadeIn 0.3s ease-out;
        }

        .modal-content {
          animation: modalFadeIn 0.3s ease-out;
        }

        .ripple-circle {
          animation: ripple 2s infinite;
        }

        .ripple-circle:nth-child(2) {
          animation-delay: 0.4s;
        }

        .ripple-circle:nth-child(3) {
          animation-delay: 0.8s;
        }

        .pulse-icon {
          animation: pulse 2s ease-in-out infinite;
        }

        .float-animation {
          animation: float 3s ease-in-out infinite;
        }

        .slide-up {
          animation: slideUp 0.4s ease-out forwards;
        }

        .text-glow {
          animation: textGlow 2s ease-in-out infinite;
        }

        .wave-bar {
          animation: waveHeight 1.2s ease-in-out infinite;
        }

        @keyframes waveHeight {
          0%, 100% {
            height: 20%;
          }
          50% {
            height: 100%;
          }
        }

        .wave-bar:nth-child(1) {
          animation-delay: 0s;
        }
        .wave-bar:nth-child(2) {
          animation-delay: 0.1s;
        }
        .wave-bar:nth-child(3) {
          animation-delay: 0.2s;
        }
        .wave-bar:nth-child(4) {
          animation-delay: 0.3s;
        }
        .wave-bar:nth-child(5) {
          animation-delay: 0.4s;
        }
      `}</style>

      <button
        type="button"
        onClick={start}
        disabled={disabled || !browserSupportsSpeechRecognition}
        className={`px-4 md:px-6 py-3 rounded-xl shadow flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95
          ${
            listening
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
        title="Start voice input"
      >
        <Mic className="w-5 h-5 lg:w-6 lg:h-6" />
      </button>

      {errorMsg && (
        <p className="text-xs text-red-600 mt-1 slide-up">{errorMsg}</p>
      )}

      {showModal && (
        <div
          className="modal-container z-50 fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center  px-4"
          onClick={stop}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-content relative z-50 bg-gradient-to-br from-white to-blue-50 p-8 rounded-3xl w-full max-w-md shadow-2xl border-2 border-blue-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={stop}
              className="absolute top-4 right-4 p-2 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>

            {/* Animated mic icon with ripples */}
            <div className="flex flex-col items-center gap-6">
              {/* <div className="relative w-32 h-32 flex items-center justify-center float-animation">
            
                <span className="ripple-circle absolute inset-0 rounded-full bg-blue-400 opacity-0" />
                <span className="ripple-circle absolute inset-0 rounded-full bg-blue-400 opacity-0" />
                <span className="ripple-circle absolute inset-0 rounded-full bg-blue-400 opacity-0" />

                <div className="pulse-icon relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-300">
                  <Mic className="w-12 h-12 text-white" />
                </div>
              </div> */}

              {/* Listening text */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 text-glow">
                  Listening...
                </h2>
                <p className="mt-2 text-sm text-gray-600 slide-up">
                  Speak clearly into your microphone
                </p>
              </div>

              {/* Audio wave visualization */}
              <div className="flex items-center justify-center gap-1.5 h-12">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="wave-bar w-1.5 bg-gradient-to-t from-blue-600 to-blue-400 rounded-full"
                  />
                ))}
              </div>

              {/* Live transcript preview */}
              <div className="w-full slide-up">
                <div className="p-4 rounded-2xl bg-white/80 backdrop-blur border border-blue-100 shadow-inner min-h-[100px] max-h-40 overflow-auto">
                  {transcript ? (
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {transcript}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      Waiting for speech...
                    </p>
                  )}
                </div>
              </div>

              {/* Stop button */}
              <button
                onClick={stop}
                className="w-full mt-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-red-800 transition-all duration-300 active:scale-95"
              >
                Stop Recording
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// "use client"; // keep if you're on Next.js. Remove otherwise.

// import React, { useEffect, useState } from "react";
// import SpeechRecognition, {
//   useSpeechRecognition,
// } from "react-speech-recognition";
// // If you use lucide-react icons:
// import { Mic, MicOff } from "lucide-react";

// type VoiceCaptureButtonProps = {
//   value: string; // current textarea value
//   setValue: (val: string) => void; // setter for textarea (e.g., setInput)
//   language?: string; // optional, default "en-IN"
//   disabled?: boolean; // optional, tie to your "sending" if needed
// };

// export default function VoiceCaptureButton({
//   value,
//   setValue,
//   language = "en-IN",
//   disabled = false,
// }: VoiceCaptureButtonProps): JSX.Element {
//   const {
//     transcript,
//     listening,
//     browserSupportsSpeechRecognition,
//     resetTranscript,
//   } = useSpeechRecognition();

//   const [showModal, setShowModal] = useState(false);

//   // Push live transcript into the provided textarea value
//   useEffect(() => {
//     if (!listening) return; // only live-fill while listening
//     // Append/replace strategy: replace with transcript or merge with existing.
//     // Here we replace the current text with transcript (feel free to customize).
//     setValue(transcript);
//   }, [transcript, listening, setValue]);

//   const start = (): void => {
//     if (!browserSupportsSpeechRecognition || disabled) return;
//     resetTranscript();
//     setShowModal(true);
//     SpeechRecognition.startListening({
//       continuous: true,
//       interimResults: true,
//       language,
//     });
//   };

//   const stop = (): void => {
//     SpeechRecognition.stopListening();
//     setShowModal(false);
//     // Optional: trim spaces at the end when stopping
//     if (transcript && transcript.trim() !== value.trim()) {
//       setValue(transcript.trim());
//     }
//   };

//   // Close modal by clicking backdrop (also stops)
//   const closeModal = (): void => {
//     stop();
//   };

//   return (
//     <>
//       {/* Trigger button (click to start) */}
//       {/* bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-3
//       max-h-12 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800
//       transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
//       hover:shadow-xl flex items-center gap-2 */}
//       <button
//         type="button"
//         onClick={start}
//         disabled={disabled || !browserSupportsSpeechRecognition}
//         className={`px-4 md:px-6 py-3 max-h-12 rounded-xl flex items-center justify-center shadow hover:shadow-xl
//           ${listening ? "bg-red-500 text-white" : "bg-gray-200"}
//           disabled:opacity-50 disabled:cursor-not-allowed`}
//         title={
//           !browserSupportsSpeechRecognition
//             ? "Voice not supported by this browser"
//             : listening
//             ? "Listening…"
//             : "Start voice input"
//         }
//       >
//         <Mic className="w-5 lg:w-6 h-5 lg:h-6" />
//       </button>
//       {/* Minimal modal / popup */}
//       {showModal && (
//         <div
//           className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
//           onClick={closeModal} // click backdrop to stop/close
//           role="dialog"
//           aria-modal="true"
//         >
//           <div
//             className="bg-white rounded-2xl p-5 w-[90%] max-w-sm shadow-2xl"
//             onClick={(e) => e.stopPropagation()} // prevent backdrop close when clicking inside
//           >
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
//                 <Mic className="w-5 h-5" />
//               </div>
//               <div className="font-semibold text-lg">Listening…</div>
//             </div>

//             <p className="mt-2 text-sm text-slate-600">
//               Speak now. Your words will appear in the text box.
//             </p>

//             {/* Live transcript preview (optional visual) */}
//             <div className="mt-3 p-3 rounded-lg bg-slate-50 border text-sm max-h-32 overflow-auto">
//               {transcript || (
//                 <span className="text-slate-400">Waiting for speech…</span>
//               )}
//             </div>

//             <div className="mt-4 flex items-center justify-end gap-2">
//               <button
//                 type="button"
//                 onClick={stop}
//                 className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
//                 title="Stop listening"
//               >
//                 <MicOff className="w-4 h-4" />
//                 Stop
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
