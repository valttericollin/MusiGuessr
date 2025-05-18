package game

import (
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Max wait time when writing message
	writeWait = 10 * time.Second

	// Max time till next pong from client
	pongWait = 60 * time.Second

	// Send ping interval
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from client
	maxMessageSize = 10000
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool { // replace with spesific url later
		return true
	},
}

type Client interface {
	disconnect()
	readPump()
	writePump()
	ServeWebsocket()
}
