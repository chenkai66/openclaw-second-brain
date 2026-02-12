const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = 8000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON
app.use(express.json());

// Helper function to ensure directory exists
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

// Helper function to calculate string similarity (simple Jaccard similarity)
function calculateSimilarity(str1, str2) {
  const set1 = new Set(str1.toLowerCase().split(''));
  const set2 = new Set(str2.toLowerCase().split(''));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

// API endpoint to get knowledge graph
app.get('/api/knowledge-graph', async (req, res) => {
  try {
    const knowledgeGraphPath = path.join(__dirname, 'data', 'knowledge-graph.json');
    const knowledgeGraphContent = await fs.readFile(knowledgeGraphPath, 'utf8');
    const knowledgeGraph = JSON.parse(knowledgeGraphContent);
    res.json(knowledgeGraph);
  } catch (error) {
    console.error('Error reading knowledge graph:', error);
    res.status(500).json({ 
      nodes: [], 
      edges: [],
      error: 'Failed to load knowledge graph'
    });
  }
});

// API endpoint to get tag library
app.get('/api/tags/library', async (req, res) => {
  try {
    const tagLibraryPath = path.join(__dirname, 'data', 'tag-library.json');
    const tagLibraryContent = await fs.readFile(tagLibraryPath, 'utf8');
    const tagLibrary = JSON.parse(tagLibraryContent);
    res.json(tagLibrary);
  } catch (error) {
    console.error('Error reading tag library:', error);
    res.status(500).json({ error: 'Failed to read tag library' });
  }
});

// API endpoint to get tag suggestions
app.get('/api/tags/suggest', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const tagLibraryPath = path.join(__dirname, 'data', 'tag-library.json');
    const tagLibraryContent = await fs.readFile(tagLibraryPath, 'utf8');
    const tagLibrary = JSON.parse(tagLibraryContent);
    
    // Find similar tags
    const suggestions = [];
    for (const [category, tags] of Object.entries(tagLibrary.categories)) {
      for (const tag of tags) {
        const similarity = calculateSimilarity(query, tag.name);
        if (similarity > 0.3 || tag.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            name: tag.name,
            category: category,
            description: tag.description,
            usageCount: tag.usageCount || 0,
            similarity: similarity
          });
        }
      }
    }
    
    // Sort by similarity and usage count
    suggestions.sort((a, b) => {
      if (b.similarity !== a.similarity) {
        return b.similarity - a.similarity;
      }
      return b.usageCount - a.usageCount;
    });
    
    // Return top 10 suggestions
    res.json(suggestions.slice(0, 10));
  } catch (error) {
    console.error('Error getting tag suggestions:', error);
    res.status(500).json({ error: 'Failed to get tag suggestions' });
  }
});

// API endpoint to add/update tag in library
app.post('/api/tags/library', async (req, res) => {
  try {
    const { name, category, description } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category required' });
    }
    
    const tagLibraryPath = path.join(__dirname, 'data', 'tag-library.json');
    const tagLibraryContent = await fs.readFile(tagLibraryPath, 'utf8');
    const tagLibrary = JSON.parse(tagLibraryContent);
    
    // Check if category exists
    if (!tagLibrary.categories[category]) {
      tagLibrary.categories[category] = [];
    }
    
    // Check if tag already exists
    const existingTagIndex = tagLibrary.categories[category].findIndex(t => t.name === name);
    if (existingTagIndex >= 0) {
      // Update existing tag
      tagLibrary.categories[category][existingTagIndex].description = description || tagLibrary.categories[category][existingTagIndex].description;
      tagLibrary.categories[category][existingTagIndex].usageCount = (tagLibrary.categories[category][existingTagIndex].usageCount || 0) + 1;
    } else {
      // Add new tag
      tagLibrary.categories[category].push({
        name: name,
        description: description || '',
        usageCount: 1,
        createdAt: new Date().toISOString()
      });
    }
    
    await fs.writeFile(tagLibraryPath, JSON.stringify(tagLibrary, null, 2));
    res.json({ success: true, message: 'Tag updated in library' });
  } catch (error) {
    console.error('Error updating tag library:', error);
    res.status(500).json({ error: 'Failed to update tag library' });
  }
});

