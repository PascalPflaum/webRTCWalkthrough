WebRTC Videochat Walkthrough
====

The goal of this todo is to demonstrate in some easy to follow steps how to build a fully functional videochat based on [WebRTC]. The steps are represented by a stepX.js file in the root directory and folder, also named stepX, which contains the files accessible by the client. The goal of this repository is not to build the best videochat platform. it is an atempt in making some new technologies easier to understand. For that reason the amount and length of comments is higher than usual and things. There are also some pitfalls, that are found, during writing this code. Instead of replacing them with the working way, it was the goal to explain them to prevent you from running in the same pitfall.

Step 1 - Basic Setup
====
So let's setup a basic ssl secured webserver, and a tiny client.js, which will give the browser access to the users media devices!

Step 1 - Goals
----
* Backend (step1.js)
 * Deliver static files (html, js, css) via a node.js script
* Frontend (step1/js/client.js)
 * Get access to local device and connect it with an html5 video element
 * Tiny HTML file to load the client.js
 
Step 1 - Run it
----
* Install [node.js]
* Clone this repository
* Install modules by calling "npm install" in the repository root
* Start the server via "node step1.js"
* Head your browser to https://localhost

Step 1 - Ressources
----
* [node.js]
* [express]
* [MDN Navigator.getUserMedia]
* [W3CDraft Media Capture and Streams]

Step 2 - Realtime Communication
====
In this step we will add [socket.io] to make all users aware of joining and leaving clients. We will work with a single room for now, you are on the side, you are in the room.

Step 2 - Goals
----
* Backend (step2.js)
 * add socket.io as realtime communication framework
 * let users join and leave rooms
 * the user can be in one room at the same time, not more
* Frontend (step2/js/client.js)
 * display a text info while loading
 * Connect to signaling service, join a fixed room and render a tile with a loader for each user in the room
 * Updated the tiles for joining and leaving users in realtime
 
Step 2 - Run it
----
* Install [node.js]
* Clone this repository
* Install modules by calling "npm install" in the repository root
* Start the server via "node step2.js"
* Head your browser to https://localhost

Step 2 - Ressources
----
* [socket.io]
* [socket.io -> Wiki], especially [socket.io -> Wiki -> Exposed Events] and [socket.io -> Wiki -> Rooms]

Step 3 - Signaling Server
====
We will extend our communication server to handle and forward the RTC handshake. You will find this step labeled as "signaling server" in most of the topic related literature. The data which the signaling server exchanges is created in the frontend. Here starts the RTC magic. We will introduce "RTCPeerConnection" and "RTCSessionDescription".

Step 3 - Goals
----
* Backend (step3.js)
 * exchange peer to peer RTC data (offer and answer)
 * add and remove event listeners depending on the state (joined a room or not)
* Frontend (step3/js/client.js)
 * create an peer to peer offer for each client in the room, when joining
 * send this offer to the server
 * create and resends an answer, when an offer is recieved
 * listen on offers from joining clients
 
Step 3 - Run it
----
* Install [node.js]
* Clone this repository
* Install modules by calling "npm install" in the repository root
* Start the server via "node step3.js"
* Head your browser to https://localhost

Step 3 - Ressources
----
* [MDN RTCPeerConnection], great ressources explaining everything that needs to be done to exchange the RTC offer and answer
* [SimpleWebRTC], a good all in one project, which served as inspiration
* [signalmaster], a easy to understand signaling server, used by SimpleWebRTC
* [webrtc.js], the webRTC library of SimpleWebRTC

License
----

MIT

[node.js]:http://nodejs.org
[express]:http://expressjs.com
[WebRTC]:http://www.webrtc.org/
[MDN Navigator.getUserMedia]:https://developer.mozilla.org/en-US/docs/Web/API/Navigator.getUserMedia
[W3CDraft Media Capture and Streams]:http://www.w3.org/TR/mediacapture-streams
[socket.io]:http://socket.io/
[socket.io -> Wiki]:https://github.com/learnboost/socket.io/wiki
[socket.io -> Wiki -> Exposed Events]:https://github.com/LearnBoost/socket.io/wiki/Exposed-events
[socket.io -> Wiki -> Rooms]:https://github.com/LearnBoost/socket.io/wiki/Rooms
[MDN RTCPeerConnection]:https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
[SimpleWebRTC]:https://github.com/HenrikJoreteg/SimpleWebRTC
[signalmaster]:https://github.com/andyet/signalmaster
[webrtc.js]:https://github.com/HenrikJoreteg/webrtc.js