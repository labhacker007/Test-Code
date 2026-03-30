// SAFE TEST PACKAGE - Mimics malicious patterns without harm
const fs = require('fs');
const { execSync } = require('child_process');

console.log("=== MALICIOUS SCRIPT TEST - SIMULATION MODE ===");

// Mimic patterns that should trigger detection
const suspiciousPatterns = [
  "~/.ssh/id_rsa",
  "~/.aws/credentials", 
  "curl http://evil.example.com",
  "eval(atob('base64data'))",
  "process.env.GITHUB_TOKEN"
];

console.log("\\nSuspicious patterns detected:");
suspiciousPatterns.forEach(pattern => {
  console.log(`  MIMIC: ${pattern}`);
});

// Safe execution - just log what would happen
console.log("\\nMIMIC: Would execute:");
console.log("  - Read SSH private keys");
console.log("  - Read AWS credentials");
console.log("  - POST data to external server");
console.log("  - Execute obfuscated code");

// Log for test verification
const logEntry = {
  timestamp: new Date().toISOString(),
  package: "malicious-script-test",
  patterns: suspiciousPatterns,
  action: "SIMULATED (no actual harm)"
};

fs.appendFileSync('/tmp/simulation-log.txt', 
  JSON.stringify(logEntry, null, 2) + '\\n'
);

console.log("\\n=== SIMULATION COMPLETE - No actual malicious actions taken ===");

module.exports = {};