// API endpoint to get all logs with proper metadata
app.get('/api/logs', async (req, res) => {
  try {
    const logsDir = path.join(__dirname, 'content', 'logs');
    await ensureDirectoryExists(logsDir);
    
    const files = await fs.readdir(logsDir);
    const logs = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(logsDir, file), 'utf8');
        const date = file.replace('.md', '');
        
        // Parse frontmatter to extract metadata
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        let summary = '';
        let topics = [];
        
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const summaryMatch = frontmatter.match(/summary:\s*"([^"]*)"/);
          if (summaryMatch) summary = summaryMatch[1];
          
          const topicsMatch = frontmatter.match(/topics:\s*\[(.*?)\]/);
          if (topicsMatch) {
            topics = topicsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
          }
        }
        
        logs.push({ 
          id: date, 
          title: date,
          summary: summary,
          topics: topics,
          content: content 
        });
      }
    }
    
    // Sort by date (newest first)
    logs.sort((a, b) => new Date(b.id) - new Date(a.id));
    res.json(logs);
  } catch (error) {
    console.error('Error reading logs:', error);
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

// API endpoint to get all notes with rich metadata
app.get('/api/notes', async (req, res) => {
  try {
    const notesDir = path.join(__dirname, 'content', 'notes');
    await ensureDirectoryExists(notesDir);
    
    const files = await fs.readdir(notesDir);
    const notes = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(notesDir, file), 'utf8');
        const id = file.replace('.md', '');
        
        // Parse frontmatter to extract rich metadata
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        let title = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let summary = '';
        let tags = [];
        let relatedLogs = [];
        let createdAt = id; // Use ID as date for now
        
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          
          const titleMatch = frontmatter.match(/title:\s*(.*)/);
          if (titleMatch) title = titleMatch[1].trim();
          
          const summaryMatch = frontmatter.match(/summary:\s*"([^"]*)"/);
          if (summaryMatch) summary = summaryMatch[1];
          
          const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
          if (tagsMatch) {
            tags = tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
          }
          
          const relatedLogsMatch = frontmatter.match(/related_logs:\s*\[(.*?)\]/);
          if (relatedLogsMatch) {
            relatedLogs = relatedLogsMatch[1].split(',').map(l => l.trim().replace(/"/g, ''));
          }
          
          const createdMatch = frontmatter.match(/created:\s*(.*)/);
          if (createdMatch) createdAt = createdMatch[1].trim();
        }
        
        notes.push({ 
          id: id,
          title: title,
          summary: summary,
          tags: tags,
          relatedLogs: relatedLogs,
          createdAt: createdAt,
          content: content 
        });
      }
    }
    
    res.json(notes);
  } catch (error) {
    console.error('Error reading notes:', error);
    res.status(500).json({ error: 'Failed to read notes' });
  }
});

// API endpoint to get a specific log
app.get('/api/logs/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const filePath = path.join(__dirname, 'content', 'logs', `${date}.md`);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let summary = '';
    let topics = [];
    
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const summaryMatch = frontmatter.match(/summary:\s*"([^"]*)"/);
      if (summaryMatch) summary = summaryMatch[1];
      
      const topicsMatch = frontmatter.match(/topics:\s*\[(.*?)\]/);
      if (topicsMatch) {
        topics = topicsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
      }
    }
    
    res.json({ 
      id: date,
      title: date,
      summary: summary,
      topics: topics,
      content: content 
    });
  } catch (error) {
    console.error('Error reading log:', error);
    res.status(404).json({ error: 'Log not found' });
  }
});

// API endpoint to get a specific note
app.get('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(__dirname, 'content', 'notes', `${id}.md`);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let title = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    let summary = '';
    let tags = [];
    let relatedLogs = [];
    let createdAt = id;
    
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      
      const titleMatch = frontmatter.match(/title:\s*(.*)/);
      if (titleMatch) title = titleMatch[1].trim();
      
      const summaryMatch = frontmatter.match(/summary:\s*"([^"]*)"/);
      if (summaryMatch) summary = summaryMatch[1];
      
      const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
      if (tagsMatch) {
        tags = tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
      }
      
      const relatedLogsMatch = frontmatter.match(/related_logs:\s*\[(.*?)\]/);
      if (relatedLogsMatch) {
        relatedLogs = relatedLogsMatch[1].split(',').map(l => l.trim().replace(/"/g, ''));
      }
      
      const createdMatch = frontmatter.match(/created:\s*(.*)/);
      if (createdMatch) createdAt = createdMatch[1].trim();
    }
    
    res.json({ 
      id: id,
      title: title,
      summary: summary,
      tags: tags,
      relatedLogs: relatedLogs,
      createdAt: createdAt,
      content: content 
    });
  } catch (error) {
    console.error('Error reading note:', error);
    res.status(404).json({ error: 'Note not found' });
  }
});

