import { useEffect, useState, useRef} from "react"
import PlayListSelectButton from "../../components/PlayListSelectButton";

const LobbyOptions = () => {
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState();
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
        console.log("Message from server ", event.data)
        })
        connection.current = socket

    }, [])

    const handlePlaylistSelect = (playlist) => {
        console.log(playlist.name)
        setSelectedPlaylist(playlist)
    }

    const handleStartClick = () => {
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
            <div>Join with code{getCookie("SID")}</div>
        </>
    )
}

export default LobbyOptions