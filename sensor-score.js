const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const Gpio = require('onoff').Gpio;

// Define and initialize the sensors
const sensorP1 = new Gpio(17, 'in', 'both', { debounceTimeout: 10 });
const sensorP2 = new Gpio(18, 'in', 'both', { debounceTimeout: 10 });

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let scoreP1 = 0;
let scoreP2 = 0;

// Function to broadcast scores to all connected clients
function broadcastScore(sensorId) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      // Send data
      client.send(JSON.stringify({ scoreP1, scoreP2, sensorId }));
    }
  });
}

// Function to increment score and broadcast when sensor is triggered
function handleSensor(sensor, sensorId) {
  sensor.watch((err, value) => {
    if (err) {
      console.error(`Error with sensor ${sensorId}:`, err);
      return;
    }
    // Assuming an active low sensor, increment score on detection
    if (value === 0) {
      if (sensorId === 'sensor1') {
        scoreP1++; // Directly increment scoreP1
      } else if (sensorId === 'sensor2') {
        scoreP2++; // Directly increment scoreP2
      }
      console.log(`${sensorId} Score: ${sensorId === 'sensor1' ? scoreP1 : scoreP2}`);
      broadcastScore(sensorId); // Broadcast updated score
    }
  });
}

// Set up sensor handling for P1 and P2
handleSensor(sensorP1, 'sensor1');
handleSensor(sensorP2, 'sensor2');



app.use(express.static('public')); // Serve static files from 'public' directory

server.listen(3000, () => console.log('Server started on http://localhost:3000'));

// Cleanup function to unexport GPIO pins when the program is stopped
process.on('SIGINT', () => {
  sensorP1.unexport();
  sensorP2.unexport();
  process.exit();
});
