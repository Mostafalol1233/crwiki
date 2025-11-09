import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLanguage } from "./LanguageProvider";
import { MessageSquare } from "lucide-react";

export interface Comment {
  id: string;
  name: string;
  content: string;
  date: string;
  parentCommentId?: string | null;
}

interface CommentSectionProps {
  comments: Comment[];
  onCommentSubmit?: (author: string, content: string, parentCommentId?: string) => void;
}

interface CommentItemProps {
  comment: Comment;
  allComments: Comment[];
  onReply: (parentId: string) => void;
  replyingTo: string | null;
  replyName: string;
  replyContent: string;
  onReplyNameChange: (value: string) => void;
  onReplyContentChange: (value: string) => void;
  onReplySubmit: (parentId: string) => void;
  onReplyCancel: () => void;
  depth?: number;
}

function CommentItem({
  comment,
  allComments,
  onReply,
  replyingTo,
  replyName,
  replyContent,
  onReplyNameChange,
  onReplyContentChange,
  onReplySubmit,
  onReplyCancel,
  depth = 0,
}: CommentItemProps) {
  const isReplying = replyingTo === comment.id;
  const maxDepth = 3;
  
  const childReplies = allComments.filter(c => c.parentCommentId === comment.id);

  return (
    <div className={depth > 0 ? "ml-12" : ""}>
      <Card data-testid={`comment-${comment.id}`}>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 flex-shrink-0">
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
                  {comment.date}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                {comment.content}
              </p>
              {depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply(comment.id)}
                  data-testid={`button-reply-${comment.id}`}
                  className="h-8"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              )}
            </div>
          </div>

          {isReplying && (
            <div className="mt-4 ml-14 space-y-3">
              <Input
                placeholder="Your name"
                value={replyName}
                onChange={(e) => onReplyNameChange(e.target.value)}
                data-testid={`input-reply-name-${comment.id}`}
              />
              <Textarea
                placeholder="Write your reply..."
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
                  Submit Reply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReplyCancel}
                  data-testid={`button-cancel-reply-${comment.id}`}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {childReplies.length > 0 && (
        <div className="mt-4 space-y-4">
          {childReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              allComments={allComments}
              onReply={onReply}
              replyingTo={replyingTo}
              replyName={replyName}
              replyContent={replyContent}
              onReplyNameChange={onReplyNameChange}
              onReplyContentChange={onReplyContentChange}
              onReplySubmit={onReplySubmit}
              onReplyCancel={onReplyCancel}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ comments, onCommentSubmit }: CommentSectionProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyName, setReplyName] = useState("");
  const [replyContent, setReplyContent] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !comment.trim()) return;
    
    if (onCommentSubmit) {
      onCommentSubmit(name, comment);
    }
    
    setName("");
    setComment("");
  };

  const handleReplySubmit = (parentId: string) => {
    if (!replyName.trim() || !replyContent.trim()) return;
    
    if (onCommentSubmit) {
      onCommentSubmit(replyName, replyContent, parentId);
    }
    
    setReplyName("");
    setReplyContent("");
    setReplyingTo(null);
  };

  const handleReplyCancel = () => {
    setReplyName("");
    setReplyContent("");
    setReplyingTo(null);
  };

  const topLevelComments = comments.filter(c => !c.parentCommentId);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-semibold">
        {t("comments")} ({comments.length})
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("addComment")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="input-comment-name"
          />
          <Textarea
            placeholder="Write your comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            data-testid="input-comment-text"
          />
          <Button onClick={handleSubmit} data-testid="button-submit-comment">
            {t("submit")}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {topLevelComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            allComments={comments}
            onReply={setReplyingTo}
            replyingTo={replyingTo}
            replyName={replyName}
            replyContent={replyContent}
            onReplyNameChange={setReplyName}
            onReplyContentChange={setReplyContent}
            onReplySubmit={handleReplySubmit}
            onReplyCancel={handleReplyCancel}
          />
        ))}
      </div>
    </div>
  );
}
