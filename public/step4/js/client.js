/**
 * This is CLIENT Part 4 of the WebRTC Walkthorugh
 * The goal of this part:
 * -------------------------
 * change the offer & answer process to work in a callback way
 * Exchanging of ice candidates
 * Getting a working video
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
		iceServers : [
			{url : 'stun:stun.l.google.com:19302'},
			{url : 'stun:stun1.l.google.com:19302'},
			{url : 'stun:stun2.l.google.com:19302'},
			{url : 'stun:stun3.l.google.com:19302'},
			{url : 'stun:stun4.l.google.com:19302'}
		]
	};
	
	//just found it on the web and trusted the www that this setting is helpful for some chrome<> connection
	var PEER_CONNECTION_CONTRAINTS = {
		optional : [
			{DtlsSrtpKeyAgreement : true}
		]
	};

	//unify the nonStandard methods
	var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
	var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
	var IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;

	//PITFALL: dont try to store this in a local variable, you will get an error
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	//store the peer connections index by the id of the remote user
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

				//add a listener for ice candidates, so they can be forwarded
				extendPeerConnection(otherClientId);

				//create an peer to peer offer
				peerConnection.createOffer(function(offer) {

					//connect a session descrition and connect it to the peer
					peerConnection.setLocalDescription(new SessionDescription(offer), function() {

						//send the offer to the server to forward it to the client with the given id
						socket.emit('offer', otherClientId, offer, function(answer) {
							peerConnection.setRemoteDescription(new SessionDescription(answer), function() {
							}, displayError);
						});

					}, displayError);
				}, displayError);

			});
		});


		/**
		 * extends the peer connection with listeners and add the local stream
		 * @param {string} otherClientId
		 */
		function extendPeerConnection(otherClientId) {

			var peerConnection = peerConnections[otherClientId];
			
			
			/**
			 * hook, which will be called, when a new REMOTE stream is added to the peer connection
			 * @param {object} data
			 */
			peerConnection.onaddstream = function(data) {
				addVideoToUserTile(otherClientId, data.stream);
				peerConnection.onaddstream = null;
			};
			
			
			/**
			 * Hook, which will be called, when a new ICE Candidate is avaible
			 * @param {object} data
			 */
			peerConnection.onicecandidate = function(data) {
				if (data.candidate) {
					socket.emit('candidate', otherClientId, data.candidate);
				}
			};

			//add the local stream to the pear connectuon
			peerConnection.addStream(localMediaStream);
		}


		/**
		 * we recieved an offer by the another client
		 * @param {string} otherClientId
		 * @param {object} offer
		 * @param {function} answerCallback
		 */
		function  onOffer(otherClientId, offer, answerCallback) {

			var peerConnection = peerConnections[otherClientId] = new PeerConnection(PEER_CONNECTION_CONFIG, PEER_CONNECTION_CONTRAINTS);

			//add a listener for ice candidates, so they can be forwarded
			extendPeerConnection(otherClientId);

			//add the remote source
			peerConnection.setRemoteDescription(new SessionDescription(offer), function() {
				peerConnection.createAnswer(function(answer) {
					peerConnection.setLocalDescription(new SessionDescription(answer), function() {

						// send the offer to a server to be forwarded to the caller, this can be done via callbacks in an easy way
						answerCallback(answer);

					}, displayError);
				}, displayError);
			}, displayError);
		}


		/**
		 * we recieved answer for our offer
		 * @param {string} otherClientId
		 * @param {object} candidate
		 */
		function onCandidate(otherClientId, candidate) {
			var peerConnection = peerConnections[otherClientId];
			peerConnection.addIceCandidate(new IceCandidate(candidate));
		}

		//add the event listeners to react on server events
		socket
				.on('clientJoinedRoom', onClientJoinedRoom)
				.on('clientLeftRoom', onClientLeftRoom)
				.on('offer', onOffer)
				.on('candidate', onCandidate);
	}

})();