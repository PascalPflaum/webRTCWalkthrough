/**
 * This is CLIENT Part 2 of the WebRTC Walkthorugh
 * The goal of this part:
 * -------------------------
 * display a text info while loading
 * Connect to signaling service, join a fixed room and render a tile with a loader for each user in the room
 * Updated the user tiles for leaving and joining users in realtime
 */


//we don't wont to leak variables to the global scope, so we create our own one here
(function() {

	//preselect some DOM Elements
	var $clients = $('#clients');

	//options for accessing local ressources
	var USER_MEDIA_SETTINGS = {video : true, audio : true};

	//socket.io options
	var SOCKET_SETTINGS = {HOST : 'https://localhost', OPTIONS : {port : 443, secure : true}};

	//we will have only one room in step 2
	var ROOM_NAME = 'step2DemoRoom';

	//unify the nonStandard methods
	var PeerConnection = window.PeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
	var IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.RTCIceCandidate;

	//PITFALL: dont try to store this in a local variable, you will get an error
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	//get access to the users media device- to avoid spaghetti here callbacks are moved to a declared function
	navigator.getUserMedia(USER_MEDIA_SETTINGS, onGetUserMediaSuccess, displayError);


	/*
	 * this will be called after we are successfully accessed the local device
	 * @param {object} localMediaStream
	 */
	function onGetUserMediaSuccess(localMediaStream) {

		//create a video object and connect it to the local camera
		$clients.find('.local .loader').replaceWith('<video src="' + window.URL.createObjectURL(localMediaStream) + '"></video>');

		//connect to the signaling server
		var socket = io.connect(SOCKET_SETTINGS.HOST, SOCKET_SETTINGS.OPTIONS);

		//add the event listeners to react on server events
		socket.on('clientJoinedRoom', onClientJoinedRoom).on('clientLeftRoom', onClientLeftRoom);

		//join the room - there will be only one room in this step
		//you can parse functions as callbacks to socket io.
		//The callback will be triggered serverside and should contain the users that are already in the room
		socket.emit('joinRoom', ROOM_NAME, function(otherClients) {
			otherClients.forEach(function(id) {
				onClientJoinedRoom(id);
			});
		});
	}


	/**
	 * a client joined the room
	 * @param {string} id
	 */
	function onClientJoinedRoom(id) {
		$('<div class="clientTile ' + id + '"><span class="userId">' + id + '</span><div class="loader">Loading...</div><div/>').appendTo($clients);
	}


	/**
	 * a client left the room
	 * @param {string} id
	 */
	function onClientLeftRoom(id) {
		$clients.children('.' + id).remove();
	}


	/**
	 * a single point responsible for managing errors
	 * @param {Error} err
	 */
	function displayError(err) {
		console.error(err);
	}

	//display a loader for the local user, the local user is threaded like any other user at this step
	onClientJoinedRoom('local');

})();