import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { IS_WARDEN_ROLE, IS_SECY_ROLE, ROLE_LABELS, timeAgo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Shield, Users } from "lucide-react";

export function ManagementGroup() {
  const { currentUser, users, groupMessages, sendGroupMessage } = useStore();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const canAccess = IS_WARDEN_ROLE(currentUser.role) || IS_SECY_ROLE(currentUser.role);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages.length]);

  if (!canAccess) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <Shield className="mx-auto mb-4 size-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">Restricted Channel</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This group is for Wardens and Secretaries only.
        </p>
      </div>
    );
  }

  const members = users.filter((u) => IS_WARDEN_ROLE(u.role) || IS_SECY_ROLE(u.role));
  const handleSend = () => {
    if (!text.trim()) return;
    sendGroupMessage(text);
    setText("");
  };

  return (
    <div className="flex h-[calc(100vh-16rem)] sm:h-[calc(100vh-12rem)] rounded-xl border border-border bg-card overflow-hidden">
      {/* Sidebar — members */}
      <div className="hidden w-56 shrink-0 border-r border-border bg-muted/30 p-4 md:block">
        <h3
          className="mb-3 flex items-center gap-2 text-xs font-bold text-foreground"
          style={{ fontFamily: "Lora, serif" }}
        >
          <Users className="size-3.5" /> Members ({members.length})
        </h3>
        <div className="space-y-1.5">
          {members.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                m.id === currentUser.id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[8px] font-bold text-primary">
                {m.name.charAt(0)}
              </span>
              <span className="min-w-0 truncate">{m.name.split(" ")[0]}</span>
              <span className="ml-auto rounded-full bg-background px-1.5 py-0.5 text-[7px] font-bold text-muted-foreground">
                {ROLE_LABELS[m.role].split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-border bg-background p-3">
          <p className="text-[10px] font-semibold text-foreground">🔒 Private Group</p>
          <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">
            Only wardens and secretaries can see and send messages here. Students are not members.
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              🏛
            </span>
            <div>
              <p className="text-sm font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
                Hostel Management Group
              </p>
              <p className="text-[10px] text-muted-foreground">
                {members.length} members · Wardens & Secretaries
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {groupMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs text-muted-foreground">No messages yet. Start the conversation.</p>
            </div>
          ) : (
            groupMessages.map((msg) => {
              const author = users.find((u) => u.id === msg.authorId);
              const isMe = msg.authorId === currentUser.id;
              const isWarden = author ? IS_WARDEN_ROLE(author.role) : false;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-3.5 py-2.5 ${
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background"
                    }`}
                  >
                    {!isMe && (
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-[8px] font-bold text-primary">
                          {author?.name.charAt(0) ?? "?"}
                        </span>
                        <span className="text-[10px] font-bold text-foreground">
                          {author?.name ?? "Unknown"}
                        </span>
                        {isWarden && (
                          <span className="rounded bg-amber-100 px-1 py-0.5 text-[7px] font-bold text-amber-700">
                            WARDEN
                          </span>
                        )}
                      </div>
                    )}
                    <p className={`text-sm leading-relaxed ${isMe ? "text-primary-foreground" : "text-foreground"}`}>
                      {msg.text}
                    </p>
                    <p className={`mt-1 text-[9px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {timeAgo(msg.createdAt)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message to the management group..."
              className="h-9 text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={!text.trim()}
              size="icon"
              className="size-9 shrink-0 rounded-full bg-primary text-primary-foreground"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
