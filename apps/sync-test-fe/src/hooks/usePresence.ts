import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SyncManager } from "@wyre-client/core";
import { debounce } from "lodash";

type MOUSE_STATE = "up" | "down" | "dragging";

export interface IUserDetails {
  mousePosition: number[];
  mouseState: MOUSE_STATE;
  name: string;
  userColor: string;
}

export interface IRoomData {
  users: { [userId: string]: IUserDetails };
}

const INITIAL_ROOM_DATA: IRoomData = {
  users: {},
};

const getRandomColor = () => {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

let loadedData: any;
let userName: string;

export const usePresence = () => {
  const [value, setValue] = useState(0);
  // const [loadedData, setLoadedData] = useState(null);
  const id = useMemo(() => SyncManager._io.id, [SyncManager._io.connected]);

  const onChange = (patch: any) => {
    setValue((value) => value + 1);
  };

  const onConnect = useCallback(() => {
    const myDetails = {
      name: userName,
      mousePosition: [window.screen.width / 2, window.screen.height / 2],
      mouseState: "up",
      userColor: getRandomColor(),
    };
    console.log("[onConnect]", myDetails, loadedData);
    // @ts-ignore
    loadedData?.users.insert(id, myDetails);
  }, [loadedData]);

  const removeSelf = () => {
    // @ts-ignore
    loadedData?.users.delete(id);
  };

  const init: (roomId: string, name?: string) => Promise<any> = async (
    roomId: string,
    name?: string
  ) => {
    userName = name || "";
    loadedData = await SyncManager.create({
      data: INITIAL_ROOM_DATA,
      collectionName: "",
      refid: roomId,
      onChange,
      name: name || "",
      onConnect: onConnect,
    });

    const myDetails = {
      name,
      mousePosition: [window.screen.width / 2, window.screen.height / 2],
      mouseState: "up",
      userColor: getRandomColor(),
    };
    // @ts-ignore
    loadedData?.users.insert(id, myDetails);

    // setLoadedData(loadedData);
    // const usersInRoom = await SyncManager.getUsersInRoom(roomId);

    // usersInRoom.forEach((user) => {
    //   try {
    //     const userData = {
    //       name: user.name,
    //       mousePosition: [window.screen.width / 2, window.screen.height / 2],
    //       mouseState: "up",
    //       userColor: getRandomColor(),
    //     };
    //     console.log("Inserting User", userData);
    //     loadedData.users.insert(user.socketId, userData);
    //   } catch (error) {}
    // });

    SyncManager.setupEventListener("room:user:add:" + roomId, (data: any) => {
      loadedData.users.delete(data.socketId);
      setValue((value) => value + 1);
    });

    SyncManager.setupEventListener(
      "room:user:remove:" + roomId,
      (data: any) => {
        loadedData.users.delete(data.socketId);
        setValue((value) => value + 1);
      }
    );

    // setup listeners for my mouse position move

    const setXY = debounce((x, y) => {
      loadedData.users[id].mousePosition = [y, x];
    }, 5);

    window.addEventListener("mousedown", (event) => {
      loadedData.users[id].mouseState = "down";
    });

    window.addEventListener("mouseup", (event) => {
      loadedData.users[id].mouseState = "up";
    });

    window.addEventListener("mousemove", (event) => {
      if (loadedData.users[id].mouseState === "down") {
        loadedData.users[id].mouseState = "dragging";
      }
      setXY(event.clientX, event.clientY);
    });

    window.addEventListener("touchmove", (event) => {
      if (loadedData.users[id].mouseState === "down") {
        loadedData.users[id].mouseState = "dragging";
      }
      setXY(event.touches[0].clientX, event.touches[0].clientY);
    });
    window.addEventListener("touchstart", () => {
      loadedData.users[id].mouseState = "down";
    });
    window.addEventListener("touchend", () => {
      loadedData.users[id].mouseState = "up";
    });

    setValue((value) => value + 1);

    return loadedData;
  };

  return { init, value, removeSelf };
};
