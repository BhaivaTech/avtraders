// src/utils/socketBus.js
// Module-level handle to the socket.io server instance so any
// controller can emit events without circular imports.

let _io = null;

export function setIo(io) {
  _io = io;
}

export function getIo() {
  return _io;
}
