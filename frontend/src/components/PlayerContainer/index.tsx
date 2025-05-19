import { useMemo } from "react";
import PlayerCard from "../PlayerCard";
import styles from "./PlayerContainer.module.css";

interface Player {
  name: string;
  score: number;
  currentRoundAnswer: {
    answer: string;
    timeStamp: number;
  };
}

interface PlayerContainerProps {
  players: Player[];
  showAnswers: boolean;
}

const PlayerContainer: React.FC<PlayerContainerProps> = ({
  players,
  showAnswers,
}) => {
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players],
  );

  return (
    <div>
      <ul className={styles.playerList}>
        {sortedPlayers.map((player) => (
          <li key={player.name} className={styles.playerListItem}>
            <PlayerCard
              name={player.name}
              score={player.score}
              currentRoundAnswer={player.currentRoundAnswer.answer}
              showAnswers={showAnswers}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerContainer;
