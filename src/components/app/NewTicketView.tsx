import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Category } from "@/convex/schema";
import { CATEGORIES, CATEGORY_META } from "@/lib/hostel";
import { useMutation } from "convex/react";
import { Megaphone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function NewTicketView({ onFiled }: { onFiled: () => void }) {
  const create = useMutation(api.tickets.createTicket);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Give it a title and a description");
      return;
    }
    setBusy(true);
    try {
      await create({ title: title.trim(), description: description.trim(), category });
      toast.success("Complaint filed! The right people have been notified.");
      setTitle("");
      setDescription("");
      setCategory("general");
      onFiled();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to file");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-[var(--clay-raised),var(--clay-inner)]">
          <Megaphone className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">File a complaint</h1>
          <p className="text-sm text-muted-foreground">
            It lands straight in the right secretary's portal. Use{" "}
            <strong>@Full Name</strong> in the description to notify someone.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="clay-lg space-y-5 p-7">
        <div>
          <label className="mb-2 block text-sm font-bold">Community</label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${
                  category === c
                    ? "shadow-[var(--clay-raised),var(--clay-inner)] " + CATEGORY_META[c].chip
                    : "clay-inset text-muted-foreground hover:text-foreground"
                }`}
              >
                {CATEGORY_META[c].emoji}
                <br />
                {CATEGORY_META[c].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Water cooler on 2nd floor not working"
            className="clay-inset rounded-full border-none"
            maxLength={120}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold">
            Description{" "}
            <span className="font-normal text-muted-foreground">
              (mention with @Name to notify)
            </span>
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder={"Describe the issue…\n\n@Demo Mess Secretary please look into tonight's dinner quality"}
            className="clay-inset resize-none rounded-2xl border-none"
          />
        </div>

        <Button
          type="submit"
          disabled={busy}
          size="lg"
          className="clay-flat clay-pressable w-full rounded-full bg-primary font-bold"
        >
          <Send className="mr-2 size-4" />
          {busy ? "Filing…" : "Submit complaint"}
        </Button>
      </form>
    </div>
  );
}
