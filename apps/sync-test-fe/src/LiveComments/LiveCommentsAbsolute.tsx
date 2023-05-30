import { useState, useEffect } from "react";
import { useSync, usePresence } from "@wyre-client/core";
import styles from "./LiveComments.module.css";
import { Cursor } from "../components/Cursor/Cursor";
import { getInitials } from "../utils/get-initials";

type TComment = {
  comment: string;
  user: string;
  userColor: string;
  dateTime: string;
  likes: number;
  dislikes: number;
  x: number;
  y: number;
};

const initialData: { [comments: string]: TComment[] } = { comments: [] };

var nameList = [
  "Time",
  "Past",
  "Future",
  "Dev",
  "Fly",
  "Flying",
  "Soar",
  "Soaring",
  "Power",
  "Falling",
  "Fall",
  "Jump",
  "Cliff",
  "Mountain",
  "Rend",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Gold",
  "Demon",
  "Demonic",
  "Panda",
  "Cat",
  "Kitty",
  "Kitten",
  "Zero",
  "Memory",
  "Trooper",
  "XX",
  "Bandit",
  "Fear",
  "Light",
  "Glow",
  "Tread",
  "Deep",
  "Deeper",
  "Deepest",
  "Mine",
  "Your",
  "Worst",
  "Enemy",
  "Hostile",
  "Force",
  "Video",
  "Game",
  "Donkey",
  "Mule",
  "Colt",
  "Cult",
  "Cultist",
  "Magnum",
  "Gun",
  "Assault",
  "Recon",
  "Trap",
  "Trapper",
  "Redeem",
  "Code",
  "Script",
  "Writer",
  "Near",
  "Close",
  "Open",
  "Cube",
  "Circle",
  "Geo",
  "Genome",
  "Germ",
  "Spaz",
  "Shot",
  "Echo",
  "Beta",
  "Alpha",
  "Gamma",
  "Omega",
  "Seal",
  "Squid",
  "Money",
  "Cash",
  "Lord",
  "King",
  "Duke",
  "Rest",
  "Fire",
  "Flame",
  "Morrow",
  "Break",
  "Breaker",
  "Numb",
  "Ice",
  "Cold",
  "Rotten",
  "Sick",
  "Sickly",
  "Janitor",
  "Camel",
  "Rooster",
  "Sand",
  "Desert",
  "Dessert",
  "Hurdle",
  "Racer",
  "Eraser",
  "Erase",
  "Big",
  "Small",
  "Short",
  "Tall",
  "Sith",
  "Bounty",
  "Hunter",
  "Cracked",
  "Broken",
  "Sad",
  "Happy",
  "Joy",
  "Joyful",
  "Crimson",
  "Destiny",
  "Deceit",
  "Lies",
  "Lie",
  "Honest",
  "Destined",
  "Bloxxer",
  "Hawk",
  "Eagle",
  "Hawker",
  "Walker",
  "Zombie",
  "Sarge",
  "Capt",
  "Captain",
  "Punch",
  "One",
  "Two",
  "Uno",
  "Slice",
  "Slash",
  "Melt",
  "Melted",
  "Melting",
  "Fell",
  "Wolf",
  "Hound",
  "Legacy",
  "Sharp",
  "Dead",
  "Mew",
  "Chuckle",
  "Bubba",
  "Bubble",
  "Sandwich",
  "Smasher",
  "Extreme",
  "Multi",
  "Universe",
  "Ultimate",
  "Death",
  "Ready",
  "Monkey",
  "Elevator",
  "Wrench",
  "Grease",
  "Head",
  "Theme",
  "Grand",
  "Cool",
  "Kid",
  "Boy",
  "Girl",
  "Vortex",
  "Paradox",
];

function generateName() {
  return nameList[Math.floor(Math.random() * nameList.length)];
}

export const LiveCommentsAbsolute: React.FC = () => {
  const [data, setData] = useState<typeof initialData>(initialData);
  const [loading, setLoading] = useState(true);
  const [myName, setMyName] = useState(generateName());
  const [presenceDetails, setPresenceDetails] = useState<any>();
  const [commentText, setCommentText] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentX, setCommentX] = useState(0);
  const [commentY, setCommentY] = useState(0);
  const [myColor, setMyColor] = useState(
    Math.floor(Math.random() * 16777215).toString(16)
  );

  const sync = useSync({
    data: initialData,
  });
  const presence = usePresence();

  const init = async () => {
    setLoading(true);
    const data = await sync.init("live:comments:1");
    const presenceDetails = await presence.init({
      presenceId: "wyre-demo:live-comments:presence:1",
    });
    presence.add({
      name: myName,
      color: `#${myColor}`,
    });
    setPresenceDetails(presenceDetails);
    setData(data);
    setLoading(false);
  };

  const handleCommentAdd = (x: number, y: number) => {
    const newComment: TComment = {
      comment: commentText,
      dateTime: Date.now().toString(),
      likes: 0,
      dislikes: 0,
      user: myName,
      userColor: myColor,
      x,
      y,
    };
    data.comments.push(newComment);
    setShowCommentBox(false);
  };

  useEffect(() => {
    init();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className={styles.Container}
      onClick={(e) => {
        if (!showCommentBox) {
          setCommentX(e.pageX);
          setCommentY(e.pageY);
          setShowCommentBox(true);
        }
      }}
    >
      {presenceDetails.users.keys().map((userId: string) => {
        return (
          <div
            style={{
              position: "absolute",
              top: presenceDetails.users[userId].mousePosition[0],
              left: presenceDetails.users[userId].mousePosition[1],
            }}
          >
            <Cursor color={presenceDetails.users[userId].userColor} />
          </div>
        );
      })}
      {data.comments.map((comment: TComment) => (
        <div
          style={{
            position: "absolute",
            top: comment.y,
            left: comment.x,
          }}
          className={styles.Comment}
        >
          <div className={styles.InnerContainer}>
            <div className={styles.AvContainer}>
              <div
                className={styles.Avatar}
                style={{
                  backgroundColor: `#${comment.userColor}`,
                }}
              >
                SR
              </div>
            </div>
            <div>
              <div className={styles.Name}>{comment.user}</div>
              <div className={styles.Details}>{comment.comment}</div>
            </div>
          </div>
          <div className={styles.Reply}>
            <span
              className={styles.Avatar}
              style={{
                background: `#${myColor}`,
              }}
            >
              SR
            </span>{" "}
            Reply
          </div>
        </div>
      ))}
      {showCommentBox && (
        <div
          style={{
            position: "absolute",
            top: commentY,
            left: commentX,
          }}
          className={styles.NewComment}
        >
          <textarea
            onChange={(e) => {
              setCommentText(e.target.value.toString());
            }}
          />
          <div className={styles.Action}>
            <button
              className={styles.Btn}
              onClick={() => {
                handleCommentAdd(commentX, commentY);
              }}
            >
              Add Comment
            </button>
            <button
              className={styles.BtnCancel}
              onClick={() => {
                setShowCommentBox(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
