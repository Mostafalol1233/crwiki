import { useState, useEffect, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLanguage } from "./LanguageProvider";
import { supabase } from "@/lib/supabase";
import { buildAuthPath } from "@/lib/authRedirect";
import { MessageSquare, Bold, Italic, Link as LinkIcon, AtSign, ThumbsUp } from "lucide-react";

const MAX_RECURSION_DEPTH = 5;
// The current comments schema has no verified parent_comment_id column.
// Keep replies hidden until a reviewed migration and server write path exist.
const COMMENT_REPLIES_ENABLED = false;

export interface Comment {
  id: string;
  name: string;
  content: string;
  date: string;
  parentCommentId?: string | null;
  likes?: number;
  likedBy?: string[];
  mentions?: string[];
  userAvatar?: string;
  userId?: string;
}

interface CommentSectionProps {
  comments: Comment[];
  onCommentSubmit?: (author: string, content: string, parentCommentId?: string, userId?: string, userAvatar?: string, email?: string) => void;
  isAdmin?: boolean;
  onDeleteComment?: (id: string) => void;
  onLike?: (id: string) => void;
}

interface CommentItemProps {
  comment: Comment;
  allComments: Comment[];
  onReply: (parentId: string) => void;
  replyingTo: string | null;
  replyName: string;
  replyContent: string;
  onReplyNameChange: (value: string) => void;
  onReplyEmailChange: (value: string) => void;
  onReplyContentChange: (value: string) => void;
  onReplySubmit: (parentId: string) => void;
  onReplyCancel: () => void;
  replyEmail: string;
  depth?: number;
  onLike?: (commentId: string) => void;
  currentUser?: { id: string; username: string; avatar?: string } | null;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

const isValidCommentId = (id: unknown): id is string => {
  if (typeof id !== "string") return false;
  const s = id.trim();
  if (!s) return false;
  if (s === "undefined" || s === "null") return false;
  return true;
};

const formatText = (text: string) => {
  if (!text) return null;
  // Basic XSS protection would be needed here if not handled by backend/sanitizer
  // Assuming text is safe or using a library like DOMPurify would be better
  // But for this simple implementation:

  const parts = text.split(/(@\w+|\*\*.*?\*\*|\*.*?\*)/g);

  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          return <span key={i} className="text-primary font-medium">{part}</span>;
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return part;
      })}
    </span>
  );
};

