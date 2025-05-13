import { useEffect, useState, useRef} from "react"
import PlayListSelectButton from "../../components/PlayListSelectButton";

const LobbyOptions = () => {
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState();
    const [tracks, setTracks] = useState([])
    const [players, setPlayers] = useState([])
    const connection = useRef(null);

    const getCookie = (name: String) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
    
    useEffect(() => {
        const accessToken = getCookie("token")
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
        const SID = getCookie("SID");
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
        //TODO: other message types
        const parsed = JSON.parse(msg)
        if (parsed.type == "join") {
            setPlayers([...players, parsed.name])
        }
    }

    const handlePlaylistSelect = (playlist) => {
        console.log(playlist.name)
        setSelectedPlaylist(playlist)
    }

    const handleStartClick = async () => {
        // get all tracks in playlist
        const accessToken = getCookie("token")
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

        const msg = {
            type: "gameState",
            action: "start"
        }
        connection.current.send(JSON.stringify(msg))
        setSpotifyContext();
    }

    const setSpotifyContext = async () => {
        const accessToken = getCookie("token")
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


    return (
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
                <h3>Join with code {getCookie("SID")}</h3>
            </div>
            <div>
                {players.length > 0 ?
                <ul>
                    {players.map(player => <li>{player}</li>)}
                </ul>
                : <p>Waiting for players to join...</p>}
            </div>
        </>
    )
}

export default LobbyOptions