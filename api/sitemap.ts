import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "node:crypto";
import { REGIONS, WEAPONS } from "../shared/crossfire-regions.js";
import { verifyAdminRequest } from "../server/adminAuth.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const ANON_KEY     = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const BASE         = "https://crossfire.wiki";

const h = () => ({ apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" });
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || "";
const serviceHeaders = () => ({ apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });

function requestBearer(req: VercelRequest): string {
  const value = req.headers.authorization;
  return typeof value === "string" ? value.replace(/^Bearer\s+/i, "").trim() : "";
}

// Temporary direct testing gate. It is intentionally limited to Vercel Preview
// and an explicit URL flag; production can never enter this path.
function directCompetitionPreviewRequested(req: VercelRequest): boolean {
  const value = Array.isArray(req.query.competition_test) ? req.query.competition_test[0] : req.query.competition_test;
  return process.env.VERCEL_ENV === "preview" && value === "1";
}

type AuthenticatedUser = {
  id: string;
  email: string;
  username: string;
};

async function authenticatedUser(req: VercelRequest): Promise<AuthenticatedUser | null> {
  const token = requestBearer(req);
  const authKey = ANON_KEY || SERVICE_KEY;
  if (!SUPABASE_URL || !authKey || !token) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: authKey, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return null;
    const user = await response.json();
    if (typeof user?.id !== "string") return null;
    const metadata = user.user_metadata && typeof user.user_metadata === "object" ? user.user_metadata : {};
    return {
      id: user.id,
      email: typeof user.email === "string" ? user.email.trim().toLowerCase() : "",
      username: typeof metadata.username === "string" && metadata.username.trim()
        ? metadata.username.trim().slice(0, 80)
        : typeof user.email === "string" ? user.email.split("@")[0].slice(0, 80) : "Member",
    };
  } catch {
    return null;
  }
}

async function authenticatedUserId(req: VercelRequest): Promise<string | null> {
  return (await authenticatedUser(req))?.id || null;
}

function sha256(value: string): string {
  return createHash("sha256").update(value.trim()).digest("hex");
}

const communityRate = new Map<string, { count: number; startedAt: number }>();
function allowCommunityRequest(req: VercelRequest, bucket: string, max: number, windowMs = 10 * 60 * 1000) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = String(Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || "unknown").split(",")[0].trim().slice(0, 100);
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const current = communityRate.get(key);
  if (!current || now - current.startedAt >= windowMs) {
    communityRate.set(key, { count: 1, startedAt: now });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

function textField(value: unknown, min: number, max: number) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().replaceAll(String.fromCharCode(0), "");
  return normalized.length >= min && normalized.length <= max ? normalized : "";
}

function emailField(value: unknown) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  const at = email.indexOf("@");
  const dot = email.lastIndexOf(".");
  return !email.includes(" ") && at > 0 && dot > at + 1 && dot < email.length - 1 && email.length <= 320 ? email : "";
}

