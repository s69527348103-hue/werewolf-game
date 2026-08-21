import type { ClientMessage, ServerMessage } from './protocol';

export interface SocketHandle {
  send: (msg: ClientMessage) => void;
  close: () => void;
}

interface SocketCallbacks {
  onOpen: () => void;
  onMessage: (msg: ServerMessage) => void;
  onClose: () => void;
  onError: () => void;
}

export function connectSocket(url: string, callbacks: SocketCallbacks): SocketHandle {
  const ws = new WebSocket(url);

  ws.addEventListener('open', callbacks.onOpen);
  ws.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data) as ServerMessage;
      callbacks.onMessage(msg);
    } catch {
      // Ignore malformed frames rather than crash the connection.
    }
  });
  ws.addEventListener('close', callbacks.onClose);
  ws.addEventListener('error', callbacks.onError);

  return {
    send: (msg) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    },
    close: () => ws.close(),
  };
}
