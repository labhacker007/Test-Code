// SAFE TEST PACKAGE - No actual malicious behavior
console.log("=== REQUSETS PACKAGE - SIMULATION MODE ===");
console.log("This is a typosquat mimic of 'requests'");
console.log("MIMIC: Would attempt to steal credentials");
console.log("MIMIC: Would connect to external C2 server");
console.log("=== SIMULATION COMPLETE ===");

// Log detection trigger
const fs = require('fs');
fs.appendFileSync('/tmp/simulation-log.txt', 
  `[${new Date().toISOString()}] Typosquat package 'requsets' installed\\n`
);

module.exports = {
  get: () => console.log("Safe mock function"),
  post: () => console.log("Safe mock function")
};
