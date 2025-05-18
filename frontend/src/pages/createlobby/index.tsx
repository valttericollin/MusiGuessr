const CreateLobby = () => {

  const spotifyLogin = async () => {
    window.location.href = "http://localhost:8080/login"
  }

  return (
    <>
      <div>
        <h1>OTSIKKO</h1>
      </div>
      <div>
        <button onClick={spotifyLogin}>Server spotify login redirect button</button>
      </div>
    </>
  )

}

export default CreateLobby