function CommentItemBase({
  comment,
  allComments,
  onReply,
  replyingTo,
  replyName,
  replyContent,
  onReplyNameChange,
  onReplyEmailChange,
  onReplyContentChange,
  onReplySubmit,
  onReplyCancel,
  replyEmail,
  depth = 0,
  onLike,
  currentUser,
  isAdmin,
  onDelete,
}: CommentItemProps) {
  if (!isValidCommentId(comment.id)) {
    return null;
  }
  const isReplying = replyingTo === comment.id;
  const maxDepth = 3;
  const hasLiked = currentUser && comment.likedBy?.includes(currentUser.id);
  const goToLogin = () => {
    if (typeof window !== "undefined") window.location.assign(buildAuthPath("login"));
  };

  const childReplies = useMemo(() =>
    allComments.filter(c => isValidCommentId(c.id) && c.parentCommentId === comment.id),
    [allComments, comment.id]
  );

  return (
    <div className={depth > 0 ? "ml-3 sm:ml-6 border-l-2 border-muted pl-3" : ""}>
      <Card data-testid={`comment-${comment.id}`} className="mb-2 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage
                src={comment.userAvatar && comment.userAvatar !== 'placeholder.png' ? comment.userAvatar : undefined}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <AvatarFallback>
                {(comment.name || '').slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">
                  {comment.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {comment.date ? (() => {
                    const d = new Date(comment.date);
                    if (isNaN(d.getTime())) return comment.date;
                    const day = String(d.getDate()).padStart(2, "0");
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const year = d.getFullYear();
                    const hours = String(d.getHours()).padStart(2, "0");
                    const mins = String(d.getMinutes()).padStart(2, "0");
                    return `${day}-${month}-${year} ${hours}:${mins}`;
                  })() : ""}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-2">
                {formatText(comment.content || "")}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => isValidCommentId(comment.id) && onLike && onLike(comment.id)}
                  className={`h-8 px-2 ${hasLiked ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
                >
                  <ThumbsUp className={`h-4 w-4 mr-1 ${hasLiked ? 'fill-current' : ''}`} />
                  {comment.likes || 0}
                </Button>

                {COMMENT_REPLIES_ENABLED && depth < maxDepth && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => isValidCommentId(comment.id) && onReply(comment.id)}
                    data-testid={`button-reply-${comment.id}`}
                    className="h-8 px-2 text-muted-foreground hover:text-primary"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    رد
                  </Button>
                )}

                {isAdmin && onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => isValidCommentId(comment.id) && onDelete(comment.id)}
                    data-testid={`button-delete-comment-${comment.id}`}
                    className="h-8 ml-2 text-destructive hover:bg-destructive/10"
                  >
                    حذف
                  </Button>
                )}
              </div>
            </div>
          </div>

          {COMMENT_REPLIES_ENABLED && isReplying && (
            <div className="mt-4 ml-14 space-y-3">
              {!currentUser && (
                <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                  يجب تسجيل الدخول لإضافة رد. {" "}
                  <button type="button" onClick={goToLogin} className="font-semibold text-primary underline">تسجيل الدخول</button>
                </div>
              )}
              {currentUser && <div className="text-xs text-muted-foreground">ترد باسم حسابك الموثق: <span className="font-semibold text-foreground">{currentUser.username}</span></div>}
              <Textarea
                disabled={!currentUser}
                placeholder={`رد على @${comment.name}...`}
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                rows={3}
                data-testid={`input-reply-content-${comment.id}`}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onReplySubmit(comment.id)}
                  data-testid={`button-submit-reply-${comment.id}`}
                >
                  إرسال الرد
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReplyCancel}
                  data-testid={`button-cancel-reply-${comment.id}`}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {childReplies.length > 0 && (
        <div className="mt-2 space-y-2">
          {depth < MAX_RECURSION_DEPTH && childReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              allComments={allComments}
              onReply={onReply}
              replyingTo={replyingTo}
              replyName={replyName}
              replyContent={replyContent}
              onReplyNameChange={onReplyNameChange}
              onReplyEmailChange={onReplyEmailChange}
              onReplyContentChange={onReplyContentChange}
              onReplySubmit={onReplySubmit}
              onReplyCancel={onReplyCancel}
              replyEmail={replyEmail}
              depth={depth + 1}
              onLike={onLike}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const CommentItem = memo(CommentItemBase);

export function CommentSection({ comments = [], onCommentSubmit, isAdmin = false, onDeleteComment, onLike }: CommentSectionProps & { onLike?: (id: string) => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyName, setReplyName] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [replyContent, setReplyContent] = useState("");

  const [localComments, setLocalComments] = useState<Comment[]>(() => Array.isArray(comments) ? [...comments] : []);

  // Auth state comes from the persisted Supabase session, never from editable localStorage values.
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar?: string } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }: any) => {
      if (!active) return;
      const user = data?.session?.user;
      if (user) {
        const metadata = user.user_metadata || {};
        setCurrentUser({
          id: user.id,
          username: metadata.username || user.email?.split("@")[0] || "User",
          avatar: metadata.avatar || metadata.avatar_url || undefined,
        });
      } else {
        setCurrentUser(null);
      }
      setAuthReady(true);
    }).catch(() => active && setAuthReady(true));
    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      const user = session?.user;
      if (!user) { setCurrentUser(null); return; }
      const metadata = user.user_metadata || {};
      setCurrentUser({ id: user.id, username: metadata.username || user.email?.split("@")[0] || "User", avatar: metadata.avatar || metadata.avatar_url || undefined });
    });
    return () => { active = false; listener?.subscription?.unsubscribe?.(); };
  }, []);

  const insertFormat = (tag: string) => {
    setComment(prev => prev + tag);
  };

  const goToLogin = () => {
    if (typeof window !== "undefined") window.location.assign(buildAuthPath("login"));
  };

  const handleSubmit = () => {
    if (!currentUser) { goToLogin(); return; }
    if (!comment.trim()) return;
    if (onCommentSubmit) onCommentSubmit(currentUser.username, comment.trim(), undefined, currentUser.id, currentUser.avatar);
    setComment("");
  };

  const handleReplySubmit = (parentId: string) => {
    if (!currentUser) { goToLogin(); return; }
    if (!replyContent.trim()) return;
    if (onCommentSubmit) onCommentSubmit(currentUser.username, replyContent.trim(), parentId, currentUser.id, currentUser.avatar);
    setReplyName("");
    setReplyEmail("");
    setReplyContent("");
    setReplyingTo(null);
  };

  const handleLike = async (commentId: string) => {
    if (!currentUser) { goToLogin(); return; }
    if (onLike) {
      onLike(commentId);
      return;
    }

    try {
      // Like handled client-side only (no backend required)
      // Note: We don't update local state here anymore, relying on parent refetch
    } catch (error) {
      console.error("Like failed", error);
    }
  };

  const topLevelComments = useMemo(
    () => localComments.filter((c) => isValidCommentId(c.id) && !c.parentCommentId),
    [localComments]
  );

  useEffect(() => {
    // Create a shallow copy to avoid mutating read-only arrays from React Query
    if (Array.isArray(comments)) {
      const cleaned = comments
        .map((c) => ({
          ...c,
          id: String((c as any)?.id || (c as any)?._id || "").trim(),
          parentCommentId:
            (c as any)?.parentCommentId === null || (c as any)?.parentCommentId === undefined
              ? undefined
              : String((c as any).parentCommentId).trim() || undefined,
        }))
        .filter((c) => isValidCommentId(c.id));

      const seen = new Set<string>();
      const deduped: Comment[] = [];
      for (const c of cleaned) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        deduped.push(c);
      }
      setLocalComments(deduped);
    }
  }, [comments]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        {t("comments")} ({comments.length})
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("addComment")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!authReady ? (
            <div className="text-sm text-muted-foreground">جارٍ التحقق من الجلسة...</div>
          ) : currentUser ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={currentUser.avatar} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <AvatarFallback>{currentUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              حسابك الموثق: <span className="font-semibold text-foreground">{currentUser.username}</span>
            </div>
          ) : (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
              سجّل الدخول أولًا لإضافة تعليق. {" "}
              <button type="button" onClick={goToLogin} className="font-semibold text-primary underline">تسجيل الدخول</button>
            </div>
          )}
          <div className="relative">
            <div className="absolute top-2 right-2 flex gap-1 bg-background/80 p-1 rounded-md border">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertFormat('**bold**')} title="Bold">
                <Bold className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertFormat('*italic*')} title="Italic">
                <Italic className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertFormat('@')} title="Mention">
                <AtSign className="h-3 w-3" />
              </Button>
            </div>
              <Textarea
                disabled={!currentUser}
                placeholder="اكتب تعليقك..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              data-testid="input-comment-text"
              className="pr-24"
            />
          </div>
          <Button onClick={handleSubmit} disabled={!authReady || !currentUser || !comment.trim()} data-testid="button-submit-comment">
            {t("submit")}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {topLevelComments.map((comm) => (
          <CommentItem
            key={comm.id}
            comment={comm}
            allComments={localComments}
            onReply={setReplyingTo}
            replyingTo={replyingTo}
            replyName={replyName}
            replyEmail={replyEmail}
            replyContent={replyContent}
            onReplyNameChange={setReplyName}
            onReplyEmailChange={setReplyEmail}
            onReplyContentChange={setReplyContent}
            onReplySubmit={handleReplySubmit}
            onReplyCancel={() => setReplyingTo(null)}
            onLike={onLike || handleLike}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onDelete={onDeleteComment}
          />
        ))}
      </div>
    </div>
  );
}
