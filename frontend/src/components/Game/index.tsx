import { useState, useEffect } from "react"

interface gameProps {
  getNextTrack: () => JSON,
  connection: WebSocket,
  accessToken: string,
  playlistUri: string
}

const Game: React.FC<gameProps> = ({ getNextTrack, connection, accessToken, players, playlistUri }) => {
    const [track, setTrack] = useState<JSON>();
    const [trackPlaying, setTrackPlaying] = useState(false)
    
    useEffect(() => {
        setTrack(getNextTrack())
    }, [])

    useEffect(() => {
        if (track) {
            console.log(track.track.uri)
            startTrackPlayback()
        }
    }, [track])

    const startTrackPlayback = async () => {
        console.log(track)
        const response = await fetch("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + accessToken,
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({
                "context-uri": playlistUri,
                "uris": [
                    track.track.uri
                ]
                /* "offset": {
                    "uri": track.track.uri
                } */
            })
        })
        // possibly add some error handling 
        setTrackPlaying(true)
    }

    /* const testing = () => {
        const nextTrack = getNextTrack()
        setTrack(nextTrack)
        startTrackPlayback()
    } */

    return (
        <>
            <div>
                <ul>
                    {players.map((player) => (
                        <li
                        key={player.name}
                        style={{ color: player.currentRoundAnswer !== "" ? "green" : "gray" }}
                        >
                        {player.name} score: {player.score}
                        </li>
                    ))}
                </ul>   
                {/* <button onClick={testing}>TEST</button> */}
            </div>
        </>
    )
}

export default Game