const { spawn } = require('child_process');
const path = require('path');

// Start the backend server
const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true
});

server.on('error', (err) => {
    console.error('Failed to start server:', err);
});

// Log server exit
server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});
