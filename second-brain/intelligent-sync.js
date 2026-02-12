#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Function to read sync state
async function readSyncState() {
    try {
        const statePath = path.join(__dirname, 'sync-state.json');
        const stateContent = await fs.readFile(statePath, 'utf8');
        return JSON.parse(stateContent);
    } catch (error) {
        console.log('No sync state found, starting fresh');
        return { lastProcessedTimestamp: 0, lastProcessedMessageId: null, processedFiles: [], version: "1.0" };
    }
}

// Function to update sync state
async function updateSyncState(newState) {
    const statePath = path.join(__dirname, 'sync-state.json');
    await fs.writeFile(statePath, JSON.stringify(newState, null, 2));
    console.log('Sync state updated successfully');
}

// Function to read tag library
async function readTagLibrary() {
    try {
        const tagLibraryPath = path.join(__dirname, 'data', 'tag-library.json');
        const tagLibraryContent = await fs.readFile(tagLibraryPath, 'utf8');
        return JSON.parse(tagLibraryContent);
    } catch (error) {
        console.log('No tag library found, creating default');
        const defaultTagLibrary = {
            tags: [
                { name: "second-brain", description: "Core Second Brain system functionality", category: "system", usage_count: 0 },
                { name: "server-deployment", description: "Server setup and deployment topics", category: "infrastructure", usage_count: 0 },
                { name: "cron-jobs", description: "Automated task scheduling and management", category: "automation", usage_count: 0 },
                { name: "troubleshooting", description: "Problem solving and debugging", category: "support", usage_count: 0 },
                { name: "knowledge-management", description: "Knowledge organization and retrieval", category: "core", usage_count: 0 },
                { name: "api", description: "Application Programming Interface development", category: "development", usage_count: 0 },
                { name: "web-interface", description: "Frontend web interface design", category: "ui", usage_count: 0 },
                { name: "public-access", description: "Public network accessibility", category: "security", usage_count: 0 },
                { name: "sync-task", description: "Data synchronization processes", category: "automation", usage_count: 0 },
                { name: "system-fix", description: "System bug fixes and improvements", category: "maintenance", usage_count: 0 }
            ],
            metadata: {
                last_updated: new Date().toISOString(),
                total_tags: 10,
                version: "1.0"
            }
        };
        await fs.writeFile(path.join(__dirname, 'data', 'tag-library.json'), JSON.stringify(defaultTagLibrary, null, 2));
        return defaultTagLibrary;
    }
}

// Function to update tag library with new tags
async function updateTagLibrary(newTags, existingLibrary) {
    const existingTagNames = new Set(existingLibrary.tags.map(tag => tag.name.toLowerCase()));
    const updatedLibrary = { ...existingLibrary };
    
    for (const newTag of newTags) {
        const normalizedTag = newTag.toLowerCase();
        if (!existingTagNames.has(normalizedTag)) {
            // Check for similar tags (fuzzy matching)
            let similarFound = false;
            for (const existingTag of existingLibrary.tags) {
                const similarity = calculateSimilarity(normalizedTag, existingTag.name.toLowerCase());
                if (similarity > 0.8) {
                    console.log(`Similar tag found: "${newTag}" is similar to "${existingTag.name}" (similarity: ${similarity})`);
                    similarFound = true;
                    break;
                }
            }
            
            if (!similarFound) {
                updatedLibrary.tags.push({
                    name: newTag,
                    description: `Auto-generated tag for: ${newTag}`,
                    category: "auto-generated",
                    usage_count: 1
                });
                existingTagNames.add(normalizedTag);
                console.log(`Added new tag to library: ${newTag}`);
            }
        } else {
            // Increment usage count for existing tag
            const existingTag = updatedLibrary.tags.find(tag => tag.name.toLowerCase() === normalizedTag);
            if (existingTag) {
                existingTag.usage_count = (existingTag.usage_count || 0) + 1;
            }
        }
    }
    
    updatedLibrary.metadata.last_updated = new Date().toISOString();
    updatedLibrary.metadata.total_tags = updatedLibrary.tags.length;
    
    await fs.writeFile(path.join(__dirname, 'data', 'tag-library.json'), JSON.stringify(updatedLibrary, null, 2));
    console.log('Tag library updated successfully');
    return updatedLibrary;
}

// Simple similarity calculation (Jaccard similarity)
function calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;
    
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
}

// Function to ensure directory exists
async function ensureDirectoryExists(dirPath) {
    try {
        await fs.access(dirPath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(dirPath, { recursive: true });
        } else {
            throw error;
        }
    }
}

