import { useState, useRef } from "react"

const JoinLobby = () => {
  const [roomCode, setRoomCode] = useState();
  const [name, setName] = useState();
  const connection = useRef();

  const SubmitAction = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const response = await fetch(`http:://localhost:8080/game/${roomCode}/preflight`);
    if (!response.ok) {
      console.log("Invalid gameId");
      // show error to user
      return;
    }

    const socket = new WebSocket(`ws://localhost:8080/game/${roomCode}`)
    socket.addEventListener("open", (event) => {
      const msg = {
        type: "join",
        data: name
      }
      socket.send(JSON.stringify(msg));
    })
    connection.current = socket;
    }

    /* const test = () => {
      const msg = {
        type: "join",
        name: name
      }
      connection.current.send(JSON.stringify(msg)); */
    

  return (
    <>
      <div>
        <form onSubmit={SubmitAction}>
          <h2>ROOM CODE</h2>
          <input placeholder="ENTER 4-LETTER CODE" value={roomCode} onChange={(event) => setRoomCode(event.target.value)} maxLength={4}/>
          <h2>NAME</h2>
          <input placeholder="ENTER NAME" value={name} onChange={(event) => setName(event.target.value)} maxLength={16}/>
          <div>
            <button type="submit">PLAY</button>
          </div>
        </form>
      </div>
    </>
  )
}

export default JoinLobby