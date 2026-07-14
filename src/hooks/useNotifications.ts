import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export type AllyRequest = {
  id: string;
  requester_id: string;
  created_at: string;
  status: string;
  requester: {
    id: string;
    displayname: string | null;
    username: string | null;
    avatar: string | null;
  };
};

const ALLY_QUERY = `
  id,
  requester_id,
  created_at,
  status,
  requester:profiles!allies_requester_id_fkey (
    id,
    displayname,
    username,
    avatar
  )
`;

/**
 * Notifications = incoming alliance requests (pending) + recently accepted
 * allies, mirroring the mobile notifications screen. Self-contained: resolves
 * the current user from the session so it can be used both inside the app
 * (page) and in the top-bar bell (outside the ProfileProvider).
 */
export function useNotifications() {
  const session = useAuth();
  const userId = session?.user?.id ?? null;

  const [requests, setRequests] = useState<AllyRequest[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!userId) {
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("allies")
      .select(ALLY_QUERY)
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data as unknown as AllyRequest[]);
      setLoadedUserId(userId);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    void fetchRequests();

    // Polling instead of realtime: the backend's realtime WS is unreliable, and
    // this hook is mounted app-wide (the top-bar bell), so a failing
    // subscription would spam connection errors on every page. A quiet 30s poll
    // keeps the badge fresh without the noise.
    const poll = setInterval(() => {
      void fetchRequests();
    }, 30000);

    function onVisible() {
      if (document.visibilityState === "visible") void fetchRequests();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, fetchRequests]);

  const accept = useCallback(
    async (req: AllyRequest) => {
      setActing(req.id);

      await supabase
        .from("allies")
        .update({ status: "accepted" })
        .eq("id", req.id);

      await fetchRequests();

      setActing(null);
    },
    [fetchRequests],
  );

  const decline = useCallback(async (req: AllyRequest) => {
    setActing(req.id);

    await supabase.from("allies").delete().eq("id", req.id);

    setRequests((prev) => prev.filter((r) => r.id !== req.id));

    setActing(null);
  }, []);

  const visibleRequests = useMemo(() => {
    if (!userId) {
      return [];
    }

    // Don't show another user's notifications while loading.
    if (loadedUserId !== userId) {
      return [];
    }

    return requests;
  }, [userId, loadedUserId, requests]);

  const pending = useMemo(
    () => visibleRequests.filter((r) => r.status === "pending"),
    [visibleRequests],
  );

  const accepted = useMemo(
    () => visibleRequests.filter((r) => r.status === "accepted"),
    [visibleRequests],
  );

  return {
    requests: visibleRequests,
    pending,
    accepted,
    pendingCount: pending.length,
    loading: userId ? loading : false,
    acting,
    accept,
    decline,
    refresh: fetchRequests,
    isAuthed: !!userId,
  };
}