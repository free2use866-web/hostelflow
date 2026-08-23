import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { MEALS } from "@/convex/schema";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo } from "@/lib/hostel";
import { useMutation, useQuery } from "convex/react";
import { QrCode, TicketX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "🌅",
  lunch: "🍛",
  snacks: "☕",
  dinner: "🌙",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function TokenChip({ token }: { token: NonNullable<Doc<"messTokens">> }) {
  const setStatus = useMutation(api.messTokens.setStatus);
  return (
    <div className="clay-flat flex items-center gap-4 rounded-3xl p-4">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-xl shadow-[var(--clay-raised),var(--clay-inner)]">
        {MEAL_EMOJI[token.meal]}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-lg font-extrabold tracking-widest">
          {token.tokenCode}
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {token.meal} · {token.date} ·{" "}
          <span
            className={
              token.status === "active"
                ? "font-bold text-emerald-600"
                : "font-semibold"
            }
          >
            {token.status}
          </span>{" "}
          · {timeAgo(token.createdAt)}
        </p>
      </div>
      {token.status === "active" && (
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              await setStatus({ tokenId: token._id, status: "cancelled" });
              toast.success("Token cancelled");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          }}
          className="clay-flat clay-pressable ml-auto shrink-0 rounded-full border-none text-xs"
        >
          <TicketX className="mr-1 size-3.5" /> Cancel
        </Button>
      )}
    </div>
  );
}

export function TokensView() {
  const { user } = useAuth();
  const role = user?.hostelRole as string | undefined;
  const isMessStaff =
    role === "mess_secy" || role === "warden" || role === "chief_warden";

  const [meal, setMeal] = useState<string>("dinner");
  const [date, setDate] = useState(todayStr());
  const [sheetDate, setSheetDate] = useState(todayStr());
  const generate = useMutation(api.messTokens.generate);

  const mine = useQuery(api.messTokens.listMine, {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const daySheet = useQuery(
    api.messTokens.listByDate,
    isMessStaff ? { date: sheetDate } : "skip",
  ) as (Doc<"messTokens"> & { ownerName: string; rollNumber: string })[] | undefined;

  const doGenerate = async () => {
    try {
      await generate({ meal: meal as never, date });
      toast.success(`${MEAL_EMOJI[meal]} ${meal} token generated for ${date}!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">
          <QrCode className="size-6 text-primary" /> Mess tokens
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate a token before your meal and show the code at the mess door.
        </p>
      </div>

      {/* Generator */}
      <div className="clay-lg p-7">
        <label className="mb-2 block text-sm font-bold">Meal</label>
        <div className="grid grid-cols-4 gap-2.5">
          {MEALS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMeal(m)}
              className={`rounded-2xl px-2 py-3 text-sm font-semibold capitalize transition-all ${
                meal === m
                  ? "bg-secondary text-secondary-foreground shadow-[var(--clay-raised),var(--clay-inner)]"
                  : "clay-inset text-muted-foreground hover:text-foreground"
              }`}
            >
              {MEAL_EMOJI[m]}
              <br />
              {m}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <label className="mb-2 block text-sm font-bold">Date</label>
            <Input
              type="date"
              value={date}
              min={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="clay-inset rounded-full border-none"
            />
          </div>
          <Button
            onClick={doGenerate}
            size="lg"
            className="clay-flat clay-pressable rounded-full bg-primary font-bold"
          >
            Generate token
          </Button>
        </div>
      </div>

      {/* My tokens */}
      <section>
        <h2 className="mb-3 font-bold">My tokens</h2>
        {mine === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : mine.length === 0 ? (
          <p className="clay-inset rounded-3xl p-8 text-center text-sm text-muted-foreground">
            No tokens yet — generate one above 🍽️
          </p>
        ) : (
          <div className="space-y-3">
            {mine.map((t) => <TokenChip key={t._id} token={t!} />)}
          </div>
        )}
      </section>

      {/* Day sheet (mess secy / wardens) */}
      {isMessStaff && (
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="font-bold">📋 Day sheet</h2>
            <Input
              type="date"
              value={sheetDate}
              onChange={(e) => setSheetDate(e.target.value)}
              className="clay-inset w-44 rounded-full border-none"
            />
            <Badge className="rounded-full border-none bg-secondary text-secondary-foreground">
              {daySheet?.length ?? 0} tokens
            </Badge>
          </div>
          {daySheet === undefined ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : daySheet.length === 0 ? (
            <p className="clay-inset rounded-3xl p-8 text-center text-sm text-muted-foreground">
              No tokens generated for this date.
            </p>
          ) : (
            <div className="space-y-3">
              {daySheet.map((t) => (
                <div
                  key={t._id}
                  className="clay-flat flex items-center gap-4 rounded-3xl p-4"
                >
                  <span className="text-xl">{MEAL_EMOJI[t.meal]}</span>
                  <div>
                    <p className="text-sm font-bold">{t.ownerName}</p>
                    <p className="font-mono text-xs tracking-widest text-muted-foreground">
                      {t.tokenCode} · {t.meal} · {t.rollNumber || "—"}
                    </p>
                  </div>
                  <Badge
                    className={`ml-auto rounded-full border-none capitalize ${
                      t.status === "active"
                        ? "bg-emerald-500/15 text-emerald-700"
                        : t.status === "used"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {t.status}
                  </Badge>
                  {t.status === "active" && <MarkUsedButton id={t._id} />}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function MarkUsedButton({ id }: { id: Id<"messTokens"> }) {
  const setStatus = useMutation(api.messTokens.setStatus);
  return (
    <Button
      size="sm"
      onClick={async () => {
        try {
          await setStatus({ tokenId: id, status: "used" });
          toast.success("Marked as used");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
        }
      }}
      className="clay-flat clay-pressable rounded-full border-none bg-primary text-xs font-bold"
      variant="outline"
    >
      Mark used
    </Button>
  );
}
