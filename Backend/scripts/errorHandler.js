function ErrorHandler(severity, error) {
  if(severity === "High") { console.log('\x1b[1;31m%s\x1b[0m', `Severity: ${ severity }, Error: ${ error }`); }
  else if(severity === "Med") { console.log('\x1b[1;33m%s\x1b[0m', `Severity: ${ severity }, Error: ${ error }`); }
  else if(severity === "Low") { console.log('\x1b[1;33m%s\x1b[0m', `Severity: ${ severity }, Error: ${ error }`); }
  else { console.log(`Severity: ${ severity }, Error: ${ error }`); }
}

module.exports = { ErrorHandler }