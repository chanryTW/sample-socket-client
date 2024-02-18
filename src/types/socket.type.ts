// Socket 發送事件
export enum SocketEmitEventType {
  Subscribe = 'subscribe',
  SendMessage = 'sendMessage',
  Disconnect = 'disconnect',
}

// Socket 接收事件
export enum SocketEventType {
  Connect = 'connect',
  Disconnect = 'disconnect',
  OnlineUsers = 'onlineUsers',
  NewOnlineUser = 'newOnlineUser',
  AllMessage = 'allMessage',
  NewMessage = 'newMessage',
}

export type OnlineUsersType = {
  username: string;
  nickname: string;
  uuid: string;
};

// Socket Chat Message Type
export type ChatMessageType = {
  id: number;
  username: string;
  nickname: string;
  message: string;
  created_at: string;
};