// API endpoint to update a log
app.put('/api/logs/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { summary, content } = req.body;
    
    // Rebuild content with proper frontmatter
    const frontmatter = `---\ndate: ${date}\ntype: daily-log\nsummary: "${summary}"\ntopics:\n  - second-brain\n  - knowledge-management\nai_generated: true\n---`;
    const fullContent = `${frontmatter}\n\n${content}`;
    
    const filePath = path.join(__dirname, 'content', 'logs', `${date}.md`);
    await fs.writeFile(filePath, fullContent);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating log:', error);
    res.status(500).json({ error: 'Failed to update log' });
  }
});

// API endpoint to update a note
app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, tags, content } = req.body;
    const tagList = Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim());
    
    // Update tag library with new tags
    const tagLibraryPath = path.join(__dirname, 'data', 'tag-library.json');
    const tagLibraryContent = await fs.readFile(tagLibraryPath, 'utf8');
    let tagLibrary = JSON.parse(tagLibraryContent);
    
    for (const tag of tagList) {
      // Find best category for this tag (simplified logic)
      let category = 'general';
      if (tag.includes('brain') || tag.includes('knowledge')) category = 'knowledge-management';
      else if (tag.includes('server') || tag.includes('api') || tag.includes('web')) category = 'technical';
      else if (tag.includes('cron') || tag.includes('automation')) category = 'automation';
      
      if (!tagLibrary.categories[category]) {
        tagLibrary.categories[category] = [];
      }
      
      const existingTagIndex = tagLibrary.categories[category].findIndex(t => t.name === tag);
      if (existingTagIndex >= 0) {
        tagLibrary.categories[category][existingTagIndex].usageCount = (tagLibrary.categories[category][existingTagIndex].usageCount || 0) + 1;
      } else {
        tagLibrary.categories[category].push({
          name: tag,
          description: '',
          usageCount: 1,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    await fs.writeFile(tagLibraryPath, JSON.stringify(tagLibrary, null, 2));
    
    // Rebuild content with proper frontmatter
    const frontmatter = `---\ntitle: ${title}\ncreated: ${new Date().toISOString().split('T')[0]}\nupdated: ${new Date().toISOString().split('T')[0]}\nsummary: "${summary}"\ntags: [${tagList.map(tag => `"${tag}"`).join(', ')}]\nai_refined: true\n---`;
    const fullContent = `${frontmatter}\n\n${content}`;
    
    const filePath = path.join(__dirname, 'content', 'notes', `${id}.md`);
    await fs.writeFile(filePath, fullContent);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// API endpoint to create a new note
app.post('/api/notes', async (req, res) => {
  try {
    const { id, title, summary, tags, content } = req.body;
    const tagList = Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim());
    
    // Update tag library with new tags
    const tagLibraryPath = path.join(__dirname, 'data', 'tag-library.json');
    const tagLibraryContent = await fs.readFile(tagLibraryPath, 'utf8');
    let tagLibrary = JSON.parse(tagLibraryContent);
    
    for (const tag of tagList) {
      // Find best category for this tag (simplified logic)
      let category = 'general';
      if (tag.includes('brain') || tag.includes('knowledge')) category = 'knowledge-management';
      else if (tag.includes('server') || tag.includes('api') || tag.includes('web')) category = 'technical';
      else if (tag.includes('cron') || tag.includes('automation')) category = 'automation';
      
      if (!tagLibrary.categories[category]) {
        tagLibrary.categories[category] = [];
      }
      
      const existingTagIndex = tagLibrary.categories[category].findIndex(t => t.name === tag);
      if (existingTagIndex >= 0) {
        tagLibrary.categories[category][existingTagIndex].usageCount = (tagLibrary.categories[category][existingTagIndex].usageCount || 0) + 1;
      } else {
        tagLibrary.categories[category].push({
          name: tag,
          description: '',
          usageCount: 1,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    await fs.writeFile(tagLibraryPath, JSON.stringify(tagLibrary, null, 2));
    
    // Create content with proper frontmatter
    const frontmatter = `---\ntitle: ${title}\ncreated: ${new Date().toISOString().split('T')[0]}\nupdated: ${new Date().toISOString().split('T')[0]}\nsummary: "${summary}"\ntags: [${tagList.map(tag => `"${tag}"`).join(', ')}]\nai_refined: true\n---`;
    const fullContent = `${frontmatter}\n\n${content}`;
    
    const filePath = path.join(__dirname, 'content', 'notes', `${id}.md`);
    await fs.writeFile(filePath, fullContent);
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// API endpoint to delete a note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(__dirname, 'content', 'notes', `${id}.md`);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// API endpoint to get notes by tag
app.get('/api/notes-by-tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const notesDir = path.join(__dirname, 'content', 'notes');
    await ensureDirectoryExists(notesDir);
    
    const files = await fs.readdir(notesDir);
    const matchingNotes = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(notesDir, file), 'utf8');
        const id = file.replace('.md', '');
        
        // Parse frontmatter to extract tags
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        let tags = [];
        let title = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let summary = '';
        
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          
          const titleMatch = frontmatter.match(/title:\s*(.*)/);
          if (titleMatch) title = titleMatch[1].trim();
          
          const summaryMatch = frontmatter.match(/summary:\s*"([^"]*)"/);
          if (summaryMatch) summary = summaryMatch[1];
          
          const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
          if (tagsMatch) {
            tags = tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
          }
        }
        
        // Check if the requested tag matches any of the note's tags
        if (tags.some(noteTag => 
          noteTag.toLowerCase() === tag.toLowerCase() || 
          noteTag.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(noteTag.toLowerCase())
        )) {
          matchingNotes.push({ 
            id: id,
            title: title,
            summary: summary,
            tags: tags,
            content: content 
          });
        }
      }
    }
    
    res.json(matchingNotes);
  } catch (error) {
    console.error('Error getting notes by tag:', error);
    res.status(500).json({ error: 'Failed to get notes by tag' });
  }
});

// API endpoint to get all research reports
app.get('/api/reports', async (req, res) => {
  try {
    const reportsDir = path.join(__dirname, 'content', 'reports');
    await ensureDirectoryExists(reportsDir);
    
    // Read the main reports directory for .md files
    const files = await fs.readdir(reportsDir);
    const reports = [];
    
    for (const file of files) {
      if (file.endsWith('.md') && file !== 'daily-research.md') {
        const content = await fs.readFile(path.join(reportsDir, file), 'utf8');
        const id = file.replace('.md', '');
        
        // Parse frontmatter to extract metadata
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        let title = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let summary = '';
        
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          
          const titleMatch = frontmatter.match(/title:\s*(.*)/);
          if (titleMatch) title = titleMatch[1].trim();
          
          const summaryMatch = frontmatter.match(/summary:\s*"([^"]*)"/);
          if (summaryMatch) summary = summaryMatch[1];
        }
        
        reports.push({ 
          id: id,
          title: title,
          summary: summary,
          content: content 
        });
      }
    }
    
    // Also check the daily-research subdirectory
    const dailyResearchDir = path.join(reportsDir, 'daily-research');
    try {
      await fs.access(dailyResearchDir);
      const dailyFiles = await fs.readdir(dailyResearchDir);
      
      for (const file of dailyFiles) {
        if (file.endsWith('.md')) {
          const content = await fs.readFile(path.join(dailyResearchDir, file), 'utf8');
          const id = file.replace('.md', '');
          
          // Parse frontmatter to extract metadata
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          let title = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          let summary = '';
          
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            
            const titleMatch = frontmatter.match(/title:\s*(.*)/);
            if (titleMatch) title = titleMatch[1].trim();
            
            const summaryMatch = frontmatter.match(/summary:\s*"([^"]*)"/);
            if (summaryMatch) summary = summaryMatch[1];
          }
          
          reports.push({ 
            id: id,
            title: title,
            summary: summary,
            content: content 
          });
        }
      }
    } catch (error) {
      // daily-research directory might not exist, that's fine
    }
    
    res.json(reports);
  } catch (error) {
    console.error('Error reading reports:', error);
    res.status(500).json({ error: 'Failed to read reports' });
  }
});

// API endpoint to get a specific report
app.get('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reportsDir = path.join(__dirname, 'content', 'reports');
    
    // Try main reports directory first
    let filePath = path.join(reportsDir, `${id}.md`);
    let content;
    
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      // Try daily-research subdirectory
      filePath = path.join(reportsDir, 'daily-research', `${id}.md`);
      content = await fs.readFile(filePath, 'utf8');
    }
    
    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let title = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    let summary = '';
    
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      
      const titleMatch = frontmatter.match(/title:\s*(.*)/);
      if (titleMatch) title = titleMatch[1].trim();
      
      const summaryMatch = frontmatter.match(/summary:\s*"([^"]*)"/);
      if (summaryMatch) summary = summaryMatch[1];
    }
    
    res.json({ 
      id: id,
      title: title,
      summary: summary,
      content: content 
    });
  } catch (error) {
    console.error('Error reading report:', error);
    res.status(404).json({ error: 'Report not found' });
  }
});

// Handle all other routes by serving index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Second Brain server running on http://0.0.0.0:${PORT}`);
});