// Function to extract topics from conversation
function extractTopicsFromConversation(conversation) {
    const userMessage = conversation.user_message.toLowerCase();
    const assistantResponse = conversation.assistant_response.toLowerCase();
    const combinedText = userMessage + ' ' + assistantResponse;
    
    // Extract potential topics based on keywords
    const potentialTopics = [];
    
    // System-related topics
    if (combinedText.includes('server') || combinedText.includes('部署') || combinedText.includes('启动')) {
        potentialTopics.push('server-deployment');
    }
    if (combinedText.includes('cron') || combinedText.includes('定时') || combinedText.includes('自动')) {
        potentialTopics.push('cron-jobs');
    }
    if (combinedText.includes('问题') || combinedText.includes('修复') || combinedText.includes('troubleshoot')) {
        potentialTopics.push('troubleshooting');
    }
    if (combinedText.includes('知识') || combinedText.includes('brain') || combinedText.includes('第二大脑')) {
        potentialTopics.push('second-brain');
        potentialTopics.push('knowledge-management');
    }
    if (combinedText.includes('公网') || combinedText.includes('public') || combinedText.includes('访问')) {
        potentialTopics.push('public-access');
    }
    if (combinedText.includes('api') || combinedText.includes('接口')) {
        potentialTopics.push('api');
    }
    if (combinedText.includes('前端') || combinedText.includes('界面') || combinedText.includes('web')) {
        potentialTopics.push('web-interface');
    }
    if (combinedText.includes('同步') || combinedText.includes('sync')) {
        potentialTopics.push('sync-task');
    }
    if (combinedText.includes('修复') || combinedText.includes('fix') || combinedText.includes('更新')) {
        potentialTopics.push('system-fix');
    }
    
    return [...new Set(potentialTopics)]; // Remove duplicates
}

