import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Send, Loader2, Sparkles, Clock, Copy, Check } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { askQuestionFn, chatDetailFn } from "../../services/chatHistory";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import aiva from "../../assets/aiva.png";
import rehypeRaw from "rehype-raw";

/* =========================
   Date formatting helpers
   ========================= */
const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toDDMMYYYY(y: number, m: number, d: number) {
  return `${pad(d)}-${pad(m)}-${y}`;
}

// Replace dates in common formats with DD-MM-YYYY.
function formatDatesInMarkdown(text: string): any {
  let out = text;

  // ISO-like 2025-11-06T... → 06-11-2025
  out = out.replace(
    /\b(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/g,
    (_, y, m, d) => toDDMMYYYY(Number(y), Number(m), Number(d))
  );

  // YYYY-MM-DD → DD-MM-YYYY
  out = out.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, y, m, d) =>
    toDDMMYYYY(Number(y), Number(m), Number(d))
  );

  // YYYY/MM/DD → DD-MM-YYYY
  out = out.replace(/\b(\d{4})\/(\d{1,2})\/(\d{1,2})\b/g, (_, y, m, d) =>
    toDDMMYYYY(Number(y), Number(m), Number(d))
  );

  // "Nov 6, 2025" / "November 6, 2025" → 06-11-2025
  out = out.replace(
    /\b([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})\b/g,
    (_, mon, d, y) => {
      const m = MONTHS[mon.toLowerCase()];
      if (!m) return `${mon} ${d}, ${y}`;
      return toDDMMYYYY(Number(y), m, Number(d));
    }
  );

  return out;
}
function extractAndReplaceDataImages(md: string) {
  if (!md) return md;

  // Replace markdown images: ![alt](data:image/png;base64,AAAA...)
  md = md.replace(
    /!\[([^\]]*)\]\(\s*(data:image\/[a-zA-Z]+;base64,[^)]+)\s*\)/g,
    (_match, alt, dataUri) => {
      const cleaned = dataUri.trim();
      if (cleaned.length < 50) return "";
      return `<img alt="${alt || "chart"}" src="${cleaned}" />`;
    }
  );

  // Replace inline HTML images (ensure valid self-closing)
  md = md.replace(
    /<img\s+([^>]*src=["']data:image\/[^>"']+["'][^>]*)>/gi,
    (_match, attrs) => {
      return `<img ${attrs}>`;
    }
  );

  return md;
}
// Replace your existing extractAndReplaceDataImages with this function
function normalizeDataImageTokens(md: string) {
  if (!md) return { cleaned: md, imgs: [] as string[] };

  // 1) Convert markdown images to HTML <img/> inline
  md = md.replace(
    /!\[([^\]]*)\]\(\s*(data:image\/[a-zA-Z0-9.+-]+;base64,[^)]+)\s*\)/g,
    (_m, alt, dataUri) => {
      const cleanedUri = dataUri.replace(/\s+/g, "");
      const safeAlt = (alt || "chart").replace(/"/g, "&quot;");
      return `<img alt="${safeAlt}" src="${cleanedUri}" />`;
    }
  );

  // 2) Normalize inline <img ...> to self-closing <img ... />
  md = md.replace(/<img\s+([^>]*?)>/gi, (_m, attrs) => `<img ${attrs} />`);

  // 3) Now scan lines; if a line contains any <img ... /> (common: table row),
  //    remove that line from the markdown and push the <img> HTML to imgs[]
  const imgs: string[] = [];
  const lines = md.split(/\r?\n/);
  const kept: string[] = [];

  for (const line of lines) {
    // If the line contains '<img' treat it as an image-only line (or image-containing)
    // Extract all <img ... /> occurrences
    const matches = Array.from(
      line.matchAll(/(<img\s+[^>]*src="[^"]+"[^>]*\/>)/gi)
    ).map((m) => m[1]);

    if (matches.length > 0) {
      // collect images and skip adding this line to kept (removes table row)
      matches.forEach((m) => {
        // sanity-check length of src
        const srcMatch = m.match(/src="([^"]+)"/i);
        const src = srcMatch ? srcMatch[1] : "";
        if (src && src.length > 50) imgs.push(m);
      });
      continue; // do not keep the line (removes the table row or cell)
    }

    kept.push(line);
  }

  const cleaned = kept.join("\n");
  return { cleaned, imgs };
}

