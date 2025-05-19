import { useState, useEffect, useRef } from "react";
import PlayerContainer from "../PlayerContainer";
import SpinningRecord from "../SpinningRecord";
import helper from "../../misc/helper";
import styles from "./Game.module.css"

interface gameProps {
  getNextTrack: () => JSON;
  connection: WebSocket;
  accessToken: string;
  playlistUri: string;
  players: any;
  setPlayers: any;
  setGameStarted: any;
  resetCurrentRoundAnswers: () => void;
}

const Game: React.FC<gameProps> = ({
  getNextTrack,
  connection,
  accessToken,
  players,
  playlistUri,
  setPlayers,
  setGameStarted
}) => {
  const [startMessage, setStartMessage] = useState(true);
  const [startCounter, setStartCounter] = useState(3);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [showBackToLobbyButton, setShowBackToLobbyButton] = useState(false)
  const [track, setTrack] = useState<JSON>();
  const [nextTrackFlag, setNextTrackFlag] = useState(false);
  const [startPlaybackFlag, setStartPlaybackFlag] = useState(false);
  const [trackPlaying, setTrackPlaying] = useState(false);
  const [finalScoreView, setFinalScoreView] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const playersRef = useRef(players);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    if (startCounter >= 1) {
      const interval = setInterval(() => {
        setStartCounter((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setStartMessage(false);
    }
  }, [startCounter])

  useEffect(() => {
    if (!startMessage && (!track || nextTrackFlag)) {
      const nextTrack = getNextTrack();
      setNextTrackFlag(false);
      if (nextTrack === undefined || nextTrack === null) {
        setFinalScoreView(true);
        setTimeout(() => {
          setShowBackToLobbyButton(true);
        }, 5000);
        return;
      }
      setTrack(nextTrack);
      setStartPlaybackFlag(true);
    }
  }, [getNextTrack, nextTrackFlag, track, startMessage]);

  useEffect(() => {
    if (track && !trackPlaying && startPlaybackFlag) {
      console.log("in useEffect 2, start playback: ", track.track.name);

      const msg = {
        type: "gameState",
        action: "openAnswerInput",
      };
      // Signal player clients to open answer inputs.
      connection.send(JSON.stringify(msg));

      startTrackPlayback();
      setTrackPlaying(true);
      setStartPlaybackFlag(false);

      setTimeout(() => {
        const msg = {
          type: "gameState",
          action: "closeAnswerInput",
        };
        // Signal player clients to close answer inputs.
        connection.send(JSON.stringify(msg));

        pausePlayback();
        setTrackPlaying(false);
        setRevealAnswer(true);
      }, 20000); // Stop playback after 20s
    }
  }, [track, trackPlaying, startPlaybackFlag]);

  useEffect(() => {
    if (revealAnswer) {
      setTimeout(() => {
        setRevealAnswer(false);
        setShowAnswers(true);
      },7000);
    };
  }, [revealAnswer])

  useEffect(() => {
    if (showAnswers) {
      console.log("in useEffect 3, show answers");
      updateScores();
      setTimeout(() => {
        setShowAnswers(false);
        setNextTrackFlag(true);
        resetCurrentRoundAnswers();
      }, 5000);
    }
  }, [showAnswers]);

  const updateScores = () => {
    let score = 10;
    const orderedTimeStamps: { timeStamp: number; name: string }[] = [];

    playersRef.current.forEach((player) => {
      if (
        helper.compare(track.track.name, player.currentRoundAnswer.answer, 0.1)
      ) {
        orderedTimeStamps.push({
          timeStamp: player.currentRoundAnswer.timeStamp,
          name: player.name,
        });
      }
    });

    if (orderedTimeStamps.length === 0) return;

    // sort from fastest to slowest
    orderedTimeStamps.sort((a, b) => a.timeStamp - b.timeStamp);

    // map of name -> score
    const scoreMap: Record<string, number> = {};
    orderedTimeStamps.forEach((entry) => {
      scoreMap[entry.name] = score;
      if (score > 6) score -= 2;
    });

    // apply score updates
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => {
        if (scoreMap[player.name] !== undefined) {
          return {
            ...player,
            score: player.score + scoreMap[player.name],
          };
        }
        return player;
      }),
    );
    setTimeout(() => {
      console.log("Players after score update:", players); // not on time
    }, 0);
  };

  const startTrackPlayback = async () => {
    console.log(track);
    const response = await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "context-uri": playlistUri,
        uris: [track.track.uri],
      }),
    });
    // possibly add some error handling
  };

  const resetCurrentRoundAnswers = () => {
    setPlayers(
      playersRef.current.map((player) => {
        // fix linter errors
        console.log("in reset answer, player: ", player);
        return { ...player, currentRoundAnswer: { answer: "", timeStamp: 0 } };
      }),
    );
  };

  const pausePlayback = async () => {
    console.log(track);
    const response = await fetch("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });
  };

  const handleBackToLobbyClick = (event) => {
    setTrack(null);
    setPlayers(
      playersRef.current.map((player) => {
        return (
          {...player, score: 0}
        )
      })
    )
    setGameStarted(false);
    };

  return (
    <>
      <div>
        {startMessage &&
          <h1 className={styles.h1}>Get ready! Game starting in {startCounter}</h1>
        }
        {trackPlaying && 
          <h1 className={styles.h1}>Write your answers!</h1>
        }
        {revealAnswer && 
          <h1 className={styles.h1}>Correct answer: {track.track.name}</h1>
        }
        {showAnswers && 
          <h1 className={styles.h1}>You answered</h1>
        }
        {finalScoreView && 
          <h1 className={styles.h1}>Final scores</h1>
        }
        {showBackToLobbyButton &&
          <div className={styles.buttonContainer}>
            <button className={styles.button} onClick={handleBackToLobbyClick}>Back to lobby</button>
          </div>
        }
      </div>
      <div>
        <SpinningRecord isSpinning={trackPlaying} />
      </div>
      <div>
        {<PlayerContainer players={players} showAnswers={showAnswers} />}
      </div>
    </>
  );
};

export default Game;
