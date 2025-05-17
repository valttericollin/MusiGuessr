import { useState, useEffect } from "react"
import PlayerCard from "../PlayerCard"
import helper from "../../misc/helper"

interface gameProps {
  getNextTrack: () => JSON,
  connection: WebSocket,
  accessToken: string,
  playlistUri: string,
  resetCurrentRoundAnswers: () => void
}

const Game: React.FC<gameProps> = ({ getNextTrack, connection, accessToken, players, playlistUri, resetCurrentRoundAnswers, setPlayers }) => {
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

            const msg = {
                type: "gameState",
                action: "openAnswerInput"
            }
            // Signal player clients to open answer inputs.
            connection.send(JSON.stringify(msg))

            startTrackPlayback()
            setTrackPlaying(true)
            setStartPlaybackFlag(false)
            
            setTimeout(() => {
                const msg = {
                    type: "gameState",
                    action: "closeAnswerInput"
                };
                // Signal player clients to close answer inputs.
                connection.send(JSON.stringify(msg));

                pausePlayback();
                setTrackPlaying(false);
                setShowAnswers(true);
            }, 10000)
        }
    }, [track, trackPlaying, startPlaybackFlag])

    useEffect(() => {
        if (showAnswers) {
            console.log("in useEffect 3, show answers")
            updateScores();
            setTimeout(() => {
                setShowAnswers(false);
                setNextTrackFlag(true);
                resetCurrentRoundAnswers();
            }, 5000)
        }
    })

    const updateScores = () => {
        // Todo: fix
        let score = 10;
        const orderedTimeStamps: { timeStamp: number; name: string }[] = [];

        players.forEach((player) => {
            if (helper.compare(track.track.name, player.currentRoundAnswer.answer, 0.1)) {
            orderedTimeStamps.push({
                timeStamp: player.currentRoundAnswer.timeStamp,
                name: player.name,
            });
            }
        });

        if (orderedTimeStamps.length === 0) return;

        // sort from fastest to slowest
        orderedTimeStamps.sort((a, b) => a.timeStamp - b.timeStamp);

        // map of name -> score
        const scoreMap: Record<string, number> = {};
        orderedTimeStamps.forEach((entry) => {
            scoreMap[entry.name] = score;
            if (score > 6) score -= 2;
        });

        // apply score updates
        setPlayers((prevPlayers) =>
            prevPlayers.map((player) => {
            if (scoreMap[player.name] !== undefined) {
                return {
                ...player,
                score: player.score + scoreMap[player.name],
                };
            }
            return player;
            })
        );
    };

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
                        <PlayerCard 
                            name={player.name}
                            score={player.score}
                            currentRoundAnswer={player.currentRoundAnswer.answer}
                            showAnswers={showAnswers}
                        />
                    ))}
                </ul>   
            </div>
        </>
    )
}

export default Game