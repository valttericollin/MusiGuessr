import { useState, useEffect, useRef } from "react"
import PlayerCard from "../PlayerCard"
import PlayerContainer from "../PlayerContainer"
import helper from "../../misc/helper"

interface gameProps {
  getNextTrack: () => JSON,
  connection: WebSocket,
  accessToken: string,
  playlistUri: string,
  resetCurrentRoundAnswers: () => void
}

const Game: React.FC<gameProps> = ({ getNextTrack, connection, accessToken, players, playlistUri, setPlayers }) => {
    const [track, setTrack] = useState<JSON>();
    const [nextTrackFlag, setNextTrackFlag] = useState(false);
    const [startPlaybackFlag, setStartPlaybackFlag] = useState(false);
    const [trackPlaying, setTrackPlaying] = useState(false);
    const [finalScoreView, setFinalScoreView] = useState(false);
    const [showAnswers, setShowAnswers] = useState(false);
    const playersRef = useRef(players);

    useEffect(() => {
        playersRef.current = players;
    }, [players]);
    
    useEffect(() => {
        if (!track || nextTrackFlag) {
            const nextTrack = getNextTrack();
            setNextTrackFlag(false);
            if (nextTrack === undefined || nextTrack === null) {
                setFinalScoreView(true);
                return;
            }
            setTrack(nextTrack);
            setStartPlaybackFlag(true);
        }
    }, [getNextTrack, nextTrackFlag, track])

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
    },[showAnswers])

    const updateScores = (playersSnapshot) => {
        // Todo: fix
        let score = 10;
        const orderedTimeStamps: { timeStamp: number; name: string }[] = [];

        playersRef.current.forEach((player) => {
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
        setTimeout(() => {
            console.log("Players after score update:", players); // not on time
        }, 0);
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

    const resetCurrentRoundAnswers = () => {
        setPlayers(playersRef.current.map((player) => {
            // fix linter errors
            console.log("in reset answer, player: ", player);
            return {...player, currentRoundAnswer: {answer: "", timeStamp: 0}}
        }))
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
                {/* {players.map((player) => (
                    <PlayerCard
                        key={player.name}
                        name={player.name}
                        score={player.score}
                        currentRoundAnswer={player.currentRoundAnswer.answer}
                        showAnswers={showAnswers}
                    />
                ))}  */} 
                {<PlayerContainer 
                    players={players}
                    showAnswers={showAnswers}
                />}
            </div>
            <div>
                {finalScoreView &&
                <PlayerContainer players={players} />}
            </div>
        </>
    )
}

export default Game