import React, { useMemo } from "react";
import { usePresence } from "../hooks/usePresence";
import { useState, useEffect } from "react";
import styles from "./Presence.module.css";
import clsx from "clsx";
import { Modal, Input, Button } from "antd";
import { Cursor } from "../components/Cursor/Cursor";

const getInitials = function (name: string) {
  var names = name.split(" "),
    initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

const getMouseStatusClass = (status: string) => {
  switch (status) {
    case "up":
      return styles.MouseStatusUp;
    case "down":
      return styles.MouseStatusDown;
    case "dragging":
      return styles.MouseStatusDragging;
  }
};

export const Presence: React.FC = () => {
  const presence = usePresence();
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [presenceDetails, setPresenceDetails] = useState<any>({ users: {} });
  const [isNameSet, setIsNameSet] = useState(false);
  const [name, setName] = useState("");

  const initRoom = async () => {
    setLoaded(false);
    setLoading(true);
    const presenceDetails = await presence.init({
      presenceId: "presenceroom",
    });
    setPresenceDetails(presenceDetails);
    setLoaded(true);
    setLoading(false);
  };

  const enterRoom = async () => {
    await initRoom();
    setIsNameSet(true);
  };

  if (!isNameSet) {
    return (
      <div>
        <Modal
          open={true}
          okButtonProps={{ disabled: true }}
          cancelButtonProps={{ disabled: true }}
        >
          <div>
            <h3>Enter your name</h3>

            <p>
              <Input onChange={(e) => setName(e.target.value)} />{" "}
            </p>
            <p>
              <Button onClick={enterRoom} loading={loading}>
                Login
              </Button>
            </p>
          </div>
        </Modal>
      </div>
    );
  }

  if (loaded && isNameSet) {
    return (
      <div className={styles.OuterContainer}>
        {/* ts-ignore */}
        {presenceDetails.users.keys().map((userId: string) => {
          return (
            <div
              className={styles.Container}
              style={{
                top: presenceDetails.users[userId].mousePosition[0],
                left: presenceDetails.users[userId].mousePosition[1],
              }}
            >
              <Cursor color={presenceDetails.users[userId].userColor} />
              <div
                className={styles.Avatar}
                style={{ background: presenceDetails.users[userId].userColor }}
              >
                {getInitials(presenceDetails.users[userId].name)}
              </div>
              <div
                className={clsx(
                  styles.MouseStatus,
                  getMouseStatusClass(presenceDetails.users[userId].mouseState)
                )}
              >
                {presenceDetails.users[userId].mouseState}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return <></>;
};
