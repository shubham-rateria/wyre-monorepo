import { useState, useEffect } from "react";
import { useSync, usePresence } from "@wyre-client/core";

type TComment = {
  comment: string;
  user: string;
  dateTime: string;
  likes: number;
  dislikes: number;
};

const initialData = { chessObj: [] };

export const TestGCL: React.FC = () => {
  const [data, setData] = useState<typeof initialData>(initialData);
  const [loading, setLoading] = useState(true);

  const sync = useSync({
    data: initialData,
  });
  //   const presence = usePresence();

  const init = async () => {
    setLoading(true);
    const data = await sync.init("testing:dynamic:import30");
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
      {data.chessObj.map((details) => (
        <div>
          {/* @ts-ignore */}
          {details.fen}
        </div>
      ))}
    </div>
  );
};
