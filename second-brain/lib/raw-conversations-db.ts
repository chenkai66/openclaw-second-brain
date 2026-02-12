import fs from 'fs';
import path from 'path';

interface RawConversation {
  id: string;
  timestamp: string;
  content: string;
  source: string; // 'chat', 'email', 'voice', etc.
}

export class RawConversationsDB {
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(__dirname, '..', 'data', 'raw-conversations.json');
    this.ensureDbExists();
  }

  private ensureDbExists(): void {
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify([], null, 2));
    }
  }

  async getAllConversations(): Promise<RawConversation[]> {
    const data = fs.readFileSync(this.dbPath, 'utf8');
    return JSON.parse(data);
  }

  async getConversationsSince(timestamp: string): Promise<RawConversation[]> {
    const allConversations = await this.getAllConversations();
    return allConversations.filter(conv => conv.timestamp > timestamp);
  }

  async addConversation(content: string, source: string = 'chat'): Promise<void> {
    const conversations = await this.getAllConversations();
    const newConversation: RawConversation = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      content,
      source
    };
    conversations.push(newConversation);
    fs.writeFileSync(this.dbPath, JSON.stringify(conversations, null, 2));
  }

  async getLastSyncTimestamp(): Promise<string | null> {
    const conversations = await this.getAllConversations();
    if (conversations.length === 0) return null;
    return conversations[conversations.length - 1].timestamp;
  }
}