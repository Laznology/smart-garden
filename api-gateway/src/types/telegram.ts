export interface TelegramUser {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramChat {
  id: number;
  type?: string;
  title?: string;
  username?: string;
}

export interface TelegramMessage {
  id: number;
  content?: string;
  chat?: TelegramChat;
  author?: TelegramUser;
}

export interface Command {
  command: string;
  description: string;
}

export interface ReadyEvent {
  user: TelegramUser;
}

export interface TelegramClientOptions {
  pollingTimeout?: number;
}
