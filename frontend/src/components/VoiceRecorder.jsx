import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, CheckCircle2 } from "lucide-react";
import { meetingsApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";

/**
 * Records a voice note, sends it to the backend (which transcribes it via
 * Sarvam AI and extracts commitments via Claude), and reports the result
 * back up so the parent can refresh meetings/commitments.
 */
export default function VoiceRecorder({ contactId, onSaved }) {
  const { showToast } = useToast();
  const [state, setState] = useState("idle"); // idle | recording | transcribing | done
  const [transcript, setTranscript] = useState("");
  const [commitmentCount, setCommitmentCount] = useState(0);
  const [autoClosedCount, setAutoClosedCount] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = handleStop;
      recorder.start();
      mediaRecorderRef.current = recorder;
      setState("recording");
    } catch {
      showToast("Microphone access is needed to record a voice note", "error");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  };

  const handleStop = async () => {
    setState("transcribing");
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", blob, "note.webm");
    formData.append("contact_id", contactId);

    try {
      const res = await meetingsApi.createFromVoice(formData);
      setTranscript(res.data.transcript || "");
      setCommitmentCount((res.data.commitments || []).length);
      setAutoClosedCount((res.data.auto_closed_commitment_ids || []).length);
      setState("done");
      onSaved?.(res.data);
      showToast("Voice note saved and understood", "success");
    } catch (err) {
      setState("idle");
      showToast(err?.response?.data?.error || "Could not process the voice note", "error");
    }
  };

  const reset = () => {
    setState("idle");
    setTranscript("");
    setCommitmentCount(0);
    setAutoClosedCount(0);
  };

  return (
    <div className="glass rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.button
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={startRecording}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-clay to-clay-soft text-white flex items-center justify-center shadow-glow hover:shadow-glow-lg transition-shadow"
          >
            <Mic size={26} />
          </motion.button>
        )}

        {state === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="relative w-16 h-16 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-clay/30 animate-breathe" />
              <button
                onClick={stopRecording}
                className="relative w-16 h-16 rounded-full bg-clay text-white flex items-center justify-center shadow-glow"
              >
                <Square size={22} />
              </button>
            </div>
            <p className="text-sm text-ink-secondary">Listening… tap to stop</p>
          </motion.div>
        )}

        {state === "transcribing" && (
          <motion.div
            key="transcribing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2 py-3"
          >
            <Loader2 className="animate-spin text-clay" size={28} />
            <p className="text-sm text-ink-secondary">Sarvam is transcribing your note…</p>
          </motion.div>
        )}

        {state === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center gap-2"
          >
            <CheckCircle2 className="text-sage" size={28} />
            <p className="text-sm text-ink-primary italic">"{transcript}"</p>
            {commitmentCount > 0 && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="pill pill-open"
              >
                {commitmentCount} commitment{commitmentCount > 1 ? "s" : ""} captured
              </motion.p>
            )}
            {autoClosedCount > 0 && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 }}
                className="pill pill-done"
              >
                {autoClosedCount} earlier promise{autoClosedCount > 1 ? "s" : ""} marked done
              </motion.p>
            )}
            <button onClick={reset} className="text-xs text-clay underline mt-1">
              Record another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {state === "idle" && (
        <p className="text-xs text-ink-muted">Tap to leave a voice note instead of typing</p>
      )}
    </div>
  );
}
