import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";

export interface RoomParticipant {
  user_id: string;
  username: string;
  displayname: string;
  avatar: string | null;
}

export interface ActiveRoom {
  room_name: string;
  participant_count: number;
  started_at: string;
  session_started_at: string | null;
  participants: RoomParticipant[];
}

const POLL_INTERVAL = 8000;

export function useActiveRooms() {
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  async function fetchRooms() {
    const { data, error } = await supabase
      .from("active_rooms")
      .select("*")
      .order("started_at", { ascending: true });

    if (!mounted.current) return;
    if (!error && data) setRooms(data as ActiveRoom[]);
    setLoading(false);
  }

  useEffect(() => {
    mounted.current = true;
    let poll: ReturnType<typeof setInterval> | null = null;

    // Polling instead of realtime: the backend's realtime WS is unreliable
    // (same reason the feed polls), so we keep the list fresh on an interval
    // rather than relying on a subscription that may never connect.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted.current) return;
      if (!session) {
        setLoading(false);
        return;
      }
      fetchRooms();
      poll = setInterval(fetchRooms, POLL_INTERVAL);
    });

    function onVisible() {
      if (document.visibilityState === "visible") fetchRooms();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mounted.current = false;
      if (poll) clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return { rooms, loading, refetch: fetchRooms };
}
