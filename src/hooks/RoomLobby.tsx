"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";

interface RoomLobbyProps {
  roomName: string;
  username: string;
  onJoin: (withCamera: boolean, isFrontCam: boolean) => void;
  onCancel: () => void;
}

const defaultColors = {
  bg:      { canvas: "#0d0d0d" },
  surface: { secondary: "#1c1c1c", raised: "#242424", skillhive: "#fffd01" },
  text:    { primary: "#f0f0f0", secondary: "#9a9a9a", tertiary: "#555", inverse: "#0d0d0d" },
  border:  { subtle: "#2a2a2a" },
  tint:    { accent: "#fffd01" },
};

export function RoomLobby({ roomName, username, onJoin, onCancel }: RoomLobbyProps) {
  const colors = defaultColors;

  const [camOn,       setCamOn]       = useState(true);
  const [facing,      setFacing]      = useState<"user" | "environment">("user");
  const [permGranted, setPermGranted] = useState<boolean | null>(null);
  const [requesting,  setRequesting]  = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  const initials = username.slice(0, 2).toUpperCase();

  // ── Start / stop camera preview ───────────────────────────────────────────
  const startPreview = useCallback(async (facingMode: "user" | "environment") => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
      streamRef.current = stream;
      setPermGranted(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setPermGranted(false);
    }
  }, []);

  const stopPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Start preview on mount if camOn
  React.useEffect(() => {
    if (camOn) startPreview(facing);
    return () => stopPreview();
  }, []);

  // ── Toggle camera ─────────────────────────────────────────────────────────
  const toggleCamera = useCallback(async () => {
    const next = !camOn;
    if (next) {
      await startPreview(facing);
      setCamOn(true);
    } else {
      stopPreview();
      setCamOn(false);
    }
  }, [camOn, facing, startPreview, stopPreview]);

  // ── Flip camera ───────────────────────────────────────────────────────────
  const flipCamera = useCallback(async () => {
    setIsSwitching(true);
    const nextFacing: "user" | "environment" = facing === "user" ? "environment" : "user";
    setFacing(nextFacing);
    if (camOn) await startPreview(nextFacing);
    setTimeout(() => setIsSwitching(false), 150);
  }, [facing, camOn, startPreview]);

  const showPreview = camOn && permGranted !== false && !isSwitching;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: colors.bg.canvas, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "end", padding: "28px 20px", borderBottom: `0.5px solid ${colors.border.subtle}`, flexShrink: 0 }}>
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: colors.text.secondary }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: colors.text.primary, marginLeft: "auto", textAlign: "center", margin: "0 12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {roomName}
        </span>
      </div>

      {/* Camera preview */}
      <div style={{ flex: 1, margin: 20, borderRadius: 20, overflow: "hidden", position: "relative", background: "#111", minHeight: 200 }}>
        {/* Video element — always mounted but hidden when cam off */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            transform: facing === "user" ? "scaleX(-1)" : "none",
            display: showPreview ? "block" : "none",
          }}
        />

        {/* Cam-off overlay */}
        {!showPreview && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: colors.surface.secondary }}>
            <div style={{ width: 80, height: 80, borderRadius: 40, background: colors.surface.raised, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: colors.text.secondary }}>{initials}</span>
            </div>
            <span style={{ fontSize: 13, color: colors.text.tertiary }}>
              {permGranted === false ? "Camera permission needed" : "Camera off"}
            </span>
            {permGranted === false && (
              <button
                onClick={() => { setRequesting(true); startPreview(facing).finally(() => setRequesting(false)); }}
                style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: colors.tint.accent, color: colors.bg.canvas, fontWeight: 600, border: "none", cursor: "pointer", fontSize: 14 }}>
                {requesting ? "Requesting..." : "Enable Camera"}
              </button>
            )}
          </div>
        )}

        {/* Mic badge */}
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, background: "rgba(0,0,0,0.55)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>Mic locked until session starts</span>
        </div>

        {/* Flip button */}
        {showPreview && (
          <button onClick={flipCamera} style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: 18, background: "rgba(0,0,0,0.45)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
          </button>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 14, flexShrink: 0 }}>
        {/* Toggle row */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={toggleCamera} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", background: camOn ? colors.tint.accent + "18" : colors.surface.secondary, border: `1px solid ${camOn ? colors.surface.skillhive + "55" : colors.border.subtle}`, cursor: "pointer", borderRadius: 0 }}>
            {camOn
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.surface.skillhive} strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.text.tertiary} strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>}
            <span style={{ fontSize: 13, fontWeight: 600, color: camOn ? colors.surface.skillhive : colors.text.tertiary }}>
              Camera {camOn ? "on" : "off"}
            </span>
          </button>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", background: colors.surface.secondary, border: `1px solid ${colors.border.subtle}`, opacity: 0.5, borderRadius: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.text.tertiary} strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.text.tertiary }}>Mic locked</span>
          </div>
        </div>

        <p style={{ fontSize: 12, lineHeight: 1.5, textAlign: "center", color: colors.text.tertiary, margin: 0 }}>
          Microphone unlocks when the session starts. Camera is optional.
        </p>

        <button onClick={() => onJoin(camOn, facing === "user")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px 0", borderRadius: 14, background: colors.surface.skillhive, border: "none", cursor: "pointer" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#000" }}>Join room</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>

        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, textAlign: "center" }}>
          <span style={{ fontSize: 13, color: colors.text.tertiary }}>Cancel</span>
        </button>
      </div>
    </div>
  );
}