import { Menu, Plus, SquarePen } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Sidebar } from "./Sidebar";
import { ChatInterface } from "../Chat/ChatInterface";
import { IntegrationsPage } from "../Integrations/IntegrationsPage";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { chatHistoryFn } from "../../services/chatHistory";
import aiva from "../../assets/aiva.png";

// ---- Backend Session Type ----
type Session = {
  id: number | null;
  user_id: number;
  title: string | null;
  startTime: string;
  endTime: string | null;
  totalMessages: number | null;
  categoryTag: string | null;
  chat_user: {
    id: number;
    name?: string;
    email?: string;
  };
};

export function Dashboard() {
  const { user } = useAuth();
  const userKey = user?.id ?? null;

  const [currentView, setCurrentView] = useState<"chat" | "integrations">(
    "chat"
  );
  const [currentSessionId, setCurrentSessionId] = useState<any>(null);

  // show a temporary "New Conversation" row until backend creates the real session
  const [showDraft, setShowDraft] = useState(false);

  // NEW: mobile sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Fetch sessions from backend ---
  const { data: sessionsData, refetch } = useQuery({
    queryKey: ["chatHistory", userKey],
    queryFn: () => chatHistoryFn({ page: 1, limit: 10 }),
    enabled: !!userKey,
  });

  // --- Normalize + sort sessions (newest first) ---
  const sessions: Session[] = useMemo(() => {
    const raw = Array.isArray(sessionsData)
      ? sessionsData
      : sessionsData?.data ?? [];
    const mapped = raw.map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      startTime: s.startTime,
      title: s.title ?? null,
      endTime: s.endTime ?? null,
      totalMessages: s.totalMessages ?? 0,
      categoryTag: s.categoryTag ?? null,
      chat_user: s.chat_user ?? {},
    }));

    return mapped.sort((a: any, b: any) => {
      const aTime = new Date(a.endTime ?? a.startTime).getTime();
      const bTime = new Date(b.endTime ?? b.startTime).getTime();
      return bTime - aTime;
    });
  }, [sessionsData]);

  // --- Draft/placeholder session (only in UI) ---
  const draftSession: Session = useMemo(
    () => ({
      id: null, // UI-only id (never sent to backend)
      user_id: userKey ?? -1,
      title: "New Conversation",
      startTime: new Date().toISOString(),
      endTime: null,
      totalMessages: 0,
      categoryTag: null,
      chat_user: { id: userKey ?? -1 },
    }),
    [userKey]
  );

  // Merge draft with real sessions for display
  const uiSessions: Session[] = useMemo(() => {
    return showDraft ? [draftSession, ...sessions] : sessions;
  }, [showDraft, draftSession, sessions]);

  // --- Auto-select most recent real session if none selected and no draft ---
  useEffect(() => {
    if (!showDraft && !currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [showDraft, sessions, currentSessionId]);

  // --- Start a new chat ---
  const handleNewChat = useCallback(() => {
    setCurrentView("chat");
    setShowDraft(true); // show placeholder row immediately
    setCurrentSessionId(null); // ChatInterface will treat this as "create new on send"
    setSidebarOpen(false); // close drawer if on mobile
  }, []);

  // --- When backend creates/updates a chat, refresh sessions & hide draft ---
  const handleSessionUpdate = useCallback(
    async (sessionId?: number) => {
      if (sessionId) setCurrentSessionId(sessionId);
      setShowDraft(false); // remove placeholder once we have server state
      await refetch();
    },
    [refetch]
  );

  return (
    <div className="md:flex h-screen  bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          sessions={uiSessions}
          currentSessionId={currentSessionId}
          onSessionChange={setCurrentSessionId}
          onNewChat={handleNewChat}
          onClose={() => {}}
          isMobile={false}
        />
      </div>

      {/* Mobile top bar + drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 h-14 flex gap-1 items-center px-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md hover:bg-slate-100 active:scale-95"
          aria-label="Open menu"
        >
          <Menu className="w-8 h-8 text-black" />
        </button>
        <img
          src={aiva}
          alt="Aiva Logo"
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg"
        />
        <div className="text-center  text-xl !font-semibold text-black">
          Aiva
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-80">
            <Sidebar
              currentView={currentView}
              onViewChange={(v) => {
                setCurrentView(v);
                setSidebarOpen(false);
              }}
              sessions={uiSessions}
              currentSessionId={currentSessionId}
              onSessionChange={(id) => {
                setCurrentSessionId(id);
                setSidebarOpen(false);
              }}
              onNewChat={handleNewChat}
              onClose={() => setSidebarOpen(false)}
              isMobile
            />
          </div>
        </div>
      )}
      <div className="h-14 md:h-0"></div>
      {/* Main area */}
      <div className="flex-1 overflow-hidden md:ml-0 md:relative">
        {/* Spacer for mobile topbar */}
        <div className="md:hidden md:h-14" />
        {currentView === "chat" ? (
          <ChatInterface
            sessionId={currentSessionId as any}
            onSessionUpdate={handleSessionUpdate as any}
            refetchSessions={setCurrentSessionId as any}
          />
        ) : (
          <IntegrationsPage />
        )}

        {/* Floating New Chat button (mobile only) */}
        {/* <div
          onClick={handleNewChat}
          className="md:hidden fixed top-3 right-2 z-40 inline-flex  px-4 py-1"
        >
          <SquarePen className="w-5 h-5 !font-semibold !text-black" />
        </div> */}
        <button
          onClick={handleNewChat}
          className="md:hidden fixed top-2.5 right-2 z-40 inline-flex items-center gap-2 rounded-full shadow-lg bg-[#1d4ed8] hover:bg-blue-700 text-white px-4 py-1"
          aria-label="New Chat"
        >
          <SquarePen className="w-4 h-4 !font-semibold !text-white" />
          <span className="font-medium">New </span>
        </button>
      </div>
    </div>
  );
}

// import { useState, useEffect, useCallback, useMemo } from "react";
// import { Sidebar } from "./Sidebar";
// import { ChatInterface } from "../Chat/ChatInterface";
// import { IntegrationsPage } from "../Integrations/IntegrationsPage";
// import { useAuth } from "../../contexts/AuthContext";
// import { useQuery } from "@tanstack/react-query";
// import { chatHistoryFn } from "../../services/chatHistory";

// // ---- Backend Session Type ----
// type Session = {
//   id: number | null;
//   user_id: number;
//   title: string | null;
//   startTime: string;
//   endTime: string | null;
//   totalMessages: number | null;
//   categoryTag: string | null;
//   chat_user: {
//     id: number;
//     name?: string;
//     email?: string;
//   };
// };

// export function Dashboard() {
//   const { user } = useAuth();
//   const userKey = user?.id ?? null;

//   const [currentView, setCurrentView] = useState<"chat" | "integrations">(
//     "chat"
//   );
//   const [currentSessionId, setCurrentSessionId] = useState<any>(null);

//   // show a temporary "New Conversation" row until backend creates the real session
//   const [showDraft, setShowDraft] = useState(false);

//   // --- Fetch sessions from backend ---
//   const { data: sessionsData, refetch } = useQuery({
//     queryKey: ["chatHistory", userKey],
//     queryFn: () => chatHistoryFn({ page: 1, limit: 10 }),
//     enabled: !!userKey,
//   });

//   // --- Normalize + sort sessions (newest first) ---
//   const sessions: Session[] = useMemo(() => {
//     const raw = Array.isArray(sessionsData)
//       ? sessionsData
//       : sessionsData?.data ?? [];
//     const mapped = raw.map((s: any) => ({
//       id: s.id,
//       user_id: s.user_id,
//       startTime: s.startTime,
//       title: s.title ?? null,
//       endTime: s.endTime ?? null,
//       totalMessages: s.totalMessages ?? 0,
//       categoryTag: s.categoryTag ?? null,
//       chat_user: s.chat_user ?? {},
//     }));

//     return mapped.sort((a: any, b: any) => {
//       const aTime = new Date(a.endTime ?? a.startTime).getTime();
//       const bTime = new Date(b.endTime ?? b.startTime).getTime();
//       return bTime - aTime;
//     });
//   }, [sessionsData]);

//   // --- Draft/placeholder session (only in UI) ---
//   const draftSession: Session = useMemo(
//     () => ({
//       id: null, // UI-only id (never sent to backend)
//       user_id: userKey ?? -1,
//       title: "New Conversation",
//       startTime: new Date().toISOString(),
//       endTime: null,
//       totalMessages: 0,
//       categoryTag: null,
//       chat_user: { id: userKey ?? -1 },
//     }),
//     [userKey]
//   );

//   // Merge draft with real sessions for display
//   const uiSessions: Session[] = useMemo(() => {
//     return showDraft ? [draftSession, ...sessions] : sessions;
//   }, [showDraft, draftSession, sessions]);

//   // --- Auto-select most recent real session if none selected and no draft ---
//   useEffect(() => {
//     if (!showDraft && !currentSessionId && sessions.length > 0) {
//       setCurrentSessionId(sessions[0].id);
//     }
//   }, [showDraft, sessions, currentSessionId]);

//   // --- Start a new chat (backend will create when first message is sent) ---
//   const handleNewChat = useCallback(() => {
//     setCurrentView("chat");
//     setShowDraft(true); // show placeholder row immediately
//     setCurrentSessionId(null); // ChatInterface will treat this as "create new on send"
//   }, []);

//   // console.log("Rendering Dashboard with currentSessionId:", currentSessionId);
//   // --- When backend creates/updates a chat, refresh sessions & hide draft ---
//   const handleSessionUpdate = useCallback(
//     async (sessionId?: number) => {
//       if (sessionId) setCurrentSessionId(sessionId);
//       setShowDraft(false); // remove placeholder once we have server state
//       await refetch();
//     },
//     [refetch]
//   );

//   return (
//     <div className="flex h-screen bg-slate-50">
//       <Sidebar
//         currentView={currentView}
//         onViewChange={setCurrentView}
//         sessions={uiSessions}
//         currentSessionId={currentSessionId}
//         onSessionChange={setCurrentSessionId}
//         onNewChat={handleNewChat}
//       />

//       <div className="flex-1 overflow-hidden">
//         {currentView === "chat" ? (
//           <ChatInterface
//             sessionId={currentSessionId as any} // ChatInterface expects string|null in your code; cast if needed
//             onSessionUpdate={handleSessionUpdate as any}
//             refetchSessions={setCurrentSessionId as any}
//           />
//         ) : (
//           <IntegrationsPage />
//         )}
//       </div>
//     </div>
//   );
// }
