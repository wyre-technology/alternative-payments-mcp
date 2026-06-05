import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

/**
 * Holds a reference to the active MCP server so domain handlers can trigger
 * elicitation (e.g. destructive-action confirmation) without threading the
 * server object through every call.
 */
let serverRef: Server | null = null;

export function setServerRef(server: Server): void {
  serverRef = server;
}

export function getServerRef(): Server | null {
  return serverRef;
}
