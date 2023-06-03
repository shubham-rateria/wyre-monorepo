import { useState, useEffect } from "react";
import { useSync, usePresence } from "@wyre-client/core";

type TComment = {
  comment: string;
  user: string;
  dateTime: string;
  likes: number;
  dislikes: number;
};

const initialData = { todos: [] };

export const StreamerTest: React.FC = () => {
  const [data, setData] = useState<typeof initialData>(initialData);
  const [loading, setLoading] = useState(true);

  const sync = useSync({
    data: initialData,
  });
  //   const presence = usePresence();

  const init = async () => {
    setLoading(true);
    const data = await sync.init("streamer:testing:1");
    setData(data);
    setLoading(false);
  };

  useEffect(() => {
    init();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {data.todos.map((details) => (
        <div>
          {/* @ts-ignore */}
          {details}
        </div>
      ))}
    </div>
  );
};