// Main intelligent sync function
async function runIntelligentSync() {
    try {
        console.log('Starting Intelligent Second Brain Sync Process...');
        
        // Read current sync state
        const syncState = await readSyncState();
        console.log('Current sync state:', syncState);
        
        // Read raw conversations
        const rawDataPath = path.join(__dirname, 'data', 'raw-conversations.json');
        let rawData;
        try {
            const rawDataContent = await fs.readFile(rawDataPath, 'utf8');
            rawData = JSON.parse(rawDataContent);
        } catch (error) {
            console.log('No raw conversations data found');
            rawData = { conversations: [], last_updated: new Date().toISOString() };
        }
        
        console.log(`Processing ${rawData.conversations.length} conversations...`);
        
        // Read or create knowledge database
        const knowledgeDbPath = path.join(__dirname, 'data', 'knowledge-db.json');
        let knowledgeDb;
        try {
            const knowledgeDbContent = await fs.readFile(knowledgeDbPath, 'utf8');
            knowledgeDb = JSON.parse(knowledgeDbContent);
        } catch (error) {
            console.log('No knowledge database found, creating new one');
            knowledgeDb = { entries: [], metadata: { last_compression: null, total_entries: 0, version: "1.0" } };
        }
        
        // Read tag library
        const tagLibrary = await readTagLibrary();
        let allExtractedTags = [];
        
        // Process each conversation
        for (const conversation of rawData.conversations) {
            const topics = extractTopicsFromConversation(conversation);
            allExtractedTags = [...allExtractedTags, ...topics];
            
            // Group related conversations under comprehensive knowledge entries
            let entryUpdated = false;
            
            for (const topic of topics) {
                // Find existing entry for this topic area
                const existingEntry = knowledgeDb.entries.find(entry => 
                    entry.tags.some(tag => tag.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(tag.toLowerCase()))
                );
                
                if (existingEntry) {
                    // Update existing entry with new information
                    const newSummary = `Updated with conversation from ${new Date(conversation.timestamp).toISOString()}: ${conversation.user_message}`;
                    existingEntry.summary += ` ${newSummary}`;
                    existingEntry.tags = [...new Set([...existingEntry.tags, ...topics])];
                    existingEntry.updated_at = new Date().toISOString();
                    existingEntry.version = (existingEntry.version || 1) + 1;
                    existingEntry.related_logs = [...new Set([...existingEntry.related_logs, conversation.id])];
                    entryUpdated = true;
                    console.log(`Updated existing knowledge entry for topic: ${topic}`);
                } else {
                    // Create new comprehensive entry
                    const newEntry = {
                        id: `${new Date().toISOString().split('T')[0]}-${topic.replace(/[^a-z0-9]/g, '-')}`,
                        title: `Comprehensive Guide: ${topic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
                        summary: `Initial knowledge entry created from conversation: ${conversation.user_message}. This entry will be expanded as more related conversations occur.`,
                        tags: topics,
                        related_logs: [conversation.id],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        version: 1,
                        ai_refined: true
                    };
                    knowledgeDb.entries.push(newEntry);
                    console.log(`Created new knowledge entry for topic: ${topic}`);
                }
            }
            
            if (!entryUpdated && topics.length > 0) {
                // Create a general Second Brain entry if no specific topic matched
                const generalEntry = {
                    id: `${new Date().toISOString().split('T')[0]}-second-brain-general`,
                    title: "Second Brain System Development",
                    summary: `General conversation about Second Brain system: ${conversation.user_message}`,
                    tags: [...new Set([...allExtractedTags, 'second-brain'])],
                    related_logs: [conversation.id],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    version: 1,
                    ai_refined: true
                };
                knowledgeDb.entries.push(generalEntry);
            }
        }
        
        // Update tag library with extracted tags
        if (allExtractedTags.length > 0) {
            await updateTagLibrary(allExtractedTags, tagLibrary);
        }
        
        // Update knowledge database
        knowledgeDb.metadata.total_entries = knowledgeDb.entries.length;
        knowledgeDb.metadata.last_updated = new Date().toISOString();
        await fs.writeFile(knowledgeDbPath, JSON.stringify(knowledgeDb, null, 2));
        console.log('Knowledge database updated successfully');
        
        // Update knowledge graph
        await updateKnowledgeGraph(knowledgeDb.entries);
        
        // Update sync state
        const newSyncState = {
            lastProcessedTimestamp: Date.now(),
            lastProcessedMessageId: rawData.conversations.length > 0 ? 
                rawData.conversations[rawData.conversations.length - 1].id : 
                `sync-${new Date().toISOString().replace(/[:.]/g, '-')}`,
            processedFiles: [...syncState.processedFiles, `sync-${new Date().toISOString().split('T')[0]}`],
            version: "1.0"
        };
        await updateSyncState(newSyncState);
        
        console.log('Intelligent Second Brain Sync completed successfully!');
        console.log(`Processed ${rawData.conversations.length} conversations`);
        console.log(`Knowledge database now has ${knowledgeDb.entries.length} entries`);
        return true;
        
    } catch (error) {
        console.error('Error during intelligent sync process:', error);
        return false;
    }
}

// Function to update knowledge graph based on knowledge entries
async function updateKnowledgeGraph(entries) {
    try {
        const nodes = new Map();
        const edges = [];
        
        // Create nodes for each unique tag
        const allTags = new Set();
        entries.forEach(entry => {
            entry.tags.forEach(tag => allTags.add(tag));
        });
        
        allTags.forEach((tag, index) => {
            nodes.set(tag, {
                id: tag,
                label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                type: "topic",
                weight: entries.filter(entry => entry.tags.includes(tag)).length
            });
        });
        
        // Create edges between tags that appear together in entries
        entries.forEach(entry => {
            const entryTags = entry.tags;
            for (let i = 0; i < entryTags.length; i++) {
                for (let j = i + 1; j < entryTags.length; j++) {
                    const source = entryTags[i];
                    const target = entryTags[j];
                    const existingEdge = edges.find(edge => 
                        (edge.source === source && edge.target === target) ||
                        (edge.source === target && edge.target === source)
                    );
                    
                    if (existingEdge) {
                        existingEdge.weight += 0.1;
                    } else {
                        edges.push({
                            source: source,
                            target: target,
                            weight: 0.5,
                            relationship: "co-occurs"
                        });
                    }
                }
            }
        });
        
        const knowledgeGraph = {
            nodes: Array.from(nodes.values()),
            edges: edges,
            metadata: {
                lastUpdated: new Date().toISOString(),
                totalNodes: nodes.size,
                totalEdges: edges.length
            }
        };
        
        const graphPath = path.join(__dirname, 'data', 'knowledge-graph.json');
        await fs.writeFile(graphPath, JSON.stringify(knowledgeGraph, null, 2));
        console.log('Knowledge graph updated successfully');
        
    } catch (error) {
        console.error('Error updating knowledge graph:', error);
    }
}

// Run the sync
if (require.main === module) {
    runIntelligentSync().then(success => {
        process.exit(success ? 0 : 1);
    });
}