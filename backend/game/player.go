package game

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

type Player struct {
	conn       *websocket.Conn
	gameServer *GameServer
	send       chan []byte
}

func newPlayer(conn *websocket.Conn, gameServer *GameServer) *Player {
	return &Player{
		conn:       conn,
		gameServer: gameServer,
		send:       make(chan []byte, 256),
	}
}

func (Player *Player) disconnect() {
	// send self to server unregister channel and close send channel
	Player.gameServer.unregisterPlayer <- Player
	close(Player.send)
}

func (Player *Player) readPump() {
	defer func() {
		Player.disconnect() // cleanup routine
	}()

	Player.conn.SetReadLimit(maxMessageSize)
	Player.conn.SetReadDeadline(time.Now().Add(pongWait))
	Player.conn.SetPongHandler(func(string) error { Player.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	// Start endless read loop, waiting for messages from Player
	for {
		_, jsonMessage, err := Player.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				fmt.Printf("unexpected close error: %v", err)
			}
			break
		}

		fmt.Println(jsonMessage)
		Player.gameServer.hostChannel <- jsonMessage
	}
}

func (Player *Player) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() { // cleanup routine
		ticker.Stop()
		Player.conn.Close()
	}()
	for {
		select {
		case message, ok := <-Player.send:
			Player.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The WsServer closed the channel.
				Player.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := Player.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Attach queued messages to the current websocket message.
			n := len(Player.send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write(<-Player.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			Player.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := Player.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServePlayerWebsocket(gameServer *GameServer, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Print(err)
		return
	}

	Player := newPlayer(conn, gameServer)
	fmt.Println("New Player connected")

	go Player.writePump()
	go Player.readPump()

	fmt.Print(*Player)

	// send self to server register channel
	gameServer.registerPlayer <- Player
}