async function communityRequest(req: VercelRequest): Promise<{ status: number; body: any }> {
  if (!SUPABASE_URL || !SERVICE_KEY) return { status: 500, body: { error: "Community service is not configured" } };
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const action = typeof body.action === "string" ? body.action : "";
  const base = `${SUPABASE_URL}/rest/v1`;
  const headers = serviceHeaders();
  const user = await authenticatedUser(req);

  if (action === "ticket:create") {
    if (!allowCommunityRequest(req, "ticket-create", 3)) return { status: 429, body: { error: "Too many requests. Try again later." } };
    const title = textField(body.title, 3, 160);
    const description = textField(body.description, 10, 10000);
    const email = user?.email || emailField(body.userEmail);
    if (!title || !description || !email) return { status: 400, body: { error: "Valid title, description, and email are required" } };
    const category = textField(body.category, 2, 60) || "general";
    const priority = ["low", "normal", "high"].includes(body.priority) ? body.priority : "normal";
    const response = await fetch(`${base}/tickets`, {
      method: "POST", headers,
      body: JSON.stringify({ title, description, user_name: user?.username || textField(body.userName, 2, 80) || "Member", user_email: email, category, priority, status: "open" }),
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return { status: 502, body: { error: "Could not create ticket" } };
    return { status: 201, body: (await response.json())?.[0] || { success: true } };
  }

  if (action === "ticket:list") {
    if (!user?.email) return { status: 401, body: { error: "Sign-in is required to view tickets" } };
    const response = await fetch(`${base}/tickets?user_email=eq.${encodeURIComponent(user.email)}&select=id,title,description,user_name,user_email,category,priority,status,created_at,updated_at&order=created_at.desc&limit=100`, { headers, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return { status: 502, body: { error: "Could not load tickets" } };
    return { status: 200, body: await response.json() };
  }

  if (action === "ticket:replies") {
    if (!user?.email) return { status: 401, body: { error: "Sign-in is required" } };
    const ticketId = textField(body.ticketId, 1, 100);
    if (!ticketId) return { status: 400, body: { error: "Ticket id is required" } };
    const ownerResponse = await fetch(`${base}/tickets?id=eq.${encodeURIComponent(ticketId)}&user_email=eq.${encodeURIComponent(user.email)}&select=id&limit=1`, { headers, signal: AbortSignal.timeout(9000) });
    const ownerRows = ownerResponse.ok ? await ownerResponse.json() : [];
    if (!Array.isArray(ownerRows) || !ownerRows.length) return { status: 404, body: { error: "Ticket not found" } };
    const response = await fetch(`${base}/ticket_messages?ticket_id=eq.${encodeURIComponent(ticketId)}&is_internal=eq.false&order=created_at.asc`, { headers, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return { status: 502, body: { error: "Could not load ticket replies" } };
    return { status: 200, body: await response.json() };
  }

  if (action === "ticket:reply") {
    if (!user?.email) return { status: 401, body: { error: "Sign-in is required" } };
    if (!allowCommunityRequest(req, "ticket-reply", 10)) return { status: 429, body: { error: "Too many requests. Try again later." } };
    const ticketId = textField(body.ticketId, 1, 100);
    const content = textField(body.content, 1, 5000);
    if (!ticketId || !content) return { status: 400, body: { error: "Ticket id and message are required" } };
    const ownerResponse = await fetch(`${base}/tickets?id=eq.${encodeURIComponent(ticketId)}&user_email=eq.${encodeURIComponent(user.email)}&select=id&limit=1`, { headers, signal: AbortSignal.timeout(9000) });
    const ownerRows = ownerResponse.ok ? await ownerResponse.json() : [];
    if (!Array.isArray(ownerRows) || !ownerRows.length) return { status: 404, body: { error: "Ticket not found" } };
    const response = await fetch(`${base}/ticket_messages`, { method: "POST", headers, body: JSON.stringify({ ticket_id: ticketId, message: content, sender_id: user.id, is_internal: false }), signal: AbortSignal.timeout(9000) });
    if (!response.ok) return { status: 502, body: { error: "Could not add ticket reply" } };
    return { status: 201, body: (await response.json())?.[0] || { success: true } };
  }

  if (action === "comment:create") {
    if (!user) return { status: 401, body: { error: "Sign-in is required to comment" } };
    if (!allowCommunityRequest(req, "comment-create", 10)) return { status: 429, body: { error: "Too many requests. Try again later." } };
    const postId = textField(body.postId, 1, 120);
    const postType = textField(body.postType, 1, 30) || "post";
    const content = textField(body.content, 2, 5000);
    if (!postId || !content) return { status: 400, body: { error: "Post and comment content are required" } };
    const response = await fetch(`${base}/comments`, { method: "POST", headers, body: JSON.stringify({ post_id: postId, post_type: postType, content, author_name: user.username }), signal: AbortSignal.timeout(9000) });
    if (!response.ok) return { status: 502, body: { error: "Could not add comment" } };
    return { status: 201, body: (await response.json())?.[0] || { success: true } };
  }

  if (["like:toggle", "like:status", "video-like:toggle", "video-like:status", "comment-like:toggle", "comment-like:status"].includes(action)) {
    if (!user) return { status: 401, body: { error: "Sign-in is required to like" } };
    if (!allowCommunityRequest(req, "like", 60)) return { status: 429, body: { error: "Too many requests. Try again later." } };
    const targetId = textField(body.targetId || body.videoId || body.commentId, 1, 120);
    if (!targetId) return { status: 400, body: { error: "Target id is required" } };
    const isToggle = action.endsWith(":toggle");
    const table = action.startsWith("like:") ? "likes" : action.startsWith("video-like:") ? "video_likes" : "comment_likes";
    const idColumn = table === "likes" ? "target_id" : table === "video_likes" ? "video_id" : "comment_id";
    const query = `${base}/${table}?${idColumn}=eq.${encodeURIComponent(targetId)}&user_identifier=eq.${encodeURIComponent(user.id)}&select=id&limit=1`;
    const existingResponse = await fetch(query, { headers, signal: AbortSignal.timeout(9000) });
    const existingRows = existingResponse.ok ? await existingResponse.json() : [];
    const existing = Array.isArray(existingRows) ? existingRows[0] : null;
    if (!isToggle) {
      const countResponse = await fetch(`${base}/${table}?${idColumn}=eq.${encodeURIComponent(targetId)}&select=id`, { headers, signal: AbortSignal.timeout(9000) });
      const countRows = countResponse.ok ? await countResponse.json() : [];
      return { status: 200, body: { liked: Boolean(existing?.id), count: Array.isArray(countRows) ? countRows.length : 0 } };
    }
    if (existing?.id) {
      const deleteResponse = await fetch(`${base}/${table}?id=eq.${encodeURIComponent(existing.id)}`, { method: "DELETE", headers, signal: AbortSignal.timeout(9000) });
      if (!deleteResponse.ok) return { status: 502, body: { error: "Could not remove like" } };
    } else {
      const row = action === "like:toggle"
        ? { target_id: targetId, target_type: textField(body.targetType, 1, 40) || "post", user_identifier: user.id }
        : action === "video-like:toggle" ? { video_id: targetId, user_identifier: user.id } : { comment_id: targetId, user_identifier: user.id };
      const insertResponse = await fetch(`${base}/${table}`, { method: "POST", headers, body: JSON.stringify(row), signal: AbortSignal.timeout(9000) });
      if (!insertResponse.ok && insertResponse.status !== 409) return { status: 502, body: { error: "Could not add like" } };
    }
    const countResponse = await fetch(`${base}/${table}?${idColumn}=eq.${encodeURIComponent(targetId)}&select=id`, { headers, signal: AbortSignal.timeout(9000) });
    const countRows = countResponse.ok ? await countResponse.json() : [];
    return { status: 200, body: { liked: !existing?.id, count: Array.isArray(countRows) ? countRows.length : 0 } };
  }

  if (action === "forum:thread:create") {
    if (!user) return { status: 401, body: { error: "Sign-in is required to create a topic" } };
    if (!allowCommunityRequest(req, "forum-thread", 5)) return { status: 429, body: { error: "Too many requests. Try again later." } };
    const categoryId = textField(body.categoryId, 1, 120);
    const title = textField(body.title, 5, 160);
    const threadBody = textField(body.body, 10, 12000);
    if (!categoryId || !title || !threadBody) return { status: 400, body: { error: "Category, title, and body are required" } };
    const categoryResponse = await fetch(`${base}/forum_categories?id=eq.${encodeURIComponent(categoryId)}&select=id&limit=1`, { headers, signal: AbortSignal.timeout(9000) });
    const categoryRows = categoryResponse.ok ? await categoryResponse.json() : [];
    if (!Array.isArray(categoryRows) || !categoryRows.length) return { status: 400, body: { error: "Forum category not found" } };
    const response = await fetch(`${base}/forum_threads`, { method: "POST", headers, body: JSON.stringify({ category_id: categoryId, title, body: threadBody, author_id: user.id, author_name: user.username, author_avatar: "", reply_count: 0, view_count: 0, last_reply_at: new Date().toISOString() }), signal: AbortSignal.timeout(9000) });
    if (!response.ok) return { status: 502, body: { error: "Could not create topic" } };
    return { status: 201, body: (await response.json())?.[0] || { success: true } };
  }

  if (action === "forum:post:create") {
    if (!user) return { status: 401, body: { error: "Sign-in is required to reply" } };
    if (!allowCommunityRequest(req, "forum-post", 15)) return { status: 429, body: { error: "Too many requests. Try again later." } };
    const threadId = textField(body.threadId, 1, 120);
    const postBody = textField(body.body, 1, 10000);
    if (!threadId || !postBody) return { status: 400, body: { error: "Thread and reply body are required" } };
    const threadResponse = await fetch(`${base}/forum_threads?id=eq.${encodeURIComponent(threadId)}&select=id,is_locked,reply_count&limit=1`, { headers, signal: AbortSignal.timeout(9000) });
    const threads = threadResponse.ok ? await threadResponse.json() : [];
    const thread = Array.isArray(threads) ? threads[0] : null;
    if (!thread) return { status: 404, body: { error: "Topic not found" } };
    if (thread.is_locked === true) return { status: 409, body: { error: "Topic is locked" } };
    const response = await fetch(`${base}/forum_posts`, { method: "POST", headers, body: JSON.stringify({ thread_id: threadId, body: postBody, author_id: user.id, author_name: user.username, author_avatar: "", is_op: false }), signal: AbortSignal.timeout(9000) });
    if (!response.ok) return { status: 502, body: { error: "Could not add reply" } };
    await fetch(`${base}/forum_threads?id=eq.${encodeURIComponent(threadId)}`, { method: "PATCH", headers, body: JSON.stringify({ reply_count: Number(thread.reply_count || 0) + 1, last_reply_at: new Date().toISOString() }), signal: AbortSignal.timeout(9000) });
    return { status: 201, body: (await response.json())?.[0] || { success: true } };
  }

  if (action === "forum:views") {
    if (!allowCommunityRequest(req, "forum-views", 60, 60 * 1000)) return { status: 429, body: { error: "Too many requests. Try again later." } };
    const threadId = textField(body.threadId, 1, 120);
    if (!threadId) return { status: 400, body: { error: "Thread id is required" } };
    const threadResponse = await fetch(`${base}/forum_threads?id=eq.${encodeURIComponent(threadId)}&select=id,view_count&limit=1`, { headers, signal: AbortSignal.timeout(9000) });
    const threads = threadResponse.ok ? await threadResponse.json() : [];
    const thread = Array.isArray(threads) ? threads[0] : null;
    if (!thread) return { status: 404, body: { error: "Topic not found" } };
    await fetch(`${base}/forum_threads?id=eq.${encodeURIComponent(threadId)}`, { method: "PATCH", headers, body: JSON.stringify({ view_count: Number(thread.view_count || 0) + 1 }), signal: AbortSignal.timeout(9000) });
    return { status: 200, body: { success: true } };
  }

  if (action === "chat:conversations:list") {
    if (!user) return { status: 401, body: { error: "Sign-in is required" } };
    const member = encodeURIComponent(`cs.{${user.username.replace(/[{},]/g, "").slice(0, 80)}}`);
    const response = await fetch(`${base}/conversations?participants=${member}&select=id,name,type,avatar,participants,last_message,last_message_at,created_at&order=last_message_at.desc.nullslast&limit=100`, { headers, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return { status: 502, body: { error: "Could not load conversations" } };
    return { status: 200, body: await response.json() };
  }

  if (action === "chat:messages:list") {
    if (!user) return { status: 401, body: { error: "Sign-in is required" } };
    const conversationId = textField(body.conversationId, 1, 120);
    if (!conversationId) return { status: 400, body: { error: "Conversation id is required" } };
    const member = encodeURIComponent(`cs.{${user.username.replace(/[{},]/g, "").slice(0, 80)}}`);
    const conversationResponse = await fetch(`${base}/conversations?id=eq.${encodeURIComponent(conversationId)}&participants=${member}&select=id&limit=1`, { headers, signal: AbortSignal.timeout(9000) });
    const conversations = conversationResponse.ok ? await conversationResponse.json() : [];
    if (!Array.isArray(conversations) || !conversations.length) return { status: 404, body: { error: "Conversation not found" } };
    const response = await fetch(`${base}/messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=id,conversation_id,sender_username,content,type,reply_to_id,reply_to_content,reply_to_sender,created_at&order=created_at.asc&limit=200`, { headers, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return { status: 502, body: { error: "Could not load messages" } };
    return { status: 200, body: await response.json() };
  }

  if (action === "chat:conversation:create") {
    if (!user) return { status: 401, body: { error: "Sign-in is required" } };
    if (!allowCommunityRequest(req, "chat-conversation", 10)) return { status: 429, body: { error: "Too many requests. Try again later." } };
    const type = ["direct", "group", "channel"].includes(body.type) ? body.type : "direct";
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
    const suppliedParticipants = Array.isArray(body.participants) ? body.participants : [];
    const participants = [...new Set([user.username, ...suppliedParticipants.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim().replace(/[{},]/g, "").slice(0, 80)).filter(Boolean)])].slice(0, 20);
    if (type !== "direct" && !name) return { status: 400, body: { error: "A conversation name is required" } };
    if (type === "direct" && participants.length < 2) return { status: 400, body: { error: "A recipient is required" } };
    const response = await fetch(`${base}/conversations`, { method: "POST", headers, body: JSON.stringify({ name: name || null, type, participants, last_message: "", last_message_at: new Date().toISOString() }), signal: AbortSignal.timeout(9000) });
    if (!response.ok) return { status: 502, body: { error: "Could not create conversation" } };
    return { status: 201, body: (await response.json())?.[0] || { success: true } };
  }

  if (action === "chat:message:create") {
    if (!user) return { status: 401, body: { error: "Sign-in is required" } };
    if (!allowCommunityRequest(req, "chat-message", 60)) return { status: 429, body: { error: "Too many requests. Try again later." } };
    const conversationId = textField(body.conversationId, 1, 120);
    const content = textField(body.content, 1, 10000);
    const type = ["text", "image", "system"].includes(body.type) ? body.type : "text";
    if (!conversationId || !content) return { status: 400, body: { error: "Conversation and message content are required" } };
    const member = encodeURIComponent(`cs.{${user.username.replace(/[{},]/g, "").slice(0, 80)}}`);
    const conversationResponse = await fetch(`${base}/conversations?id=eq.${encodeURIComponent(conversationId)}&participants=${member}&select=id&limit=1`, { headers, signal: AbortSignal.timeout(9000) });
    const conversations = conversationResponse.ok ? await conversationResponse.json() : [];
    if (!Array.isArray(conversations) || !conversations.length) return { status: 404, body: { error: "Conversation not found" } };
    const messageRow: Record<string, unknown> = { conversation_id: conversationId, sender_username: user.username, content, type };
    for (const key of ["reply_to_id", "reply_to_content", "reply_to_sender"]) {
      if (typeof body[key] === "string" && body[key].trim()) messageRow[key] = body[key].trim().slice(0, 200);
    }
    const response = await fetch(`${base}/messages`, { method: "POST", headers, body: JSON.stringify(messageRow), signal: AbortSignal.timeout(9000) });
    if (!response.ok) return { status: 502, body: { error: "Could not send message" } };
    const created = (await response.json())?.[0] || { ...messageRow, created_at: new Date().toISOString() };
    await fetch(`${base}/conversations?id=eq.${encodeURIComponent(conversationId)}`, { method: "PATCH", headers, body: JSON.stringify({ last_message: content.slice(0, 500), last_message_at: created.created_at || new Date().toISOString() }), signal: AbortSignal.timeout(9000) });
    return { status: 201, body: created };
  }

  if (action === "review:create") {
    if (!user) return { status: 401, body: { error: "Sign-in is required to submit a review" } };
    if (!allowCommunityRequest(req, "review-create", 3)) return { status: 429, body: { error: "Too many requests. Try again later." } };
    const sellerId = textField(body.sellerId, 1, 120);
    const rating = Number(body.rating);
    const comment = textField(body.comment, 5, 5000);
    if (!sellerId || !Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) return { status: 400, body: { error: "Seller, rating, and comment are required" } };
    const sellerResponse = await fetch(`${base}/sellers?id=eq.${encodeURIComponent(sellerId)}&select=id&limit=1`, { headers, signal: AbortSignal.timeout(9000) });
    const sellerRows = sellerResponse.ok ? await sellerResponse.json() : [];
    if (!Array.isArray(sellerRows) || !sellerRows.length) return { status: 404, body: { error: "Seller not found" } };
    const response = await fetch(`${base}/seller_reviews`, { method: "POST", headers, body: JSON.stringify({ seller_id: sellerId, user_name: user.username, rating, comment, helpful_votes: 0, status: "pending" }), signal: AbortSignal.timeout(9000) });
    if (!response.ok) return { status: 502, body: { error: "Could not submit review" } };
    return { status: 201, body: (await response.json())?.[0] || { success: true } };
  }

  return { status: 400, body: { error: "Unsupported community action" } };
}

async function enrichWeaponOptionImages(questions: any[], headers: Record<string, string>): Promise<any[]> {
  const names = new Set<string>();
  for (const question of questions) {
    if (question?.kind !== "weapon" || !Array.isArray(question.options)) continue;
    for (const option of question.options) {
      const name = typeof option === "string"
        ? option
        : option && typeof option === "object"
          ? (typeof option.label_en === "string" ? option.label_en : typeof option.value === "string" ? option.value : "")
          : "";
      if (name) names.add(name);
    }
  }
  if (!names.size || !SUPABASE_URL) return questions;
  try {
    const params = new URLSearchParams({ select: "name,image_url", name: `in.(${Array.from(names).join(",")})`, limit: "200" });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/weapons?${params.toString()}`, { headers, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return questions;
    const rows = await response.json();
    const imageByName = new Map<string, string>();
    for (const row of Array.isArray(rows) ? rows : []) {
      if (typeof row?.name === "string" && typeof row?.image_url === "string" && row.image_url) imageByName.set(row.name, row.image_url);
    }
    return questions.map((question) => {
      if (question?.kind !== "weapon" || !Array.isArray(question.options)) return question;
      return {
        ...question,
        options: question.options.map((option: any) => {
          if (typeof option === "string") return { value: option, label_en: option, image_url: imageByName.get(option) || null };
          if (!option || typeof option !== "object") return option;
          const name = typeof option.label_en === "string" ? option.label_en : typeof option.value === "string" ? option.value : "";
          return { ...option, image_url: typeof option.image_url === "string" && option.image_url ? option.image_url : imageByName.get(name) || null };
        }),
      };
    });
  } catch {
    return questions;
  }
}

async function competitionRequest(req: VercelRequest): Promise<{ status: number; body: any }> {
  if (!SUPABASE_URL || !SERVICE_KEY) return { status: 500, body: { error: "Competition service is not configured" } };
  const admin = verifyAdminRequest(req.headers as Record<string, unknown>);
  const previewAllowed = (process.env.VERCEL_ENV !== "production" && admin?.role === "super_admin") || directCompetitionPreviewRequested(req);
  const userId = await authenticatedUserId(req);
  if (!userId && !previewAllowed) return { status: 401, body: { error: "Sign-in is required" } };
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const action = typeof body.action === "string" ? body.action : "";
  const headers = serviceHeaders();
  const base = `${SUPABASE_URL}/rest/v1`;

  if (action === "start") {
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const inviteCode = typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";
    if (phone.length < 5 || phone.length > 40) return { status: 400, body: { error: "A valid phone number is required" } };
    if (body.consent !== true) return { status: 400, body: { error: "Contact consent is required" } };

    const configParams = new URLSearchParams({ id: "eq.default", select: "id,invite_required,active,preview_only,preview_owner_username", limit: "1" });
    if (!previewAllowed) configParams.set("active", "eq.true");
    const configResponse = await fetch(`${base}/competition_config?${configParams.toString()}`, { headers, signal: AbortSignal.timeout(9000) });
    if (!configResponse.ok) return { status: 502, body: { error: "Could not read competition settings" } };
    const configRows = await configResponse.json();
    const config = Array.isArray(configRows) ? configRows[0] : null;
    const ownerPreview = previewAllowed && config?.preview_only === true && config?.preview_owner_username === "super_admin";
    if (!config || (!config.active && !ownerPreview)) return { status: 409, body: { error: "Competition is not active" } };

    let inviteCodeId: string | null = null;
    if (config.invite_required !== false && !directCompetitionPreviewRequested(req)) {
      if (!inviteCode) return { status: 400, body: { error: "Invitation code is required" } };
      const params = new URLSearchParams({ select: "id,max_uses,uses_count,expires_at", code_hash: `eq.${sha256(inviteCode)}`, active: "eq.true", limit: "1" });
      const codeResponse = await fetch(`${base}/competition_invite_codes?${params.toString()}`, { headers, signal: AbortSignal.timeout(9000) });
      if (!codeResponse.ok) return { status: 502, body: { error: "Could not validate invitation code" } };
      const codes = await codeResponse.json();
      const code = Array.isArray(codes) ? codes[0] : null;
      const expired = code?.expires_at && new Date(code.expires_at).getTime() <= Date.now();
      const exhausted = code?.max_uses != null && Number(code.uses_count || 0) >= Number(code.max_uses);
      if (!code || expired || exhausted) return { status: 400, body: { error: "Invitation code is invalid or unavailable" } };
      inviteCodeId = code.id;
    }

    const attemptResponse = await fetch(`${base}/competition_attempts`, {
      method: "POST", headers,
      body: JSON.stringify({ user_id: userId || admin?.id || null, invite_code_id: inviteCodeId, phone, consent_contact: true, status: "in_progress" }),
      signal: AbortSignal.timeout(9000),
    });
    if (!attemptResponse.ok) return { status: 502, body: { error: "Could not create competition attempt" } };
    const attemptRows = await attemptResponse.json();
    const attempt = Array.isArray(attemptRows) ? attemptRows[0] : null;
    if (inviteCodeId) {
      const currentParams = new URLSearchParams({ select: "uses_count", id: `eq.${inviteCodeId}`, limit: "1" });
      const currentResponse = await fetch(`${base}/competition_invite_codes?${currentParams.toString()}`, { headers, signal: AbortSignal.timeout(9000) });
      const currentRows = currentResponse.ok ? await currentResponse.json() : [];
      const currentCount = Number(currentRows?.[0]?.uses_count || 0);
      await fetch(`${base}/competition_invite_codes?id=eq.${encodeURIComponent(inviteCodeId)}`, { method: "PATCH", headers, body: JSON.stringify({ uses_count: currentCount + 1 }), signal: AbortSignal.timeout(9000) });
    }
    const questionsResponse = await fetch(`${base}/competition_questions?select=id,kind,question_en,question_ar,options,points,audio_url,image_url,weapon_id,sort_order&status=eq.published&order=sort_order.asc`, { headers, signal: AbortSignal.timeout(9000) });
    const rawQuestions = questionsResponse.ok ? await questionsResponse.json() : [];
    const questions = await enrichWeaponOptionImages(Array.isArray(rawQuestions) ? rawQuestions : [], headers);
    return { status: 200, body: { attempt: { id: attempt?.id }, questions } };
  }

  if (action === "submit_proof") {
    const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
    const proofType = typeof body.proofType === "string" ? body.proofType : "other";
    const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl.trim() : "";
    const fileName = typeof body.fileName === "string" ? body.fileName.trim().slice(0, 180) : null;
    if (!attemptId || !/^https:\/\//i.test(fileUrl) || fileUrl.length > 2000) return { status: 400, body: { error: "A valid HTTPS proof link is required" } };
    if (!["subscription", "purchase_receipt", "other"].includes(proofType)) return { status: 400, body: { error: "Unsupported proof type" } };
    const attemptParams = new URLSearchParams({ select: "id,status", id: `eq.${attemptId}`, limit: "1" });
    if (!previewAllowed) attemptParams.set("user_id", `eq.${userId}`);
    const attemptResponse = await fetch(`${base}/competition_attempts?${attemptParams.toString()}`, { headers, signal: AbortSignal.timeout(9000) });
    const attempts = attemptResponse.ok ? await attemptResponse.json() : [];
    const attempt = Array.isArray(attempts) ? attempts[0] : null;
    if (!attempt || !["submitted", "reviewed"].includes(attempt.status)) return { status: 400, body: { error: "Submit the quiz before sending proof" } };
    const proofResponse = await fetch(`${base}/competition_proofs`, {
      method: "POST", headers,
      body: JSON.stringify({ attempt_id: attemptId, proof_type: proofType, file_url: fileUrl, file_name: fileName, mime_type: "text/uri-list", status: "pending" }),
      signal: AbortSignal.timeout(9000),
    });
    if (!proofResponse.ok) return { status: 502, body: { error: "Could not submit proof" } };
    const rows = await proofResponse.json();
    return { status: 200, body: { proof: Array.isArray(rows) ? rows[0] : null, status: "pending" } };
  }

  if (action === "submit") {
    const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    if (!attemptId) return { status: 400, body: { error: "Attempt id is required" } };
    const attemptParams = new URLSearchParams({ select: "id,status", id: `eq.${attemptId}`, limit: "1" });
    if (!previewAllowed) attemptParams.set("user_id", `eq.${userId}`);
    const attemptResponse = await fetch(`${base}/competition_attempts?${attemptParams.toString()}`, { headers, signal: AbortSignal.timeout(9000) });
    if (!attemptResponse.ok) return { status: 502, body: { error: "Could not read competition attempt" } };
    const attempts = await attemptResponse.json();
    const attempt = Array.isArray(attempts) ? attempts[0] : null;
    if (!attempt || attempt.status !== "in_progress") return { status: 400, body: { error: "This competition attempt is no longer active" } };
    const questionResponse = await fetch(`${base}/competition_questions?select=id,correct_option,points,kind&status=eq.published`, { headers, signal: AbortSignal.timeout(9000) });
    const questions = questionResponse.ok ? await questionResponse.json() : [];
    let objectiveScore = 0;
    for (const question of Array.isArray(questions) ? questions : []) {
      const submitted = typeof answers[question.id] === "string" ? answers[question.id] : "";
      if (question.correct_option && submitted && submitted === question.correct_option) objectiveScore += Number(question.points || 0);
    }
    const updateParams = new URLSearchParams({ id: `eq.${attemptId}` });
    if (!previewAllowed) updateParams.set("user_id", `eq.${userId}`);
    const updateResponse = await fetch(`${base}/competition_attempts?${updateParams.toString()}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ answers, objective_score: objectiveScore, final_score: objectiveScore, status: "submitted", submitted_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(9000),
    });
    if (!updateResponse.ok) return { status: 502, body: { error: "Could not submit competition attempt" } };
    return { status: 200, body: { objectiveScore, status: "submitted" } };
  }

  return { status: 400, body: { error: "Unknown competition action" } };
}

async function q(table: string, select: string, order: string, limit = 2000): Promise<any[]> {
  if (!SUPABASE_URL || !ANON_KEY) return [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=${encodeURIComponent(order)}&limit=${limit}`,
      { headers: h(), signal: AbortSignal.timeout(9000) }
    );
    if (!r.ok) return [];
    return r.json();
  } catch { return []; }
}

async function readCompetitionContent(previewAllowed = false): Promise<{ config: any | null; prizes: any[]; questions: any[]; leaderboard: any[] }> {
  if (!SUPABASE_URL || !ANON_KEY) return { config: null, prizes: [], questions: [], leaderboard: [] };
  const readHeaders = previewAllowed && SERVICE_KEY ? serviceHeaders() : h();
  const request = async (table: string, select: string, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ select, ...extra });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, { headers: readHeaders, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };
  try {
    const [configs, prizes, questions] = await Promise.all([
      request('competition_config', 'id,title_en,title_ar,intro_en,intro_ar,rules_en,rules_ar,active,preview_only,preview_owner_username,invite_required,leaderboard_published', previewAllowed ? { id: 'eq.default', limit: '1' } : { id: 'eq.default', active: 'eq.true', limit: '1' }),
      request('competition_prizes', 'id,category,title_en,title_ar,description_en,description_ar,availability_note_en,availability_note_ar,sort_order', { published: 'eq.true', order: 'sort_order.asc' }),
      request('competition_questions', 'id,kind,question_en,question_ar,options,points,audio_url,image_url,weapon_id,sort_order', { status: 'eq.published', order: 'sort_order.asc' }),
    ]);
    const enrichedQuestions = await enrichWeaponOptionImages(questions, readHeaders);
    const config = configs[0] || null;
    let leaderboard: any[] = [];
    if (config?.leaderboard_published && SERVICE_KEY && !previewAllowed) {
      const leaderboardParams = new URLSearchParams({ select: "final_score,submitted_at,status", status: "in.(submitted,reviewed)", final_score: "not.is.null", order: "final_score.desc,submitted_at.asc", limit: "20" });
      const leaderboardResponse = await fetch(`${SUPABASE_URL}/rest/v1/competition_attempts?${leaderboardParams.toString()}`, { headers: serviceHeaders(), signal: AbortSignal.timeout(9000) });
      const leaderboardRows = leaderboardResponse.ok ? await leaderboardResponse.json() : [];
      leaderboard = Array.isArray(leaderboardRows) ? leaderboardRows : [];
    }
    const previewOrActive = previewAllowed || config?.active === true;
    return { config, prizes: previewOrActive ? prizes : [], questions: previewOrActive ? enrichedQuestions : [], leaderboard };
  } catch {
    return { config: null, prizes: [], questions: [], leaderboard: [] };
  }
}

async function readContentRows(
  type: 'weapons' | 'posts',
  opts: { limit?: number; offset?: number; category?: string; q?: string; letter?: string; sort?: string; order?: string } = {}
): Promise<{ rows: any[]; total: number }> {
  if (type === 'weapons') {
    const limit = Math.min(50, Math.max(1, Number(opts.limit) || 50));
    const offset = Math.max(0, Number(opts.offset) || 0);
    const safeSort = opts.sort === 'date' ? 'created_at' : 'name';
    const safeOrder = opts.order === 'desc' ? 'desc' : 'asc';
    const baseParams = {
      order: `${safeSort}.${safeOrder}`,
      limit: String(limit),
      offset: String(offset),
    };

    async function fetchWeaponProjection(select: string) {
      const params = new URLSearchParams({ select, ...baseParams });
      if (opts.category) params.set('category', `eq.${opts.category}`);
      if (opts.q) params.set('name', `ilike.*${String(opts.q).replace(/[,*()]/g, '')}*`);
      if (opts.letter) params.set('name', `ilike.${String(opts.letter).slice(0, 1)}*`);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/weapons?${params.toString()}`, {
        headers: { ...h(), Prefer: 'count=exact' },
        signal: AbortSignal.timeout(9000),
      });
      if (!response.ok) return null;
      const rows = await response.json();
      const range = response.headers.get('content-range') || '';
      const parsedTotal = Number.parseInt(range.split('/')[1] || '', 10);
      return {
        rows: Array.isArray(rows) ? rows : [],
        total: Number.isFinite(parsedTotal) ? parsedTotal : (Array.isArray(rows) ? rows.length : 0),
      };
    }

    if (SUPABASE_URL && ANON_KEY) {
      try {
        // Keep the catalogue compatible with older Supabase schemas: try the
        // richer projection first, then fall back to the stable public fields.
        const enriched = await fetchWeaponProjection(
          'id,name,category,description,stats,image_url,background_url,created_at,acquisition_type,acquisition_method,acquisition_verified,acquisition,shop_type,currency,source_url',
        );
        if (enriched) return enriched;

        const stable = await fetchWeaponProjection(
          'id,name,category,description,stats,image_url,created_at',
        );
        if (stable) return stable;
      } catch {
        // Use an empty response rather than accidentally loading the full table.
      }
    }

    return { rows: [], total: 0 };
  }

  if (!SUPABASE_URL || !ANON_KEY) return { rows: [], total: 0 };
  const limit = Math.min(50, Math.max(1, Number(opts.limit) || 24));
  const offset = Math.max(0, Number(opts.offset) || 0);
  const baseParams = {
    order: 'created_at.desc',
    limit: String(limit),
    offset: String(offset),
  };
  if (opts.category) (baseParams as Record<string, string>).category = `eq.${opts.category}`;

  async function fetchPostProjection(select: string) {
    const params = new URLSearchParams({ select, ...baseParams });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?${params.toString()}`, {
      headers: { ...h(), Prefer: 'count=exact' },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return null;
    const rows = await response.json();
    const contentRange = response.headers.get('content-range') || '';
    const totalText = contentRange.split('/')[1] || '';
    const total = Number.parseInt(totalText, 10);
    return { rows: Array.isArray(rows) ? rows : [], total: Number.isFinite(total) ? total : (Array.isArray(rows) ? rows.length : 0) };
  }

  try {
    // The posts table has existed through several schema revisions. A single
    // missing optional column must not make the public archive look empty.
    const projections = [
      'id,title,title_ar,post_slug,summary,summary_ar,content,content_ar,image_url,category,tags,author,views,reading_time,featured,language,seo_title,seo_description,og_image,canonical_url,full_layout,template,wiki_tabs,external_links,source_url,gallery,created_at,updated_at',
      'id,title,title_ar,post_slug,summary,summary_ar,content,content_ar,image_url,category,tags,author,views,reading_time,featured,created_at,updated_at',
      'id,title,post_slug,content,image_url,category,created_at',
    ];
    for (const projection of projections) {
      const result = await fetchPostProjection(projection);
      if (result) return result;
    }
    console.error('[api/content] all posts projections failed');
    return { rows: [], total: 0 };
  } catch {
    return { rows: [], total: 0 };
  }
}

function xe(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function isoDate(s?: string) {
  if (!s) return "";
  try { return new Date(s).toISOString().split("T")[0]; } catch { return ""; }
}

function dateAtOrBefore(value: unknown, maxDate: string) {
  const date = isoDate(value == null ? "" : String(value));
  return date && date <= maxDate ? date : "";
}

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  images?: { url: string; title?: string; caption?: string }[];
  videos?: { thumbnail: string; title: string; description?: string; contentLoc?: string; playerLoc?: string; publicationDate?: string }[];
}

function entry({ loc, lastmod, changefreq, priority, images, videos }: UrlEntry) {
  let xml = `  <url>\n    <loc>${xe(loc)}</loc>\n`;
  if (lastmod)    xml += `    <lastmod>${lastmod}</lastmod>\n`;
  if (changefreq) xml += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority)   xml += `    <priority>${priority}</priority>\n`;
  for (const img of (images || [])) {
    xml += `    <image:image>\n`;
    xml += `      <image:loc>${xe(img.url)}</image:loc>\n`;
    if (img.title)   xml += `      <image:title>${xe(img.title)}</image:title>\n`;
    if (img.caption) xml += `      <image:caption>${xe(img.caption)}</image:caption>\n`;
    xml += `    </image:image>\n`;
  }
  for (const video of (videos || [])) {
    xml += `    <video:video>\n`;
    xml += `      <video:thumbnail_loc>${xe(video.thumbnail)}</video:thumbnail_loc>\n`;
    xml += `      <video:title>${xe(video.title)}</video:title>\n`;
    if (video.description) xml += `      <video:description>${xe(video.description)}</video:description>\n`;
    if (video.contentLoc) xml += `      <video:content_loc>${xe(video.contentLoc)}</video:content_loc>\n`;
    if (video.playerLoc) xml += `      <video:player_loc>${xe(video.playerLoc)}</video:player_loc>\n`;
    if (video.publicationDate) xml += `      <video:publication_date>${xe(video.publicationDate)}</video:publication_date>\n`;
    xml += `    </video:video>\n`;
  }
  xml += `  </url>\n`;
  return xml;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  const rawType = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
  if (req.method === 'POST' && rawType === 'competition') {
    const result = await competitionRequest(req);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(result.status).json(result.body);
  }

  if (req.method === 'POST' && rawType === 'community') {
    const result = await communityRequest(req);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(result.status).json(result.body);
  }

  if (req.method === 'GET' && rawType === 'competition') {
    const previewAdmin = verifyAdminRequest(req.headers as Record<string, unknown>);
    const previewAllowed = (process.env.VERCEL_ENV !== "production" && previewAdmin?.role === "super_admin") || directCompetitionPreviewRequested(req);
    const payload = await readCompetitionContent(previewAllowed);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json(payload);
  }

  if (req.method === 'GET' && typeof rawType === 'string' && rawType !== 'weapons' && rawType !== 'posts') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(400).json({ error: 'Unsupported content type. Use weapons or posts.' });
  }

  if (req.method === 'GET' && typeof rawType === 'string' && (rawType === 'weapons' || rawType === 'posts')) {
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const rawOffset = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
    const rawCategory = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category;
    const rawQuery = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
    const rawLetter = Array.isArray(req.query.letter) ? req.query.letter[0] : req.query.letter;
    const rawSort = Array.isArray(req.query.sort) ? req.query.sort[0] : req.query.sort;
    const rawOrder = Array.isArray(req.query.order) ? req.query.order[0] : req.query.order;
    const { rows, total } = await readContentRows(rawType as 'weapons' | 'posts', {
      limit: Number(rawLimit),
      offset: Number(rawOffset),
      category: typeof rawCategory === 'string' ? rawCategory : undefined,
      q: typeof rawQuery === 'string' ? rawQuery : undefined,
      letter: typeof rawLetter === 'string' ? rawLetter : undefined,
      sort: typeof rawSort === 'string' ? rawSort : undefined,
      order: typeof rawOrder === 'string' ? rawOrder : undefined,
    });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(rawType === 'weapons' ? { weapons: rows || [], total } : { posts: rows || [], total });
  }

  const today = new Date().toISOString().split("T")[0];

  const [events, news, posts, tutorials, customPages, weapons, mercs, modes, competitionConfig] = await Promise.all([
    q("events",       "id,title,event_name_slug,image_url,date,updated_at,seo_description,source_url", "date.desc"),
    q("news",         "id,title,news_slug,image_url,created_at,updated_at,seo_description,source_url", "created_at.desc"),
    q("posts",        "id,title,post_slug,image_url,created_at,updated_at,seo_description,source_url", "created_at.desc"),
    q("tutorials",    "id,title,slug,image_url,created_at,seo_title,seo_description,youtube_url,youtube_id,video_url", "created_at.desc"),
    q("custom_pages", "id,slug,title_en,title_ar,seo_title,seo_description,updated_at,status", "updated_at.desc"),
    q("weapons",      "id,name,image_url",                                                   "name", 10000),
    q("mercenaries",  "id,name,image_url",                                                   "order_index", 10000),
    q("modes",        "id,name,image_url",                                                   "name", 10000),
    q("competition_config", "id,active,updated_at", "updated_at.desc", 1),
  ]);

  // Use the newest real content timestamp for shared/static URLs. This avoids
  // publishing a stale fixed date while still falling back safely when the DB
  // is unavailable or contains malformed timestamps.
  const contentDates = [...events, ...news, ...posts, ...tutorials, ...customPages]
    .flatMap((row: any) => [row.updated_at, row.created_at, row.date])
    .map((value) => dateAtOrBefore(value, today))
    .filter(Boolean)
    .sort()
    .reverse();
  const latestContentDate = contentDates[0] || today;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n`;
  xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n`;
  xml += `        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n\n`;

  // ── Static pages ──────────────────────────────────────────────────────
  const statics: UrlEntry[] = [
    { loc: `${BASE}/`,           priority: "1.0", changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/global-wiki`,priority: "0.98",changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/events`,     priority: "0.95",changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/weapons`,    priority: "0.9", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/modes`,      priority: "0.9", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/ranks`,      priority: "0.9", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/mercenaries`,priority: "0.9", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/maps`,       priority: "0.8", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/news`,       priority: "0.85",changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/posts`,      priority: "0.75",changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/tutorials`,  priority: "0.8", changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/videos`,      priority: "0.8", changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/pages`,       priority: "0.7", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/content-hub`, priority: "0.8", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/faq`,         priority: "0.6", changefreq: "monthly", lastmod: latestContentDate },
    ...(competitionConfig[0]?.active === true ? [{ loc: `${BASE}/competition`, priority: "0.65", changefreq: "weekly", lastmod: dateAtOrBefore(competitionConfig[0].updated_at, today) || latestContentDate }] : []),
    { loc: `${BASE}/grave-games`, priority: "0.5", changefreq: "monthly", lastmod: latestContentDate },
    { loc: `${BASE}/category/news`,   priority: "0.7", changefreq: "daily"   },
    { loc: `${BASE}/category/events`, priority: "0.7", changefreq: "daily"   },
    { loc: `${BASE}/category/guides`, priority: "0.7", changefreq: "weekly"  },
    { loc: `${BASE}/download`,   priority: "0.7", changefreq: "weekly"  },
    { loc: `${BASE}/sellers`,    priority: "0.6", changefreq: "weekly"  },
    { loc: `${BASE}/services`,   priority: "0.6", changefreq: "weekly"  },
    { loc: `${BASE}/reviews`,    priority: "0.6", changefreq: "weekly"  },
    { loc: `${BASE}/forum`,      priority: "0.6", changefreq: "daily"   },
    { loc: `${BASE}/about`,      priority: "0.5", changefreq: "monthly" },
    { loc: `${BASE}/contact`,    priority: "0.5", changefreq: "monthly" },
    { loc: `${BASE}/support`,    priority: "0.5", changefreq: "monthly" },
    { loc: `${BASE}/privacy`,    priority: "0.3", changefreq: "monthly" },
    { loc: `${BASE}/terms`,      priority: "0.3", changefreq: "monthly" },
  ];
  for (const s of statics) xml += entry(s);
  xml += "\n";

  xml += "  <!-- Regional wiki landing pages -->\n";
  for (const region of REGIONS) {
    xml += entry({ loc: `${BASE}/${region.slug}`, priority: "0.9", changefreq: "weekly", lastmod: latestContentDate });
    for (const weapon of WEAPONS) {
      xml += entry({ loc: `${BASE}/${region.slug}/weapons/${weapon.slug}`, priority: "0.8", changefreq: "weekly", lastmod: latestContentDate });
    }
  }
  xml += "\n";

  // ── Events ────────────────────────────────────────────────────────────
  xml += "  <!-- Events -->\n";
  for (const ev of events) {
    const slug = ev.event_name_slug || ev.id;
    if (!slug) continue;
    const img = ev.image_url;
    xml += entry({
      loc:        `${BASE}/events/${slug}`,
      lastmod:    dateAtOrBefore(ev.updated_at || ev.date, today) || today,
      changefreq: "weekly",
      priority:   "0.85",
      images:     img ? [{ url: img, title: ev.title, caption: `CrossFire event: ${ev.title}` }] : [],
    });
  }
  xml += "\n";

  // ── News ──────────────────────────────────────────────────────────────
  xml += "  <!-- News -->\n";
  for (const n of news) {
    const slug = n.news_slug || n.id;
    if (!slug) continue;
    const img = n.image_url;
    xml += entry({
      loc:        `${BASE}/news/${slug}`,
      lastmod:    dateAtOrBefore(n.updated_at || n.created_at, today) || today,
      changefreq: "weekly",
      priority:   "0.75",
      images:     img ? [{ url: img, title: n.title, caption: `CrossFire news: ${n.title}` }] : [],
    });
  }
  xml += "\n";

  // ── Posts ─────────────────────────────────────────────────────────────
  xml += "  <!-- Posts -->\n";
  for (const p of posts) {
    const slug = p.post_slug || p.id;
    if (!slug) continue;
    const img = p.image_url;
    xml += entry({
      loc:        `${BASE}/posts/${slug}`,
      lastmod:    dateAtOrBefore(p.updated_at || p.created_at, today) || today,
      changefreq: "weekly",
      priority:   "0.65",
      images:     img ? [{ url: img, title: p.title }] : [],
    });
  }
  xml += "\n";

  // ── Tutorials ─────────────────────────────────────────────────────────
  xml += "  <!-- Tutorials -->\n";
  for (const t of tutorials) {
    const slug = t.slug || t.id;
    if (!slug) continue;
    const img = t.image_url;
    xml += entry({
      loc:        `${BASE}/tutorials/${slug}`,
      lastmod:    dateAtOrBefore(t.updated_at || t.created_at, today) || today,
      changefreq: "monthly",
      priority:   "0.65",
      images:     img ? [{ url: img, title: t.title }] : [],
      videos: t.youtube_id || t.youtube_url || t.video_url ? [{
        thumbnail: img || `https://img.youtube.com/vi/${t.youtube_id}/hqdefault.jpg`,
        title: t.title || "CrossFire tutorial",
        description: t.seo_description || `CrossFire tutorial: ${t.title}`,
        playerLoc: t.youtube_id ? `https://www.youtube.com/embed/${t.youtube_id}` : undefined,
        contentLoc: t.video_url || undefined,
        publicationDate: dateAtOrBefore(t.created_at, today) ? new Date(t.created_at).toISOString() : undefined,
      }] : [],
    });
  }
  xml += "\n";

  // ── Custom pages ───────────────────────────────────────────────────────
  xml += "  <!-- Published custom pages -->\n";
  for (const page of customPages) {
    if (page.status && page.status !== "published") continue;
    const slug = page.slug || page.id;
    if (!slug) continue;
    xml += entry({
      loc: `${BASE}/pages/${slug}`,
      lastmod: dateAtOrBefore(page.updated_at, today) || today,
      changefreq: "weekly",
      priority: "0.65",
    });
  }
  xml += "\n";

  // ── Weapons (image sitemap) ───────────────────────────────────────────
  xml += "  <!-- Weapons -->\n";
  for (const w of weapons) {
    if (!w.name) continue;
    const slug = w.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const img = w.image_url;
    xml += entry({
      loc:        `${BASE}/weapons`,
      images:     img ? [{ url: img, title: `${w.name} — CrossFire Weapon`, caption: `CrossFire weapon: ${w.name}` }] : [],
    });
  }
  xml += "\n";

  // ── Mercenaries (image sitemap) ───────────────────────────────────────
  xml += "  <!-- Mercenaries -->\n";
  for (const m of mercs) {
    if (!m.name) continue;
    const img = m.image_url;
    if (!img) continue;
    xml += entry({
      loc:    `${BASE}/mercenaries`,
      images: [{ url: img, title: `${m.name} — CrossFire Mercenary`, caption: `CrossFire mercenary: ${m.name}` }],
    });
  }

  xml += "\n</urlset>";

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=1800");
  res.setHeader("X-Robots-Tag", "noindex");
  return res.status(200).send(xml);
}
