import { useState, useEffect } from "react"
import PlayerCard from "../PlayerCard"

interface finalScoreViewProps {
    players: Array<
        {name: string,
        score: number,
        currentRoundAnswer: {
            answer: string,
            timeStamp: number
        }}> 
}

const FinalScoreView: React.FC<finalScoreViewProps> = ({ players }) => {
    const [displayPlayers, setDisplayPlayers] = useState<{ score: number; name: string }[]>([])

    useEffect(() => {
        if (displayPlayers.length != 0) {
            return;
        }

        const nameAndScoreArray: { score: number; name: string }[] = [];
        players.map(player => nameAndScoreArray.push({score: player.score, name: player.name}));
        nameAndScoreArray.sort((a, b) => a.score - b.score);
        setDisplayPlayers(nameAndScoreArray);

    },[displayPlayers, players])

    return (
        <>
            <div>
                <h1>Final scores</h1>
            </div>
            <div>
                {displayPlayers?.map((player) => {
                    <PlayerCard 
                        name={player.name}
                        score={player.score}
                        currentRoundAnswer=""
                        showAnswers={false}
                    />
                })}
            </div>
        </>
    )
}

export default FinalScoreView