const playButton = document.getElementById('play-button');
const pauseButton = document.getElementById('pause-button');
const stopButton = document.getElementById('stop-button');

let ws;
let isPlaying = false;

function connectToServer() {
  ws = new WebSocket('ws://localhost:3000'); // Replace with your server address

  ws.onopen = () => {
    console.log('Connected to server');
    playButton.disabled = false;
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
  if (data.type === 'audio') {
    const audioContext = new AudioContext();
const audioChunk = data.data; // Base64 encoded audio data
const buffer = atob(audioChunk); // Decode Base64

try {
  const byteArray = new Uint8Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    byteArray[i] = buffer.charCodeAt(i); // Convert to bytes
  }
  
  // Convert Uint8Array to ArrayBuffer
  const arrayBuffer = byteArray.buffer;
  console.log(arrayBuffer);
  // Use the ArrayBuffer to create an AudioBuffer
  setTimeout(() => {
    // Code to be executed after 2 seconds
    AudioDeliver();
  }, 2000);
  function AudioDeliver(){
    audioContext.decodeAudioData(arrayBuffer, (decodedArrayBuffer) => {
        // Play the decoded audio buffer
        const source = audioContext.createBufferSource();
        source.buffer = decodedArrayBuffer;
        source.connect(audioContext.destination);
        source.start(0); // Start playback immediately
      }, (error) => {
        console.error("Error decoding audio data:", error);
        // Handle decoding errors
      });
  }
  
} catch (error) {
  console.error("Error preparing audio data:", error);
  // Handle errors in preparing audio data (e.g., decoding Base64)
}


    }
    if (data.message === "Song ended") {
      isPlaying = false;
      playButton.disabled = false;
      pauseButton.disabled = true;
      stopButton.disabled = true;
    } else if (data.message === "Playback paused") {
      isPlaying = false;
      pauseButton.disabled = true;
    } else if (data.message === "Playback stopped") {
      isPlaying = false;
      playButton.disabled = false;
      pauseButton.disabled = true;
      stopButton.disabled = true;
    } else if (data.message === "Not authorized to control playback") {
      console.warn("Not authorized to control playback");
      playButton.disabled = true;
      pauseButton.disabled = true;
      stopButton.disabled = true;
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    playButton.disabled = true;
    pauseButton.disabled = true;
    stopButton.disabled = true;
  };
}

playButton.addEventListener('click', () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    connectToServer();
    return;
  }
  if (!isPlaying) {
    ws.send(JSON.stringify({ action: "play" }));
    isPlaying = true;
    playButton.disabled = true;
    pauseButton.disabled = false;
    stopButton.disabled = false;
  }
});

pauseButton.addEventListener('click', () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  if (isPlaying) {
    ws.send(JSON.stringify({ action: "pause" }));
    isPlaying = false;
    pauseButton.disabled = true;
  }
});

stopButton.addEventListener('click', () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  if (isPlaying) {
    ws.send(JSON.stringify({ action: "stop" }));
    isPlaying = false;
    playButton.disabled = false;
    pauseButton.disabled = true;
    stopButton.disabled = true;
  }
});

connectToServer();
