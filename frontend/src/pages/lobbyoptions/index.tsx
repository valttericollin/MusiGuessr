import { useEffect, useState, useRef} from "react"
import PlayListSelectButton from "../../components/PlayListSelectButton";
import Game from "../../components/Game";
import helper from "../../misc/helper";

interface Player {
    name: string,
    score: number,
    currentRoundAnswer: string
}

const LobbyOptions = () => {
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState();
    const [tracks, setTracks] = useState<Array<JSON>>([])
    const [players, setPlayers] = useState<Array<Player>>([])
    const [numberOfTracks, setNumberOfTracks] = useState("");
    const [gameStarted, setGameStarted] = useState(false)
    const connection = useRef<WebSocket>(null);

    /* const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    } */
    
    useEffect(() => {
        console.log("in useEffect")
        const accessToken = helper.getCookie("token")
        if (!accessToken) {
            window.location.href = "http://localhost:5173/createLobby"
        } else {
            const getPlaylists = async () => {
                const response = await fetch("https://api.spotify.com/v1/me/playlists", {
                    headers: {
                        Authorization : "Bearer " + accessToken
                    }
                })
                const data = await response.json();
                setPlaylists(data.items.map((item: JSON) => item));
            }
            getPlaylists() 
            
        }
        const SID = helper.getCookie("SID");
        const socket = new WebSocket(`ws://localhost:8080/game/${SID}/${accessToken}`)
        
        socket.addEventListener("open", (event) => {
        socket.send("Connection established")
        })

        // Listen for messages
        socket.addEventListener("message", (event) => {
            console.log("happening");
            console.log(event.data);
            handleMessage(event.data);
        })
        connection.current = socket

    }, [])

    const handleMessage = (msg: string) => {
        //Handle incoming messages from websocket
        console.log("handleMessage")
        const parsed = JSON.parse(msg)
        switch (parsed.type) {
            case "join": {
                console.log("join")
                const newPlayer = {name: parsed.name, score: 0, currentRoundAnswer: ""}
                setPlayers([...players, newPlayer])
                break
            }
            case "submitAnswer":
                console.log("submitAnswer")
                console.log("cur players: ", players)
                console.log(players.find((player) => player.name === parsed.name))
                setPlayers(prevPlayers => 
                    prevPlayers.map((player) =>
                        player.name === parsed.name
                            ? { ...player, currentRoundAnswer: parsed.answer }
                            : player
                    ));
                break
            default:
                console.log("unrecognized message type")
                // do stuff
        }
    }

    const resetCurrentRoundAnswers = () => {
        setPlayers(players.map((player) => ({...player, currentRoundAnswer: ""})))
    }

    const handlePlaylistSelect = (playlist) => {
        console.log(playlist.name)
        setSelectedPlaylist(playlist)
    }

    const handleStartClick = async () => {
        // get all tracks in playlist
        const accessToken = helper.getCookie("token")
        let response = await fetch(`https://api.spotify.com/v1/playlists/${selectedPlaylist.id}/tracks?limit=50`, {
            headers: {
                Authorization : "Bearer " + accessToken
            }
        })
        let data = await response.json()
        const playlistTracks = data.items
        while (data.next) {
            response = await fetch(data.next)
            data = await response.json()
            playlistTracks.push(data)
        }
        setTracks(playlistTracks)
        //TODO: transfer playback to some device to start playback.
        // notify server
        const msg = {
            type: "gameState",
            action: "start"
        }
        connection.current.send(JSON.stringify(msg))
        setGameStarted(true)
    }

    const setSpotifyContext = async () => {
        const accessToken = helper.getCookie("token")
        const response = await fetch("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + accessToken,
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({
                "context_uri" : selectedPlaylist.uri
            })
        })
        
        const data = await response.json();
        console.log(data);
    }

    const getNextTrack = () => {
        const newTracks = [...tracks];
        const nextTrack = newTracks.pop();
        setTracks(newTracks);
        return nextTrack;
    }

    const handleNumberOfSongschange = (event) => {
        let input = event.target.value
        if (input.length == 0) {
            setNumberOfTracks("")
            return
        }
        input = parseInt(input)
        if (!Number.isNaN(input) && 0 < input && input < 13) {
            setNumberOfTracks(input)
        }
    }


    return (
        <>
            {!gameStarted && // probably should be made into its own component
            <>
                <div>
                    <h1>Lobby options over here</h1>
                </div>
                <div>
                    {playlists.map((playlist) => <PlayListSelectButton key={playlist.name} playlist={playlist} handlePlaylistSelect={handlePlaylistSelect}></PlayListSelectButton>)}
                </div>
                <div>
                    <button onClick={handleStartClick}>Start game!</button>
                </div>
                <div>
                    <h3>Join with code {helper.getCookie("SID")}</h3>
                </div>
                <div>
                    <input placeholder="NUMBER OF SONGS 1-12" value={numberOfTracks} onChange={handleNumberOfSongschange} maxLength={2}/>
                </div>
                <div>
                    {players.length > 0 ?
                    <ul>
                        {players.map(player => <li>{player.name}</li>)}
                    </ul>
                    : <p>Waiting for players to join...</p>}
                </div>
            </>
            }
            {gameStarted &&
                <Game 
                    getNextTrack={getNextTrack} 
                    connection={connection.current} 
                    accessToken={helper.getCookie("token")} 
                    players={players} 
                    playlistUri={selectedPlaylist.uri}
                />
            }
        </>
    )
}

export default LobbyOptions