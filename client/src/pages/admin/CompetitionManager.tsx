import React, { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/supabaseAdmin";

type Tab = "config" | "codes" | "questions" | "prizes" | "attempts" | "proofs";
type Config = { id: string; title_en: string; title_ar: string; intro_en: string; intro_ar: string; rules_en: string; rules_ar: string; active: boolean; invite_required: boolean; leaderboard_published: boolean };
type Question = { id: string; kind: string; question_en: string; question_ar: string; options: string[]; correct_option: string; points: number; sort_order: number; status: string; audio_url: string; weapon_id: string; source_note: string };
type Prize = { id: string; category: string; title_en: string; title_ar: string; description_en: string; description_ar: string; availability_note_en: string; availability_note_ar: string; published: boolean; sort_order: number };
type Code = { id: string; label: string; max_uses: number | null; uses_count: number; expires_at: string | null; active: boolean; created_at: string };
type Attempt = { id: string; user_id: string | null; invite_code_id: string | null; phone: string; consent_contact: boolean; objective_score: number; essay_score: number; proof_bonus: number; final_score: number; status: string; answers: Record<string, unknown>; submitted_at: string | null; reviewed_at: string | null; created_at: string };
type Proof = { id: string; attempt_id: string; proof_type: string; file_url: string; file_name: string | null; file_size: number | null; mime_type: string | null; status: string; bonus_points: number; reviewer_note: string | null; created_at: string; reviewed_at: string | null };

const emptyConfig: Config = { id: "default", title_en: "CrossFire Wiki Competition", title_ar: "مسابقة CrossFire Wiki", intro_en: "", intro_ar: "", rules_en: "", rules_ar: "", active: false, invite_required: true, leaderboard_published: false };
const emptyQuestion: Omit<Question, "id"> = { kind: "multiple_choice", question_en: "", question_ar: "", options: ["", "", "", ""], correct_option: "", points: 1, sort_order: 0, status: "draft", audio_url: "", weapon_id: "", source_note: "" };
const emptyPrize: Omit<Prize, "id"> = { category: "", title_en: "", title_ar: "", description_en: "", description_ar: "", availability_note_en: "", availability_note_ar: "", published: false, sort_order: 0 };

type AdminResponse = { data?: unknown[]; issuedCode?: string };
async function tableRequest(type: string, operation: string, extra: Record<string, unknown> = {}) {
  return adminFetch<AdminResponse>("/api/admin/rebuild", { method: "POST", body: JSON.stringify({ action: "admin-table", type, operation, ...extra }) });
}

function asNumber(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function whatsappUrl(phone: string, message = "") { const normalized = phone.replace(/[^\d+]/g, "").replace(/^\+/, ""); return normalized ? `https://wa.me/${normalized}${message ? `?text=${encodeURIComponent(message)}` : ""}` : ""; }

export default function CompetitionManager() {
  const [tab, setTab] = useState<Tab>("config");
  const [config, setConfig] = useState<Config>(emptyConfig);
  const [question, setQuestion] = useState<Omit<Question, "id">>(emptyQuestion);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [prize, setPrize] = useState<Omit<Prize, "id">>(emptyPrize);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [codeForm, setCodeForm] = useState({ label: "", code: "", max_uses: 1, expires_at: "", active: true });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [configResult, questionResult, prizeResult, codeResult, attemptResult, proofResult] = await Promise.all([
        tableRequest("competition_config", "list", { pageSize: 1 }),
        tableRequest("competition_questions", "list", { pageSize: 100 }),
        tableRequest("competition_prizes", "list", { pageSize: 100 }),
        tableRequest("competition_invite_codes", "list", { pageSize: 100 }),
        tableRequest("competition_attempts", "list", { pageSize: 100 }),
        tableRequest("competition_proofs", "list", { pageSize: 100 }),
      ]);
      const configRow = Array.isArray(configResult.data) && configResult.data[0] ? configResult.data[0] as Config : null;
      if (configRow) setConfig({ ...emptyConfig, ...configRow });
      setQuestions((Array.isArray(questionResult.data) ? questionResult.data : []) as Question[]);
      setPrizes((Array.isArray(prizeResult.data) ? prizeResult.data : []) as Prize[]);
      setCodes((Array.isArray(codeResult.data) ? codeResult.data : []) as Code[]);
      setAttempts((Array.isArray(attemptResult.data) ? attemptResult.data : []) as Attempt[]);
      setProofs((Array.isArray(proofResult.data) ? proofResult.data : []) as Proof[]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load competition data"); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const saveConfig = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await tableRequest("competition_config", "update", { id: config.id, row: config }); setMessage("Competition configuration saved."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save configuration"); }
    finally { setBusy(false); }
  };

  const finishCompetition = async () => {
    if (!window.confirm("End the competition and publish the leaderboard?")) return;
    setBusy(true); setMessage("");
    try {
      const next = { ...config, active: false, leaderboard_published: true };
      await tableRequest("competition_config", "update", { id: config.id, row: next });
      setConfig(next);
      setMessage("Competition ended and leaderboard published.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to publish results"); }
    finally { setBusy(false); }
  };

  const createCode = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const result = await tableRequest("competition_invite_codes", "create", { row: { label: codeForm.label, code: codeForm.code, max_uses: Number(codeForm.max_uses) || 1, expires_at: codeForm.expires_at || null, active: codeForm.active } });
      setCodeForm({ label: "", code: "", max_uses: 1, expires_at: "", active: true });
      setMessage(result.issuedCode ? `Code created. Store it securely: ${result.issuedCode}` : "Invitation code created."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create code"); }
    finally { setBusy(false); }
  };

  const createQuestion = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await tableRequest("competition_questions", "create", { row: { ...question, options: question.options.filter(Boolean), points: Number(question.points) || 1, sort_order: Number(question.sort_order) || 0, weapon_id: question.weapon_id || null } });
      setQuestion(emptyQuestion); setMessage("Question created as a draft."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create question"); }
    finally { setBusy(false); }
  };

  const createPrize = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await tableRequest("competition_prizes", "create", { row: { ...prize, sort_order: Number(prize.sort_order) || 0 } }); setPrize(emptyPrize); setMessage("Prize category created."); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create prize category"); }
    finally { setBusy(false); }
  };

  const createParticipantCode = async (attempt: Attempt) => {
    setBusy(true); setMessage("");
    try {
      const result = await tableRequest("competition_invite_codes", "create", { row: { label: `Participant ${attempt.phone}`, max_uses: 1, active: true } });
      const code = result.issuedCode || "";
      const message = code ? `مرحبًا، هذا كود المشاركة الخاص بك في مسابقة CrossFire Wiki: ${code}\nاستخدمه في صفحة المسابقة مع رقم الهاتف الذي سجلت به.` : "";
      setMessage(code ? `تم توليد الكود ${code}. استخدم زر واتساب لإرساله للمشارك.` : "تم إنشاء الكود، راجع قائمة الأكواد.");
      await load();
      return { code, whatsapp: whatsappUrl(attempt.phone, message) };
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to generate participant code"); return { code: "", whatsapp: "" }; }
    finally { setBusy(false); }
  };

  const updateAttempt = async (attempt: Attempt, patch: Partial<Attempt>) => {
    setBusy(true); setMessage("");
    try {
      const next = { ...attempt, ...patch };
      const finalScore = asNumber(next.objective_score) + asNumber(next.essay_score) + asNumber(next.proof_bonus);
      await tableRequest("competition_attempts", "update", { id: attempt.id, row: { essay_score: asNumber(next.essay_score), proof_bonus: asNumber(next.proof_bonus), final_score: finalScore, status: next.status, reviewed_at: new Date().toISOString() } });
      setMessage("Attempt review saved."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save attempt review"); }
    finally { setBusy(false); }
  };

  const updateProof = async (proof: Proof, patch: Partial<Proof>) => {
    setBusy(true); setMessage("");
    try {
      const status = patch.status ?? proof.status;
      const bonus = asNumber(patch.bonus_points ?? proof.bonus_points);
      await tableRequest("competition_proofs", "update", { id: proof.id, row: { status, bonus_points: bonus, reviewer_note: patch.reviewer_note ?? proof.reviewer_note, reviewed_at: new Date().toISOString() } });
      const attempt = attempts.find((item) => item.id === proof.attempt_id);
      if (attempt && status === "approved") {
        const finalScore = asNumber(attempt.objective_score) + asNumber(attempt.essay_score) + bonus;
        await tableRequest("competition_attempts", "update", { id: attempt.id, row: { proof_bonus: bonus, final_score: finalScore, status: "reviewed", reviewed_at: new Date().toISOString() } });
      }
      setMessage("Proof review saved and score updated."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save proof review"); }
    finally { setBusy(false); }
  };

  const deleteRow = async (type: string, id: string) => {
    if (!window.confirm("Delete this record?")) return;
    setBusy(true); setMessage("");
    try { await tableRequest(type, "delete", { id }); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to delete record"); }
    finally { setBusy(false); }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "config", label: "Configuration" }, { id: "codes", label: "Invitation codes" }, { id: "questions", label: "Questions" },
    { id: "prizes", label: "Prizes" }, { id: "attempts", label: `Attempts (${attempts.length})` }, { id: "proofs", label: `Proofs (${proofs.length})` },
  ];

  return <section style={{ maxWidth: 1180, margin: "0 auto" }}>
    <div style={header}><div><div style={kicker}>COMPETITION</div><h1 style={title}>Competition Management</h1><p style={muted}>Configure the bilingual quiz, invitation codes, question bank, participant reviews, proof bonuses, and prize categories.</p></div><button style={secondaryButton} onClick={() => void load()} disabled={busy}>Refresh</button></div>
    {message && <div style={notice}>{message}</div>}
    <div style={tabsStyle}>{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} style={{ ...tabButton, ...(tab === item.id ? activeTab : {}) }}>{item.label}</button>)}</div>

    {tab === "config" && <form onSubmit={saveConfig} style={panel}><h2 style={sectionTitle}>Public competition settings</h2><div style={grid}><Field label="English title" value={config.title_en} onChange={(value) => setConfig({ ...config, title_en: value })} /><Field label="Arabic title" value={config.title_ar} onChange={(value) => setConfig({ ...config, title_ar: value })} dir="rtl" /><TextArea label="English introduction" value={config.intro_en || ""} onChange={(value) => setConfig({ ...config, intro_en: value })} /><TextArea label="Arabic introduction" value={config.intro_ar || ""} onChange={(value) => setConfig({ ...config, intro_ar: value })} dir="rtl" /><TextArea label="English rules" value={config.rules_en || ""} onChange={(value) => setConfig({ ...config, rules_en: value })} /><TextArea label="Arabic rules" value={config.rules_ar || ""} onChange={(value) => setConfig({ ...config, rules_ar: value })} dir="rtl" /></div><div style={checkRow}><Check label="Competition active" value={config.active} onChange={(value) => setConfig({ ...config, active: value })} /><Check label="Invitation code required" value={config.invite_required} onChange={(value) => setConfig({ ...config, invite_required: value })} /><Check label="Publish leaderboard" value={config.leaderboard_published} onChange={(value) => setConfig({ ...config, leaderboard_published: value })} /></div><div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}><button style={primaryButton} disabled={busy}>Save configuration</button><button type="button" style={{ ...secondaryButton, borderColor: "#a16207", color: "#fbbf24" }} disabled={busy} onClick={() => void finishCompetition()}>End competition and publish results</button></div></form>}

    {tab === "codes" && <div style={twoColumn}><form onSubmit={createCode} style={panel}><h2 style={sectionTitle}>Create invitation code</h2><p style={muted}>Leave the code blank to generate a secure one-time code automatically, or enter a shared code manually. The plaintext is returned only once and stored as a hash.</p><div style={gridOne}><Field label="Label" value={codeForm.label} onChange={(value) => setCodeForm({ ...codeForm, label: value })} /><Field label="Plaintext code" value={codeForm.code} onChange={(value) => setCodeForm({ ...codeForm, code: value })} /><Field label="Maximum uses" type="number" value={String(codeForm.max_uses)} onChange={(value) => setCodeForm({ ...codeForm, max_uses: Number(value) })} /><Field label="Expires at" type="datetime-local" value={codeForm.expires_at} onChange={(value) => setCodeForm({ ...codeForm, expires_at: value })} /></div><Check label="Active" value={codeForm.active} onChange={(value) => setCodeForm({ ...codeForm, active: value })} /><button style={primaryButton} disabled={busy}>Create code</button></form><ListPanel title="Existing codes">{codes.map((item) => <div key={item.id} style={listRow}><div><strong>{item.label || "Untitled code"}</strong><div style={small}>{item.uses_count || 0} / {item.max_uses ?? "unlimited"} uses · {item.active ? "active" : "inactive"}</div></div><button style={dangerButton} onClick={() => void deleteRow("competition_invite_codes", item.id)}>Delete</button></div>)}</ListPanel></div>}

    {tab === "questions" && <div style={twoColumn}><form onSubmit={createQuestion} style={panel}><h2 style={sectionTitle}>Add question</h2><div style={gridOne}><Select label="Question type" value={question.kind} options={["multiple_choice", "audio", "weapon", "essay", "scenario"]} onChange={(value) => setQuestion({ ...question, kind: value })} /><Field label="Points" type="number" value={String(question.points)} onChange={(value) => setQuestion({ ...question, points: Number(value) })} /><Field label="Order" type="number" value={String(question.sort_order)} onChange={(value) => setQuestion({ ...question, sort_order: Number(value) })} /><Select label="Status" value={question.status} options={["draft", "published", "archived"]} onChange={(value) => setQuestion({ ...question, status: value })} /></div><TextArea label="English question" value={question.question_en} onChange={(value) => setQuestion({ ...question, question_en: value })} /><TextArea label="Arabic question" value={question.question_ar} onChange={(value) => setQuestion({ ...question, question_ar: value })} dir="rtl" /><TextArea label="Options (one per line)" value={question.options.join("\n")} onChange={(value) => setQuestion({ ...question, options: value.split("\n") })} /><Field label="Correct option" value={question.correct_option} onChange={(value) => setQuestion({ ...question, correct_option: value })} /><Field label="Audio URL" value={question.audio_url} onChange={(value) => setQuestion({ ...question, audio_url: value })} /><Field label="Related weapon UUID (optional)" value={question.weapon_id} onChange={(value) => setQuestion({ ...question, weapon_id: value })} /><TextArea label="Source or review note" value={question.source_note} onChange={(value) => setQuestion({ ...question, source_note: value })} /><button style={primaryButton} disabled={busy}>Save draft question</button></form><ListPanel title={`Question bank (${questions.length})`}>{questions.map((item) => <div key={item.id} style={listRow}><div><strong>{item.kind} · {item.question_en || item.question_ar || "Untitled"}</strong><div style={small}>{item.points} points · {item.status} · {item.kind === "essay" || item.kind === "scenario" ? "manual review" : "auto-score"}</div></div><button style={dangerButton} onClick={() => void deleteRow("competition_questions", item.id)}>Delete</button></div>)}</ListPanel></div>}

    {tab === "prizes" && <div style={twoColumn}><form onSubmit={createPrize} style={panel}><h2 style={sectionTitle}>Add prize category</h2><div style={gridOne}><Field label="Category" value={prize.category} onChange={(value) => setPrize({ ...prize, category: value })} /><Field label="English title" value={prize.title_en} onChange={(value) => setPrize({ ...prize, title_en: value })} /><Field label="Arabic title" value={prize.title_ar} onChange={(value) => setPrize({ ...prize, title_ar: value })} dir="rtl" /><TextArea label="English description" value={prize.description_en} onChange={(value) => setPrize({ ...prize, description_en: value })} /><TextArea label="Arabic description" value={prize.description_ar} onChange={(value) => setPrize({ ...prize, description_ar: value })} dir="rtl" /><Field label="Availability note" value={prize.availability_note_en} onChange={(value) => setPrize({ ...prize, availability_note_en: value })} /><Field label="Arabic availability note" value={prize.availability_note_ar} onChange={(value) => setPrize({ ...prize, availability_note_ar: value })} dir="rtl" /><Field label="Order" type="number" value={String(prize.sort_order)} onChange={(value) => setPrize({ ...prize, sort_order: Number(value) })} /></div><Check label="Publish this category" value={prize.published} onChange={(value) => setPrize({ ...prize, published: value })} /><button style={primaryButton} disabled={busy}>Save prize category</button></form><ListPanel title={`Prize categories (${prizes.length})`}>{prizes.map((item) => <div key={item.id} style={listRow}><div><strong>{item.category}: {item.title_en || item.title_ar}</strong><div style={small}>{item.published ? "published" : "draft"}</div></div><button style={dangerButton} onClick={() => void deleteRow("competition_prizes", item.id)}>Delete</button></div>)}</ListPanel></div>}

    {tab === "attempts" && <ListPanel title={`Participant requests and attempts (${attempts.length})`}>{attempts.length === 0 && <p style={muted}>No participant requests have been submitted.</p>}{attempts.map((item) => <AttemptRow key={item.id} attempt={item} busy={busy} onSave={updateAttempt} onGenerateCode={createParticipantCode} />)}</ListPanel>}
    {tab === "proofs" && <ListPanel title={`Uploaded proofs (${proofs.length})`}>{proofs.length === 0 && <p style={muted}>No proof uploads have been submitted.</p>}{proofs.map((item) => <ProofRow key={item.id} proof={item} busy={busy} onSave={updateProof} />)}</ListPanel>}
  </section>;
}

function AttemptRow({ attempt, busy, onSave, onGenerateCode }: { attempt: Attempt; busy: boolean; onSave: (attempt: Attempt, patch: Partial<Attempt>) => Promise<void>; onGenerateCode: (attempt: Attempt) => Promise<{ code: string; whatsapp: string }> }) {
  const [essay, setEssay] = useState(String(attempt.essay_score || 0));
  const [generatedCode, setGeneratedCode] = useState("");
  const [whatsappMessageUrl, setWhatsappMessageUrl] = useState("");
  const [bonus, setBonus] = useState(String(attempt.proof_bonus || 0));
  const [status, setStatus] = useState(attempt.status);
  const link = whatsappUrl(attempt.phone);
  const isAccessRequest = Boolean(attempt.answers && attempt.answers.access_request === true);
  return <div style={reviewRow}><div style={{ minWidth: 220 }}><strong>{attempt.phone || "No phone"}</strong><div style={small}>{isAccessRequest ? "Participation code request" : attempt.id} · {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : "not submitted"}</div>{link && <a href={link} target="_blank" rel="noreferrer" style={contactLink}>Open WhatsApp</a>}{isAccessRequest && <button style={{ ...secondaryButton, marginTop: 8 }} disabled={busy} onClick={() => void onGenerateCode(attempt).then((result) => { setGeneratedCode(result.code); setWhatsappMessageUrl(result.whatsapp); })}>Generate private code</button>}{generatedCode && <div style={{ ...small, color: "#fbbf24" }}>Code: {generatedCode}{whatsappMessageUrl && <a href={whatsappMessageUrl} target="_blank" rel="noreferrer" style={{ ...contactLink, marginLeft: 8 }}>WhatsApp message</a>}</div>}</div><div style={reviewGrid}><Field label="Objective" value={String(attempt.objective_score || 0)} onChange={() => undefined} /><Field label="Essay score" type="number" value={essay} onChange={setEssay} /><Field label="Proof bonus" type="number" value={bonus} onChange={setBonus} /><Select label="Status" value={status} options={["in_progress", "submitted", "reviewed", "withdrawn"]} onChange={setStatus} /></div><button style={secondaryButton} disabled={busy} onClick={() => void onSave(attempt, { essay_score: Number(essay), proof_bonus: Number(bonus), status })}>Save review</button></div>;
}

function ProofRow({ proof, busy, onSave }: { proof: Proof; busy: boolean; onSave: (proof: Proof, patch: Partial<Proof>) => Promise<void> }) {
  const [status, setStatus] = useState(proof.status);
  const [bonus, setBonus] = useState(String(proof.bonus_points || 0));
  const [note, setNote] = useState(proof.reviewer_note || "");
  return <div style={reviewRow}><div style={{ minWidth: 220 }}><strong>{proof.proof_type}</strong><div style={small}>Attempt: {proof.attempt_id}</div>{proof.file_url && <a href={proof.file_url} target="_blank" rel="noreferrer" style={contactLink}>Open proof file</a>}</div><div style={reviewGrid}><Select label="Status" value={status} options={["pending", "approved", "rejected"]} onChange={setStatus} /><Field label="Bonus points" type="number" value={bonus} onChange={setBonus} /><Field label="Reviewer note" value={note} onChange={setNote} /></div><button style={secondaryButton} disabled={busy} onClick={() => void onSave(proof, { status, bonus_points: Number(bonus), reviewer_note: note })}>Save proof review</button></div>;
}

function Field({ label, value, onChange, type = "text", dir, disabled }: { label: string; value: string; onChange: (value: string) => void; type?: string; dir?: "rtl" | "ltr"; disabled?: boolean }) { return <label style={labelStyle}>{label}<input dir={dir} disabled={disabled} type={type} value={value} onChange={(event) => onChange(event.target.value)} style={input} /></label>; }
function TextArea({ label, value, onChange, dir }: { label: string; value: string; onChange: (value: string) => void; dir?: "rtl" | "ltr" }) { return <label style={labelStyle}>{label}<textarea dir={dir} value={value} onChange={(event) => onChange(event.target.value)} style={{ ...input, minHeight: 92, resize: "vertical" }} /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label style={labelStyle}>{label}<select value={value} onChange={(event) => onChange(event.target.value)} style={input}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <label style={{ display: "flex", gap: 8, alignItems: "center", color: "#cbd5e1", fontSize: 13 }}><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />{label}</label>; }
function ListPanel({ title, children }: { title: string; children: React.ReactNode }) { return <div style={panel}><h2 style={sectionTitle}>{title}</h2><div style={{ display: "grid", gap: 9 }}>{children}</div></div>; }

const header: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", marginBottom: 22 };
const kicker: React.CSSProperties = { color: "#aeb8c4", letterSpacing: "0.12em", fontSize: 11, marginBottom: 8 };
const title: React.CSSProperties = { margin: 0, color: "#f8fafc", fontSize: 30 };
const sectionTitle: React.CSSProperties = { margin: "0 0 16px", color: "#f8fafc", fontSize: 18 };
const muted: React.CSSProperties = { color: "#9ca3af", lineHeight: 1.6, fontSize: 13 };
const panel: React.CSSProperties = { background: "#0f1115", border: "1px solid #27272a", padding: 20, borderRadius: 6 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 };
const gridOne: React.CSSProperties = { display: "grid", gap: 12 };
const twoColumn: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(320px, .9fr) minmax(0, 1.1fr)", gap: 18, alignItems: "start" };
const labelStyle: React.CSSProperties = { display: "grid", gap: 6, color: "#cbd5e1", fontSize: 12 };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "#09090b", border: "1px solid #3f3f46", color: "#f8fafc", padding: "9px 10px", borderRadius: 4 };
const primaryButton: React.CSSProperties = { marginTop: 18, background: "#d1d5db", border: 0, color: "#111827", padding: "10px 14px", borderRadius: 4, fontWeight: 700, cursor: "pointer" };
const secondaryButton: React.CSSProperties = { background: "transparent", border: "1px solid #3f3f46", color: "#cbd5e1", padding: "9px 12px", borderRadius: 4, cursor: "pointer" };
const dangerButton: React.CSSProperties = { background: "transparent", border: "1px solid #7f1d1d", color: "#fca5a5", padding: "6px 9px", borderRadius: 4, cursor: "pointer" };
const tabsStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6, borderBottom: "1px solid #27272a", marginBottom: 18 };
const tabButton: React.CSSProperties = { background: "transparent", border: 0, color: "#71717a", padding: "9px 12px", cursor: "pointer" };
const activeTab: React.CSSProperties = { color: "#f8fafc", borderBottom: "2px solid #aeb8c4" };
const notice: React.CSSProperties = { background: "#17202b", border: "1px solid #334155", color: "#cbd5e1", padding: 12, marginBottom: 18, fontSize: 13 };
const checkRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 18, marginTop: 18 };
const listRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", border: "1px solid #27272a", padding: 11, background: "#0b0d10" };
const reviewRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(220px, .8fr) minmax(360px, 1.4fr) auto", gap: 14, alignItems: "end", border: "1px solid #27272a", padding: 14, background: "#0b0d10" };
const reviewGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, minmax(90px, 1fr))", gap: 10 };
const contactLink: React.CSSProperties = { display: "inline-block", marginTop: 8, color: "#cbd5e1", fontSize: 12, textDecoration: "underline" };
const small: React.CSSProperties = { color: "#71717a", fontSize: 11, marginTop: 4 };
