import { useState, useEffect } from "react";
import { useSync, usePresence } from "@wyre-client/core";

type TComment = {
  comment: string;
  user: string;
  dateTime: string;
  likes: number;
  dislikes: number;
};

const initialData: { [comments: string]: TComment[] } = { comments: [] };

export const LiveComments: React.FC = () => {
  const [data, setData] = useState<typeof initialData>(initialData);
  const [loading, setLoading] = useState(true);
  const [myName, setMyName] = useState("Shubham Rateria");
  //   const [presenceDetails, setPresenceDetails] = useState<any>();
  const [commentText, setCommentText] = useState("");

  const sync = useSync({
    data: initialData,
  });
  //   const presence = usePresence();

  const init = async () => {
    setLoading(true);
    const data = await sync.init("live:comments");
    // const presenceDetails = await presence.init({
    //   presenceId: "wyre-demo:live-comments:presence",
    // });
    // presence.add({
    //   name: myName,
    // });
    // setPresenceDetails(presenceDetails);
    setData(data);
    setLoading(false);
  };

  const handleCommentAdd = () => {
    const newComment: TComment = {
      comment: commentText,
      dateTime: Date.now().toString(),
      likes: 0,
      dislikes: 0,
      user: myName,
    };
    data.comments.push(newComment);
  };

  useEffect(() => {
    init();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {data.comments.map((comment: TComment) => (
        <div>{comment.comment}</div>
      ))}
      <div>
        <textarea
          onChange={(e) => {
            setCommentText(e.target.value.toString());
          }}
        />
        <button onClick={handleCommentAdd}>Add Comment</button>
      </div>
    </div>
  );
};
