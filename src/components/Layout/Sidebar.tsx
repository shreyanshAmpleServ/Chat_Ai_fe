import { MessageSquare, Plus, Settings, LogOut, Database } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarProps {
  currentView: "chat" | "integrations";
  onViewChange: (view: "chat" | "integrations") => void;
  // sessions: Array<{ id: string; title: string; updated_at: string }>;
  sessions: Array<any>;
  currentSessionId: Number | null;
  onSessionChange: (currentSessionId: Number) => void;
  onNewChat: () => void;
}

export function Sidebar({
  currentView,
  onViewChange,
  sessions,
  currentSessionId,
  onSessionChange,
  onNewChat,
}: SidebarProps) {
  const { user, logout } = useAuth();
  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">AI Assistant</h2>
            <p className="text-xs text-slate-400 truncate">{user?.company}</p>
          </div>
        </div>

        <button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <button
          onClick={() => onViewChange("chat")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            currentView === "chat"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-medium">Conversations</span>
        </button>

        {/* <button
          onClick={() => onViewChange("integrations")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            currentView === "integrations"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Integrations</span>
        </button> */}

        {currentView === "chat" && sessions.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-800">
            <p className="text-xs font-medium text-slate-500 px-3 mb-2">
              Recent Chats
            </p>
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSessionChange(session.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentSessionId === session.id
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <p className="truncate">{session.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
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
    </div>
  );
}
