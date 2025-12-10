import React, { useState, useMemo } from "react";
import { MessageSquare, Plus, LogOut, Trash2, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteChatHistoryFn } from "../../services/chatHistory";
import { DeleteConfirmation } from "../DeleteConfirmation";
import aiva from "../../Assets/aiva-light.png";
import aiva2 from "../../Assets/aiva.png";

interface SidebarProps {
  currentView: "chat" | "integrations";
  onViewChange: (view: "chat" | "integrations") => void;
  sessions: Array<any>;
  currentSessionId: Number | null;
  onSessionChange: (currentSessionId: Number | any) => void;
  onNewChat: () => void;
  onClose: () => void; // NEW: for mobile drawer close
  isMobile?: boolean; // NEW
}

export function Sidebar({
  currentView,
  onViewChange,
  sessions,
  currentSessionId,
  onSessionChange,
  onNewChat,
  onClose,
  isMobile = false,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const qc = useQueryClient();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const target = useMemo(
    () => sessions.find((s) => s.id === targetId),
    [sessions, targetId]
  );

  const { mutateAsync: deleteHistory, isPending } = useMutation({
    mutationFn: deleteChatHistoryFn as unknown as (id: number) => Promise<any>,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["chatHistory"] });
      if (targetId && Number(currentSessionId) === targetId) {
        const next = sessions.find((s) => s.id !== targetId);
        onSessionChange(next ? next.id : (null as any));
      }
    },
  });

  const openConfirm = (id: number) => {
    setTargetId(id);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setTargetId(null);
  };

  const handleConfirmDelete = async () => {
    if (!targetId) return;
    await deleteHistory(targetId);
    closeConfirm();
  };

  return (
    <div
      className={
        isMobile
          ? "h-full bg-slate-900 text-white flex flex-col shadow-xl"
          : "w-64 bg-slate-900 text-white flex flex-col h-screen"
      }
      role={isMobile ? "dialog" : undefined}
      aria-modal={isMobile || undefined}
    >
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* <div className="bg-white "> */}
          {/* <img
              src="https://demo.dcclogsuite.com/ng/1.1/assets/images/ai_logo.png"
              alt="Logo"
              className="w-7 h-7"
            /> */}
          {/* <img src={aiva} alt="Logo" className="w-7 h-7" /> */}
          <img src={aiva2} alt="Logo" className="w-10 h-10 rounded-lg" />
          {/* </div> */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">AI Assistant</h2>
            <p className="text-xs text-slate-400 truncate">{user?.company}</p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4">
        <button
          onClick={() => {
            onNewChat();
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {/* <button
          onClick={() => onViewChange("chat")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            currentView === "chat"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-medium">Conversations</span>
        </button> */}

        {currentView === "chat" && sessions.length > 0 && (
          <div className="pt-4 mt-2 border-t border-slate-800">
            <p className="text-xs font-medium text-slate-500 px-3 mb-2">
              Recent Chats
            </p>
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between px-3 pr-0 py-2 rounded-lg ${
                    Number(currentSessionId) === session.id
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <button
                    onClick={() => onSessionChange(session.id)}
                    className="flex-1 text-left truncate text-sm"
                    title={session.title || "Conversation"}
                  >
                    {session.title || "Conversation"}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfirm(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 p-1 rounded"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium capitalize">
              {user?.username?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate capitalize">
              {user?.username}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
      <DeleteConfirmation
        confirmOpen={confirmOpen}
        closeConfirm={closeConfirm}
        target={target}
        handleConfirmDelete={handleConfirmDelete}
        isPending={isPending}
      />
    </div>
  );
}

// import {
//   MessageSquare,
//   Plus,
//   Settings,
//   LogOut,
//   Database,
//   Trash2,
//   X,
// } from "lucide-react";
// import { useAuth } from "../../contexts/AuthContext";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { deleteChatHistoryFn } from "../../services/chatHistory";
// import { useState, useMemo } from "react";
// import { DeleteConfirmation } from "../DeleteConfirmation";

// interface SidebarProps {
//   currentView: "chat" | "integrations";
//   onViewChange: (view: "chat" | "integrations") => void;
//   sessions: Array<any>;
//   currentSessionId: Number | null;
//   onSessionChange: (currentSessionId: Number | any) => void;
//   onNewChat: () => void;
// }

// export function Sidebar({
//   currentView,
//   onViewChange,
//   sessions,
//   currentSessionId,
//   onSessionChange,
//   onNewChat,
// }: SidebarProps) {
//   const { user, logout } = useAuth();
//   const qc = useQueryClient();

//   const [confirmOpen, setConfirmOpen] = useState(false);
//   const [targetId, setTargetId] = useState<number | null>(null);
//   const target = useMemo(
//     () => sessions.find((s) => s.id === targetId),
//     [sessions, targetId]
//   );

//   const { mutateAsync: deleteHistory, isPending } = useMutation({
//     mutationFn: deleteChatHistoryFn as unknown as (id: number) => Promise<any>,
//     onSuccess: async () => {
//       // refresh chat history list everywhere
//       await qc.invalidateQueries({ queryKey: ["chatHistory"] });
//       // if the deleted one was selected, move selection to the next available session (if any)
//       if (targetId && Number(currentSessionId) === targetId) {
//         const next = sessions.find((s) => s.id !== targetId);
//         onSessionChange(next ? next.id : (null as any));
//       }
//     },
//   });

//   const openConfirm = (id: number) => {
//     setTargetId(id);
//     setConfirmOpen(true);
//   };

//   const closeConfirm = () => {
//     setConfirmOpen(false);
//     setTargetId(null);
//   };

//   const handleConfirmDelete = async () => {
//     if (!targetId) return;
//     await deleteHistory(targetId);
//     closeConfirm();
//   };

//   return (
//     <div className="w-64 bg-slate-900 text-white flex flex-col h-screen">
//       <div className="p-4 border-b border-slate-800">
//         <div className="flex items-center gap-3 mb-4">
//           <div className="bg-white p-1 rounded-lg">
//             {/* <Database className="w-5 h-5" /> */}
//             <img
//               src="https://demo.dcclogsuite.com/ng/1.1/assets/images/ai_logo.png"
//               alt="Logo"
//               className="w-7 h-7"
//             />
//           </div>
//           <div className="flex-1 min-w-0">
//             <h2 className="font-semibold text-sm truncate">AI Assistant</h2>
//             <p className="text-xs text-slate-400 truncate">{user?.company}</p>
//           </div>
//         </div>

//         <button
//           onClick={onNewChat}
//           className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
//         >
//           <Plus className="w-4 h-4" />
//           New Chat
//         </button>
//       </div>

//       <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-transparent">
//         <button
//           onClick={() => onViewChange("chat")}
//           className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
//             currentView === "chat"
//               ? "bg-slate-800 text-white"
//               : "text-slate-400 hover:text-white hover:bg-slate-800/50"
//           }`}
//         >
//           <MessageSquare className="w-4 h-4" />
//           <span className="text-sm font-medium">Conversations</span>
//         </button>

//         {currentView === "chat" && sessions.length > 0 && (
//           <div className="pt-4 mt-4 border-t border-slate-800">
//             <p className="text-xs font-medium text-slate-500 px-3 mb-2">
//               Recent Chats
//             </p>
//             <div className="space-y-1 ">
//               {sessions.map((session) => (
//                 <div
//                   key={session.id}
//                   className={`group flex items-center justify-between px-3 pr-0 py-2 rounded-lg ${
//                     Number(currentSessionId) === session.id
//                       ? "bg-slate-800 text-white px-2 pr-0 py-1 rounded"
//                       : "text-slate-400 hover:text-white"
//                   }`}
//                 >
//                   <button
//                     onClick={() => onSessionChange(session.id)}
//                     className={`flex-1 text-left truncate text-sm transition-colors ${
//                       Number(currentSessionId) === session.id
//                         ? "bg-slate-800 text-white px-2 pr-0 py-1 rounded"
//                         : "text-slate-400 hover:text-white"
//                     }`}
//                     title={session.title || "Conversation"}
//                   >
//                     {session.title || "Conversation"}
//                   </button>

//                   {/* Hover delete button */}
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       openConfirm(session.id);
//                     }}
//                     className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 p-1 rounded"
//                     title="Delete conversation"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </nav>

//       <div className="p-4 border-t border-slate-800">
//         <div className="flex items-center gap-3 mb-3">
//           <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center">
//             <span className="text-sm font-medium capitalize">
//               {user?.username?.charAt(0) || "U"}
//             </span>
//           </div>
//           <div className="flex-1 min-w-0">
//             <p className="text-sm font-medium truncate capitalize">
//               {user?.username}
//             </p>
//             <p className="text-xs text-slate-400 truncate">{user?.email}</p>
//           </div>
//         </div>

//         <button
//           onClick={logout}
//           className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
//         >
//           <LogOut className="w-4 h-4" />
//           Sign Out
//         </button>
//       </div>
//       <DeleteConfirmation
//         confirmOpen={confirmOpen}
//         closeConfirm={closeConfirm}
//         target={target}
//         handleConfirmDelete={handleConfirmDelete}
//         isPending={isPending}
//       />
//     </div>
//   );
// }
