const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors'); // Import cors middleware

const app = express();
const PORT = 3001; // The port your backend server will listen on

const DATA_DIR = path.join(__dirname, 'data');
const DOCUMENTS_FILE = path.join(DATA_DIR, 'documents.json');
const FOLDERS_FILE = path.join(DATA_DIR, 'folders.json');
const ENTITIES_FILE = path.join(DATA_DIR, 'entities.json');
const ASSIGNED_TEXT_BLOCKS_FILE = path.join(DATA_DIR, 'assignedTextBlocks.json');

// Ensure data directory exists
async function ensureDataDirectory() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log(`Ensured data directory exists at: ${DATA_DIR}`);
    } catch (error) {
        console.error('Error ensuring data directory:', error);
        process.exit(1); // Exit if cannot create data directory
    }
}

// Initialize data files if they don't exist
async function initializeDataFile(filePath, defaultContent) {
    try {
        await fs.access(filePath); // Check if file exists
        console.log(`${path.basename(filePath)} already exists.`);
    } catch (error) {
        if (error.code === 'ENOENT') { // File does not exist
            await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
            console.log(`Created ${path.basename(filePath)} with default content.`);
        } else {
            console.error(`Error checking/creating ${path.basename(filePath)}:`, error);
        }
    }
}

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for development. In production, configure this more strictly.
// For example, allow only your specific frontend origin.
app.use(cors());

// --- API Endpoints ---

// GET all data
app.get('/api/data', async (req, res) => {
    try {
        // Use the robust readDataFile for initial fetching
        const documents = await readDataFile(DOCUMENTS_FILE);
        const folders = await readDataFile(FOLDERS_FILE);
        const entities = await readDataFile(ENTITIES_FILE);
        const assignedTextBlocks = await readDataFile(ASSIGNED_TEXT_BLOCKS_FILE);

        res.json({ documents, folders, entities, assignedTextBlocks });
    } catch (error) {
        console.error('Error fetching all data:', error);
        res.status(500).json({ message: 'Error fetching all data', error: error.message });
    }
});

// Generic read function for a data type - now more resilient
async function readDataFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        // If file is empty or just whitespace, treat as empty array
        if (data.trim() === '') {
            console.warn(`Warning: ${path.basename(filePath)} is empty or contains only whitespace. Initializing as empty array.`);
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`${path.basename(filePath)} not found. Initializing with empty array.`);
            return []; // File doesn't exist, start with an empty array
        }
        // Catch JSON parsing errors specifically and recover by returning an empty array
        if (error instanceof SyntaxError) {
            console.error(`Error parsing JSON from ${path.basename(filePath)}. File might be corrupted. Attempting to reset data.`, error);
            // Attempt to clear the corrupted file by writing an empty array to it.
            // This is a recovery mechanism.
            try {
                await fs.writeFile(filePath, '[]', 'utf8'); // Write empty array to clear corruption
                console.log(`Cleared corrupted file: ${path.basename(filePath)}`);
            } catch (writeError) {
                console.error(`Failed to clear corrupted file ${path.basename(filePath)}:`, writeError);
            }
            return []; // Return empty array to allow the application to continue
        }
        // For any other unexpected errors, re-throw
        throw error;
    }
}

// Generic write function for a data type
async function writeDataFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Documents API
app.get('/api/documents', async (req, res) => {
    try {
        const documents = await readDataFile(DOCUMENTS_FILE);
        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'Error fetching documents', error: error.message });
    }
});

app.post('/api/documents', async (req, res) => {
    try {
        const documents = await readDataFile(DOCUMENTS_FILE);
        const newDoc = req.body;
        documents.push(newDoc);
        await writeDataFile(DOCUMENTS_FILE, documents);
        res.status(201).json(newDoc);
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ message: 'Error creating document', error: error.message });
    }
});

app.put('/api/documents/:id', async (req, res) => {
    try {
        let documents = await readDataFile(DOCUMENTS_FILE);
        const { id } = req.params;
        const updatedDoc = req.body;
        const index = documents.findIndex(doc => doc.id === id);
        if (index !== -1) {
            documents[index] = { ...documents[index], ...updatedDoc };
            await writeDataFile(DOCUMENTS_FILE, documents);
            res.json(documents[index]);
        } else {
            res.status(404).json({ message: 'Document not found' });
        }
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ message: 'Error updating document', error: error.message });
    }
});

