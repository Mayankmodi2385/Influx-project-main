// Helper script to get your local network IP address
const os = require('os');

const networkInterfaces = os.networkInterfaces();
let localIP = null;

for (const interfaceName in networkInterfaces) {
  const interfaces = networkInterfaces[interfaceName];
  for (const iface of interfaces) {
    if (iface.family === 'IPv4' && !iface.internal) {
      localIP = iface.address;
      break;
    }
  }
  if (localIP) break;
}

if (localIP) {
  console.log('\n🌐 Your Local Network IP Address:');
  console.log(`   ${localIP}`);
  console.log('\n📱 Access your app from other devices:');
  console.log(`   Frontend: http://${localIP}:5173`);
  console.log(`   Backend:  http://${localIP}:5000`);
  console.log(`   API Docs: http://${localIP}:5000/api/docs\n`);
} else {
  console.log('❌ Could not find local network IP address');
}


