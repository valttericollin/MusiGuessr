import { useState, useEffect } from "react"

interface PlayerViewProps {
  connection: WebSocket,
  name: string
}

const PlayerView: React.FC<PlayerViewProps> = ({ connection, name }) => {
    const [waitingForGameStart, setWaitingForGameStart] = useState(true)
    const [submitFormOpen, setsubmitFormOpen] = useState(false)
    const [answer, setAnswer] = useState("")

    const handleSubmit = (event) => {
        event.preventDefault();
        const msg = {
            type: "submitAnswer",
            answer: answer,
            name: name,
            timeStamp: Date.now()
        }
        connection.send(JSON.stringify(msg));
        setAnswer("");
        setsubmitFormOpen(false);
    }

    useEffect(() => {
        connection.addEventListener("message", (event) => {
            handleMessage(event.data)
        })
    })

    const handleMessage = (msg: string) => {
        const parsed = JSON.parse(msg)

        switch (parsed.action) {
            case "openAnswerInput":
                setsubmitFormOpen(true)
                break
            
            case "closeAnswerInput":
                setsubmitFormOpen(false)
                break

            case "start":
                setWaitingForGameStart(false)
                break
            
            default:
                console.log("Unrecognized message type")
                // handle -->
        }
        }

    return (
        <>
        <div>
            {waitingForGameStart &&
                <p>Waiting for host to start the game.</p>
            }
            {submitFormOpen &&
                <form onSubmit={handleSubmit}>
                    <input placeholder="ENTER YOUR GUESS" value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={24}/>
                    <div>
                        <button type="submit">SEND</button>
                    </div>
                </form>
            }
            {!submitFormOpen &&
                <p>Answer submitted. Waiting for other players.</p>
            }
        </div>
        </>
    )
}

export default PlayerView