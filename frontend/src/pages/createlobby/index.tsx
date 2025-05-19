import PageContents from "../../components/PageContents";

const CreateLobby = () => {
  const spotifyLogin = async () => {
    window.location.href = "http://localhost:8080/login";
  };

  return (
    <>
      <PageContents>
        <div>
          <h1>OTSIKKO</h1>
        </div>
        <div>
          <button onClick={spotifyLogin}>
            Server spotify login redirect button
          </button>
        </div>
      </PageContents>
    </>
  );
};

export default CreateLobby;
