package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"

	"main/game"
)

var letters = []rune("abcdefghijklmnopqrstuvwxyz1234567890")

func genRandomString(n int) string {
	sequence := make([]rune, n)
	for i := range sequence {
		sequence[i] = letters[rand.Intn(len(letters))]
	}
	return string(sequence)
}

var gameServers = make(map[string]game.GameServer)

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func root(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got / reguest\n")
}

func login(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
	}
	log.Print("Reguest to /login")
	log.Print(r.Body)
	var client_id = os.Getenv("CLIENT_ID")
	fmt.Print(client_id)
	scope := "user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control"

	params := url.Values{}
	params.Add("response_type", "code")
	params.Add("client_id", client_id)
	params.Add("scope", scope)
	params.Add("redirect_uri", "http://localhost:8080/spotifyCallback")
	params.Add("state", "replacethiswithsomethingsmarterlatereiksjea")

	authURL := "https://accounts.spotify.com/authorize?" + params.Encode()
	http.Redirect(w, r, authURL, http.StatusSeeOther)
}

func spotifyCallback(w http.ResponseWriter, r *http.Request) {
	fmt.Print("Reguest to /spotifyCallback")

	code := r.URL.Query().Get("code")
	// error handling if no code -->
	var client_id = os.Getenv("CLIENT_ID")
	var client_secret = os.Getenv("CLIENT_SECRET")

	tokenURL := "https://accounts.spotify.com/api/token"
	authHeader := "Basic " + base64.StdEncoding.EncodeToString([]byte(client_id+":"+client_secret))

	params := url.Values{}
	params.Add("grant_type", "authorization_code")
	params.Add("code", code)
	params.Add("redirect_uri", "http://localhost:8080/spotifyCallback")

	req, err := http.NewRequest("POST", tokenURL, strings.NewReader(params.Encode()))
	if err != nil {
		log.Println("Request creation failed:", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("HTTP request failed:", err)
		http.Error(w, "Failed to contact Spotify", http.StatusBadGateway)
		return
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Println("Spotify returned status:", resp.Status)
		http.Error(w, "Spotify auth failed", http.StatusUnauthorized)
		return
	}

	var data struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		log.Println("JSON decode error:", err)
		http.Error(w, "Invalid response from Spotify", http.StatusBadGateway)
		return
	}

	fmt.Print("Decoded token data: \n")
	fmt.Print(data)

	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    data.AccessToken,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
	})

	// Probably not needed, just send the 4 letter route
	/* var sessionID = uuid.New().String()

	http.SetCookie(w, &http.Cookie{
		Name:     "SID",
		Value:    sessionID,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
	}) */

	var sessionID = genRandomString(4)

	http.SetCookie(w, &http.Cookie{
		Name:     "SID",
		Value:    sessionID,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
	})

	gameServer := game.NewGameServer(data.AccessToken)
	go gameServer.Run()
	gameServers[sessionID] = *gameServer

	http.Redirect(w, r, "http://localhost:5173/lobbyoptions", http.StatusFound)

}

func gamePreflight(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sid := vars["id"]

	var _, ok = gameServers[sid]

	if !ok {
		fmt.Print("Game server not found. Returning")
		http.Error(w, "Invalid game id", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	var port = os.Getenv("PORT")

	router := mux.NewRouter()

	router.HandleFunc("/", root)
	router.HandleFunc("/login", login)
	router.HandleFunc("/spotifyCallback", spotifyCallback)
	router.HandleFunc("/game/{id}/preflight", gamePreflight)
	router.HandleFunc("/game/{id}", func(w http.ResponseWriter, r *http.Request) {

		vars := mux.Vars(r)
		sid := vars["id"]
		var gameServer, ok = gameServers[sid]

		if !ok {
			fmt.Print("Game server not found. Returning")
			http.Error(w, "Invalid game id", http.StatusNotFound)
			return
		}
		game.ServePlayerWebsocket(&gameServer, w, r)
	})

	router.HandleFunc("/game/{id}/{token}", func(w http.ResponseWriter, r *http.Request) {

		vars := mux.Vars(r)

		// debugging prints ---->
		fmt.Print("\nMux.vars: ")
		//fmt.Println(vars)
		bs, _ := json.Marshal(vars)
		fmt.Println(string(bs))

		sid := vars["id"]
		var gameServer, ok = gameServers[sid]

		fmt.Print("sid: ")
		fmt.Println(sid)

		fmt.Print("Gameservers: ")
		fmt.Println(gameServers)
		// <------

		if !ok {
			fmt.Print("Game server not found. Returning")
			http.Error(w, "Invalid game id", http.StatusNotFound)
			return
		}

		var accessToken = vars["token"]
		if gameServer.AccessToken != accessToken {
			fmt.Print("Invalid access token")
			http.Error(w, "Invalid access token", http.StatusUnauthorized)
			return
		}
		game.ServeHostWebsocket(&gameServer, w, r)

	})

	fmt.Printf("Server listening on port %s\n", port)
	log.Fatal(http.ListenAndServe(port, router))
}
