/**
 * This is SERVER Part 2 of the WebRTC Walkthorugh
 * The goal of this part:
 * -------------------------
 * add socket.io as realtime communication framework
 * let users join and leave rooms
 * the user can be in one room at the same time, not more
 * -------------------------
 * You can start the server with "node step2.js" and goto "https://localhost" in your browser
 */

//some config you maybe want to change
var HTTP_PORT = 443;
var DOCUMENT_ROOT = __dirname + '/public/step2';

//load custom modules
var fs = require('fs');
var express = require('express');

//create express app and deliver static files
var app = express();
app.use(express.static(DOCUMENT_ROOT));

//prepare SSL keys
var sslOptions = {
	key : fs.readFileSync('./ssl/key.key'),
	cert : fs.readFileSync('./ssl/certificate.crt'),
	ca : [fs.readFileSync('./ssl/RapidSSL_Intermediate_CA.pem')]
};

//create an https server and connect it with express
var io = require('socket.io').listen(require('https').createServer(sslOptions, app).listen(HTTP_PORT));

//a new client connected
io.sockets.on('connection', function(socket) {

	//we want to store the users current room by our self. Hacking around the socket.io roomsystem to figure out this information is exhausting.
	var currentRoom;


	//the user wants to join a room
	socket.on('joinRoom', function(roomName, otherClientsCallback) {

		//get a list of clients in the room before joining the room, because we want to have the list without this client
		var otherSockets = io.sockets.clients(roomName).map(function(otherSocket) {
			return otherSocket.id;
		});

		//Join the room
		socket.join(roomName);

		//and store it as the users room
		currentRoom = roomName;

		//And make aware the other clients, that a new person joined
		socket.broadcast.to(roomName).emit('clientJoinedRoom', socket.id);

		//give the fresh joined client the list of connected clients
		otherClientsCallback(otherSockets);
	});


	/*
	 * the user is leaving a room and we need to inform all users in that room
	 */
	function leaveRoom() {

		console.log('leavingRoom:' + currentRoom);

		//leave and tell the other users - leaving is not neccessary during disconnect, but doesn't cause any harm
		socket.leave(currentRoom).broadcast.to(currentRoom).emit('clientLeftRoom', socket.id);

		//mark that the user is in no room at the moment
		currentRoom = undefined;
	}

	//the user can leave a room by command or by disconnect
	socket.on('leaveRoom', leaveRoom).on('disconnect', leaveRoom);
});