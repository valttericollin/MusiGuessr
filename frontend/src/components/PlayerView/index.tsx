import { useState, useEffect } from "react";
import styles from "./PlayerView.module.css"

interface PlayerViewProps {
  connection: WebSocket;
  name: string;
}

const PlayerView: React.FC<PlayerViewProps> = ({ connection, name }) => {
  const [waitingForGameStart, setWaitingForGameStart] = useState(true);
  const [submitFormOpen, setsubmitFormOpen] = useState(false);
  const [answer, setAnswer] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const msg = {
      type: "submitAnswer",
      answer: answer,
      name: name,
      timeStamp: Date.now(),
    };
    connection.send(JSON.stringify(msg));
    setAnswer("");
    setsubmitFormOpen(false);
  };

  useEffect(() => {
    connection.addEventListener("message", (event) => {
      handleMessage(event.data);
    });
  });

  const handleMessage = (msg: string) => {
    const parsed = JSON.parse(msg);

    switch (parsed.action) {
      case "openAnswerInput":
        setsubmitFormOpen(true);
        break;

      case "closeAnswerInput":
        setsubmitFormOpen(false);
        break;

      case "start":
        setWaitingForGameStart(false);
        break;

      default:
        console.log("Unrecognized message type");
      // handle -->
    }
  };

  return (
    <>
      <div>
        {waitingForGameStart && <h2 className={styles.h2}>Waiting for host to start the game.</h2>}
        {submitFormOpen && (
          <form className={styles.formContainer} onSubmit={handleSubmit}>
            <input
              className={styles.inputContainer}
              placeholder="ENTER YOUR ANSWER"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              maxLength={32}
            />
            <div className={styles.buttonContainer}>
              <button className={styles.button} type="submit">SEND</button>
            </div>
          </form>
        )}
        {!submitFormOpen && !waitingForGameStart && <h2 className={styles.h2}>Answer submitted. Waiting for next song.</h2>}
      </div>
    </>
  );
};

export default PlayerView;
