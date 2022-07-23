const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const socket = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  }
});

let players = [];
let result = "";

server.listen(5000, () => {
  console.log('listening on 5000');
});

const calcScore = winner => {
  if (winner !== 'draw') {
    if (winner === 'playerOneWins') {
      players[0].score++;
    } else {
      players[1].score++;
    }
  }
}

const getWinner = (playerOneChoice, playerTwoChoice) => {
  if (playerOneChoice === playerTwoChoice) {
    result = 'draw';
  } else if (playerOneChoice === "rock") {
    if (playerTwoChoice === "paper") {
      result = "playerTwoWins";
    } else {
      result = "playerOneWins";
    }
  } else if (playerOneChoice === "paper") {
    if (playerTwoChoice === "scissors") {
      result = "playerTwoWins";
    } else {
      result = "playerOneWins";
    }
  } else if (playerOneChoice === "scissors") {
    if (playerTwoChoice === "rock") {
      result = "playerTwoWins";
    } else {
      result = "playerOneWins";
    }
  }
  return result;
}

const resolve = roomId => {
  if (players[0]?.choice && players[1]?.choice) {
    const winner = getWinner(players[0].choice, players[1].choice);
    calcScore(winner);
    socket.sockets.to(roomId).emit("result", {
      winner,
      playerOneChoice: players[0].choice,
      playerTwoChoice: players[1].choice,
      playerOneScore: players[0].score,
      playerTwoScore: players[1].score,
    });
    players[0].choice = "";
    players[1].choice = "";
    result = "";
  }
}

socket.on('connection', (socket) => {
  socket.on("createRoom", (name, roomId) => {
    players.push({
      socket: socket.id,
      name,
      roomId,
      player: 'playerOne',
      score: 0,
    })
    socket.join(roomId);
  });

  socket.on("joinRoom", (name, roomId) => {
    if (roomId) {
      socket.join(roomId);
      players.push({
        socket: socket.id,
        name,
        roomId,
        player: 'playerTwo',
        score: 0,
      });
      socket.broadcast.to(roomId).emit("opponentJoined", players);
    }
  });

  socket.on("joinedRoom", (name, roomId) => {
    socket.broadcast.to(roomId).emit(name, " has joined the game.");
  });

  socket.on("choiceSelected", (room, choice, id) => {
    const playerChoice = players.find(x => x.socket === id);
    if (playerChoice) {
      playerChoice.choice = choice;
      resolve(room);
    }
  });

  // socket.on('disconnect', () => {
  //   console.log('user disconnected');
  // });
});