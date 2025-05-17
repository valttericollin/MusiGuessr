package game

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

type Host struct {
	conn       *websocket.Conn
	gameServer *GameServer
	send       chan []byte
}

func newHost(conn *websocket.Conn, gameServer *GameServer) *Host {
	return &Host{
		conn:       conn,
		gameServer: gameServer,
		send:       make(chan []byte, 256),
	}
}

func (Host *Host) disconnect() {
	Host.gameServer.unregisterHost <- Host
	close(Host.send)
}

func (Host *Host) readPump() {
	defer func() { // cleanup routine
		Host.disconnect()
	}()

	Host.conn.SetReadLimit(maxMessageSize)
	Host.conn.SetReadDeadline(time.Now().Add(pongWait))
	Host.conn.SetPongHandler(func(string) error { Host.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	// Start endless read loop, waiting for messages from Host
	for {
		_, jsonMessage, err := Host.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				fmt.Printf("unexpected close error: %v", err)
			}
			break
		}

		Host.gameServer.playerBroadcastChannel <- jsonMessage
	}
}

func (Host *Host) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() { // cleanup routine
		ticker.Stop()
		Host.conn.Close()
	}()
	for {
		select {
		case message, ok := <-Host.send:
			Host.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The gameServer closed the channel.
				Host.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := Host.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Attach queued messages to the current websocket message.
			n := len(Host.send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write(<-Host.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			Host.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := Host.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServeHostWebsocket(gameServer *GameServer, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Print(err)
		return
	}

	Host := newHost(conn, gameServer)
	fmt.Print("New Host connected\n")

	go Host.writePump()
	go Host.readPump()

	fmt.Print(*Host)

	// Send self to server host register channel
	gameServer.registerHost <- Host
}
