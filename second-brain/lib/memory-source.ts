import { MockMemorySource } from './mock-memory-source';

// This is an abstraction layer for getting conversation data
// In production, this would connect to a real memory source (Redis, database, etc.)
export class MemorySource {
  private mockSource: MockMemorySource;

  constructor() {
    this.mockSource = new MockMemorySource();
  }

  async getNewConversations(): Promise<{ id: string; content: string; timestamp: string }[]> {
    // In a real implementation, this would check for conversations since last sync
    // For now, we'll use the mock implementation
    return this.mockSource.getNewConversations();
  }

  async markConversationsAsProcessed(conversationIds: string[]): Promise<void> {
    // Mark conversations as processed so they're not processed again
    return this.mockSource.markConversationsAsProcessed(conversationIds);
  }
}