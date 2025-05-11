

const CreateLobby = () => {
  
  const getAccesToken = async () => {
    // Do this through server
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {"Content-type": "application/x-www-form-urlencoded"},
      body: `grant_type=client_credentials&client_id=${import.meta.env.VITE_CLIENT_ID}&client_secret=${import.meta.env.VITE_CLIENT_SECRET}`
    });

    const data = await response.json();
    console.log(data)
  }

  const spotifyLogin = async () => {
    window.location.href = "http://localhost:8080/login"
  }

  return (
    <>
      <div>
        <h1>OTSIKKO</h1>
      </div>
      <div>
        <button onClick={getAccesToken}>API TOKEN TEST BUTTON</button>
      </div>
      <div>
        <button onClick={spotifyLogin}>Server spotify login redirect button</button>
      </div>
    </>
  )

}

export default CreateLobby