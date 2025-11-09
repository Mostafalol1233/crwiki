import { CommentSection } from "../CommentSection";
import { LanguageProvider } from "../LanguageProvider";

export default function CommentSectionExample() {
  const comments = [
    {
      id: "1",
      name: "John Doe",
      content: "Great article! Very informative and well-written. Looking forward to more content like this.",
      date: "2 hours ago"
    },
    {
      id: "2",
      name: "Jane Smith",
      content: "Thanks for sharing this. The examples were really helpful.",
      date: "5 hours ago"
    }
  ];

  return (
    <LanguageProvider>
      <CommentSection comments={comments} />
    </LanguageProvider>
  );
}
