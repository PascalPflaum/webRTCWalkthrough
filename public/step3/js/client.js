/**
 * This is CLIENT Part 3 of the WebRTC Walkthorugh
 * The goal of this part:
 * -------------------------
 * create an peer to peer offer for each client in the room, when joining
 * send this offer to the server
 * create and resends an answer, when an offer is recieved
 * listen on offers from joining clients
  * -------------------------
 */


//we don't wont to leak variables to the global scope, so we create our own one here
(function() {

	//preselect some DOM Elements
	var $clients = $('#clients');

	//options for accessing local ressources
	var USER_MEDIA_SETTINGS = {video : true, audio : true};

	//socket.io options
	var SOCKET_SETTINGS = {
		HOST : location.protocol + '//' + location.hostname,
		OPTIONS : {port : 443, secure : true}
	};

	//we will have only one room in step 3
	var ROOM_NAME = 'step3DemoRoom';

	//all peer connections share the same servers and settings
	var PEER_CONNECTION_CONFIG = {
		iceServers : [{"url" : "stun:stun.l.google.com:19302"}]
	};

	var PEER_CONNECTION_CONTRAINTS = {
		optional : [
			{DtlsSrtpKeyAgreement : true}
		]
	};

	//unify the nonStandard methods
	var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
	var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

	//PITFALL: dont try to store this in a local variable, you will get an error
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	var peerConnections = {};

	//display a loader for the local user, the local user is threaded like any other user at this step
	onClientJoinedRoom('local');

	//get access to the users media device- to avoid spaghetti here callbacks are moved to a declared function
	navigator.getUserMedia(USER_MEDIA_SETTINGS, onGetUserMediaSuccess, displayError);


	/**
	 * a client joined the room
	 * @param {string} id
	 */
	function onClientJoinedRoom(id) {
		$('<div class="clientTile ' + id + '"><span class="userId">' + id + '</span><div class="loader videoArea">Loading...</div><div/>').appendTo($clients);
	}


	/**
	 * a client left the room
	 * @param {string} id
	 */
	function onClientLeftRoom(id) {
		$clients.children('.' + id).remove();
	}


	/**
	 * render a video in the tile representing the user with the given clientId
	 * @param {string} clientId
	 * @param {object} mediaStream
	 * @returns {undefined}
	 */
	function addVideoToUserTile(clientId, mediaStream) {
		$clients.find('.' + clientId + ' .videoArea').replaceWith('<video muted autoplay><source src="' + window.URL.createObjectURL(mediaStream) + '"></source></video>');
	}

	/**
	 * a single point responsible for managing errors
	 * @param {Error} err
	 */
	function displayError(err) {
		console.error(err);
	}


	/*
	 * this will be called after we are successfully accessed the local device
	 * @param {object} localMediaStream
	 */
	function onGetUserMediaSuccess(localMediaStream) {

		//create a video object and connect it to the local camera
		addVideoToUserTile('local', localMediaStream);

		//connect to the signaling server
		var socket = io.connect(SOCKET_SETTINGS.HOST, SOCKET_SETTINGS.OPTIONS);

		//join the room - there will be only one room in this step
		//you can parse functions as callbacks to socket io.
		//The callback will be triggered serverside and should contain the users that are already in the room
		socket.emit('joinRoom', ROOM_NAME, function(otherClients) {

			//iterate over all clients
			otherClients.forEach(function(otherClientId) {

				//we can threat the clients, who are already in the room like new clients for the rendering part
				onClientJoinedRoom(otherClientId);

				//we are the new guy in the room, so we are the one who will send an offer to all of them
				var peerConnection = peerConnections[otherClientId] = new PeerConnection(PEER_CONNECTION_CONFIG, PEER_CONNECTION_CONTRAINTS);

				//add the own stream to the peer connection
				peerConnection.addStream(localMediaStream);

				//create an peer to peer offer
				peerConnection.createOffer(function(offer) {

					//connect a session descrition and connect it to the peer
					peerConnection.setLocalDescription(new SessionDescription(offer), function() {

						//send the offer to the server to forward it to the client with the given id
						socket.emit('offer', otherClientId, offer);

					}, displayError);
				}, displayError);

				peerConnection.onaddstream = function(obj) {
					addVideoToUserTile(otherClientId, obj.stream);
				};
			});
		});


		/**
		 * we recieved an offer by the another client
		 * @param {type} otherClientId
		 * @param {type} offer
		 * @returns {undefined}
		 */
		function  onOffer(otherClientId, offer) {

			console.log('recieved offer from: ' + otherClientId);
			console.log(offer);

			var peerConnection = peerConnections[otherClientId] = new PeerConnection(PEER_CONNECTION_CONFIG, PEER_CONNECTION_CONTRAINTS);

			//add the local stream to the pear connectuon
			peerConnection.addStream(localMediaStream);

			//add the remote source
			peerConnection.setRemoteDescription(new SessionDescription(offer), function() {
				peerConnection.createAnswer(function(answer) {
					peerConnection.setLocalDescription(new SessionDescription(answer), function() {

						// send the offer to a server to be forwarded to the caller
						socket.emit('answer', otherClientId, answer);

					}, displayError);
				}, displayError);
			}, displayError);


			peerConnection.onaddstream = function(obj) {
				addVideoToUserTile(otherClientId, obj.stream);
			};
		}
		
		
		/**
		 * we recieved answer for our offer
		 * @param {string} otherClientId
		 * @param {object} answer
		 */
		function onAnswer(otherClientId, answer) {

			console.log('recieved answer from: ' + otherClientId);
			console.log(answer);

			var peerConnection = peerConnections[otherClientId];

			peerConnection.setRemoteDescription(new SessionDescription(answer), function() {
			}, displayError);
		}

		//add the event listeners to react on server events
		socket
				.on('clientJoinedRoom', onClientJoinedRoom)
				.on('clientLeftRoom', onClientLeftRoom)
				.on('offer', onOffer)
				.on('answer', onAnswer);
	}

})();