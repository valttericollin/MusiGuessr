import { useState } from "react"

interface PlayerViewProps {
  connection: WebSocket,
  name: string
}

const PlayerView: React.FC<PlayerViewProps> = ({ connection, name }) => {
    const [answerSubmitted, setAnswerSubmitted] = useState(false)
    const [answer, setAnswer] = useState("")

    const handleSubmit = (event) => {
        event.preventDefault();
        const msg = {
            type: "submitAnswer",
            answer: answer,
            name: name
        }
        connection.send(JSON.stringify(msg));
        setAnswer("");
        setAnswerSubmitted(true);
    }

    return (
        <>
        <div>
            {!answerSubmitted &&
            <form onSubmit={handleSubmit}>
                <input placeholder="ENTER YOUR GUESS" value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={24}/>
                <div>
                    <button type="submit">SEND</button>
                </div>
            </form>
            }{answerSubmitted &&
            <p>Answer submitted. Waiting for other players.</p>
            }
        </div>
        </>
    )
}

export default PlayerView