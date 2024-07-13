const express = require('express')
const app =  express()
const server = require('http').createServer(app)
const WebSocket = require('ws')
const fs = require('fs');
const admin = require('firebase-admin');

admin.initializeApp({
    apiKey: "AIzaSyB0HNMUpFXrzy0mFDYFEBbJuBX27Zzb5RI",
    authDomain: "shared-control-music.firebaseapp.com",
    projectId: "shared-control-music",
    storageBucket: "shared-control-music.appspot.com",
    messagingSenderId: "961090961641",
    appId: "1:961090961641:web:4697b0db535bcb2bd23078",
    measurementId: "G-XLWF2NKLTB"
  });

const db = admin.database();

const webserver = new WebSocket.Server({server:server});
let isPlaying = false;
let readableStream;
let currentClientId = null; // Stores the ID of the client controlling playback
webserver.on('connection', function connection(ws) {
    console.log('New User Joined');
    ws.send(JSON.stringify({ message: "Welcome New User" }));
  
    // Assign control ID to the first connecting client
    if (!currentClientId) {
      currentClientId = ws._socket.remoteAddress; // Extract client IP address for identification (replace with a more reliable method if needed)
    }
  
    ws.on('message', function incoming(message) {
      const data = JSON.parse(message);
      if (data.action === "play") {
        // Only allow control from the designated client
        if (ws._socket.remoteAddress === currentClientId) {
          if (!isPlaying) {
            isPlaying = true;
            let filePath = "ThemeOfKalki.mp3";
            readableStream = fs.createReadStream(filePath);
            readableStream.on('data', (chunk) => {
              // Broadcast audio data to all connected clients
              webserver.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    let audioChunk = chunk.toString('base64');
                    client.send(JSON.stringify({ type: 'audio', data: audioChunk }));
                }
              });
            });
            readableStream.on('end', () => {
              isPlaying = false;
              webserver.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({ message: "Song ended" }));
                }
              });
              readableStream = null;
            });
            readableStream.on('error', (err) => {
              console.error("Error during audio streaming:", err);
              // Handle streaming error (e.g., send error message to all clients)
              webserver.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({ message: "Error during playback" }));
                }
              });
            });
          } else {
            ws.send(JSON.stringify({ message: "Already playing" })); // Inform controlling client
          }
        } else {
          ws.send(JSON.stringify({ message: "Not authorized to control playback" })); // Inform other clients
        }
      } else if (data.action === "pause") {
        // Only allow control from the designated client
        if (ws._socket.remoteAddress === currentClientId) {
          if (readableStream) {
            readableStream.pause(); // Pause the stream for pausing
            webserver.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ message: "Playback paused" }));
              }
            });
          }
        }
      } else if (data.action === "stop") {
        // Only allow control from the designated client
        if (ws._socket.remoteAddress === currentClientId) {
          if (readableStream) {
            readableStream.destroy(); // Close the stream for stopping
            isPlaying = false;
            webserver.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ message: "Playback stopped" }));
              }
            });
          }
        }
      }
    });
  
    // Handle client disconnection (optional)
    ws.on('close', () => {
      if (readableStream && ws._socket.remoteAddress === currentClientId) {
        // If controlling client disconnects, stop playback and clear control ID
        readableStream.destroy();
        isPlaying = false;
        currentClientId = null;
        webserver.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ message: "Playback stopped due to control client disconnect" }));
          }
        });
      }
    });
  });
app.get('/',(req,res)=>{
    res.send("Started");
    // if (req.url === '/audio-stream') {
    //     res.writeHead(200, {
    //       'Content-Type': 'text/event-stream',
    //       'Cache-Control': 'no-cache',
    //       'Connection': 'keep-alive',
    //     });
    //     server.on('connect', () => {
    //       const filePath = 'ThemeOfKalki.pcm'; // Replace with your actual file path
    //       const fs = require('fs');
    //       const stream = fs.createReadStream(filePath);
    
    //       let chunkSize = 1024 * 10; // Adjust chunk size (e.g., 10 milliseconds of audio)
    
    //       stream.on('data', (chunk) => {
    //         const base64Chunk = Buffer.from(chunk).toString('base64'); // Example: encode chunk
    //         server.sendEvent({
    //           data: JSON.stringify({ type: 'audio', chunk: base64Chunk }), // Example message format
    //         });
    //       });
    
    //       stream.on('end', () => {
    //         server.sendEvent({
    //           data: JSON.stringify({ type: 'end' }), // Example: send end message
    //         });
    //       });
    //     });
    //     server.pipe(res);
    //   } else {
    //     res.statusCode = 404;
    //     res.end('Not Found');
    //   }
});

server.listen(3000,()=>{console.log("Listening on port : 3000")});