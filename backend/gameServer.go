package main

import "fmt"

type GameServer struct {
	clients map[*Client]bool
	//host Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
}

func NewGameServer() *GameServer {
	return &GameServer{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte),
	}
}

func (server *GameServer) Run() {
	for {
		fmt.Println(len(server.clients))
		select {

		case client := <-server.register:
			server.registerClient(client)

		case client := <-server.unregister:
			server.unregisterClient(client)

		case message := <-server.broadcast:
			server.broadcastToClients(message)
		}

	}
}

func (server *GameServer) registerClient(client *Client) {
	server.clients[client] = true
}

func (server *GameServer) unregisterClient(client *Client) {
	if _, ok := server.clients[client]; ok {
		delete(server.clients, client)
	}
}

func (server *GameServer) broadcastToClients(message []byte) {
	for client := range server.clients {
		client.send <- message
	}
}
