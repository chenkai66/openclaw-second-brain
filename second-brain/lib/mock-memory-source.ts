import { MemorySource } from './memory-source';

// Mock implementation for development
// In production, this would connect to actual conversation history
export class MockMemorySource implements MemorySource {
  private conversations: Record<string, any[]> = {};
  private lastProcessedTimestamp: number = Date.now() - 3600000; // 1 hour ago

  async getNewConversationsSince(timestamp: number): Promise<any[]> {
    // Return mock conversations if we haven't returned them yet
    if (timestamp < this.lastProcessedTimestamp) {
      return [];
    }
    
    // Create mock conversation data
    const newConversations = [
      {
        id: 'conv-1',
        timestamp: Date.now(),
        content: 'User discussed the importance of real-time knowledge synchronization in their second brain system. They emphasized the need for elegant naming conventions and semantic organization.',
        participants: ['user', 'assistant']
      },
      {
        id: 'conv-2', 
        timestamp: Date.now() + 1000,
        content: 'The team explored how AI could automatically extract key concepts from conversations and organize them into structured notes with proper metadata and relationships.',
        participants: ['user', 'assistant']
      }
    ];
    
    // Update last processed timestamp
    this.lastProcessedTimestamp = Date.now();
    
    return newConversations;
  }

  async markAsProcessed(conversationIds: string[]): Promise<void> {
    // In a real implementation, this would mark conversations as processed
    console.log('Marking conversations as processed:', conversationIds);
  }
}