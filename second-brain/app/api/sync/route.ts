import { NextRequest } from 'next/server';
import { RawConversationsDB } from '@/lib/raw-conversations-db';
import { KnowledgeDB } from '@/lib/knowledge-db';
import { KnowledgeGraphDB } from '@/lib/knowledge-graph-db';
import { ContentCompression } from '@/lib/content-compression';
import { AIOrganizer } from '@/lib/ai-organizer';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting comprehensive sync process...');
    
    // Initialize all database handlers
    const rawDB = new RawConversationsDB();
    const knowledgeDB = new KnowledgeDB();
    const graphDB = new KnowledgeGraphDB();
    const compression = new ContentCompression();
    const aiOrganizer = new AIOrganizer();
    
    // Step 1: Get new conversations from memory source
    const newConversations = await rawDB.getNewConversations();
    
    if (newConversations.length === 0) {
      console.log('No new conversations found.');
      return new Response(JSON.stringify({ success: true, message: 'No new conversations' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Step 2: Store raw conversations in history database
    await rawDB.storeConversations(newConversations);
    
    // Step 3: Process conversations to extract knowledge
    const today = new Date().toISOString().split('T')[0];
    const dailySummary = await aiOrganizer.generateDailySummary(newConversations, today);
    
    // Step 4: Extract individual knowledge items with rich metadata
    const knowledgeItems = await aiOrganizer.extractKnowledgeItems(newConversations);
    
    // Step 5: Check for duplicates and merge similar content
    const processedItems = [];
    for (const item of knowledgeItems) {
      const similarItems = await knowledgeDB.findSimilarItems(item.title, item.tags);
      
      if (similarItems.length > 0) {
        // Merge with existing similar items
        const mergedItem = await compression.mergeSimilarItems(item, similarItems);
        await knowledgeDB.updateItem(mergedItem.id, mergedItem);
        processedItems.push(mergedItem);
      } else {
        // Create new knowledge item
        const newItem = await knowledgeDB.createItem(item);
        processedItems.push(newItem);
      }
    }
    
    // Step 6: Update knowledge graph with new relationships
    await graphDB.updateGraph(processedItems);
    
    // Step 7: Perform daily compression check (once per day)
    const shouldCompress = await compression.shouldPerformDailyCompression(today);
    if (shouldCompress) {
      await compression.performDailyCompression(knowledgeDB, today);
    }
    
    console.log(`Sync completed successfully. Processed ${newConversations.length} conversations, created/updated ${processedItems.length} knowledge items.`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${newConversations.length} conversations`,
      knowledgeItems: processedItems.length,
      dailySummary: dailySummary?.id || null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}