app.delete('/api/documents/:id', async (req, res) => {
    try {
        let documents = await readDataFile(DOCUMENTS_FILE);
        const { id } = req.params;
        const initialLength = documents.length;
        documents = documents.filter(doc => doc.id !== id);
        if (documents.length < initialLength) {
            await writeDataFile(DOCUMENTS_FILE, documents);
            res.status(204).send(); // No Content
        } else {
            res.status(404).json({ message: 'Document not found' });
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Error deleting document', error: error.message });
    }
});

// Folders API
app.get('/api/folders', async (req, res) => {
    try {
        const folders = await readDataFile(FOLDERS_FILE);
        res.json(folders);
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ message: 'Error fetching folders', error: error.message });
    }
});

app.post('/api/folders', async (req, res) => {
    try {
        const folders = await readDataFile(FOLDERS_FILE);
        const newFolder = req.body;
        folders.push(newFolder);
        await writeDataFile(FOLDERS_FILE, folders);
        res.status(201).json(newFolder);
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ message: 'Error creating folder', error: error.message });
    }
});

app.put('/api/folders/:id', async (req, res) => {
    try {
        let folders = await readDataFile(FOLDERS_FILE);
        const { id } = req.params;
        const updatedFolder = req.body;
        const index = folders.findIndex(folder => folder.id === id);
        if (index !== -1) {
            folders[index] = { ...folders[index], ...updatedFolder };
            await writeDataFile(FOLDERS_FILE, folders);
            res.json(folders[index]);
        } else {
            res.status(404).json({ message: 'Folder not found' });
        }
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ message: 'Error updating folder', error: error.message });
    }
});

app.delete('/api/folders/:id', async (req, res) => {
    try {
        let folders = await readDataFile(FOLDERS_FILE);
        const { id } = req.params;
        const initialLength = folders.length;
        folders = folders.filter(folder => folder.id !== id);
        if (folders.length < initialLength) {
            await writeDataFile(FOLDERS_FILE, folders);
            res.status(204).send(); // No Content
        } else {
            res.status(404).json({ message: 'Folder not found' });
        }
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ message: 'Error deleting folder', error: error.message });
    }
});

// Entities API
app.get('/api/entities', async (req, res) => {
    try {
        const entities = await readDataFile(ENTITIES_FILE);
        res.json(entities);
    } catch (error) {
        console.error('Error fetching entities:', error);
        res.status(500).json({ message: 'Error fetching entities', error: error.message });
    }
});

app.post('/api/entities', async (req, res) => {
    try {
        const entities = await readDataFile(ENTITIES_FILE);
        const newEntity = req.body;
        entities.push(newEntity);
        await writeDataFile(ENTITIES_FILE, entities);
        res.status(201).json(newEntity);
    } catch (error) {
        console.error('Error creating entity:', error);
        res.status(500).json({ message: 'Error creating entity', error: error.message });
    }
});

app.put('/api/entities/:id', async (req, res) => {
    try {
        let entities = await readDataFile(ENTITIES_FILE);
        const { id } = req.params;
        const updatedEntity = req.body;
        const index = entities.findIndex(entity => entity.id === id);
        if (index !== -1) {
            entities[index] = { ...entities[index], ...updatedEntity };
            await writeDataFile(ENTITIES_FILE, entities);
            res.json(entities[index]);
        } else {
            res.status(404).json({ message: 'Entity not found' });
        }
    } catch (error) {
        console.error('Error updating entity:', error);
        res.status(500).json({ message: 'Error updating entity', error: error.message });
    }
});

app.delete('/api/entities/:id', async (req, res) => {
    try {
        let entities = await readDataFile(ENTITIES_FILE);
        const { id } = req.params;
        const initialLength = entities.length;
        entities = entities.filter(entity => entity.id !== id);
        if (entities.length < initialLength) {
            await writeDataFile(ENTITIES_FILE, entities);
            res.status(204).send(); // No Content
        } else {
            res.status(404).json({ message: 'Entity not found' });
        }
    } catch (error) {
        console.error('Error deleting entity:', error);
        res.status(500).json({ message: 'Error deleting entity', error: error.message });
    }
});

