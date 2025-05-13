import { useState } from "react"

const PlayerView = (connection: WebSocket) => {
    const [answerSubmitted, setAnswerSubmitted] = useState(false)
    const [answer, setAnswer] = useState("")

    const handleSubmit = () => {
        const msg = {
            type: "answer",
            data: answer
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