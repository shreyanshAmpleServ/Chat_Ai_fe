"use client"; // keep if you're on Next.js. Remove otherwise.

import React, { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
// If you use lucide-react icons:
import { Mic, MicOff } from "lucide-react";

type VoiceCaptureButtonProps = {
  value: string; // current textarea value
  setValue: (val: string) => void; // setter for textarea (e.g., setInput)
  language?: string; // optional, default "en-IN"
  disabled?: boolean; // optional, tie to your "sending" if needed
};

export default function VoiceCaptureButton({
  value,
  setValue,
  language = "en-IN",
  disabled = false,
}: VoiceCaptureButtonProps): JSX.Element {
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  const [showModal, setShowModal] = useState(false);

  // Push live transcript into the provided textarea value
  useEffect(() => {
    if (!listening) return; // only live-fill while listening
    // Append/replace strategy: replace with transcript or merge with existing.
    // Here we replace the current text with transcript (feel free to customize).
    setValue(transcript);
  }, [transcript, listening, setValue]);

  const start = (): void => {
    if (!browserSupportsSpeechRecognition || disabled) return;
    resetTranscript();
    setShowModal(true);
    SpeechRecognition.startListening({
      continuous: true,
      interimResults: true,
      language,
    });
  };

  const stop = (): void => {
    SpeechRecognition.stopListening();
    setShowModal(false);
    // Optional: trim spaces at the end when stopping
    if (transcript && transcript.trim() !== value.trim()) {
      setValue(transcript.trim());
    }
  };

  // Close modal by clicking backdrop (also stops)
  const closeModal = (): void => {
    stop();
  };

  return (
    <>
      {/* Trigger button (click to start) */}
      {/* bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-3
      max-h-12 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800
      transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
      hover:shadow-xl flex items-center gap-2 */}
      <button
        type="button"
        onClick={start}
        disabled={disabled || !browserSupportsSpeechRecognition}
        className={`px-4 md:px-6 py-3 max-h-12 rounded-xl flex items-center justify-center shadow hover:shadow-xl
          ${listening ? "bg-red-500 text-white" : "bg-gray-200"} 
          disabled:opacity-50 disabled:cursor-not-allowed`}
        title={
          !browserSupportsSpeechRecognition
            ? "Voice not supported by this browser"
            : listening
            ? "Listening…"
            : "Start voice input"
        }
      >
        <Mic className="w-5 lg:w-6 h-5 lg:h-6" />
      </button>
      {/* Minimal modal / popup */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          onClick={closeModal} // click backdrop to stop/close
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl p-5 w-[90%] max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()} // prevent backdrop close when clicking inside
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div className="font-semibold text-lg">Listening…</div>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              Speak now. Your words will appear in the text box.
            </p>

            {/* Live transcript preview (optional visual) */}
            <div className="mt-3 p-3 rounded-lg bg-slate-50 border text-sm max-h-32 overflow-auto">
              {transcript || (
                <span className="text-slate-400">Waiting for speech…</span>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={stop}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                title="Stop listening"
              >
                <MicOff className="w-4 h-4" />
                Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
