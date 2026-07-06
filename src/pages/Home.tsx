"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { WorkRoomCard } from "@/components/ui/WorkRoomCard";
import { computePhase, FOCUS_MS, BREAK_MS, CYCLE_MS } from "@/hooks/sessionPhase";
import { useActiveRooms } from "@/hooks/useActiveRooms";
import { useNavigate } from "react-router"; // swap for your router

// ─── Types ────────────────────────────────────────────────────────────────────

const colors = {
  bg:      { muted: "#0b0c10", accentDim: "#1a1f2e", elevated: "#13141c" },
  surface: { skillhive: "#fffd01" },
  text:    { primary: "#f0f0f0", secondary: "#9a9a9a", skillhive: "#fffd01" },
  border:  { primary: "#2a2a2a" },
};

// ─── Modal ───────────────────────────────────────────────────────────────────

function NewRoomModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (name: string) => void }) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onClose();
  }

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40, display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }} />
      <div className="new-room-sheet" style={{ position: "relative", margin: "0 auto", width: 400,  zIndex: 50, background: colors.bg.muted, borderRadius: 20,  padding: "20px 20px 20px 20px", boxShadow: "0 -4px 40px rgba(0,0,0,0.5)" }}>

        <div style={{ fontSize: 17, fontWeight: 700, color: colors.text.primary, marginBottom: 16 }}>Name your room</div>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="e.g. deep work, thesis grind…"
          style={{ width: "100%", border: `1px solid ${colors.border.primary}`, borderRadius: 0, padding: "14px", marginBottom: 20, fontSize: 14, background: "#0b0c04", color: colors.text.primary, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleSubmit}
            style={{ padding: "6px 12px", background: "#24280B", border: `1px solid ${colors.border.primary}`, borderRadius: 1, cursor: "pointer", fontSize: 12, fontWeight: 700, color: colors.text.skillhive, fontFamily: "inherit" }}
          >
            Create
          </button>
        </div>
      </div>
    </>
  );
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes idx-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 24, height: 24, border: `2px solid ${colors.border.primary}`, borderTopColor: colors.surface.skillhive, borderRadius: "50%", animation: "idx-spin 0.8s linear infinite" }} />
    </>
  );
}

// ─── Index ───────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useNavigate();
  const { rooms, loading } = useActiveRooms();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleOpenSheet = useCallback(() => setSheetOpen(true), []);
  const handleCloseSheet = useCallback(() => setSheetOpen(false), []);

  function handleStartSession(name: string) {
    handleCloseSheet();
    router(`/rooms/${encodeURIComponent(name)}`);
  }

  function handleJoinRoom(name: string) {
    router(`/rooms/${encodeURIComponent(name)}`);
  }

  return (
    <div className="pt-20 bg-[#0c0c0e]" style={{ flex: 1, minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: colors.text.primary }}>Work Rooms</span>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {rooms.length > 0 && (
              <div style={{ padding: "4px 10px", borderRadius: 999, background: colors.surface.skillhive }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.text.skillhive }}>{rooms.length} live</span>
              </div>
            )}
            <button
              onClick={handleOpenSheet}
              style={{ padding: "6px 12px", background: colors.bg.accentDim, border: `1px solid ${colors.border.primary}`, borderRadius: 1, cursor: "pointer", fontSize: 12, fontWeight: 700, color: colors.text.skillhive, fontFamily: "inherit" }}
            >
              + New Room
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ paddingTop: 48, display: "flex", justifyContent: "center" }}>
            <Spinner />
          </div>
        )}

        {/* Empty state */}
        {!loading && rooms.length === 0 && (
          <WorkRoomCard
            state="empty"
            name="No rooms yet"
            tag="Be the first"
            onStart={handleOpenSheet}
            timerSeconds={0}
            breakSeconds={0}
          />
        )}

        {/* Room cards */}
        {!loading && rooms.map((room) => {
          const phase = computePhase(room.session_started_at);
          const memberNames = room.participants.map((p) => p.displayname || p.username);

          const sessionStartMs = room.session_started_at
            ? new Date(room.session_started_at).getTime()
            : undefined;

          const elapsed = sessionStartMs ? Date.now() - sessionStartMs : 0;
          const posInCycle = elapsed % CYCLE_MS;
          const phaseStartedAt = sessionStartMs
            ? Date.now() - posInCycle + (phase.phase === "break" ? FOCUS_MS : 0)
            : undefined;

          const phaseDurationMs = phase.phase === "focus" ? FOCUS_MS : BREAK_MS;

          return (
            <WorkRoomCard
              key={room.room_name}
              state={phase.phase === "focus" ? "active" : phase.phase === "break" ? "break" : "empty"}
              name={room.room_name}
              tag={`${room.participant_count} joined`}
              members={memberNames}
              phaseStartedAt={phaseStartedAt}
              onJoin={() => handleJoinRoom(room.room_name)}
              phaseDurationMs={phaseDurationMs}
            />
          );
        })}
      </div>

      <NewRoomModal open={sheetOpen} onClose={handleCloseSheet} onSubmit={handleStartSession} />
    </div>
  );
}