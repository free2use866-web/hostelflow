import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { uploadMedicalSlip, isSupabaseConfigured } from "@/lib/supabase";
import type { MealType, SickDietStatus, RebateStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Clock, FileText, Pill, UtensilsCrossed } from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MEAL_EMOJI: Record<MealType, string> = { Breakfast: "🌅", Lunch: "🍛", Dinner: "🌙" };

function statusColor(s: string) {
  const m: Record<string, string> = {
    Requested: "bg-purple-100 text-purple-800", "In Preparation": "bg-sky-100 text-sky-800",
    "Out for Delivery": "bg-amber-100 text-amber-800", Delivered: "bg-emerald-100 text-emerald-800",
    Pending: "bg-amber-100 text-amber-800", Approved: "bg-emerald-100 text-emerald-800",
    Rejected: "bg-rose-100 text-rose-800",
  };
  return m[s] ?? "bg-gray-100 text-gray-800";
}

export function MessView() {
  const store = useStore();
  const { currentUser, messMenus, sickDietRequests, rebates, addSickDietRequest, updateSickDietStatus, addRebate } = store;
  const role = currentUser.role;
  const isMessStaff = role === "MessSec" || role === "Warden" || role === "AsstWarden";

  const [dayIdx, setDayIdx] = useState(new Date().getDay());
  const [tab, setTab] = useState<"menu" | "sick" | "rebate">("menu");
  const [showSickForm, setShowSickForm] = useState(false);

  const bhawanMenus = messMenus.filter((m) => m.bhawan === currentUser.bhawan && m.dayOfWeek === dayIdx);
  const sickReqs = isMessStaff
    ? sickDietRequests
    : sickDietRequests.filter((r) => r.studentId === currentUser.id);
  const myRebates = rebates.filter((r) => r.studentId === currentUser.id);

  const specialToday = bhawanMenus.find((m) => m.noticeText)?.noticeText;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
            <UtensilsCrossed className="mr-1.5 inline size-5 text-primary" /> Mess & Sick Diet
          </h2>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {([["menu", "Weekly Menu"], ["sick", "Sick Diet"], ["rebate", "Rebate Tracker"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === k ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"
            }`}>
            {l}
          </button>
        ))}
      </div>

      {/* Special Banner */}
      {tab === "menu" && specialToday && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm font-semibold text-primary">
          📢 {specialToday}
        </motion.div>
      )}

      {/* Weekly Menu */}
      {tab === "menu" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DAY_NAMES.map((d, i) => (
              <button key={d} onClick={() => setDayIdx(i)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  dayIdx === i ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"
                }`}>
                {d}
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(["Breakfast", "Lunch", "Dinner"] as MealType[]).map((meal) => {
              const menu = bhawanMenus.find((m) => m.mealType === meal);
              return (
                <div key={meal} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl">{MEAL_EMOJI[meal]}</span>
                    <h3 className="font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>{meal}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {menu?.menuDetails ?? "No menu available."}
                  </p>
                  {menu?.noticeText && (
                    <p className="mt-2 text-xs font-semibold text-primary">📢 {menu.noticeText}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sick Diet */}
      {tab === "sick" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowSickForm(true)} className="rounded-full bg-primary text-primary-foreground text-xs">
              <Pill className="mr-1.5 size-3.5" /> Request Sick Meal
            </Button>
          </div>
          <div className="space-y-3">
            {sickReqs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                No sick diet requests.
              </div>
            ) : (
              sickReqs.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
                      {MEAL_EMOJI[r.mealType]} {r.mealType}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(r.status)}`}>
                      {r.status}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {r.date} · Room {r.roomNo}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.message}</p>
                  {r.medicalProofUrl && (
                    <a href={r.medicalProofUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      📎 View medical slip
                    </a>
                  )}
                  {r.deliveredBy && (
                    <p className="mt-1 text-xs text-emerald-700">Delivered by: {r.deliveredBy}</p>
                  )}
                  {/* Status controls for mess staff */}
                  {isMessStaff && r.status !== "Delivered" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["Requested", "In Preparation", "Out for Delivery", "Delivered"] as SickDietStatus[]).map((s) => (
                        <Button key={s} size="sm" variant="outline" disabled={r.status === s}
                          onClick={() => updateSickDietStatus(r.id, s, currentUser.name)}
                          className={`rounded-full text-[10px] font-semibold ${statusColor(s)} border-none`}>
                          {s}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Rebate Tracker */}
      {tab === "rebate" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
              <FileText className="mr-1.5 inline size-4 text-primary" /> IITR Rebate Rules
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>• Minimum <strong>2 days advance notice</strong> required before leaving.</li>
              <li>• Maximum <strong>35 days / 105 meals</strong> rebate per semester.</li>
              <li>• Submit your request below — approval goes to the Warden.</li>
            </ul>
          </div>
          <div className="space-y-3">
            {myRebates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No rebate requests yet.
              </div>
            ) : (
              myRebates.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {r.startDate} → {r.endDate}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.totalDays} days · {r.totalMeals} meals</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(r.status)}`}>
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
          <RebateForm />
        </div>
      )}

      {/* Sick Diet Form Dialog */}
      <SickDietForm open={showSickForm} onOpenChange={setShowSickForm} />
    </div>
  );
}

function SickDietForm({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { currentUser, addSickDietRequest } = useStore();
  const [meal, setMeal] = useState<MealType>("Lunch");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState("");
  const [slip, setSlip] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const submit = async () => {
    if (!msg.trim()) return;
    setUploading(true);
    let medicalProofUrl: string | undefined;
    try {
      if (slip) {
        medicalProofUrl = await uploadMedicalSlip(slip); // Supabase Storage
      }
      addSickDietRequest({ studentId: currentUser.id, roomNo: currentUser.roomNo, bhawan: currentUser.bhawan, date, mealType: meal, message: msg.trim(), medicalProofUrl });
      setMsg(""); setSlip(null);
      onOpenChange(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to upload medical slip.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl border-border">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Lora, serif" }}>Request Sick Meal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["Breakfast", "Lunch", "Dinner"] as MealType[]).map((m) => (
              <button key={m} onClick={() => setMeal(m)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                  meal === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                }`}>
                {MEAL_EMOJI[m]} {m}
              </button>
            ))}
          </div>
          <Input type="date" value={date} min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)} className="rounded-lg border-border" />
          <Textarea placeholder="Message (e.g. need khichdi, running fever)" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} className="rounded-lg border-border text-sm" />

          {isSupabaseConfigured && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Medical slip (optional — uploaded to Supabase Storage)
              </label>
              <Input type="file" accept="image/*,.pdf"
                onChange={(e) => setSlip(e.target.files?.[0] ?? null)}
                className="rounded-lg border-border text-xs" />
              {slip && <p className="mt-1 text-[10px] text-muted-foreground">{slip.name}</p>}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            Alerts will be sent to Mess Secretary & Wellness Secretary. Your roommates will also be notified.
          </p>
          <Button onClick={submit} className="w-full rounded-full bg-primary text-primary-foreground" disabled={!msg.trim() || uploading || (!!slip && uploading)}>
            {uploading ? "Uploading…" : "Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RebateForm() {
  const { currentUser, addRebate } = useStore();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!start || !end) return;
    const startD = new Date(start);
    const endD = new Date(end);
    const diffDays = Math.ceil((endD.getTime() - startD.getTime()) / 86400000);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2);
    if (startD < minDate) { alert("Minimum 2 days advance notice required."); return; }
    if (diffDays > 35) { alert("Maximum 35 days per semester allowed."); return; }
    addRebate({ studentId: currentUser.id, startDate: start, endDate: end, totalDays: diffDays, totalMeals: diffDays * 3 });
    setStart(""); setEnd(""); setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>New Rebate Request</h3>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Start Date</label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border-border text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">End Date</label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border-border text-sm" />
        </div>
        {start && end && (
          <span className="text-xs text-muted-foreground">
            ≈ {Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000)} days / {Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) * 3} meals
          </span>
        )}
        <Button onClick={submit} className="rounded-full bg-primary text-primary-foreground text-xs" disabled={!start || !end}>
          Submit
        </Button>
      </div>
      {submitted && <p className="mt-2 text-xs font-semibold text-emerald-700">✓ Rebate request submitted for Warden approval.</p>}
    </div>
  );
}
