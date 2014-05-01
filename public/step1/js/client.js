/**
 * This is CLIENT Part 1 of the WebRTC Walkthorugh
 * The goal of this part:
 * -------------------------
 * Get access to local media devices and connect them to a html5 video element
 */


//we don't wont to leak Variables to the global scope, so we create our own one here
(function() {

	//preselect some DOM Elements
	var $clients = $('#clients');

	//options for accessing local ressources
	var userMediaOptions = {video : true, audio : true};
	
	//unify some nonStandard methods
	//PITFALL: dont try to store this in a local variable, you will get an error
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	
	//get access to the users media device
	navigator.getUserMedia(userMediaOptions,
		
		//success callback
		function(localMediaStream) {

		//create a video object and connect it to the local camera
			$('<video src="' + window.URL.createObjectURL(localMediaStream) + '"></video>').appendTo($clients);
		},

		//error callback
		function(err) {
			console.error(err);
		}
	);
})();