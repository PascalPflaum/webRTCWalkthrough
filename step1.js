/**
 * This is SERVER Part 1 of the WebRTC Walkthorugh
 * The goal of this part:
 * -------------------------
 * Setup a webserver delivering static files via https
 * -------------------------
 * You can start the server with "node step1.js" and goto "https://localhost" in your browser
 */

//some config you maybe want to change
var HTTP_PORT = 443;
var DOCUMENT_ROOT = __dirname + '/public/step1';

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
require('https').createServer(sslOptions, app).listen(HTTP_PORT);