// Assigned Text Blocks API
app.get('/api/assignedTextBlocks', async (req, res) => {
    try {
        const assignedTextBlocks = await readDataFile(ASSIGNED_TEXT_BLOCKS_FILE);
        res.json(assignedTextBlocks);
    } catch (error) {
        console.error('Error fetching assigned text blocks:', error);
        res.status(500).json({ message: 'Error fetching assigned text blocks', error: error.message });
    }
});

app.post('/api/assignedTextBlocks', async (req, res) => {
    try {
        const assignedTextBlocks = await readDataFile(ASSIGNED_TEXT_BLOCKS_FILE);
        const newBlock = req.body;
        assignedTextBlocks.push(newBlock);
        await writeDataFile(ASSIGNED_TEXT_BLOCKS_FILE, assignedTextBlocks);
        res.status(201).json(newBlock);
    } catch (error) {
        console.error('Error creating assigned text block:', error);
        res.status(500).json({ message: 'Error creating assigned text block', error: error.message });
    }
});

app.put('/api/assignedTextBlocks/:id', async (req, res) => {
    try {
        let assignedTextBlocks = await readDataFile(ASSIGNED_TEXT_BLOCKS_FILE);
        const { id } = req.params;
        const updatedBlock = req.body;
        const index = assignedTextBlocks.findIndex(block => block.id === id);
        if (index !== -1) {
            assignedTextBlocks[index] = { ...assignedTextBlocks[index], ...updatedBlock };
            await writeDataFile(ASSIGNED_TEXT_BLOCKS_FILE, assignedTextBlocks);
            res.json(assignedTextBlocks[index]);
        } else {
            res.status(404).json({ message: 'Assigned text block not found' });
        }
    } catch (error) {
        console.error('Error updating assigned text block:', error);
        res.status(500).json({ message: 'Error updating assigned text block', error: error.message });
    }
});

app.delete('/api/assignedTextBlocks/:id', async (req, res) => {
    try {
        let assignedTextBlocks = await readDataFile(ASSIGNED_TEXT_BLOCKS_FILE);
        const { id } = req.params;
        const initialLength = assignedTextBlocks.length;
        assignedTextBlocks = assignedTextBlocks.filter(block => block.id !== id);
        if (assignedTextBlocks.length < initialLength) {
            await writeDataFile(ASSIGNED_TEXT_BLOCKS_FILE, assignedTextBlocks);
            res.status(204).send(); // No Content
        } else {
            res.status(404).json({ message: 'Assigned text block not found' });
        }
    } catch (error) {
        console.error('Error deleting assigned text block:', error);
        res.status(500).json({ message: 'Error deleting assigned text block', error: error.message });
    }
});

// NEW: Endpoint for bulk data import
app.post('/api/import', async (req, res) => {
    try {
        const { documents, folders, entities, assignedTextBlocks } = req.body;

        // Overwrite existing data files with imported data
        // Ensure the data is always an array to prevent JSON parsing errors
        await writeDataFile(DOCUMENTS_FILE, Array.isArray(documents) ? documents : []);
        await writeDataFile(FOLDERS_FILE, Array.isArray(folders) ? folders : []);
        await writeDataFile(ENTITIES_FILE, Array.isArray(entities) ? entities : []);
        await writeDataFile(ASSIGNED_TEXT_BLOCKS_FILE, Array.isArray(assignedTextBlocks) ? assignedTextBlocks : []);

        console.log('All data imported successfully via bulk API.');
        res.status(200).json({ message: 'Data imported successfully and replaced existing data.' });
    } catch (error) {
        console.error('Error during bulk data import:', error);
        res.status(500).json({ message: 'Failed to import all data.', error: error.message });
    }
});


// Start the server
async function startServer() {
    await ensureDataDirectory();
    await initializeDataFile(DOCUMENTS_FILE, []);
    await initializeDataFile(FOLDERS_FILE, []);
    await initializeDataFile(ENTITIES_FILE, []);
    await initializeDataFile(ASSIGNED_TEXT_BLOCKS_FILE, []);

    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
        console.log('Ensure Nginx is configured to proxy requests to this server.');
    });
}

startServer();
