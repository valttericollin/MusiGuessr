package game

import "fmt"

type GameServer struct {
	AccessToken            string
	Players                map[*Player]bool
	host                   *Host
	registerPlayer         chan *Player
	unregisterPlayer       chan *Player
	registerHost           chan *Host
	unregisterHost         chan *Host
	hostChannel            chan []byte
	playerBroadcastChannel chan []byte
}

func NewGameServer(accessToken string) *GameServer {
	return &GameServer{
		AccessToken:            accessToken,
		Players:                make(map[*Player]bool),
		registerPlayer:         make(chan *Player),
		unregisterPlayer:       make(chan *Player),
		registerHost:           make(chan *Host),
		unregisterHost:         make(chan *Host),
		hostChannel:            make(chan []byte),
		playerBroadcastChannel: make(chan []byte),
	}
}

func (server *GameServer) Run() {
	for {
		fmt.Println(len(server.Players)) //debug
		fmt.Println(server.host)
		select {

		case Host := <-server.registerHost:
			fmt.Println("host connecting")
			server.addHost(Host)

		case Host := <-server.unregisterHost:
			server.removeHost(Host)

		case Player := <-server.registerPlayer:
			server.addPlayer(Player)

		case Player := <-server.unregisterPlayer:
			server.removePlayer(Player)

		case message := <-server.playerBroadcastChannel:
			server.broadcastToPlayers(message)

		case message := <-server.hostChannel:
			server.messageHost(message)

		}

	}
}

func (server *GameServer) addHost(Host *Host) {
	server.host = Host
}

func (server *GameServer) removeHost(Host *Host) {
	server.host = nil
}

func (server *GameServer) addPlayer(Player *Player) {
	server.Players[Player] = true
}

func (server *GameServer) removePlayer(Player *Player) {
	if _, ok := server.Players[Player]; ok {
		delete(server.Players, Player)
	}
}

func (server *GameServer) messageHost(message []byte) {
	server.host.send <- message
}

func (server *GameServer) broadcastToPlayers(message []byte) {
	fmt.Println("Messaging players")
	for Player := range server.Players {
		Player.send <- message
	}
	// test
	fmt.Println("Messaging host")
	server.host.send <- message
}
