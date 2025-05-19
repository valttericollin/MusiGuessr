import { useState, useRef } from "react";
import PlayerView from "../../components/PlayerView";
import PageContents from "../../components/PageContents";
import styles from "./JoinLobby.module.css";

const JoinLobby = () => {
  const [roomCode, setRoomCode] = useState();
  const [name, setName] = useState();
  const [connected, setConnected] = useState(false);
  const connection = useRef<WebSocket>(null);

  const SubmitAction = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const baseAddress = import.meta.env.VITE_BASE_ADDRESS;
    const response = await fetch(
      `${baseAddress}/game/${roomCode}/preflight`,
    );
    if (!response.ok) {
      console.log("Invalid gameId");
      // show error to user
      return;
    }

    const ws = import.meta.env.VITE_BASE_WS;
    const socket = new WebSocket(`${ws}/game/${roomCode}`);
    socket.addEventListener("open", (event) => {
      const msg = {
        type: "join",
        name: name,
      };
      socket.send(JSON.stringify(msg));
    });
    connection.current = socket;
    setConnected(true);
  };

  return (
    <>
      <PageContents>
        {!connected && (
          <div className={styles.container}>
            <form className={styles.formContainer} onSubmit={SubmitAction}>
              <h2 className={styles.h2}>ROOM CODE</h2>
              <input
                className={styles.inputContainer}
                placeholder="ENTER 4-LETTER CODE"
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value)}
                maxLength={4}
              />
              <h2 className={styles.h2}>NAME</h2>
              <input
                className={styles.inputContainer}
                placeholder="ENTER NAME"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={16}
              />
              <div className={styles.buttonContainer}>
                <button className={styles.button} type="submit">PLAY</button>
              </div>
            </form>
          </div>
        )}
        {connected && <PlayerView connection={connection.current} name={name} />}
      </PageContents>
    </>
  );
};

export default JoinLobby;
