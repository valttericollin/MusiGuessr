import { useState, useEffect } from "react";
import styles from "./PlayerCard.module.css"

interface PlayerCardProps {
  name: string;
  score: number;
  currentRoundAnswer: string;
  showAnswers: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  score,
  currentRoundAnswer,
  showAnswers,
}) => {
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    // update score incrementally
    if (displayScore === score) return;

    const difference = score - displayScore;
    const steps = Math.abs(difference);
    const duration = 1000; // 1 second
    const intervalTime = duration / steps;

    const increment = difference > 0 ? 1 : -1;

    const interval = setInterval(() => {
      setDisplayScore((prev) => {
        const next = prev + increment;
        if (
          (increment > 0 && next >= score) ||
          (increment < 0 && next <= score)
        ) {
          clearInterval(interval);
          return score;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [score, displayScore]);

  return (
    <>
      {!showAnswers && (
        <div className={currentRoundAnswer !== "" ? styles.playerCardWithAnswer : styles.playerCard}>
          {name} Score: {displayScore}
        </div>
      )}
      {showAnswers && (
        <div className={currentRoundAnswer !== "" ? styles.playerCardWithAnswer : styles.playerCard}>
          {name} Score: {displayScore} Answer:{" "}
          {currentRoundAnswer != "" ? currentRoundAnswer : "..."}
        </div>
      )}
    </>
  );
};

export default PlayerCard;
