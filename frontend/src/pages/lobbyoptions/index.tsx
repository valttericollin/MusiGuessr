import { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/mousewheel';
import Game from "../../components/Game";
import helper from "../../misc/helper";
import PageContents from "../../components/PageContents";
import styles from "./LobbyOptions.module.css"

interface Player {
  name: string;
  score: number;
  currentRoundAnswer: {
    answer: string;
    timeStamp: number;
  };
}

const LobbyOptions = () => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState();
  const [tracks, setTracks] = useState<Array<JSON>>([]);
  const [players, setPlayers] = useState<Array<Player>>([]);
  const [numberOfTracks, setNumberOfTracks] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const connection = useRef<WebSocket>(null);

  useEffect(() => {
    console.log("in useEffect");
    const accessToken = helper.getCookie("token");
    if (!accessToken) {
      window.location.href = "http://localhost:5173/createLobby";
    } else {
      const getPlaylists = async () => {
        const response = await fetch(
          "https://api.spotify.com/v1/me/playlists",
          {
            headers: {
              Authorization: "Bearer " + accessToken,
            },
          },
        );
        const data = await response.json();
        setPlaylists(data.items.map((item: JSON) => item));
      };
      getPlaylists();
    }
    const SID = helper.getCookie("SID");
    const wsAddress = import.meta.env.VITE_BASE_WS;
    const socket = new WebSocket(
      `${wsAddress}/game/${SID}/${accessToken}`,
    );

    socket.addEventListener("open", (event) => {
      socket.send("Connection established");
    });

    // Listen for messages
    socket.addEventListener("message", (event) => {
      console.log("happening");
      console.log(event.data);
      handleMessage(event.data);
    });
    connection.current = socket;
  }, []);

  const handleMessage = (msg: string) => {
    //Handle incoming messages from websocket
    console.log("handleMessage");
    const parsed = JSON.parse(msg);
    switch (parsed.type) {
      case "join": {
        console.log("join");
        const newPlayer = {
          name: parsed.name,
          score: 0,
          currentRoundAnswer: { answer: "", timeStamp: 0 },
        };
        setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
        break;
      }
      case "submitAnswer":
        console.log("submitAnswer");
        console.log("cur players: ", players); // empty array for some reason? works either way, fix later.
        console.log(players.find((player) => player.name === parsed.name));
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player.name === parsed.name
              ? {
                  ...player,
                  currentRoundAnswer: {
                    answer: parsed.answer,
                    timeStamp: parsed.timeStamp,
                  },
                }
              : player,
          ),
        );
        break;
      default:
        console.log("unrecognized message type");
      // do stuff
    }
    setTimeout(() => {
      console.log("players after handlemessage: ", players); // still empty array.
    }, 0);
  };

  /* const resetCurrentRoundAnswers = () => {
        setPlayers(players.map((player) => ({...player, currentRoundAnswer: {answer: "", timeStamp: 0}})))
    } */

  const handlePlaylistSelect = (playlist) => {
    console.log(playlist.name);
    setSelectedPlaylist(playlist);
  };

  const handleStartClick = async () => {
    if (players.length == 0) {
      // maybe display some error message.
      return;
    }
    // get all tracks in playlist
    const accessToken = helper.getCookie("token");
    let response = await fetch(
      `https://api.spotify.com/v1/playlists/${selectedPlaylist.id}/tracks?limit=50`,
      {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      },
    );
    let data = await response.json();
    const playlistTracks = data.items;
    while (data.next) {
      response = await fetch(data.next);
      data = await response.json();
      playlistTracks.push(data);
    }
    helper.shuffle(playlistTracks);
    setTracks(playlistTracks.slice(0, numberOfTracks));
    //TODO: transfer playback to some device to start playback.
    // notify server
    const msg = {
      type: "gameState",
      action: "start",
    };
    connection.current.send(JSON.stringify(msg));
    setGameStarted(true);
  };

  const setSpotifyContext = async () => {
    const accessToken = helper.getCookie("token");
    const response = await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context_uri: selectedPlaylist.uri,
      }),
    });

    const data = await response.json();
    console.log(data);
  };

  const getNextTrack = () => {
    const newTracks = [...tracks];
    const nextTrack = newTracks.pop();
    setTracks(newTracks);
    return nextTrack;
  };

  const handleNumberOfSongschange = (event) => {
    let input = event.target.value;
    if (input.length == 0) {
      setNumberOfTracks("");
      return;
    }
    input = parseInt(input);
    if (!Number.isNaN(input) && 0 < input && input <= 100) {
      setNumberOfTracks(input);
    }
  };

  return (
    <>
      <PageContents>
        {!gameStarted && ( // probably should be made into its own component
          <>
            <div>
              <h1 className={styles.h1}>Choose a playlist</h1>
            </div>
            <div className={styles.carousel}>
              <Swiper
                className="mySwiper"
                direction={'horizontal'}
                slidesPerView={3}
                spaceBetween={30}
                mousewheel={true}
                loop={true}
                pagination={{
                  clickable: true,
                }}
                modules={[Mousewheel]}
                style={{ width: '100%', maxWidth: '100vw' }}
                watchSlidesProgress={false}
                onSlideChange={(swiper) => {
                  let activeIndex = swiper.realIndex;
                  activeIndex = activeIndex === playlists.length - 1 ? 0 : activeIndex + 1; // fix the index
                  const activePlaylist = playlists[activeIndex];
                  console.log("Current Playlist:", activePlaylist);
                  console.log(activeIndex);
                  setSelectedPlaylist(activePlaylist);
                }}
              >
                {playlists.map((playlist) => {
                  return (
                  <SwiperSlide
                    key={playlist.name}>
                      <button
                        className={playlist.name === selectedPlaylist?.name ? styles.playlistCardSelected : styles.playlistCard}>
                        {playlist.name}
                      </button>
                  </SwiperSlide>
                  )
                })}
              </Swiper>
            <div>
              <input
                type="number"
                min={""}
                max={selectedPlaylist?.tracks.total}
                className={styles.inputContainer}
                placeholder={`SELECT NUMBER OF SONGS 1-${selectedPlaylist?.tracks.total}`}
                value={numberOfTracks}
                onChange={handleNumberOfSongschange}
                maxLength={2}
              />
            </div>
            </div>
            <div className={styles.buttonContainer}>
              <button className={styles.button} onClick={handleStartClick}>Start game!</button>
            </div>
            <div className={styles.optionsRow}>
              <div className={styles.sidePanel}>
                <h3 className={styles.h3}>Join with code: {helper.getCookie("SID")}</h3>
                <section className={styles.textSetction}>
                  The aim of the game is to guess the names of the songs being played.
                  If multiple players get the same song right, the faster answers will get more
                  points. The player with the most points at the end of the game wins! Good luck!
                </section>
              </div>
              <div className={styles.sidePanel}>
                {players.length > 0 ? (
                  <>
                    <h2 className={styles.h3}>Players</h2>
                    <ul className={styles.playerList}>
                      {players.map((player) => (
                        <li className={styles.playersListItem} key={player.name}>{player.name}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <h2 className={styles.h3}>Waiting for players to join...</h2>
                )}
              </div>
            </div>
          </>
        )}
        {gameStarted && (
          <Game
            getNextTrack={getNextTrack}
            connection={connection.current}
            accessToken={helper.getCookie("token")}
            players={players}
            playlistUri={selectedPlaylist.uri}
            setPlayers={setPlayers}
            setGameStarted={setGameStarted}
          />
        )}
      </PageContents>
    </>
  );
};

export default LobbyOptions;