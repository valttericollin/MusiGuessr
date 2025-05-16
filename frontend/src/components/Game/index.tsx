import { useState, useEffect } from "react"

interface gameProps {
  getNextTrack: () => JSON,
  connection: WebSocket,
  accessToken: string,
  playlistUri: string
}

const Game: React.FC<gameProps> = ({ getNextTrack, connection, accessToken, players, playlistUri }) => {
    const [track, setTrack] = useState<JSON>();
    const [nextTrackFlag, setNextTrackFlag] = useState(false);
    const [startPlaybackFlag, setStartPlaybackFlag] = useState(false)
    const [trackPlaying, setTrackPlaying] = useState(false);
    const [showAnswers, setShowAnswers] = useState(false);
    
    useEffect(() => {
        if (!track || nextTrackFlag) {
            console.log("in useEffect 1")
            setTrack(getNextTrack())
            setNextTrackFlag(false)
            setStartPlaybackFlag(true)
        }
    }, [nextTrackFlag, track])

    useEffect(() => {
        if (track && !trackPlaying && startPlaybackFlag) {
            console.log("in useEffect 2, start playback: ", track.track.name)
            startTrackPlayback()
            setTrackPlaying(true)
            setStartPlaybackFlag(false)
            
            setTimeout(() => {
                pausePlayback();
                setTrackPlaying(false);
                setShowAnswers(true);
            }, 10000)
        }
    }, [track, trackPlaying, startPlaybackFlag])

    useEffect(() => {
        if (showAnswers) {
            console.log("in useEffect 3, show answers")
            setTimeout(() => {
                setShowAnswers(false);
                setNextTrackFlag(true);
            }, 5000)
        }
    })

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
    }

    const pausePlayback = async () => {
        console.log(track)
        const response = await fetch("https://api.spotify.com/v1/me/player/pause", {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + accessToken
            },
        })
    }

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
                {showAnswers && <h1>SHOW ANSWERS HERE</h1>}
            </div>
        </>
    )
}

export default Game