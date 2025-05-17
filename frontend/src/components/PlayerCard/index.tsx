import { useState, useEffect} from "react"

interface PlayerCardProps {
    name: string,
    score: number,
    currentRoundAnswer: string
    showAnswers: boolean
}   

const PlayerCard: React.FC<PlayerCardProps> = ({name, score, currentRoundAnswer, showAnswers}) => {
const [displayScore, setDisplayScore] = useState(score);

    useEffect(() => {
        console.log("PlayerCard answer: ", currentRoundAnswer)
        // Smooth score update
        if (showAnswers && displayScore != score) {
        // SOMETHING BROKEN
            const difference = score - displayScore;
            const intervalTime = 1000 / difference;

            /* const increment = difference > 0 ? 1 : 0; */

            const interval = setInterval(() => {
                setDisplayScore(prev => {
                    const next = prev + 1;
                    if (next >= score) {
                        clearInterval(interval);
                        return score;
                    }
                    return next;
                })
            }, intervalTime);
        }
    },)

    return (
        <>
            {!showAnswers && 
                <li
                key={name}
                style={{ color: currentRoundAnswer !== "" ? "white" : "gray" }}
                >
                    {name} Score: {score}
                </li>
            }
            {showAnswers &&
                <li
                key={name}
                style={{ color: currentRoundAnswer !== "" ? "white" : "gray" }}
                >
                    {name} Score: {score} Answer: {currentRoundAnswer != "" ? currentRoundAnswer : "..."}
                </li>
            }
        </>
    )
}

export default PlayerCard