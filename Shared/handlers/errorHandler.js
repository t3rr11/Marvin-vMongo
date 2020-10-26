function ErrorHandler(severity, error) {
  if(severity === "High") { console.log('\x1b[1;31m%s\x1b[0m', `Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`); }
  else if(severity === "Med") { console.log('\x1b[1;33m%s\x1b[0m', `Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`); }
  else if(severity === "Low") { console.log('\x1b[1;33m%s\x1b[0m', `Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`); }
  else { console.log(`Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`); }
}

module.exports = { ErrorHandler }