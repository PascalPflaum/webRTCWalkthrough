/**
 * This is SERVER Part 4 of the WebRTC Walkthorugh
 * The goal of this part:
 * -------------------------
 * adding TURN
 * -------------------------
 * You can start the server with "node step3.js" and goto "https://localhost" in your browser
 */

//some config you maybe want to change
var HTTP_PORT = 443;
var DOCUMENT_ROOT = __dirname + '/public/step5';

var STUN_SERVER =
		[
			{url : 'stun:185.21.103.236:3478'}
		];

var TURN_SERVER = [
	{
		url : 'turn:185.21.103.236:3478',
		secret : 'turnserversharedsecret',
		expiry : 86400
	}
];

//load custom modules
var fs = require('fs');
var express = require('express');
var crypto = require('crypto');

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
io.configure(function() {
	io.set('log level', 2);
});

function getServers(userId) {
	return {
		iceServers : STUN_SERVER.concat(TURN_SERVER.map(setupTurn))
	};

	function setupTurn(turnServer) {

		var hmac = crypto.createHmac('sha1', turnServer.secret);

		// default to 86400 seconds timeout unless specified
		var username = Math.floor(new Date().getTime() / 1000) + (turnServer.expiry || 86400) + ':' + userId;
		hmac.update(username);
		return {
			username : username,
			credential : hmac.digest('base64'),
			url : turnServer.url
		};
	}
}


//a new client connected
io.sockets.on('connection', function(socket) {

	//we want to store the users current room by our self. Hacking around the socket.io roomsystem to figure out this information is exhausting.
	var currentRoom;

//	socket.emit('init', getServers());


	/**
	 * the user requests to join a room
	 * @param {string} roomName
	 * @param {function} joinRoomCallback
	 */
	function onJoinRoom(roomName, joinRoomCallback) {

		//get a list of clients in the room before joining the room, because we want to have the list without ourself
		var currentSocketsInRoom = io.sockets.clients(roomName).map(function(otherSocket) {
			return otherSocket.id;
		});

		//Join the room
		socket.join(roomName);

		//and store it as the users room
		currentRoom = roomName;

		//And make aware the other clients, that a new person joined
		socket.broadcast.to(roomName).emit('clientJoinedRoom', socket.id);

		//switch to event set for being in a Room
		listenForEventsWhileUserIsInARoom();

		//give the fresh joined client the list of connected clients
		joinRoomCallback(getServers(socket.id), currentSocketsInRoom);
	}


	/**
	 * listen to the offer event and forward it to the requested client
	 * @param {string} targetId
	 * @param {object} offer
	 * @param {function} answerCallback
	 */
	function onOffer(targetId, offer, answerCallback) {

		//PITFALL: this looks nice, but doesn't work - the answerCallback will be undefined in the client
		//io.sockets.sockets[targetId].emit('offer', socket.id, offer, answerCallback);

		//@todo verify that this user is really in the room
		io.sockets.sockets[targetId].emit('offer', socket.id, offer, function(answer) {
			answerCallback(answer);
		});
	}


	function onCandidate(targetId, candidate) {

		//@todo verify that this user is really in the room
		io.sockets.sockets[targetId].emit('candidate', socket.id, candidate);
	}

	/**
	 * the user is leaving a room and we need to inform all users in that room
	 */
	function onLeaveRoom() {

		//leave and tell the other users - leaving is not neccessary during disconnect, but doesn't cause any harm
		socket.leave(currentRoom).broadcast.to(currentRoom).emit('clientLeftRoom', socket.id);

		//mark that the user is in no room at the moment
		currentRoom = undefined;

		//switch to event set for being in no Room
		listenForEventsWhileUserIsNotInARoom();
	}


	/**
	 * unregister from all events we don't need and register a new set of events representing state connected
	 */
	function listenForEventsWhileUserIsNotInARoom() {

		//the user can no longer leave a room and it is not required to listen on the disconnect event again
		socket
				.removeListener('leaveRoom', onLeaveRoom)
				.removeListener('disconnect', onLeaveRoom)
				.removeListener('offer', onOffer)
				.removeListener('candidate', onCandidate);

		//the user can NOW join a room
		socket.on('joinRoom', onJoinRoom);
	}


	/**
	 * unregister from all events we don't need and register a new set of events representing state connected
	 * @returns {undefined}
	 */
	function listenForEventsWhileUserIsInARoom() {

		//the user can no longer join a room
		socket.removeListener('joinRoom', onJoinRoom);

		//the user can NOW leave a room by command or by disconnect, so we have to listen on both
		socket
				.on('leaveRoom', onLeaveRoom)
				.on('disconnect', onLeaveRoom)
				.on('offer', onOffer)
				.on('candidate', onCandidate);
	}

	//the user is intitially in the "not in a room" state
	listenForEventsWhileUserIsNotInARoom();
});