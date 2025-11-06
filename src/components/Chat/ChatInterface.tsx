import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Send, Loader2, Sparkles, Database } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { askQuestionFn, chatDetailFn } from "../../services/chatHistory";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

interface ChatInterfaceProps {
  sessionId: string | null;
  onSessionUpdate: () => void; // parent will refetch sessions & select latest
  refetchSessions: (sessionId: any) => void; // parent will refetch sessions & select latest
}
interface AnswerBlockProps {
  d: {
    aiAnswer: string;
  };
}

type ChatDetail = {
  id: number;
  chatId: number;
  question: string;
  aiAnswer: string;
  sql_code?: string | null;
  categoryTag?: string | null;
  createdAt: string;
  updatedAt: string;
};

const categoryList = [
  {
    title: "Sales Analytics",
    description: "Track revenue, top customers, and sales trends",
  },
  {
    title: "Inventory Management",
    description: "Monitor stock levels and product movement",
  },
  {
    title: "Purchase Orders",
    description: "Track orders, suppliers, and procurement",
  },
  {
    title: "Financial Reports",
    description: "Generate P&L, balance sheets, and more",
  },
];

export function ChatInterface({
  sessionId,
  onSessionUpdate,
  refetchSessions,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [category, setCategory] = useState<string>("");
  // const [toast, setToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ----- Load chat details from backend -----
  const {
    data: chatDetailsResp,
    isLoading: detailsLoading,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ["chatDetails", sessionId],
    queryFn: () => chatDetailFn(Number(sessionId)),
    enabled: !!sessionId,
  });

  // Normalize details array
  const details: ChatDetail[] = useMemo(() => {
    const arr =
      (chatDetailsResp as any)?.data?.ChatDetails ??
      (Array.isArray(chatDetailsResp) ? chatDetailsResp : []) ??
      [];
    return arr as ChatDetail[];
  }, [chatDetailsResp]);

  // Reset category only when user switches to an existing session (optional)
  useEffect(() => {
    // Keep the chosen category when starting a new chat (sessionId === null)
    // Reset it when switching to an existing session
    if (sessionId) setCategory("");
  }, [sessionId]);

  // ----- Send message via backend -----
  const { mutateAsync: sendMessage, isPending: sending } = useMutation({
    mutationFn: askQuestionFn as unknown as (args: {
      question: string;
      chatId?: string | number | null;
      userId: string | number;
      categoryTag?: string | null;
    }) => Promise<any>,
    onSuccess: async (data) => {
      if (sessionId) await refetchDetails(); // existing chat → reload messages
      console.log("sendMessage onSuccess data:", data);
      if (sessionId === null) {
        // new chat → refetch sessions and select latest
        refetchSessions(data?.data?.chatId);
      }
      onSessionUpdate(); // parent will refetch sessions; if new chat, it will select it
    },
  });

  // ---- Auto-scroll on new messages ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [details, sending]);

  // ---- Toast helper ----
  const showToast = useCallback((msg: string) => {
    // setToast(msg);
    toast.error(msg);
    // setTimeout(() => setToast(null), 2500);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !user) return;

    // If it's a NEW conversation (no sessionId yet), force category selection
    if (!sessionId && !category) {
      toast.error(
        "Please select a category before sending your first message."
      );
      return;
    }

    const payload = {
      question: input.trim(),
      chatId: sessionId ? Number(sessionId) : undefined, // let backend create if undefined
      userId: user.id,
      categoryTag: category || undefined,
    };

    setInput("");
    await sendMessage(payload);
  }, [input, user, sessionId, category, sendMessage, showToast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Header */}
      <div className="border-b flex gap-3 border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
            <Database className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            SAP Business One Assistant
          </h1>
          <p className="text-sm text-slate-500">
            Ask anything about your enterprise data
          </p>
        </div>
      </div>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* If no session yet OR no messages in an existing session, show helpful starter */}
        {detailsLoading && (sessionId ? details.length === 0 : true) ? (
          <div className="flex justify-start">
            <div className="bg-slate-50 rounded-2xl px-6 py-4 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading conversation…</span>
              </div>
            </div>
          </div>
        ) : details.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-8 border border-blue-100">
                <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-3">
                  Enterprise Intelligence at Your Fingertips
                </h3>
                <p className="text-slate-600 mb-6">
                  Query your SAP Business One database using natural language.
                  Get instant insights on sales, inventory, purchases, and more.
                </p>

                {/* Category quick-picks are available even before first send */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {categoryList.map((item) => (
                    <div
                      key={item.title}
                      onClick={() => setCategory(item.title)}
                      className={`bg-white rounded-lg p-4 cursor-pointer text-left border border-slate-200 ${
                        item.title === category
                          ? "shadow-lg border-blue-600 bg-gradient-to-br from-pink-100 via-blue-50 to-white"
                          : ""
                      }`}
                    >
                      <p className="font-medium text-slate-800 mb-1">
                        {item.title}
                      </p>
                      <p className="text-slate-600 text-xs">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          details.map((d) => (
            <div key={d.id} className="space-y-3">
              {/* User bubble */}
              <div className="flex justify-end">
                <div className="max-w-3xl rounded-2xl px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {d.question}
                  </p>
                  {d.sql_code && (
                    <div className="mt-3 pt-3 border-t border-blue-300/40">
                      <p className="text-xs font-medium mb-2 text-blue-50">
                        Generated SQL:
                      </p>
                      <code className="text-xs bg-slate-800 text-slate-100 p-2 rounded block overflow-x-auto">
                        {d.sql_code}
                      </code>
                    </div>
                  )}
                </div>
              </div>
              {/* Assistant bubble */}
              <div className="flex justify-start">
                <div className="max-w-3xl rounded-2xl px-6 py-4 bg-slate-50 text-slate-800 border border-slate-200">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: (props) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          />
                        ),
                        code({
                          inline,
                          children,
                          ...props
                        }: {
                          inline?: boolean;
                          children?: React.ReactNode;
                        }) {
                          return inline ? (
                            <code
                              className="bg-gray-200 px-1 py-0.5 rounded text-sm"
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm">
                              <code {...props}>{children}</code>
                            </pre>
                          );
                        },
                      }}
                    >
                      {d.aiAnswer}
                    </ReactMarkdown>
                  </p>
                </div>
              </div>
            </div>
          ))
        )}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-50 rounded-2xl px-6 py-4 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyzing your query...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Composer */}
      <div className="border-t border-slate-200 bg-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* If no session yet, show the chosen category (and allow changing) near the input */}
          {!sessionId && (
            <div className="mb-3 flex flex-wrap gap-2">
              {categoryList.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setCategory(item.title)}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    category === item.title
                      ? "border-blue-600 text-blue-700 bg-blue-50"
                      : "border-slate-300 text-slate-600 bg-white"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !sessionId
                  ? "Pick a category and ask your first question…"
                  : "Ask about your business data… (e.g., 'Show me top customers this month')"
              }
              className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              rows={1}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>

      {/* {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )} */}
    </div>
  );
}
