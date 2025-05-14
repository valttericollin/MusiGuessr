import { useState } from "react"

interface PlayerCardProps {
    name: string,
    score: number,
    gotAnswer: boolean
}   

const PlayerCard: React.FC<PlayerCardProps> = ({name, score, gotAnswer}) => {
const [answerSubmitted, setAnswerSubmitted] = useState(false)

    return (
        <>
            {name} score: {score}
        </>
    )
}

export default PlayerCard