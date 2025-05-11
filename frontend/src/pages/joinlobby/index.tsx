

const JoinLobby = () => {

  const SubmitAction = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    console.log("SUBMIT")
  }
  

  return (
    <>
      <div>
      </div>
      <div>
        <form onSubmit={SubmitAction}>
          <h2>ROOM CODE</h2>
          <input placeholder="ENTER 4-LETTER CODE"/>
          <h2>NAME</h2>
          <input placeholder="ENTER NAME" />
          <div>
            <button type="submit">PLAY</button>
          </div>
        </form>
      </div>
    </>
  )
}

export default JoinLobby