// Friendly timestamp (DD-MM-YYYY HH:MM)
function formatStamp(iso?: string | null) {
  if (!iso) return "";
  const dt = new Date(iso);
  const dd = pad(dt.getDate());
  const mm = pad(dt.getMonth() + 1);
  const yyyy = dt.getFullYear();
  const hh = pad(dt.getHours());
  const min = pad(dt.getMinutes());
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

/* =========================
   Types & Constants
   ========================= */
interface ChatInterfaceProps {
  sessionId: string | null;
  onSessionUpdate: () => void; // parent will refetch sessions & select latest
  refetchSessions: (sessionId: any) => void; // parent will refetch sessions & select latest
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

/* =========================
   Component
   ========================= */
export function ChatInterface({
  sessionId,
  onSessionUpdate,
  refetchSessions,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [category, setCategory] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // paginated state
  const [messages, setMessages] = useState<ChatDetail[]>([]);
  const [nextCursor, setNextCursor] = useState<string | number | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(false);
  const [loadingOlder, setLoadingOlder] = useState<boolean>(false);
  const PAGE_LIMIT = 10;

  // copy state for showing a tiny "Copied" check per message or sql block
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const markCopied = (key: string) => {
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1200);
  };
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      markCopied(key);
      toast.success("Copied Successfully!");
    } catch {
      toast.error("Copy failed");
    }
  };

  /* === NEW: copy rendered HTML of assistant answer (keeps tables/images formatting) === */
  const renderedRefs = useRef<Record<number, HTMLDivElement | null>>({});

  async function copyRenderedHTML(messageId: number, key: string) {
    const root = renderedRefs.current[messageId];
    if (!root) {
      toast.error("Nothing to copy");
      return;
    }
    const target = root.querySelector("[data-copy='md']") as HTMLElement | null;
    const node = target || root;
    const html = node.innerHTML;
    const text = node.innerText;

    try {
      if ("ClipboardItem" in window) {
        const item = new (window as any).ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        });
        await (navigator.clipboard as any).write([item]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      markCopied(key);
      toast.success("Copied Successfully.");
    } catch {
      toast.error("Copy failed");
    }
  }

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

  // Reset category when switching to an existing session
  useEffect(() => {
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
      if (sessionId) await refetchDetails();
      if (sessionId === null) {
        refetchSessions(data?.data?.chatId);
      }
      onSessionUpdate();
    },
  });

  // ---- Auto-scroll on new messages ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [details, sending]);

  // ---- Toast helper ----
  const showToast = useCallback((msg: string) => {
    toast.error(msg);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !user) return;

    if (!sessionId && !category) {
      showToast("Please select a category before sending your first message.");
      return;
    }

    const payload = {
      question: input.trim(),
      chatId: sessionId ? Number(sessionId) : undefined,
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

  // ==== Mobile: auto-grow textarea up to ~6 rows ====
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = "auto";
    // approx row height 24px + padding; clamp to ~6 rows
    el.style.height = Math.min(el.scrollHeight, 6 * 24 + 32) + "px";
  }, [input]);

  // normalize function to accept legacy and paginated responses
  function normalizeResp(resp: any) {
    // case A: legacy API returned { data: { ChatDetails: [...] } }
    if (resp && resp.data && Array.isArray(resp.data.ChatDetails)) {
      const arr = resp.data.ChatDetails as ChatDetail[];
      // ensure chronological order (old->new)
      const ordered = arr
        .slice()
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      return {
        messages: ordered,
        nextCursor: ordered.length ? ordered[0].id : null,
        hasMore: false,
      };
    }

    // case B: paginated API: { messages: [...], nextCursor, hasMore }
    if (resp && Array.isArray(resp.messages)) {
      return {
        messages: resp.messages as ChatDetail[],
        nextCursor: resp.nextCursor ?? null,
        hasMore: !!resp.hasMore,
      };
    }

    // fallback: try if resp is already an array
    if (Array.isArray(resp)) {
      const ordered = resp
        .slice()
        .sort(
          (a: ChatDetail, b: ChatDetail) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      return {
        messages: ordered,
        nextCursor: ordered.length ? ordered[0].id : null,
        hasMore: false,
      };
    }

    return { messages: [], nextCursor: null, hasMore: false };
  }

  // initial load
  const fetchInitial = useCallback(async (sid?: string | null) => {
    if (!sid) {
      setMessages([]);
      setNextCursor(null);
      setHasMore(false);
      return;
    }
    try {
      setLoadingInitial(true);
      const resp = await chatDetailFn(Number(sid), null, PAGE_LIMIT);
      console.log("fetchInitial resp:", resp);
      const {
        messages: fetched,
        nextCursor: nc,
        hasMore: hm,
      } = normalizeResp(resp);
      console.log("fetchInitial normalized:", { fetched, nc, hm });
      setMessages(fetched);
      setNextCursor(nc ?? null);
      setHasMore(Boolean(hm));
      // scroll to bottom after initial load
      requestAnimationFrame(() => {
        const el = containerRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    } catch (err) {
      console.error("fetchInitial error", err);
      toast.error("Failed to load conversation.");
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  // load older messages (cursor pagination)
  const fetchOlder = useCallback(async () => {
    if (!sessionId || !hasMore || loadingOlder || !nextCursor) return;
    try {
      setLoadingOlder(true);
      const el = containerRef.current;
      const prevScrollHeight = el ? el.scrollHeight : 0;

      const resp = await chatDetailFn(
        Number(sessionId),
        nextCursor,
        PAGE_LIMIT + 10
      );
      const {
        messages: olderMsgs,
        nextCursor: nc,
        hasMore: hm,
      } = normalizeResp(resp);

      if (!olderMsgs || olderMsgs.length === 0) {
        setHasMore(Boolean(hm));
        setNextCursor(nc ?? null);
        return;
      }

      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const deduped = olderMsgs.filter((m) => !ids.has(m.id));
        return [...deduped, ...prev];
      });

      // restore scroll position so viewport remains stable
      requestAnimationFrame(() => {
        const el2 = containerRef.current;
        if (el2) {
          const newScrollHeight = el2.scrollHeight;
          el2.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });

      setNextCursor(nc ?? null);
      setHasMore(Boolean(hm));
    } catch (err) {
      console.error("fetchOlder error", err);
      toast.error("Failed to load older messages.");
    } finally {
      setLoadingOlder(false);
    }
  }, [sessionId, nextCursor, hasMore, loadingOlder]);

  // load initial when sessionId changes
  useEffect(() => {
    fetchInitial(sessionId);
    setCopiedKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // // scroll listener to trigger loadOlder when near top
  // useEffect(() => {
  //   const el = containerRef.current;
  //   if (!el) return;

  //   let ticking = false;
  //   const onScroll = () => {
  //     if (ticking) return;
  //     ticking = true;
  //     requestAnimationFrame(() => {
  //       if (el.scrollTop <= 120 && hasMore && !loadingOlder) {
  //         fetchOlder();
  //       }
  //       ticking = false;
  //     });
  //   };

  //   el.addEventListener("scroll", onScroll, { passive: true });
  //   return () => el.removeEventListener("scroll", onScroll);
  // }, [fetchOlder, hasMore, loadingOlder]);

  // // auto-scroll behavior: if user is near bottom, scroll to bottom on new messages
  // useEffect(() => {
  //   const el = containerRef.current;
  //   if (!el) return;
  //   // console.log(
  //   //   "Checking auto-scroll on new messages...",
  //   //   el.scrollTop,
  //   //   el.scrollHeight,
  //   //   el.clientHeight
  //   // );
  //   const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;

  //   if (atBottom) {
  //     requestAnimationFrame(() => {
  //       el.scrollTop = el.scrollHeight;
  //     });
  //   }
  // }, [messages, sending]);
  console.log("messages:", messages);
  return (
    <div className="h-full flex flex-col bg-white relative w-full max-w-[100vw] overflow-x-hidden">
      {/* Header */}
      <div className=" border-b  lg:flex hidden  gap-3 border-slate-200 bg-white px-4 md:px-6 py-3 md:py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img
            src={aiva}
            alt="Aiva Logo"
            className="w-9 h-9 md:w-10 md:h-10 rounded-lg"
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-slate-800 truncate">
            DCC Enterprise Aiva AI Assistant
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Ask anything about your enterprise data
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        style={{ overscrollBehavior: "contain" }}
        className="flex-1 relative overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6"
      >
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

                {/* Category quick-picks */}
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
          <>
            {/* Optionally show "load older" indicator */}
            {loadingOlder && (
              <div className="flex justify-center">
                <div className="bg-slate-50 rounded-full px-3 py-2 border border-slate-200 text-xs text-slate-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline-block mr-2" />
                  Loading older messages...
                </div>
              </div>
            )}

            {/* <div className="flex justify-center">
              <div
                onClick={() => fetchOlder()}
                className="bg-slate-50 rounded-full px-3 py-2 border border-slate-200 text-xs text-slate-600"
              >
                Click here to get older messages...
              </div>
            </div> */}

            {messages.map((d) => {
              const formattedDate = formatDatesInMarkdown(d.aiAnswer);
              const { cleaned: formatted, imgs } =
                normalizeDataImageTokens(formattedDate);
              // const imgs = normalizeDataImageTokens(formattedDate)?.imgs;
              // console.log("safeMarkdown preview: ", d?.id, formatted);
              const userTime = formatStamp(d.createdAt);
              const aiTime = formatStamp(d.updatedAt || d.createdAt);
              const sqlCopyKey = `sql-${d.id}`;
              const qCopyKey = `q-${d.id}`;
              const ansHtmlCopyKey = `ans-${d.id}-html`;

              return (
                <div key={d.id} className="space-y-3 ">
                  {/* User bubble */}
                  <div className="flex justify-end  my-6">
                    <div className="relative max-w-3xl  min-w-0 rounded-2xl px-6 py-4 pb-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      {/* NEW: Copy question button (same position style) */}
                      <button
                        onClick={() =>
                          copyToClipboard(d.question || "", qCopyKey)
                        }
                        className="absolute right-4 bottom-1.5 inline-flex items-center gap-1 rounded-md border border-white/30 bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                        title="Copy question"
                        type="button"
                      >
                        {copiedKey === qCopyKey ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <p className="whitespace-pre-wrap leading-relaxed break-words pr-14">
                        {d.question}
                      </p>

                      {d.sql_code && (
                        <div className="mt-3 pt-3 border-t border-blue-300/40">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium mb-2 text-blue-50">
                              Generated SQL:
                            </p>
                            <button
                              onClick={() =>
                                copyToClipboard(d.sql_code || "", sqlCopyKey)
                              }
                              className="text-[11px] mb-2 inline-flex items-center gap-1 rounded-md border border-white/30 px-2 py-0.5 hover:bg-white/10"
                              title="Copy SQL"
                              type="button"
                            >
                              {copiedKey === sqlCopyKey ? (
                                <>
                                  <Check className="w-3 h-3" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                          <code className="text-xs bg-slate-800 text-slate-100 p-2 rounded block overflow-x-auto">
                            {d.sql_code}
                          </code>
                        </div>
                      )}

                      {/* time */}
                      <div className="mt-2 flex items-end mr-8 gap-2 text-blue-100/90 text-xs">
                        {/* <Clock className="w-3.5 h-3.5" /> */}
                        <span>{userTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assistant bubble */}
                  <div className="flex justify-start">
                    <div
                      className="relative max-w-3xl  min-w-0 rounded-2xl lg:px-3 lg:py-3  bg-slate-50 text-slate-800 border-2xl lg:border border-slate-200"
                      ref={(el) => {
                        renderedRefs.current[d.id] = el;
                      }}
                    >
                      {/* NEW: Copy rendered HTML of answer (keeps tables/images) */}
                      <button
                        onClick={() => copyRenderedHTML(d.id, ansHtmlCopyKey)}
                        className="absolute right-4 bottom-1.5 inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white/80 px-2 py-1 text-xs text-slate-700 hover:bg-white shadow-sm"
                        title="Copy rendered HTML"
                        type="button"
                      >
                        {copiedKey === ansHtmlCopyKey ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Markdown content */}
                      <div
                        className="max-w-full overflow-x-hidden"
                        data-copy="md"
                      >
                        <article className="prose prose-slate max-w-none md-scroll">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw, rehypeHighlight]}
                            components={{
                              table: (props) => (
                                <div className="md-table-wrap">
                                  <table className="md-table" {...props} />
                                </div>
                              ),
                              thead: (props) => (
                                <thead className="md-thead" {...props} />
                              ),
                              tbody: (props) => (
                                <tbody className="md-tbody" {...props} />
                              ),
                              tr: (props) => (
                                <tr className="md-tr" {...props} />
                              ),
                              th: (props) => (
                                <th className="md-th !text-center" {...props} />
                              ),
                              td: (props) => (
                                <td className="md-td !text-center" {...props} />
                              ),
                              a: (props) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="md-link"
                                />
                              ),
                              // img: ({ src, alt, title }) => {

                              //   // existing fallback if missing
                              //   if (!src || src === "None" || src.trim() === "") {
                              //     return (
                              //       <span className="inline-block rounded px-1 py-0.5 text-xs text-slate-500 bg-slate-100/40">
                              //         Image not available
                              //       </span>
                              //     );
                              //   }
                              //   if (!src || src === "None" || src.trim() === "") {
                              //     return (
                              //       <span className="inline-block rounded px-1 py-0.5 text-xs text-slate-500 bg-slate-100/40">
                              //         Image not available
                              //       </span>
                              //     );
                              //   }

                              //   // const isData =
                              //   //   typeof src === "string" &&
                              //   //   src.startsWith("data:image/");
                              //   let finalSrc = src;

                              //   // OPTIONAL: if CSP blocks data:, uncomment this to convert to blob:
                              //   // if (isData) finalSrc = base64ToBlobUrl(src);

                              //   return (
                              //     <img
                              //       src={finalSrc}
                              //       alt={alt ?? ""}
                              //       title={title ?? ""}
                              //       className="md-img max-w-full rounded inline-block"
                              //       style={{
                              //         display: "inline-block",
                              //         maxWidth: "100%",
                              //       }}
                              //     />
                              //   );
                              // },
                              img: (props) => (
                                <div className="md-img-container">
                                  {" "}
                                  <img {...props} className="md-img" />{" "}
                                </div>
                              ),
                              p: (props) => (
                                <p className="md-table-p" {...props} />
                              ),
                              code({
                                inline,
                                children,
                                ...props
                              }: {
                                inline?: boolean;
                                children?: React.ReactNode;
                              } & any) {
                                return inline ? (
                                  <code className="md-code-inline" {...props}>
                                    {children}
                                  </code>
                                ) : (
                                  <pre className="md-code-block">
                                    <code {...props}>{children}</code>
                                  </pre>
                                );
                              },
                            }}
                          >
                            {formatted}
                          </ReactMarkdown>
                          {/* Render any extracted images below the markdown (kept out of tables) */}
                          {imgs && imgs.length > 0 && (
                            <div className="mt-1 flex flex-col gap-3">
                              {imgs.map((imgHtml, i) => {
                                // Prefer parsing the src/alt instead of dangerouslySetInnerHTML
                                const srcMatch =
                                  imgHtml.match(/src="([^"]+)"/i);
                                const altMatch =
                                  imgHtml.match(/alt="([^"]*)"/i);
                                const src = srcMatch ? srcMatch[1] : "";
                                const alt = altMatch
                                  ? altMatch[1]
                                  : `image-${i}`;

                                // If you have CSP issues with data: URIs, convert here using base64ToBlobUrl(src)
                                // const finalSrc = src.startsWith("data:") ? base64ToBlobUrl(src) : src;
                                const finalSrc = src;

                                return (
                                  <img
                                    key={i}
                                    src={finalSrc}
                                    alt={alt}
                                    className="max-w-full rounded border border-slate-200 shadow-sm"
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      height: "auto",
                                      objectFit: "contain",
                                    }}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </article>
                      </div>

                      {/* time */}
                      <div className="mb-2 lg:mb-0 mt-3 md:mt-2 flex items-center gap-2 text-slate-500 text-xs">
                        {/* <Clock className="w-3.5 ml-2 h-3.5" /> */}
                        <span>{aiTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
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
      <div className="h-14 md:h-20"></div>
      {/* Composer */}
      <div className="fixed md:absolute bottom-0 w-full">
        <div className="border-t border-slate-200 bg-white p-3 md:p-3 sticky bottom-0 z-10 [padding-bottom:env(safe-area-inset-bottom)]">
          <div className="max-w-4xl mx-auto">
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

            <div className="flex items-end  gap-2 z-50 pb-2.5 lg:mb-0 md:gap-3">
              <textarea
                ref={textAreaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !sessionId
                    ? "Pick a category and ask your first question…"
                    : "Ask about your business data…"
                }
                className="scrollbar-hide flex-1 max-h-32 md:max-h-56 resize-none rounded-xl border border-slate-300 px-3 md:px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm md:text-base"
                rows={1}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-3 max-h-12 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="text-[11px] md:text-xs md:flex hidden justify-center text-slate-500  text-center">
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// import React, {
//   useState,
//   useEffect,
//   useRef,
//   useMemo,
//   useCallback,
// } from "react";
// import {
//   Send,
//   Loader2,
//   Sparkles,
//   Database,
//   Clock,
//   Copy,
//   Check,
// } from "lucide-react";
// import { useAuth } from "../../contexts/AuthContext";
// import { useMutation, useQuery } from "@tanstack/react-query";
// import { askQuestionFn, chatDetailFn } from "../../services/chatHistory";
// import toast from "react-hot-toast";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import rehypeHighlight from "rehype-highlight";
// import "highlight.js/styles/github.css";
// import aiva from "../../assets/aiva.png";

// // --- Date formatting helpers ---
// const MONTHS: Record<string, number> = {
//   jan: 1,
//   january: 1,
//   feb: 2,
//   february: 2,
//   mar: 3,
//   march: 3,
//   apr: 4,
//   april: 4,
//   may: 5,
//   jun: 6,
//   june: 6,
//   jul: 7,
//   july: 7,
//   aug: 8,
//   august: 8,
//   sep: 9,
//   sept: 9,
//   september: 9,
//   oct: 10,
//   october: 10,
//   nov: 11,
//   november: 11,
//   dec: 12,
//   december: 12,
// };

// function pad(n: number) {
//   return String(n).padStart(2, "0");
// }

// function toDDMMYYYY(y: number, m: number, d: number) {
//   return `${pad(d)}-${pad(m)}-${y}`;
// }

// // Replace dates in common formats with DD-MM-YYYY.
// function formatDatesInMarkdown(text: string): any {
//   let out = text;

//   // ISO-like 2025-11-06T... → 06-11-2025
//   out = out.replace(
//     /\b(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/g,
//     (_, y, m, d) => toDDMMYYYY(Number(y), Number(m), Number(d))
//   );

//   // YYYY-MM-DD → DD-MM-YYYY
//   out = out.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, y, m, d) =>
//     toDDMMYYYY(Number(y), Number(m), Number(d))
//   );

//   // YYYY/MM/DD → DD-MM-YYYY
//   out = out.replace(/\b(\d{4})\/(\d{1,2})\/(\d{1,2})\b/g, (_, y, m, d) =>
//     toDDMMYYYY(Number(y), Number(m), Number(d))
//   );

//   // "Nov 6, 2025" / "November 6, 2025" → 06-11-2025
//   out = out.replace(
//     /\b([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})\b/g,
//     (_, mon, d, y) => {
//       const m = MONTHS[mon.toLowerCase()];
//       if (!m) return `${mon} ${d}, ${y}`;
//       return toDDMMYYYY(Number(y), m, Number(d));
//     }
//   );
//   return out;
// }

// // NEW: friendly timestamp for bubbles (DD-MM-YYYY HH:MM)
// function formatStamp(iso?: string | null) {
//   if (!iso) return "";
//   const dt = new Date(iso);
//   const dd = pad(dt.getDate());
//   const mm = pad(dt.getMonth() + 1);
//   const yyyy = dt.getFullYear();
//   const hh = pad(dt.getHours());
//   const min = pad(dt.getMinutes());
//   return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
// }

// interface ChatInterfaceProps {
//   sessionId: string | null;
//   onSessionUpdate: () => void; // parent will refetch sessions & select latest
//   refetchSessions: (sessionId: any) => void; // parent will refetch sessions & select latest
// }

// type ChatDetail = {
//   id: number;
//   chatId: number;
//   question: string;
//   aiAnswer: string;
//   sql_code?: string | null;
//   categoryTag?: string | null;
//   createdAt: string;
//   updatedAt: string;
// };

// const categoryList = [
//   {
//     title: "Sales Analytics",
//     description: "Track revenue, top customers, and sales trends",
//   },
//   {
//     title: "Inventory Management",
//     description: "Monitor stock levels and product movement",
//   },
//   {
//     title: "Purchase Orders",
//     description: "Track orders, suppliers, and procurement",
//   },
//   {
//     title: "Financial Reports",
//     description: "Generate P&L, balance sheets, and more",
//   },
// ];

// export function ChatInterface({
//   sessionId,
//   onSessionUpdate,
//   refetchSessions,
// }: ChatInterfaceProps) {
//   const { user } = useAuth();
//   const [input, setInput] = useState("");
//   const [category, setCategory] = useState<string>("");
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // copy state for showing a tiny "Copied" check per message or sql block
//   const [copiedKey, setCopiedKey] = useState<string | null>(null);
//   const markCopied = (key: string) => {
//     setCopiedKey(key);
//     setTimeout(() => setCopiedKey(null), 1200);
//   };
//   const copyToClipboard = async (text: string, key: string) => {
//     try {
//       await navigator.clipboard.writeText(text);
//       markCopied(key);
//       toast.success("Copiec Successfully !");
//     } catch {
//       toast.error("Copy failed");
//     }
//   };

//   // ----- Load chat details from backend -----
//   const {
//     data: chatDetailsResp,
//     isLoading: detailsLoading,
//     refetch: refetchDetails,
//   } = useQuery({
//     queryKey: ["chatDetails", sessionId],
//     queryFn: () => chatDetailFn(Number(sessionId)),
//     enabled: !!sessionId,
//   });

//   // Normalize details array
//   const details: ChatDetail[] = useMemo(() => {
//     const arr =
//       (chatDetailsResp as any)?.data?.ChatDetails ??
//       (Array.isArray(chatDetailsResp) ? chatDetailsResp : []) ??
//       [];
//     return arr as ChatDetail[];
//   }, [chatDetailsResp]);

//   // Reset category when switching to an existing session
//   useEffect(() => {
//     if (sessionId) setCategory("");
//   }, [sessionId]);

//   // ----- Send message via backend -----
//   const { mutateAsync: sendMessage, isPending: sending } = useMutation({
//     mutationFn: askQuestionFn as unknown as (args: {
//       question: string;
//       chatId?: string | number | null;
//       userId: string | number;
//       categoryTag?: string | null;
//     }) => Promise<any>,
//     onSuccess: async (data) => {
//       if (sessionId) await refetchDetails();
//       if (sessionId === null) {
//         refetchSessions(data?.data?.chatId);
//       }
//       onSessionUpdate();
//     },
//   });

//   // ---- Auto-scroll on new messages ----
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView();
//     // messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [details, sending]);

//   // ---- Toast helper ----
//   const showToast = useCallback((msg: string) => {
//     toast.error(msg);
//   }, []);

//   const handleSend = useCallback(async () => {
//     if (!input.trim() || !user) return;

//     if (!sessionId && !category) {
//       showToast("Please select a category before sending your first message.");
//       return;
//     }

//     const payload = {
//       question: input.trim(),
//       chatId: sessionId ? Number(sessionId) : undefined,
//       userId: user.id,
//       categoryTag: category || undefined,
//     };

//     setInput("");
//     await sendMessage(payload);
//   }, [input, user, sessionId, category, sendMessage, showToast]);

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   return (
//     <div className="h-full flex flex-col bg-white relative">
//       {/* Header */}
//       <div className="border-b flex gap-3 border-slate-200 bg-white px-6 py-4">
//         <div className="flex items-center gap-3">
//           <img src={aiva} alt="Aiva Logo" className="w-10 h-10 rounded-lg" />
//         </div>
//         <div>
//           <h1 className="text-lg font-semibold text-slate-800">
//             DCC Enterprise Aiva AI Assistant
//           </h1>
//           <p className="text-sm text-slate-500">
//             Ask anything about your enterprise data
//           </p>
//         </div>
//       </div>

//       {/* Messages area */}
//       <div className="flex-1 overflow-y-auto p-6 space-y-6">
//         {detailsLoading && (sessionId ? details.length === 0 : true) ? (
//           <div className="flex justify-start">
//             <div className="bg-slate-50 rounded-2xl px-6 py-4 border border-slate-200">
//               <div className="flex items-center gap-2 text-slate-600">
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 <span className="text-sm">Loading conversation…</span>
//               </div>
//             </div>
//           </div>
//         ) : details.length === 0 ? (
//           <div className="h-full flex items-center justify-center">
//             <div className="max-w-2xl mx-auto text-center space-y-6">
//               <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-8 border border-blue-100">
//                 <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
//                 <h3 className="text-xl font-semibold text-slate-800 mb-3">
//                   Enterprise Intelligence at Your Fingertips
//                 </h3>
//                 <p className="text-slate-600 mb-6">
//                   Query your SAP Business One database using natural language.
//                   Get instant insights on sales, inventory, purchases, and more.
//                 </p>

//                 {/* Category quick-picks */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
//                   {categoryList.map((item) => (
//                     <div
//                       key={item.title}
//                       onClick={() => setCategory(item.title)}
//                       className={`bg-white rounded-lg p-4 cursor-pointer text-left border border-slate-200 ${
//                         item.title === category
//                           ? "shadow-lg border-blue-600 bg-gradient-to-br from-pink-100 via-blue-50 to-white"
//                           : ""
//                       }`}
//                     >
//                       <p className="font-medium text-slate-800 mb-1">
//                         {item.title}
//                       </p>
//                       <p className="text-slate-600 text-xs">
//                         {item.description}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         ) : (
//           details.map((d) => {
//             // NOTE: no hooks in here. Do simple formatting call per item.
//             const formatted = formatDatesInMarkdown(d.aiAnswer);
//             const userTime = formatStamp(d.createdAt);
//             const aiTime = formatStamp(d.updatedAt || d.createdAt);
//             const sqlCopyKey = `sql-${d.id}`;
//             const answerCopyKey = `ans-${d.id}`;

//             return (
//               <div key={d.id} className="space-y-3">
//                 {/* User bubble */}
//                 <div className="flex justify-end">
//                   <div className="max-w-3xl rounded-2xl px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
//                     <p className="whitespace-pre-wrap leading-relaxed">
//                       {d.question}
//                     </p>

//                     {d.sql_code && (
//                       <div className="mt-3 pt-3 border-t border-blue-300/40">
//                         <div className="flex items-center justify-between gap-2">
//                           <p className="text-xs font-medium mb-2 text-blue-50">
//                             Generated SQL:
//                           </p>
//                           <button
//                             onClick={() =>
//                               copyToClipboard(d.sql_code || "", sqlCopyKey)
//                             }
//                             className="text-[11px] mb-2 inline-flex items-center gap-1 rounded-md border border-white/30 px-2 py-0.5 hover:bg-white/10"
//                             title="Copy SQL"
//                             type="button"
//                           >
//                             {copiedKey === sqlCopyKey ? (
//                               <>
//                                 <Check className="w-3 h-3" /> Copied
//                               </>
//                             ) : (
//                               <>
//                                 <Copy className="w-3 h-3" /> Copy
//                               </>
//                             )}
//                           </button>
//                         </div>
//                         <code className="text-xs bg-slate-800 text-slate-100 p-2 rounded block overflow-x-auto">
//                           {d.sql_code}
//                         </code>
//                       </div>
//                     )}

//                     {/* time */}
//                     <div className="mt-2 flex items-center gap-2 text-blue-100/90 text-xs">
//                       <Clock className="w-3.5 h-3.5" />
//                       <span>{userTime}</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Assistant bubble */}
//                 <div className="flex justify-start">
//                   <div className="relative max-w-3xl rounded-2xl px-6 py-4 pt-6  bg-slate-50 text-slate-800 border border-slate-200">
//                     {/* Copy whole answer */}
//                     <button
//                       onClick={() => copyToClipboard(d.aiAnswer, answerCopyKey)}
//                       className="absolute right-4 bottom-3 inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white/80 px-2 py-1 text-xs text-slate-600 hover:bg-white shadow-sm"
//                       title="Copy answer"
//                       type="button"
//                     >
//                       {copiedKey === answerCopyKey ? (
//                         <>
//                           <Check className="w-3.5 h-3.5" /> Copied
//                         </>
//                       ) : (
//                         <>
//                           <Copy className="w-3.5 h-3.5" /> Copy
//                         </>
//                       )}
//                     </button>

//                     {/* Markdown content */}
//                     <article className="prose prose-slate max-w-none md-scroll">
//                       <ReactMarkdown
//                         remarkPlugins={[remarkGfm]}
//                         rehypePlugins={[rehypeHighlight]}
//                         components={{
//                           table: (props) => (
//                             <table className="md-table" {...props} />
//                           ),
//                           thead: (props) => (
//                             <thead className="md-thead" {...props} />
//                           ),
//                           tbody: (props) => (
//                             <tbody className="md-tbody" {...props} />
//                           ),
//                           tr: (props) => <tr className="md-tr" {...props} />,
//                           th: (props) => <th className="md-th" {...props} />,
//                           td: (props) => <td className="md-td" {...props} />,
//                           a: (props) => (
//                             <a
//                               {...props}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="md-link"
//                             />
//                           ),
//                           // keep types simple to avoid TS noise; adjust if you enforce strict types
//                           code({
//                             inline,
//                             children,
//                             ...props
//                           }: {
//                             inline?: boolean;
//                             children?: React.ReactNode;
//                           } & any) {
//                             return inline ? (
//                               <code className="md-code-inline" {...props}>
//                                 {children}
//                               </code>
//                             ) : (
//                               <pre className="md-code-block">
//                                 <code {...props}>{children}</code>
//                               </pre>
//                             );
//                           },
//                         }}
//                       >
//                         {formatted}
//                       </ReactMarkdown>
//                     </article>

//                     {/* time */}
//                     <div className="mt-3 flex items-center gap-2 text-slate-500 text-xs">
//                       <Clock className="w-3.5 h-3.5" />
//                       <span>{aiTime}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             );
//           })
//         )}

//         {sending && (
//           <div className="flex justify-start">
//             <div className="bg-slate-50 rounded-2xl px-6 py-4 border border-slate-200">
//               <div className="flex items-center gap-2 text-slate-600">
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 <span className="text-sm">Analyzing your query...</span>
//               </div>
//             </div>
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Composer */}
//       <div className="border-t border-slate-200 bg-white p-6">
//         <div className="max-w-4xl mx-auto">
//           {!sessionId && (
//             <div className="mb-3 flex flex-wrap gap-2">
//               {categoryList.map((item) => (
//                 <button
//                   key={item.title}
//                   type="button"
//                   onClick={() => setCategory(item.title)}
//                   className={`px-3 py-1 rounded-full text-xs border ${
//                     category === item.title
//                       ? "border-blue-600 text-blue-700 bg-blue-50"
//                       : "border-slate-300 text-slate-600 bg-white"
//                   }`}
//                 >
//                   {item.title}
//                 </button>
//               ))}
//             </div>
//           )}

//           <div className="flex gap-3">
//             <textarea
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={handleKeyDown}
//               placeholder={
//                 !sessionId
//                   ? "Pick a category and ask your first question…"
//                   : "Ask about your business data… (e.g., 'Show me top customers this month')"
//               }
//               className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
//               rows={1}
//               disabled={sending}
//             />
//             <button
//               onClick={handleSend}
//               disabled={!input.trim() || sending}
//               className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
//             >
//               {sending ? (
//                 <Loader2 className="w-5 h-5 animate-spin" />
//               ) : (
//                 <Send className="w-5 h-5" />
//               )}
//             </button>
//           </div>
//           <p className="text-xs text-slate-500 mt-2 text-center">
//             Press Enter to send, Shift + Enter for new line
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// // import React, {
// //   useState,
// //   useEffect,
// //   useRef,
// //   useMemo,
// //   useCallback,
// // } from "react";
// // import { Send, Loader2, Sparkles, Database } from "lucide-react";
// // import { useAuth } from "../../contexts/AuthContext";
// // import { useMutation, useQuery } from "@tanstack/react-query";
// // import { askQuestionFn, chatDetailFn } from "../../services/chatHistory";
// // import toast from "react-hot-toast";
// // import ReactMarkdown from "react-markdown";
// // import remarkGfm from "remark-gfm";
// // import rehypeHighlight from "rehype-highlight";
// // import "highlight.js/styles/github.css";
// // import aiva from "../../assets/aiva.png";

// // // --- Date formatting helpers ---
// // const MONTHS: Record<string, number> = {
// //   jan: 1,
// //   january: 1,
// //   feb: 2,
// //   february: 2,
// //   mar: 3,
// //   march: 3,
// //   apr: 4,
// //   april: 4,
// //   may: 5,
// //   jun: 6,
// //   june: 6,
// //   jul: 7,
// //   july: 7,
// //   aug: 8,
// //   august: 8,
// //   sep: 9,
// //   sept: 9,
// //   september: 9,
// //   oct: 10,
// //   october: 10,
// //   nov: 11,
// //   november: 11,
// //   dec: 12,
// //   december: 12,
// // };

// // function pad(n: number) {
// //   return String(n).padStart(2, "0");
// // }

// // function toDDMMYYYY(y: number, m: number, d: number) {
// //   return `${pad(d)}-${pad(m)}-${y}`;
// // }

// // // Replace dates in common formats with DD-MM-YYYY.
// // function formatDatesInMarkdown(text: string): any {
// //   let out = text;

// //   // ISO-like 2025-11-06T... → 06-11-2025
// //   out = out.replace(
// //     /\b(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/g,
// //     (_, y, m, d) => toDDMMYYYY(Number(y), Number(m), Number(d))
// //   );

// //   // YYYY-MM-DD → DD-MM-YYYY
// //   out = out.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, y, m, d) =>
// //     toDDMMYYYY(Number(y), Number(m), Number(d))
// //   );

// //   // YYYY/MM/DD → DD-MM-YYYY
// //   out = out.replace(/\b(\d{4})\/(\d{1,2})\/(\d{1,2})\b/g, (_, y, m, d) =>
// //     toDDMMYYYY(Number(y), Number(m), Number(d))
// //   );

// //   // "Nov 6, 2025" / "November 6, 2025" → 06-11-2025
// //   out = out.replace(
// //     /\b([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})\b/g,
// //     (_, mon, d, y) => {
// //       const m = MONTHS[mon.toLowerCase()];
// //       if (!m) return `${mon} ${d}, ${y}`;
// //       return toDDMMYYYY(Number(y), m, Number(d));
// //     }
// //   );
// //   return out;
// // }

// // interface ChatInterfaceProps {
// //   sessionId: string | null;
// //   onSessionUpdate: () => void; // parent will refetch sessions & select latest
// //   refetchSessions: (sessionId: any) => void; // parent will refetch sessions & select latest
// // }

// // type ChatDetail = {
// //   id: number;
// //   chatId: number;
// //   question: string;
// //   aiAnswer: string;
// //   sql_code?: string | null;
// //   categoryTag?: string | null;
// //   createdAt: string;
// //   updatedAt: string;
// // };

// // const categoryList = [
// //   {
// //     title: "Sales Analytics",
// //     description: "Track revenue, top customers, and sales trends",
// //   },
// //   {
// //     title: "Inventory Management",
// //     description: "Monitor stock levels and product movement",
// //   },
// //   {
// //     title: "Purchase Orders",
// //     description: "Track orders, suppliers, and procurement",
// //   },
// //   {
// //     title: "Financial Reports",
// //     description: "Generate P&L, balance sheets, and more",
// //   },
// // ];

// // export function ChatInterface({
// //   sessionId,
// //   onSessionUpdate,
// //   refetchSessions,
// // }: ChatInterfaceProps) {
// //   const { user } = useAuth();
// //   const [input, setInput] = useState("");
// //   const [category, setCategory] = useState<string>("");
// //   const messagesEndRef = useRef<HTMLDivElement>(null);

// //   // ----- Load chat details from backend -----
// //   const {
// //     data: chatDetailsResp,
// //     isLoading: detailsLoading,
// //     refetch: refetchDetails,
// //   } = useQuery({
// //     queryKey: ["chatDetails", sessionId],
// //     queryFn: () => chatDetailFn(Number(sessionId)),
// //     enabled: !!sessionId,
// //   });

// //   // Normalize details array
// //   const details: ChatDetail[] = useMemo(() => {
// //     const arr =
// //       (chatDetailsResp as any)?.data?.ChatDetails ??
// //       (Array.isArray(chatDetailsResp) ? chatDetailsResp : []) ??
// //       [];
// //     return arr as ChatDetail[];
// //   }, [chatDetailsResp]);

// //   // Reset category when switching to an existing session
// //   useEffect(() => {
// //     if (sessionId) setCategory("");
// //   }, [sessionId]);

// //   // ----- Send message via backend -----
// //   const { mutateAsync: sendMessage, isPending: sending } = useMutation({
// //     mutationFn: askQuestionFn as unknown as (args: {
// //       question: string;
// //       chatId?: string | number | null;
// //       userId: string | number;
// //       categoryTag?: string | null;
// //     }) => Promise<any>,
// //     onSuccess: async (data) => {
// //       if (sessionId) await refetchDetails();
// //       if (sessionId === null) {
// //         refetchSessions(data?.data?.chatId);
// //       }
// //       onSessionUpdate();
// //     },
// //   });

// //   // ---- Auto-scroll on new messages ----
// //   useEffect(() => {
// //     messagesEndRef.current?.scrollIntoView();
// //     // messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// //   }, [details, sending]);

// //   // ---- Toast helper ----
// //   const showToast = useCallback((msg: string) => {
// //     toast.error(msg);
// //   }, []);

// //   const handleSend = useCallback(async () => {
// //     if (!input.trim() || !user) return;

// //     if (!sessionId && !category) {
// //       showToast("Please select a category before sending your first message.");
// //       return;
// //     }

// //     const payload = {
// //       question: input.trim(),
// //       chatId: sessionId ? Number(sessionId) : undefined,
// //       userId: user.id,
// //       categoryTag: category || undefined,
// //     };

// //     setInput("");
// //     await sendMessage(payload);
// //   }, [input, user, sessionId, category, sendMessage, showToast]);

// //   const handleKeyDown = (e: React.KeyboardEvent) => {
// //     if (e.key === "Enter" && !e.shiftKey) {
// //       e.preventDefault();
// //       handleSend();
// //     }
// //   };

// //   return (
// //     <div className="h-full flex flex-col bg-white relative">
// //       {/* Header */}
// //       <div className="border-b flex gap-3 border-slate-200 bg-white px-6 py-4">
// //         <div className="flex items-center gap-3">
// //           {/* <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg"> */}
// //           {/* <Database className="w-5 h-5 text-white" /> */}
// //           <img src={aiva} alt="Aiva Logo" className="w-10 h-10 rounded-lg" />
// //           {/* </div> */}
// //         </div>
// //         <div>
// //           <h1 className="text-lg font-semibold text-slate-800">
// //             DCC Enterprise Aiva AI Assistant
// //           </h1>
// //           <p className="text-sm text-slate-500">
// //             Ask anything about your enterprise data
// //           </p>
// //         </div>
// //       </div>

// //       {/* Messages area */}
// //       <div className="flex-1 overflow-y-auto p-6 space-y-6">
// //         {detailsLoading && (sessionId ? details.length === 0 : true) ? (
// //           <div className="flex justify-start">
// //             <div className="bg-slate-50 rounded-2xl px-6 py-4 border border-slate-200">
// //               <div className="flex items-center gap-2 text-slate-600">
// //                 <Loader2 className="w-4 h-4 animate-spin" />
// //                 <span className="text-sm">Loading conversation…</span>
// //               </div>
// //             </div>
// //           </div>
// //         ) : details.length === 0 ? (
// //           <div className="h-full flex items-center justify-center">
// //             <div className="max-w-2xl mx-auto text-center space-y-6">
// //               <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-8 border border-blue-100">
// //                 <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
// //                 <h3 className="text-xl font-semibold text-slate-800 mb-3">
// //                   Enterprise Intelligence at Your Fingertips
// //                 </h3>
// //                 <p className="text-slate-600 mb-6">
// //                   Query your SAP Business One database using natural language.
// //                   Get instant insights on sales, inventory, purchases, and more.
// //                 </p>

// //                 {/* Category quick-picks */}
// //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
// //                   {categoryList.map((item) => (
// //                     <div
// //                       key={item.title}
// //                       onClick={() => setCategory(item.title)}
// //                       className={`bg-white rounded-lg p-4 cursor-pointer text-left border border-slate-200 ${
// //                         item.title === category
// //                           ? "shadow-lg border-blue-600 bg-gradient-to-br from-pink-100 via-blue-50 to-white"
// //                           : ""
// //                       }`}
// //                     >
// //                       <p className="font-medium text-slate-800 mb-1">
// //                         {item.title}
// //                       </p>
// //                       <p className="text-slate-600 text-xs">
// //                         {item.description}
// //                       </p>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         ) : (
// //           details.map((d) => {
// //             // NOTE: no hooks in here. Do simple formatting call per item.
// //             const formatted = formatDatesInMarkdown(d.aiAnswer);

// //             return (
// //               <div key={d.id} className="space-y-3">
// //                 {/* User bubble */}
// //                 <div className="flex justify-end">
// //                   <div className="max-w-3xl rounded-2xl px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
// //                     <p className="whitespace-pre-wrap leading-relaxed">
// //                       {d.question}
// //                     </p>
// //                     {d.sql_code && (
// //                       <div className="mt-3 pt-3 border-t border-blue-300/40">
// //                         <p className="text-xs font-medium mb-2 text-blue-50">
// //                           Generated SQL:
// //                         </p>
// //                         <code className="text-xs bg-slate-800 text-slate-100 p-2 rounded block overflow-x-auto">
// //                           {d.sql_code}
// //                         </code>
// //                       </div>
// //                     )}
// //                   </div>
// //                 </div>

// //                 {/* Assistant bubble */}
// //                 <div className="flex justify-start">
// //                   <div className="max-w-3xl rounded-2xl px-6 py-4 bg-slate-50 text-slate-800 border border-slate-200">
// //                     {/* Use a div/article, not <p>, to host block markdown */}
// //                     <article className="prose prose-slate max-w-none md-scroll">
// //                       <ReactMarkdown
// //                         remarkPlugins={[remarkGfm]}
// //                         rehypePlugins={[rehypeHighlight]}
// //                         components={{
// //                           table: (props) => (
// //                             <table className="md-table" {...props} />
// //                           ),
// //                           thead: (props) => (
// //                             <thead className="md-thead" {...props} />
// //                           ),
// //                           tbody: (props) => (
// //                             <tbody className="md-tbody" {...props} />
// //                           ),
// //                           tr: (props) => <tr className="md-tr" {...props} />,
// //                           th: (props) => <th className="md-th" {...props} />,
// //                           td: (props) => <td className="md-td" {...props} />,
// //                           a: (props) => (
// //                             <a
// //                               {...props}
// //                               target="_blank"
// //                               rel="noopener noreferrer"
// //                               className="md-link"
// //                             />
// //                           ),
// //                           // keep types simple to avoid TS noise; adjust if you enforce strict types
// //                           code({
// //                             inline,
// //                             children,
// //                             ...props
// //                           }: {
// //                             inline?: boolean;
// //                             children?: React.ReactNode;
// //                           } & any) {
// //                             return inline ? (
// //                               <code className="md-code-inline" {...props}>
// //                                 {children}
// //                               </code>
// //                             ) : (
// //                               <pre className="md-code-block">
// //                                 <code {...props}>{children}</code>
// //                               </pre>
// //                             );
// //                           },
// //                         }}
// //                       >
// //                         {formatted}
// //                       </ReactMarkdown>
// //                     </article>
// //                   </div>
// //                 </div>
// //               </div>
// //             );
// //           })
// //         )}

// //         {sending && (
// //           <div className="flex justify-start">
// //             <div className="bg-slate-50 rounded-2xl px-6 py-4 border border-slate-200">
// //               <div className="flex items-center gap-2 text-slate-600">
// //                 <Loader2 className="w-4 h-4 animate-spin" />
// //                 <span className="text-sm">Analyzing your query...</span>
// //               </div>
// //             </div>
// //           </div>
// //         )}
// //         <div ref={messagesEndRef} />
// //       </div>

// //       {/* Composer */}
// //       <div className="border-t border-slate-200 bg-white p-6">
// //         <div className="max-w-4xl mx-auto">
// //           {!sessionId && (
// //             <div className="mb-3 flex flex-wrap gap-2">
// //               {categoryList.map((item) => (
// //                 <button
// //                   key={item.title}
// //                   type="button"
// //                   onClick={() => setCategory(item.title)}
// //                   className={`px-3 py-1 rounded-full text-xs border ${
// //                     category === item.title
// //                       ? "border-blue-600 text-blue-700 bg-blue-50"
// //                       : "border-slate-300 text-slate-600 bg-white"
// //                   }`}
// //                 >
// //                   {item.title}
// //                 </button>
// //               ))}
// //             </div>
// //           )}

// //           <div className="flex gap-3">
// //             <textarea
// //               value={input}
// //               onChange={(e) => setInput(e.target.value)}
// //               onKeyDown={handleKeyDown}
// //               placeholder={
// //                 !sessionId
// //                   ? "Pick a category and ask your first question…"
// //                   : "Ask about your business data… (e.g., 'Show me top customers this month')"
// //               }
// //               className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
// //               rows={1}
// //               disabled={sending}
// //             />
// //             <button
// //               onClick={handleSend}
// //               disabled={!input.trim() || sending}
// //               className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
// //             >
// //               {sending ? (
// //                 <Loader2 className="w-5 h-5 animate-spin" />
// //               ) : (
// //                 <Send className="w-5 h-5" />
// //               )}
// //             </button>
// //           </div>
// //           <p className="text-xs text-slate-500 mt-2 text-center">
// //             Press Enter to send, Shift + Enter for new line
// //           </p>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
