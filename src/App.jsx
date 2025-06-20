import React, { useState, useEffect, useRef, useCallback } from 'react';

// Import icons from lucide-react
import { Link, Image, MinusCircle, Bold, Italic, List, ListOrdered, Heading, HelpCircle, Eye, EyeOff, Folder, FileText, Search, Plus, X, Pencil, Trash2, ChevronRight, CornerDownRight, ExternalLink, Text } from 'lucide-react';

// Base URL for your backend API
// If your frontend is served from the same domain as your backend API through Nginx,
// you can use a relative path like '/api'. Otherwise, specify the full URL.
const BASE_URL = '/api'; // Assuming Nginx proxies /api to http://localhost:3001

// Helper functions for selection management
const saveSelection = () => {
    if (window.getSelection) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            return selection.getRangeAt(0);
        }
    }
    return null;
};

const restoreSelection = (range) => {
    if (range && window.getSelection) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
};

// --- API Utility Functions ---
const apiFetch = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        // For DELETE requests, response might be empty (204 No Content)
        if (response.status === 204) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        throw error; // Re-throw to be handled by calling components
    }
};


// Custom Modal Component for Conflict Resolution (now simplified/removed logic, just for display)
const ConflictResolutionModal = ({ isOpen, conflicts, onResolve, onCancel }) => {
    // This modal is now largely informational/placeholder as the backend /api/import
    // directly overwrites data. The conflict resolution logic is less relevant for this bulk overwrite.
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Import Information</h2>
                <p className="mb-4 text-gray-700">
                    The imported data will overwrite existing data. Proceed with import?
                </p>

                {conflicts.documents.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3 text-indigo-700">Documents to overwrite:</h3>
                        <ul className="list-disc pl-5">
                            {conflicts.documents.map(doc => <li key={doc.id} className="text-gray-800">{doc.title} (ID: {doc.id})</li>)}
                        </ul>
                    </div>
                )}
                {conflicts.entities.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3 text-purple-700">Entities to overwrite:</h3>
                        <ul className="list-disc pl-5">
                            {conflicts.entities.map(entity => <li key={entity.id} className="text-gray-800">{entity.primaryName} (ID: {entity.id})</li>)}
                        </ul>
                    </div>
                )}
                {conflicts.textBlocks && conflicts.textBlocks.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3 text-emerald-700">Text Blocks to overwrite:</h3>
                        <ul className="list-disc pl-5">
                            {conflicts.textBlocks.map(block => <li key={block.id} className="text-gray-800">Block ID: {block.id}, Entity: {block.entityName || 'N/A'}</li>)}
                        </ul>
                    </div>
                )}
                {conflicts.folders && conflicts.folders.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3 text-pink-700">Folders to overwrite:</h3>
                        <ul className="list-disc pl-5">
                            {conflicts.folders.map(folder => <li key={folder.id} className="text-gray-800">{folder.name} (ID: {folder.id})</li>)}
                        </ul>
                    </div>
                )}


                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
                    >
                        Cancel Import
                    </button>
                    <button
                        onClick={() => onResolve(true)} // Pass true to confirm overwrite
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
                    >
                        Confirm Overwrite & Import
                    </button>
                </div>
            </div>
        </div>
    );
};


// Custom Modal Component for Entity Selection
const EntitySelectionModal = ({ isOpen, entities, onSelectEntity, onCancel }) => {
    const [selectedEntityId, setSelectedEntityId] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedEntityId(''); // Reset selection when modal opens
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Select Entity for Assignment</h2>
                <div className="mb-4">
                    <select
                        className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={selectedEntityId}
                        onChange={(e) => setSelectedEntityId(e.target.value)}
                    >
                        <option value="">-- Choose an Entity --</option>
                        {entities.map(entity => (
                            <option key={entity.id} value={entity.id}>{entity.primaryName}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSelectEntity(selectedEntityId)}
                        disabled={!selectedEntityId}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    >
                        Assign
                    </button>
                </div>
            </div>
        </div>
    );
};

// Custom Modal Component for Removing Assignments
const RemoveAssignmentModal = ({ isOpen, blocks, onRemoveBlock, onCancel }) => {
    if (!isOpen || blocks.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Remove Text Assignment</h2>
                <p className="mb-4 text-gray-700">
                    Multiple assigned blocks detected at your cursor position. Select one to remove:
                </p>
                <ul className="space-y-2 mb-6">
                    {blocks.map(block => (
                        <li key={block.id} className="flex items-center justify-between bg-gray-100 p-3 rounded-md">
                            <span className="font-medium text-gray-800 flex-grow pr-2">
                                <strong>{block.entityName}:</strong> "{block.plainText.substring(0, 80)}{block.plainText.length > 80 ? '...' : ''}"
                            </span>
                            <button
                                onClick={() => onRemoveBlock(block.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Remove this assignment"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="flex justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


// Custom Modal for Document Creation (asking for folder)
const CreateDocumentModal = ({ isOpen, folders, onCreate, onCancel }) => {
    const [title, setTitle] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState('root'); // 'root' for no parent folder

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setSelectedFolderId('root');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (title.trim()) {
            onCreate(title.trim(), selectedFolderId === 'root' ? null : selectedFolderId);
        } else {
            // Replaced alert with a simple console error or message within the modal if needed
            console.error('Document title cannot be empty.');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Create New Document</h2>
                <div className="mb-4">
                    <label htmlFor="docTitle" className="block text-gray-700 text-sm font-bold mb-2">
                        Document Title:
                    </label>
                    <input
                        type="text"
                        id="docTitle"
                        className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                        }}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="folderSelect" className="block text-gray-700 text-sm font-bold mb-2">
                        Place in Folder:
                    </label>
                    <select
                        id="folderSelect"
                        className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        value={selectedFolderId}
                        onChange={(e) => setSelectedFolderId(e.target.value)}
                    >
                        <option value="root">Root</option>
                        {folders.map(folder => (
                            <option key={folder.id} value={folder.id}>
                                {folder.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};


// Custom Modal for Folder Creation
const CreateFolderModal = ({ isOpen, folders, onCreate, onCancel }) => {
    const [folderName, setFolderName] = useState('');
    const [selectedParentFolderId, setSelectedParentFolderId] = useState('root');

    useEffect(() => {
        if (isOpen) {
            setFolderName('');
            setSelectedParentFolderId('root');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (folderName.trim()) {
            onCreate(folderName.trim(), selectedParentFolderId === 'root' ? null : selectedParentFolderId);
        } else {
            console.error('Folder name cannot be empty.');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Create New Folder</h2>
                <div className="mb-4">
                    <label htmlFor="folderName" className="block text-gray-700 text-sm font-bold mb-2">
                        Folder Name:
                    </label>
                    <input
                        type="text"
                        id="folderName"
                        className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                        }}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="parentFolderSelect" className="block text-gray-700 text-sm font-bold mb-2">
                        Parent Folder:
                    </label>
                    <select
                        id="parentFolderSelect"
                        className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        value={selectedParentFolderId}
                        onChange={(e) => setSelectedParentFolderId(e.target.value)}
                    >
                        <option value="root">Root</option>
                        {folders.map(folder => (
                            <option key={folder.id} value={folder.id}>
                                {folder.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!folderName.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};


// FolderItem Component for recursive rendering
const FolderItem = ({ folder, documents, folders, onDocumentSelect, currentDocumentId, documentSearchQuery, onEditDocument, onDeleteDocument, onEditFolder, onDeleteFolder, onMoveDocument, editingDocument, saveEditedDocument, cancelEditDocument }) => {
    const [isOpen, setIsOpen] = useState(folder.isOpen || false);
    const [isDragOver, setIsDragOver] = useState(false); // State for drag-over visual feedback

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        // Optionally update the folder's isOpen state in main App's state for persistence
        // This would require passing a prop like onToggleFolder(folder.id)
    };

    const childDocuments = documents.filter(doc => doc.folderId === folder.id);
    const childFolders = folders.filter(f => f.parentId === folder.id);

    // Filter based on search query
    const lowerCaseQuery = documentSearchQuery.toLowerCase();
    const matchesSearch = folder.name.toLowerCase().includes(lowerCaseQuery) ||
        childDocuments.some(doc => doc.title.toLowerCase().includes(lowerCaseQuery)) ||
        childFolders.some(f => f.name.toLowerCase().includes(lowerCaseQuery)); // Check if child folders or docs match

    if (documentSearchQuery && !matchesSearch) {
        return null; // Don't render if doesn't match search
    }

    const handleDragOver = (e) => {
        e.preventDefault(); // Necessary to allow drop
        e.dataTransfer.dropEffect = 'move';
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Stop event propagation to prevent parent drop handlers from firing
        setIsDragOver(false);
        const draggedDocId = e.dataTransfer.getData('text/plain');
        if (draggedDocId) {
            onMoveDocument(draggedDocId, folder.id);
        }
    };

    return (
        <div className="mb-1">
            <div
                className={`flex items-center justify-between p-2 rounded-md bg-gray-600 hover:bg-gray-500 cursor-pointer text-lg font-medium transition duration-200 ${isDragOver ? 'border-2 border-blue-400' : ''}`}
                onClick={toggleOpen}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver} // Use handleDragOver for enter too
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex items-center">
                    <ChevronRight className={`h-5 w-5 mr-2 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    <Folder className="h-5 w-5 mr-2" />
                    <span>{folder.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }} className="text-yellow-400 hover:text-yellow-300" title="Edit Folder">
                        <Pencil className="h-5 w-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }} className="text-red-400 hover:text-red-300" title="Delete Folder">
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>
            {isOpen && (
                <div className="pl-4 border-l border-gray-700 ml-2">
                    {childFolders.map(childFolder => (
                        <FolderItem
                            key={childFolder.id}
                            folder={childFolder}
                            documents={documents}
                            folders={folders}
                            onDocumentSelect={onDocumentSelect}
                            currentDocumentId={currentDocumentId}
                            documentSearchQuery={documentSearchQuery}
                            onEditDocument={onEditDocument}
                            onDeleteDocument={onDeleteDocument}
                            onEditFolder={onEditFolder}
                            onDeleteFolder={onDeleteFolder}
                            onMoveDocument={onMoveDocument}
                            editingDocument={editingDocument} // Pass editingDocument
                            saveEditedDocument={saveEditedDocument} // Pass saveEditedDocument
                            cancelEditDocument={cancelEditDocument} // Pass cancelEditDocument
                        />
                    ))}
                    {childDocuments
                        .filter(doc => doc.title.toLowerCase().includes(lowerCaseQuery))
                        .map(doc => (
                            <div
                                key={doc.id}
                                draggable="true" // Make documents draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', doc.id); // Store document ID
                                    e.dataTransfer.effectAllowed = 'move';
                                }}
                                className={`flex items-center justify-between p-2 mb-1 rounded-md cursor-pointer transition duration-200
                                    ${doc.id === currentDocumentId ? 'bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                {/* Corrected: Wrap the conditional content and buttons in a React.Fragment */}
                                <>
                                    {editingDocument && editingDocument.id === doc.id ? (
                                        <input
                                            type="text"
                                            value={editingDocument.title}
                                            onChange={(e) => onEditDocument({ ...editingDocument, title: e.target.value })}
                                            onBlur={() => saveEditedDocument(doc.id, editingDocument.title)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    saveEditedDocument(doc.id, editingDocument.title);
                                                    e.target.blur(); // Remove focus
                                                }
                                            }}
                                            className="flex-grow p-1 rounded-md bg-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                            autoFocus
                                        />
                                    ) : (
                                        <span onClick={() => onDocumentSelect(doc.id)} className="flex-grow text-md">
                                            {doc.title}
                                        </span>
                                    )}
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditDocument(doc); }}
                                            className="text-yellow-400 hover:text-yellow-300"
                                            title="Edit Document"
                                        >
                                            <Pencil className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteDocument(doc.id); }}
                                            className="text-red-400 hover:text-red-300"
                                            title="Delete Document"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

// Shortcuts Modal Component
const ShortcutsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Keyboard Shortcuts</h2>
                <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
                    <li><strong>Ctrl + B:</strong> Bold text</li>
                    <li><strong>Ctrl + I:</strong> Italic text</li>
                    <li><strong>Ctrl + L:</strong> Insert Link</li>
                    <li><strong>Ctrl + G:</strong> Insert Image</li>
                    <li><strong>Ctrl + Shift + L:</strong> Unlink (remove link)</li>
                    <li><strong>Ctrl + Shift + 7:</strong> Bullet List</li>
                    <li><strong>Ctrl + Shift + 8:</strong> Numbered List</li>
                    <li><strong>Ctrl + Shift + 0:</strong> Paragraph (Normal Text)</li>
                    <li><strong>Ctrl + 1:</strong> Heading 1</li>
                    <li><strong>Ctrl + 2:</strong> Heading 2</li>
                    <li><strong>Ctrl + 3:</strong> Heading 3</li>
                    <li><strong>Ctrl + 4:</strong> Heading 4</li>
                    <li><strong>Ctrl + 5:</strong> Heading 5</li>
                    <li><strong>Ctrl + 6:</strong> Heading 6</li>
                    <li><strong>Esc:</strong> Close any open dropdowns/modals</li>
                </ul>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Custom Modal for Link Insertion
const LinkModal = ({ isOpen, onConfirm, onCancel }) => {
    const [url, setUrl] = useState('');
    const [text, setText] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Get selected text if any
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                setText(selection.toString());
            } else {
                setText('');
            }
            setUrl('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (url.trim()) {
            onConfirm(url.trim(), text.trim());
        } else {
            console.error('URL cannot be empty.'); // Use console.error instead of alert
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Insert Hyperlink</h2>
                <div className="mb-4">
                    <label htmlFor="linkText" className="block text-gray-700 text-sm font-bold mb-2">
                        Link Text:
                    </label>
                    <input
                        type="text"
                        id="linkText"
                        className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="linkUrl" className="block text-gray-700 text-sm font-bold mb-2">
                        URL:
                    </label>
                    <input
                        type="url"
                        id="linkUrl"
                        placeholder="https://example.com"
                        className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                        }}
                    />
                </div>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!url.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    >
                        Insert Link
                    </button>
                </div>
            </div>
        </div>
    );
};

// Custom Modal for Image Insertion
const ImageModal = ({ isOpen, onConfirm, onCancel }) => {
    const [imageUrl, setImageUrl] = useState('');
    const [altText, setAltText] = useState('');

    useEffect(() => {
        if (isOpen) {
            setImageUrl('');
            setAltText('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (imageUrl.trim()) {
            onConfirm(imageUrl.trim(), altText.trim());
        } else {
            console.error('Image URL cannot be empty.'); // Use console.error instead of alert
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Insert Image</h2>
                <div className="mb-4">
                    <label htmlFor="imageUrl" className="block text-gray-700 text-sm font-bold mb-2">
                        Image URL:
                    </label>
                    <input
                        type="url"
                        id="imageUrl"
                        placeholder="https://placehold.co/600x400"
                        className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                        }}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="altText" className="block text-gray-700 text-sm font-bold mb-2">
                        Alt Text (for accessibility):
                    </label>
                    <input
                        type="text"
                        id="altText"
                        placeholder="A descriptive text for the image"
                        className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                    />
                </div>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!imageUrl.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    >
                        Insert Image
                    </button>
                </div>
            </div>
        </div>
    );
};


// Main App Component
const App = () => {
    const [documents, setDocuments] = useState([]);
    const [folders, setFolders] = useState([]);
    const [entities, setEntities] = useState([]);
    const [assignedTextBlocks, setAssignedTextBlocks] = useState([]);

    const [currentDocumentId, setCurrentDocumentId] = useState(null);

    const [isCreateDocumentModalOpen, setIsCreateDocumentModalOpen] = useState(false);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);


    const [newEntityPrimaryName, setNewEntityPrimaryName] = useState('');
    const [newEntityAliases, setNewEntityAliases] = useState([]);
    const [newEntityDescription, setNewEntityDescription] = useState('');
    const [newEntityLink, setNewEntityLink] = useState('');
    const [isExternalLink, setIsExternalLink] = useState(false);
    const [editingEntity, setEditingEntity] = useState(null);
    const [newAliasInput, setNewAliasInput] = useState('');
    const [newEntityColor, setNewEntityColor] = useState('#fffacd');

    const contentEditableRef = useRef(null);
    const savedSelectionRange = useRef(null);
    const fileInputRef = useRef(null);
    const blockToScrollToRef = useRef(null);

    const [openDropdownEntityId, setOpenDropdownEntityId] = useState(null);
    const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
    const [conflictData, setConflictData] = useState({ documents: [], entities: [], textBlocks: [], folders: [] });
    const importedDataRef = useRef(null);

    const [entitySearchQuery, setEntitySearchQuery] = useState('');
    const [documentSearchQuery, setDocumentSearchQuery] = useState('');

    const [isEntitySelectionModalOpen, setIsEntitySelectionModalOpen] = useState(false);
    const [isRemoveAssignmentModalOpen, setIsRemoveAssignmentModalOpen] = useState(false);
    const [blocksAtCursor, setBlocksAtCursor] = useState([]);

    const [showHighlights, setShowHighlights] = useState(true);

    const [isRootDragOver, setIsRootDragOver] = useState(false);

    const [showDocumentsSidebar, setShowDocumentsSidebar] = useState(true);
    const [showEntitiesSidebar, setShowEntitiesSidebar] = useState(true);
    const [showPreview, setShowPreview] = useState(true);

    const [showShortcutsModal, setShowShortcutsModal] = useState(false);
    const [showFontDropdown, setShowFontDropdown] = useState(false);
    const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);

    // --- Data Fetching from Backend on Load ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await apiFetch('/data');
                setDocuments(data.documents || []);
                setFolders(data.folders || []);
                setEntities(data.entities || []);
                setAssignedTextBlocks(data.assignedTextBlocks || []);

                if (data.documents && data.documents.length > 0) {
                    // Set current document to the first one, or keep existing if it's still available
                    const firstDocId = data.documents[0].id;
                    setCurrentDocumentId(prevId => data.documents.some(doc => doc.id === prevId) ? prevId : firstDocId);
                } else {
                    setCurrentDocumentId(null);
                }
            } catch (error) {
                console.error("Failed to fetch initial data from backend:", error);
                // Optionally show an error message to the user
            }
        };
        fetchData();
    }, []); // Empty dependency array means this runs once on component mount


    // --- Browser Close Prompt ---
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            // No longer directly managing unsaved changes in localStorage,
            // as changes are now pushed to the backend immediately.
            // However, a simple warning can still be useful if the backend save failed silently or network issues.
            // For now, removing the prompt as we assume backend persistence.
            // If you implement offline capabilities or explicit save buttons, you might re-add this logic.
            // event.returnValue = 'Are you sure you want to leave? Your unsaved changes might be lost.';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // --- Document Management ---
    const handleDocumentSelect = (id) => {
        setCurrentDocumentId(id);
    };

    const handleOpenCreateDocumentModal = () => {
        setIsCreateDocumentModalOpen(true);
    };

    const handleCreateDocument = async (title, folderId) => {
        if (!title.trim()) {
            console.error('Document title cannot be empty.');
            return;
        }
        try {
            const newDoc = {
                id: Date.now().toString(),
                title: title.trim(),
                content: '',
                folderId: folderId,
            };
            const createdDoc = await apiFetch('/documents', {
                method: 'POST',
                body: JSON.stringify(newDoc),
            });
            setDocuments(prevDocs => [...prevDocs, createdDoc]);
            setCurrentDocumentId(createdDoc.id);
            setIsCreateDocumentModalOpen(false);
        } catch (error) {
            console.error('Error creating document:', error);
        }
    };

    const handleDeleteDocument = async (id) => {
        try {
            await apiFetch(`/documents/${id}`, { method: 'DELETE' });
            setDocuments(prevDocs => {
                const updatedDocs = prevDocs.filter(doc => doc.id !== id);
                if (currentDocumentId === id) {
                    setCurrentDocumentId(updatedDocs.length > 0 ? updatedDocs[0].id : null);
                }
                return updatedDocs;
            });
            setAssignedTextBlocks(prev => prev.filter(block => block.documentId !== id)); // Also clean up related blocks
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };

    const handleMoveDocument = async (documentId, targetFolderId) => {
        try {
            const docToMove = documents.find(doc => doc.id === documentId);
            if (!docToMove) {
                console.error('Document to move not found.');
                return;
            }
            const updatedDoc = { ...docToMove, folderId: targetFolderId };
            await apiFetch(`/documents/${documentId}`, {
                method: 'PUT',
                body: JSON.stringify({ folderId: targetFolderId }), // Only send the changed field
            });
            setDocuments(prevDocs => prevDocs.map(doc =>
                doc.id === documentId ? updatedDoc : doc
            ));
        } catch (error) {
            console.error('Error moving document:', error);
        }
    };


    const [editingDocument, setEditingDocument] = useState(null);

    const startEditDocument = (doc) => {
        setEditingDocument(doc);
    };

    const saveEditedDocument = async (id, newTitle) => {
        if (!newTitle.trim()) {
            console.error("Document title cannot be empty.");
            cancelEditDocument();
            return;
        }
        try {
            const updatedDoc = await apiFetch(`/documents/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ title: newTitle.trim() }),
            });
            setDocuments(prevDocs => prevDocs.map(doc =>
                doc.id === id ? updatedDoc : doc
            ));
            setEditingDocument(null);
        } catch (error) {
            console.error('Error updating document title:', error);
        }
    };

    const cancelEditDocument = () => {
        setEditingDocument(null);
    };

    const currentDocument = documents.find(doc => doc.id === currentDocumentId);

    // This useCallback reads the content directly from the contentEditable div
    // and updates the React state. It does NOT modify the DOM.
    // It also now sends the content to the backend.
    const handleContentInput = useCallback(async () => {
        if (contentEditableRef.current && currentDocument) {
            const currentContentInDOM = contentEditableRef.current.innerHTML;
            // Optimistically update UI
            setDocuments(prevDocs => prevDocs.map(doc =>
                doc.id === currentDocument.id ? { ...doc, content: currentContentInDOM } : doc
            ));
            // Send to backend
            try {
                await apiFetch(`/documents/${currentDocument.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ content: currentContentInDOM }),
                });
            } catch (error) {
                console.error('Failed to save document content to backend:', error);
                // Optionally revert UI change or notify user of save failure
            }
        }
    }, [currentDocument]); // currentDocument needed for its ID.

    // This effect handles the initial loading of document content into the editor
    // and cursor positioning/scrolling when the active document changes.
    // It also handles programmatic updates that might affect the DOM from outside user typing.
    useEffect(() => {
        if (!contentEditableRef.current || !currentDocument) {
            if (contentEditableRef.current) {
                contentEditableRef.current.innerHTML = '';
                delete contentEditableRef.current.dataset.currentDocId;
            }
            return;
        }

        const domContent = contentEditableRef.current.innerHTML;

        // Only update innerHTML if content has changed or if it's a new document being loaded
        // We compare against `dataset.currentDocId` to detect if it's truly a *new* document.
        if (domContent !== currentDocument.content || contentEditableRef.current.dataset.currentDocId !== currentDocument.id) {
            // Restore selection if it was saved (e.g., after programmatic DOM update via another button)
            const selectionToRestore = savedSelectionRange.current || saveSelection(); // Prefer explicit saved range, otherwise current DOM selection

            contentEditableRef.current.innerHTML = currentDocument.content;
            contentEditableRef.current.dataset.currentDocId = currentDocument.id; // Mark the div with the current document ID

            if (selectionToRestore) {
                restoreSelection(selectionToRestore);
                savedSelectionRange.current = null; // Clear after restoring
            } else {
                // Otherwise, put cursor at the end (typical for new doc selection)
                const range = document.createRange();
                range.selectNodeContents(contentEditableRef.current);
                range.collapse(false);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }

        // Handle scrolling to a specific block if requested (always check)
        if (blockToScrollToRef.current) {
            const targetBlockId = blockToScrollToRef.current;
            blockToScrollToRef.current = null;
            requestAnimationFrame(() => {
                const blockElement = contentEditableRef.current.querySelector(`[data-assigned-block-id="${targetBlockId}"]`);
                if (blockElement) {
                    blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    blockElement.classList.add('flash-highlight');
                    setTimeout(() => {
                        blockElement.classList.remove('flash-highlight');
                    }, 1000);
                }
            });
        }
    }, [currentDocumentId, currentDocument]);

    // This useEffect saves the user's current selection whenever the cursor moves
    // or text is typed in the contentEditable area. This is essential for
    // restoring cursor position after programmatic DOM changes.
    useEffect(() => {
        const editorElement = contentEditableRef.current;
        const handleUserSelectionChange = () => {
            savedSelectionRange.current = saveSelection();
        };
        if (editorElement) {
            editorElement.addEventListener('mouseup', handleUserSelectionChange, { passive: true });
            editorElement.addEventListener('keyup', handleUserSelectionChange, { passive: true });
            return () => {
                editorElement.removeEventListener('mouseup', handleUserSelectionChange);
                editorElement.removeEventListener('keyup', handleUserSelectionChange);
            };
        }
    }, [currentDocumentId]);

    // --- Rich Text Formatting Functions ---
    const applyFormatting = (command, value = null) => {
        if (!contentEditableRef.current) return;
        savedSelectionRange.current = saveSelection(); // Save selection before command
        document.execCommand(command, false, value);
        restoreSelection(savedSelectionRange.current); // Restore selection after command
        handleContentInput(); // Sync DOM changes back to React state and backend
    };

    const toggleBold = () => applyFormatting('bold');
    const toggleItalic = () => applyFormatting('italic');
    const toggleUnorderedList = () => applyFormatting('insertUnorderedList');
    const toggleOrderedList = () => applyFormatting('insertOrderedList');
    const changeFont = (fontName) => applyFormatting('fontName', fontName);
    const setHeading = (tag) => {
        applyFormatting('formatBlock', tag);
        setShowHeadingDropdown(false); // Close dropdown after selection
    };
    const setParagraph = () => {
        applyFormatting('formatBlock', 'p');
        setShowHeadingDropdown(false); // Close dropdown after selection
    };

    const handleInsertLink = () => {
        savedSelectionRange.current = saveSelection(); // Save current selection
        setIsLinkModalOpen(true);
    };

    const handleConfirmLink = (url, text) => {
        if (savedSelectionRange.current) {
            restoreSelection(savedSelectionRange.current);
        } else {
            // Fallback: put cursor at end of editor if no selection was saved
            const range = document.createRange();
            range.selectNodeContents(contentEditableRef.current);
            range.collapse(false);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }

        // Check if there's selected text; if not, insert text and then apply link
        const selection = window.getSelection();
        if (selection.isCollapsed) {
            const textNode = document.createTextNode(text || url); // Use provided text or URL as fallback
            const range = selection.getRangeAt(0);
            range.insertNode(textNode);
            range.selectNodeContents(textNode); // Select the newly inserted text
            selection.removeAllRanges();
            selection.addRange(range);
        }
        applyFormatting('createLink', url);
        savedSelectionRange.current = null; // Clear saved selection
        setIsLinkModalOpen(false);
    };

    const handleUnlink = () => {
        applyFormatting('unlink');
    };

    const handleInsertImage = () => {
        savedSelectionRange.current = saveSelection(); // Save current selection
        setIsImageModalOpen(true);
    };

    const handleConfirmImage = (url, altText) => {
        if (!contentEditableRef.current) return;

        if (savedSelectionRange.current) {
            restoreSelection(savedSelectionRange.current);
        } else {
            // Fallback: put cursor at end of editor if no selection was saved
            const range = document.createRange();
            range.selectNodeContents(contentEditableRef.current);
            range.collapse(false);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }

        const img = document.createElement('img');
        img.src = url;
        img.alt = altText || '';
        img.style.maxWidth = '100%'; // Ensure images don't overflow
        img.style.height = 'auto'; // Maintain aspect ratio
        img.style.display = 'block'; // Block-level for better spacing
        img.style.margin = '10px 0'; // Add some margin

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents(); // Remove any selected content
            range.insertNode(img);

            // Move cursor after the image
            range.setStartAfter(img);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        handleContentInput(); // Sync DOM changes back to React state and backend
        savedSelectionRange.current = null; // Clear saved selection
        setIsImageModalOpen(false);
    };


    // --- Keyboard Shortcuts Listener ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey) {
                // Formatting shortcuts
                if (e.key === 'b') { e.preventDefault(); toggleBold(); }
                if (e.key === 'i') { e.preventDefault(); toggleItalic(); }
                if (e.key === 'l') { e.preventDefault(); handleInsertLink(); } // Ctrl+L for Link
                if (e.key === 'g') { e.preventDefault(); handleInsertImage(); } // Ctrl+G for Image
                if (e.shiftKey && e.key === 'L') { e.preventDefault(); handleUnlink(); } // Ctrl+Shift+L for Unlink
                if (e.shiftKey && e.key === '7') { e.preventDefault(); toggleUnorderedList(); } // Ctrl+Shift+7 for bullet
                if (e.shiftKey && e.key === '8') { e.preventDefault(); toggleOrderedList(); } // Ctrl+Shift+8 for numbered
                if (e.shiftKey && e.key === '0') { e.preventDefault(); setParagraph(); } // Ctrl+Shift+0 for paragraph
                if (e.key >= '1' && e.key <= '6') { e.preventDefault(); setHeading(`h${e.key}`); } // Ctrl+1 to Ctrl+6 for headings
            }
            // Close modals/dropdowns on Escape
            if (e.key === 'Escape') {
                setShowShortcutsModal(false);
                setOpenDropdownEntityId(null);
                setIsEntitySelectionModalOpen(false);
                setIsRemoveAssignmentModalOpen(false);
                setIsCreateDocumentModalOpen(false);
                setIsCreateFolderModalOpen(false);
                setIsLinkModalOpen(false); // Close link modal
                setIsImageModalOpen(false); // Close image modal
                setShowFontDropdown(false);
                setShowHeadingDropdown(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleBold, toggleItalic, toggleUnorderedList, toggleOrderedList, setParagraph, setHeading, handleInsertLink, handleInsertImage, handleUnlink]);


    // --- Folder Management ---
    const handleOpenCreateFolderModal = () => {
        setIsCreateFolderModalOpen(true);
    };

    const handleCreateFolder = async (name, parentId) => {
        if (!name.trim()) {
            console.error('Folder name cannot be empty.');
            return;
        }
        try {
            const newFolder = {
                id: Date.now().toString(),
                name: name,
                parentId: parentId,
                isOpen: false, // Default state for new folders
            };
            const createdFolder = await apiFetch('/folders', {
                method: 'POST',
                body: JSON.stringify(newFolder),
            });
            setFolders(prevFolders => [...prevFolders, createdFolder]);
            setIsCreateFolderModalOpen(false);
        }
        catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const handleDeleteFolder = async (id) => {
        const docsInFolder = documents.filter(doc => doc.folderId === id);
        const childFolders = folders.filter(folder => folder.parentId === id);

        if (docsInFolder.length > 0) {
            console.error("Cannot delete a folder that contains documents. Please move or delete its documents first.");
            return;
        }
        if (childFolders.length > 0) {
            console.error("Cannot delete a folder that contains sub-folders. Please delete its sub-folders first.");
            return;
        }
        try {
            await apiFetch(`/folders/${id}`, { method: 'DELETE' });
            setFolders(prevFolders => prevFolders.filter(folder => folder.id !== id));
        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    };

    const handleEditFolder = async (folderToEdit) => {
        const newName = prompt("Enter new folder name:", folderToEdit.name);
        if (newName && newName.trim()) {
            try {
                const updatedFolder = await apiFetch(`/folders/${folderToEdit.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ name: newName.trim() }),
                });
                setFolders(prevFolders => prevFolders.map(folder =>
                    folder.id === folderToEdit.id ? updatedFolder : folder
                ));
            } catch (error) {
                console.error('Error editing folder:', error);
            }
        }
    };

    // --- Entity Management ---
    const handleAddNewAlias = () => {
        const aliasName = newAliasInput.trim();
        if (aliasName && !newEntityAliases.some(a => a.name === aliasName)) {
            setNewEntityAliases(prevAliases => [...prevAliases, { id: Date.now().toString(), name: aliasName }]);
            setNewAliasInput('');
        }
    };

    const handleUpdateAlias = (id, newName) => {
        const aliasName = newName.trim();
        if (aliasName && !newEntityAliases.some(a => a.name === aliasName)) {
            setNewEntityAliases(prevAliases => prevAliases.map(alias =>
                alias.id === id ? { ...alias, name: aliasName } : alias
            ));
        } else if (!aliasName) {
            setNewEntityAliases(prevAliases => prevAliases.filter(alias => alias.id !== id));
        }
    };

    const handleRemoveAlias = (idToRemove) => {
        setNewEntityAliases(newEntityAliases.filter(alias => alias.id !== idToRemove));
    };

    const clearEntityForm = () => {
        setNewEntityPrimaryName('');
        setNewEntityAliases([]);
        setNewAliasInput('');
        setNewEntityDescription('');
        setNewEntityLink('');
        setIsExternalLink(false);
        setEditingEntity(null);
        setNewEntityColor('#fffacd');
    };

    const handleSaveEntity = async () => {
        if (!newEntityPrimaryName.trim()) {
            console.error("Primary name cannot be empty.");
            return;
        }

        const entityData = {
            primaryName: newEntityPrimaryName.trim(),
            aliases: newEntityAliases.filter(alias => alias.name.trim() !== ''),
            description: newEntityDescription.trim(),
            link: newEntityLink.trim(),
            isExternal: isExternalLink,
            color: newEntityColor
        };

        try {
            if (editingEntity) {
                const updatedEntity = await apiFetch(`/entities/${editingEntity.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(entityData),
                });
                setEntities(prevEntities => prevEntities.map(entity =>
                    entity.id === editingEntity.id ? updatedEntity : entity
                ));
            } else {
                const newEnt = {
                    id: Date.now().toString(),
                    ...entityData,
                };
                const createdEntity = await apiFetch('/entities', {
                    method: 'POST',
                    body: JSON.stringify(newEnt),
                });
                setEntities(prevEntities => [...prevEntities, createdEntity]);
            }
            clearEntityForm();
        } catch (error) {
            console.error('Error saving entity:', error);
        }
    };

    const handleDeleteEntity = async (id) => {
        try {
            await apiFetch(`/entities/${id}`, { method: 'DELETE' });
            setEntities(prevEntities => prevEntities.filter(entity => entity.id !== id));
            setAssignedTextBlocks(prev => prev.filter(block => block.entityId !== id)); // Clean up assigned blocks
        } catch (error) {
            console.error('Error deleting entity:', error);
        }
    };

    const startEditEntity = (entity) => {
        setEditingEntity(entity);
        setNewEntityPrimaryName(entity.primaryName);
        setNewEntityAliases(entity.aliases || []);
        setNewEntityDescription(entity.description);
        setNewEntityLink(entity.link || '');
        setIsExternalLink(entity.isExternal || false);
        setNewAliasInput('');
        setNewEntityColor(entity.color || '#fffacd');
    };

    // --- Dynamic Entity Name and Color Updates in Editor Content ---
    useEffect(() => {
        if (!contentEditableRef.current || !currentDocument) {
            return;
        }

        const editorElement = contentEditableRef.current;
        const currentSelection = saveSelection(); // Save selection before any potential DOM modification

        let contentChangedInDOM = false;

        editorElement.querySelectorAll('.entity-link[data-entity-id]').forEach(span => {
            const entityId = span.dataset.entityId;
            const entityTextType = span.dataset.entityTextType;
            const entityAliasId = span.dataset.entityAliasId;

            const correspondingEntity = entities.find(e => e.id === entityId);

            if (correspondingEntity) {
                let newText = span.innerText;
                let shouldUpdateSpan = false;

                if (entityTextType === 'primary') {
                    if (span.innerText !== correspondingEntity.primaryName) {
                        newText = correspondingEntity.primaryName;
                        shouldUpdateSpan = true;
                    }
                } else if (entityTextType === 'alias') {
                    const linkedAlias = correspondingEntity.aliases.find(a => a.id === entityAliasId);
                    if (linkedAlias) {
                        if (span.innerText !== linkedAlias.name) {
                            newText = linkedAlias.name;
                            shouldUpdateSpan = true;
                        }
                    } else {
                        newText = correspondingEntity.primaryName;
                        span.dataset.entityTextType = 'primary';
                        delete span.dataset.entityAliasId;
                        shouldUpdateSpan = true;
                    }
                }

                if (shouldUpdateSpan) {
                    span.innerText = newText;
                    contentChangedInDOM = true;
                }
            } else {
                // If entity no longer exists, remove the span and keep its text content
                const textNode = document.createTextNode(span.innerText);
                span.parentNode.replaceChild(textNode, span);
                contentChangedInDOM = true;
            }
        });

        editorElement.querySelectorAll('.assigned-text-block[data-assigned-entity-id]').forEach(span => {
            const entityId = span.dataset.assignedEntityId;
            const correspondingEntity = entities.find(e => e.id === entityId);
            if (correspondingEntity && span.dataset.assignedEntityColor !== correspondingEntity.color) {
                span.dataset.assignedEntityColor = correspondingEntity.color;
                if (showHighlights) {
                    span.style.backgroundColor = correspondingEntity.color;
                }
                contentChangedInDOM = true;
            } else if (!correspondingEntity && span.style.backgroundColor) {
                span.style.backgroundColor = ''; // Remove highlight if entity is gone
                delete span.dataset.assignedEntityColor;
                contentChangedInDOM = true;
            }
        });


        if (contentChangedInDOM) {
            handleContentInput(); // Sync the DOM changes to React state and backend
            // Restore selection after programmatic DOM update
            if (currentSelection) {
                restoreSelection(currentSelection);
            }
        }

    }, [entities, currentDocument, handleContentInput, showHighlights]); // Dependencies for this effect are correct

    // --- Insert Entity into Editor ---
    const handleInsertEntity = (entityToInsert, textToDisplay, type, aliasId = null) => {
        if (!contentEditableRef.current || !currentDocument) {
            console.warn("Editor not ready or no document selected.");
            return;
        }

        const selection = window.getSelection();
        let range = savedSelectionRange.current; // Use saved selection if available

        if (!range || !contentEditableRef.current.contains(range.commonAncestorContainer)) {
            // Fallback to current selection if saved one is invalid or doesn't exist
            if (selection.rangeCount > 0) {
                range = selection.getRangeAt(0);
            } else {
                // If no selection, put cursor at end of editor
                range = document.createRange();
                range.selectNodeContents(contentEditableRef.current);
                range.collapse(false);
            }
        }

        const entitySpan = document.createElement('span');
        entitySpan.className = 'entity-link';
        entitySpan.dataset.entityId = entityToInsert.id;
        entitySpan.dataset.entityLink = entityToInsert.link || '';
        entitySpan.dataset.isExternal = entityToInsert.isExternal || false;
        entitySpan.dataset.entityTextType = type;
        entitySpan.dataset.entityOriginalText = textToDisplay;
        if (type === 'alias' && aliasId) {
            entitySpan.setAttribute('data-entity-alias-id', aliasId);
        }
        entitySpan.innerText = textToDisplay;

        range.deleteContents(); // Delete selected content (if any)
        range.insertNode(entitySpan); // Insert the new entity span

        // Position cursor right after the inserted entity
        range.setStartAfter(entitySpan);
        range.collapse(true);
        const nbspNode = document.createTextNode('\u00A0'); // Add a non-breaking space
        range.insertNode(nbspNode);

        range.setStartAfter(nbspNode);
        range.setEndAfter(nbspNode);
        selection.removeAllRanges();
        selection.addRange(range);

        handleContentInput(); // Sync updated DOM with React state and backend
        savedSelectionRange.current = saveSelection(); // Save new cursor position
        setOpenDropdownEntityId(null);
    };

    // --- Assign Selected Text to Entity ---
    const handleAssignSelectedText = async () => {
        const selection = window.getSelection();
        if (!selection.rangeCount || selection.isCollapsed) {
            console.error("Please select some text in the editor to assign.");
            return;
        }
        if (!currentDocument) {
            console.error("Please select or create a document first.");
            return;
        }

        savedSelectionRange.current = saveSelection(); // Save selection before opening modal
        setIsEntitySelectionModalOpen(true);
    };

    const handleSelectEntityForAssignment = async (entityId) => {
        const selectedEntity = entities.find(e => e.id === entityId);
        if (!selectedEntity || !currentDocument) {
            console.error("Selected entity or current document not found for assignment.");
            setIsEntitySelectionModalOpen(false);
            return;
        }

        const selection = window.getSelection();
        // Restore selection if it was saved before modal opened
        if (savedSelectionRange.current) {
            restoreSelection(savedSelectionRange.current);
            selection.removeAllRanges(); // Clear existing selection to ensure only saved one is used
            selection.addRange(savedSelectionRange.current);
            savedSelectionRange.current = null; // Clear after restoring
        } else if (!selection.rangeCount) {
            // Fallback if no selection is present after restoration attempt
            setIsEntitySelectionModalOpen(false);
            return;
        }

        const range = selection.getRangeAt(0);
        if (!contentEditableRef.current.contains(range.commonAncestorContainer)) {
            console.error("Selected text is not within the editable document content.");
            setIsEntitySelectionModalOpen(false);
            return;
        }

        const blockId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);

        const fragment = range.cloneContents();
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(fragment);
        const assignedHtml = tempDiv.innerHTML;
        const plainText = tempDiv.innerText;

        const assignedSpan = document.createElement('span');
        assignedSpan.dataset.assignedBlockId = blockId;
        assignedSpan.dataset.assignedEntityId = entityId;
        assignedSpan.dataset.assignedEntityColor = selectedEntity.color;
        assignedSpan.className = 'assigned-text-block';
        if (showHighlights) {
            assignedSpan.classList.add('highlight');
        }
        assignedSpan.appendChild(range.extractContents());
        range.insertNode(assignedSpan);

        const newBlockData = {
            id: blockId,
            entityId: entityId,
            documentId: currentDocument.id,
            plainText: plainText,
            htmlContent: assignedHtml
        };

        try {
            const createdBlock = await apiFetch('/assignedTextBlocks', {
                method: 'POST',
                body: JSON.stringify(newBlockData),
            });
            setAssignedTextBlocks(prev => [...prev, createdBlock]);
            handleContentInput(); // Sync state with DOM and backend
            savedSelectionRange.current = saveSelection(); // Save new cursor position after DOM change
            setIsEntitySelectionModalOpen(false);
        } catch (error) {
            console.error('Error assigning text block:', error);
            // Optionally revert DOM change if backend save failed
        }
    };

    const handleCancelEntitySelection = () => {
        setIsEntitySelectionModalOpen(false);
        savedSelectionRange.current = null; // Clear saved selection if cancelled
    };

    // --- Remove Text Block Assignments ---
    const handleRemoveAssignmentClick = () => {
        if (!currentDocument || !contentEditableRef.current) {
            console.error("Please select a document.");
            return;
        }

        const selection = window.getSelection();
        let targetNode = null;
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            targetNode = range.commonAncestorContainer;
            if (range.collapsed && targetNode.nodeType === Node.TEXT_NODE) {
                targetNode = targetNode.parentNode;
            }
        }

        if (!targetNode || !contentEditableRef.current.contains(targetNode)) {
            console.error("Please place your cursor or select text within an assigned block.");
            return;
        }

        const blocksAtCursor = [];
        const allAssignedSpans = contentEditableRef.current.querySelectorAll('.assigned-text-block');

        allAssignedSpans.forEach(span => {
            if (span.contains(targetNode) || targetNode.contains(span) || (selection.rangeCount > 0 && selection.getRangeAt(0).intersectsNode(span))) {
                const blockId = span.dataset.assignedBlockId;
                const entityId = span.dataset.assignedEntityId;
                const assignedBlockData = assignedTextBlocks.find(b => b.id === blockId && b.entityId === entityId && b.documentId === currentDocument.id);

                if (assignedBlockData) {
                    const entity = entities.find(e => e.id === entityId);
                    blocksAtCursor.push({
                        id: blockId,
                        plainText: assignedBlockData.plainText,
                        entityName: entity ? entity.primaryName : 'Unknown Entity'
                    });
                }
            }
        });

        if (blocksAtCursor.length === 0) {
            console.error("No assigned text blocks found at the current cursor position or within the selection.");
            return;
        }
        savedSelectionRange.current = saveSelection(); // Save selection before opening modal
        setBlocksAtCursor(blocksAtCursor);
        setIsRemoveAssignmentModalOpen(true);
    };

    const handleRemoveAssignedBlock = async (blockIdToRemove) => {
        const editorElement = contentEditableRef.current;
        const assignedSpan = editorElement.querySelector(`span[data-assigned-block-id="${blockIdToRemove}"]`);

        // Optimistic UI update
        if (assignedSpan) {
            if (savedSelectionRange.current) {
                restoreSelection(savedSelectionRange.current);
                savedSelectionRange.current = null;
            }
            const children = Array.from(assignedSpan.childNodes);
            children.forEach(child => {
                assignedSpan.parentNode.insertBefore(child, assignedSpan);
            });
            assignedSpan.parentNode.removeChild(assignedSpan);
            editorElement.normalize();
        }

        setAssignedTextBlocks(prev => prev.filter(block => block.id !== blockIdToRemove));
        handleContentInput(); // Sync state with DOM and backend

        try {
            await apiFetch(`/assignedTextBlocks/${blockIdToRemove}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Error removing assigned text block from backend:', error);
            // Implement a more robust rollback if needed
        }

        if (blocksAtCursor.length <= 1) {
            setIsRemoveAssignmentModalOpen(false);
        } else {
            setBlocksAtCursor(prev => prev.filter(block => block.id !== blockIdToRemove));
        }
    };

    const handleCancelRemoveAssignment = () => {
        setIsRemoveAssignmentModalOpen(false);
        setBlocksAtCursor([]);
        savedSelectionRange.current = null; // Clear saved selection if cancelled
    };


    // --- Toggle Highlights Visibility ---
    useEffect(() => {
        if (!contentEditableRef.current) return;

        const editorElement = contentEditableRef.current;
        editorElement.querySelectorAll('.assigned-text-block').forEach(span => {
            const entityId = span.dataset.assignedEntityId;
            const correspondingEntity = entities.find(e => e.id === entityId);

            if (showHighlights) {
                span.classList.add('highlight');
                if (correspondingEntity) {
                    // Set custom property for CSS to pick up
                    span.style.setProperty('--entity-highlight-color', correspondingEntity.color || '#fffacd');
                }
            } else {
                span.classList.remove('highlight');
                span.style.removeProperty('--entity-highlight-color');
            }
        });
    }, [showHighlights, documents, currentDocumentId, assignedTextBlocks, entities]);

    const toggleHighlights = () => {
        setShowHighlights(prev => !prev);
    };


    // --- Content Rendering for Read-Only Preview ---
    const parsePreviewContent = useCallback((htmlContent) => {
        if (!htmlContent) return null;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        tempDiv.querySelectorAll('.entity-link[data-entity-id]').forEach(span => {
            const entityId = span.dataset.entityId;
            const entityTextType = span.dataset.entityTextType;
            const entityAliasId = span.dataset.entityAliasId;
            const entity = entities.find(e => e.id === entityId);

            if (entity) {
                span.dataset.entityLink = entity.link || '';
                span.dataset.isExternal = entity.isExternal || false;

                if (entityTextType === 'primary') {
                    span.innerText = entity.primaryName;
                } else if (entityTextType === 'alias' && entityAliasId) {
                    const linkedAlias = entity.aliases.find(a => a.id === entityAliasId);
                    if (linkedAlias) {
                        span.innerText = linkedAlias.name;
                    } else {
                        span.innerText = entity.primaryName;
                    }
                }
            } else {
                const textNode = document.createTextNode(span.innerText);
                span.parentNode.replaceChild(textNode, span);
            }
        });

        tempDiv.querySelectorAll('.assigned-text-block').forEach(span => {
            const entityId = span.dataset.assignedEntityId;
            const correspondingEntity = entities.find(e => e.id === entityId);

            if (showHighlights && correspondingEntity) {
                span.classList.add('highlight');
                span.style.setProperty('--entity-highlight-color', correspondingEntity.color || '#fffacd');
            } else {
                span.classList.remove('highlight');
                span.style.removeProperty('--entity-highlight-color');
            }
        });

        let finalHtml = tempDiv.innerHTML;
        finalHtml = finalHtml.replace(/\[\[(.*?)\]\]/g, (match, docTitle) => {
            const linkedDoc = documents.find(doc => doc.title.toLowerCase() === docTitle.toLowerCase());
            if (linkedDoc) {
                if (match.includes('<span class="entity-link"') || match.includes('<span class="assigned-text-block"')) {
                    // Avoid creating nested cross-links if already part of an entity or assigned block
                    return match;
                }
                return `<span class="cross-link" data-doc-id="${linkedDoc.id}">${docTitle}</span>`;
            }
            return match;
        });

        // Basic Markdown-like parsing for preview (ensure this doesn't conflict with editor's contenteditable HTML)
        finalHtml = finalHtml.replace(/^#\s(.+)/gm, '<h1>$1</h1>');
        finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        finalHtml = finalHtml.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Convert <br> to newlines for list item detection (simple approach, might need refinement)
        finalHtml = finalHtml.replace(/<br\s*\/?>/g, '\n');
        // Simple list conversion for preview (basic, might need more robust markdown parser for complex cases)
        finalHtml = finalHtml.replace(/(\n|^)\*\s(.+)/g, '$1<li>$2</li>'); // Bullet points
        finalHtml = finalHtml.replace(/(\n|^)\d+\.\s(.+)/g, '$1<li>$2</li>'); // Numbered lists

        // Wrap list items in <ul> or <ol> if they're not already (very basic)
        if (finalHtml.includes('<li>') && !finalHtml.includes('<ul>') && !finalHtml.includes('<ol>')) {
            if (finalHtml.startsWith('<li>')) { // Assume unordered if starting with bullet format
                finalHtml = `<ul>${finalHtml}</ul>`;
            } else if (finalHtml.match(/^\d+\.\s/)) { // Assume ordered if starting with number format
                finalHtml = `<ol>${finalHtml}</ol>`;
            }
        }

        finalHtml = finalHtml.replace(/\n/g, '<br/>'); // Convert newlines back to <br> for HTML rendering

        return finalHtml;
    }, [entities, documents, showHighlights]);


    const [hoverPreview, setHoverPreview] = useState(null);

    const handleMouseEnter = (e) => {
        const target = e.target.closest('.entity-link');
        if (target) {
            const entityId = target.dataset.entityId;
            const entity = entities.find(e => e.id === entityId);
            if (entity) {
                const rect = target.getBoundingClientRect();
                setHoverPreview({
                    name: entity.primaryName,
                    description: entity.description,
                    x: rect.left + window.scrollX,
                    y: rect.bottom + window.scrollY,
                });
            }
        }
    };

    const handleMouseLeave = () => {
        setHoverPreview(null);
    };

    const handleClickContent = (e) => {
        const entityTarget = e.target.closest('.entity-link');
        if (entityTarget) {
            const entityId = entityTarget.dataset.entityId;
            const entity = entities.find(e => e.id === entityId);
            if (entity) {
                if (entity.isExternal && entity.link) {
                    console.log("Opening external link:", entity.link);
                    window.open(entity.link, '_blank');
                } else if (entity.link) {
                    console.log("Attempting to navigate to internal document via entity link. Target ID:", entity.link);
                    const targetDoc = documents.find(doc => doc.id === entity.link);
                    if (targetDoc) {
                        setCurrentDocumentId(entity.link);
                    } else {
                        console.warn("Entity link target document not found:", entity.link);
                    }
                }
            }
            return;
        }

        const crossLinkTarget = e.target.closest('.cross-link');
        if (crossLinkTarget) {
            const docId = crossLinkTarget.dataset.docId;
            if (docId) {
                console.log("Attempting to navigate to internal document via crosslink. Target ID:", docId);
                const targetDoc = documents.find(doc => doc.id === docId);
                if (targetDoc) {
                    blockToScrollToRef.current = docId; // Changed to docId for document scrolling
                    setCurrentDocumentId(docId);
                } else {
                    console.warn("Crosslink target document not found:", docId);
                }
            }
            return;
        }

        const backlinkDocTitleTarget = e.target.closest('.backlink-doc-title');
        if (backlinkDocTitleTarget) {
            const docId = backlinkDocTitleTarget.dataset.docId;
            const blockId = backlinkDocTitleTarget.dataset.blockId;

            if (docId) {
                console.log("Attempting to navigate to backlinked block. Doc ID:", docId, "Block ID:", blockId);
                const targetDoc = documents.find(doc => doc.id === docId);
                if (targetDoc) {
                    blockToScrollToRef.current = blockId;
                    setCurrentDocumentId(docId);
                } else {
                    console.warn("Backlinked document not found:", docId);
                }
            }
        }
    };

    // --- Export Functionality ---
    const handleExportTxt = () => {
        if (currentDocument) {
            const filename = `${currentDocument.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
            const element = document.createElement('a');
            const plainTextContent = currentDocument.content.replace(/<[^>]*>/g, '');
            const file = new Blob([plainTextContent], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = filename;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } else {
            console.error("Please select a document to export.");
        }
    };

    const handleExportAllData = async () => {
        try {
            const dataToExport = await apiFetch('/data'); // Fetch all current data from backend
            const filename = `book_editor_backup_${Date.now()}.json`;
            const element = document.createElement('a');
            const file = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            element.href = URL.createObjectURL(file);
            element.download = filename;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            URL.revokeObjectURL(element.href);
        } catch (error) {
            console.error('Error exporting all data:', error);
        }
    };

    // --- Import All Data (Documents & Entities) ---
    const handleImportAllData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.documents && Array.isArray(importedData.documents) &&
                    importedData.entities && Array.isArray(importedData.entities) &&
                    importedData.assignedTextBlocks && Array.isArray(importedData.assignedTextBlocks) &&
                    importedData.folders && Array.isArray(importedData.folders)) {

                    importedDataRef.current = importedData;

                    // Since backend /api/import endpoint overwrites,
                    // we just show a confirmation modal.
                    // Collect IDs for display in the confirmation modal
                    const existingDocumentIds = new Set(documents.map(doc => doc.id));
                    const existingEntityIds = new Set(entities.map(entity => entity.id));
                    const existingTextBlockIds = new Set(assignedTextBlocks.map(block => block.id));
                    const existingFolderIds = new Set(folders.map(folder => folder.id));

                    const conflictingDocuments = importedData.documents.filter(doc => existingDocumentIds.has(doc.id));
                    const conflictingEntities = importedData.entities.filter(entity => existingEntityIds.has(entity.id));
                    const conflictingTextBlocks = importedData.assignedTextBlocks.filter(block => existingTextBlockIds.has(block.id));
                    const conflictingFolders = importedData.folders.filter(folder => existingFolderIds.has(folder.id));

                    setConflictData({
                        documents: conflictingDocuments,
                        entities: conflictingEntities,
                        textBlocks: conflictingTextBlocks,
                        folders: conflictingFolders
                    });
                    setIsConflictModalOpen(true); // Open confirmation modal


                } else {
                    console.error('Invalid JSON structure: Expected "documents", "entities", "assignedTextBlocks", and "folders" arrays.');
                }
            } catch (error) {
                console.error('Failed to import data. Please ensure it is a valid JSON file.', error);
            }
            event.target.value = ''; // Clear the file input
        };
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
        };
        reader.readAsText(file);
    };

    // Simplified applyImportResolution to send data to the new /api/import endpoint
    const applyImportResolution = async (confirmOverwrite) => {
        if (!confirmOverwrite || !importedDataRef.current) {
            setIsConflictModalOpen(false);
            importedDataRef.current = null;
            console.log('Import cancelled by user or not confirmed.');
            return;
        }

        try {
            // Send the entire imported data object to the new bulk import endpoint
            await apiFetch('/import', {
                method: 'POST',
                body: JSON.stringify(importedDataRef.current),
            });
            console.log('Bulk data import successful!');

            // Re-fetch all data to ensure UI is in sync with backend after mass updates
            const refreshedData = await apiFetch('/data');
            setDocuments(refreshedData.documents || []);
            setFolders(refreshedData.folders || []);
            setEntities(refreshedData.entities || []);
            setAssignedTextBlocks(refreshedData.assignedTextBlocks || []);

            if (refreshedData.documents.length > 0) {
                const currentDocStillExists = refreshedData.documents.some(doc => doc.id === currentDocumentId);
                if (!currentDocStillExists) {
                    setCurrentDocumentId(refreshedData.documents[0].id);
                }
            } else {
                setCurrentDocumentId(null);
            }

        } catch (error) {
            console.error('Error during bulk data import application:', error);
            // Optionally, notify the user about the failure
        } finally {
            setIsConflictModalOpen(false);
            importedDataRef.current = null;
        }
    };


    const handleConflictModalCancel = () => {
        setIsConflictModalOpen(false);
        importedDataRef.current = null;
        console.log('Import cancelled by user.');
    };

    const filteredEntities = entities.filter(entity => {
        const query = entitySearchQuery.toLowerCase();
        if (entity.primaryName.toLowerCase().includes(query)) {
            return true;
        }
        if (entity.aliases && entity.aliases.some(alias => alias.name.toLowerCase().includes(query))) {
            return true;
        }
        return false;
    });

    const getFilteredAndOrganizedDocuments = useCallback(() => {
        const lowerCaseQuery = documentSearchQuery.toLowerCase();
        const rootItems = [];

        const relevantDocuments = documents.filter(doc => doc.title.toLowerCase().includes(lowerCaseQuery));

        const relevantFolders = new Set();
        folders.forEach(folder => {
            if (folder.name.toLowerCase().includes(lowerCaseQuery)) {
                relevantFolders.add(folder.id);
            }
        });

        const addParents = (id, isFolder = true) => {
            let currentId = id;
            let currentItem = isFolder ? folders.find(f => f.id === currentId) : documents.find(d => d.id === currentId);

            while (currentItem && currentItem.parentId) {
                if (relevantFolders.has(currentItem.parentId)) break;
                relevantFolders.add(currentItem.parentId);
                currentItem = folders.find(f => f.id === currentItem.parentId);
            }
        };

        relevantDocuments.forEach(doc => addParents(doc.folderId, false));
        relevantFolders.forEach(folderId => addParents(folderId, true));


        const buildTree = (parentId = null) => {
            const items = [];

            folders
                .filter(f => f.parentId === parentId)
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach(folder => {
                    if (documentSearchQuery && !relevantFolders.has(folder.id) && !folder.name.toLowerCase().includes(lowerCaseQuery)) {
                        return;
                    }
                    items.push({
                        type: 'folder',
                        data: folder,
                        children: buildTree(folder.id)
                    });
                });

            documents
                .filter(doc => doc.folderId === parentId)
                .sort((a, b) => a.title.localeCompare(b.title))
                .forEach(doc => {
                    if (documentSearchQuery && !doc.title.toLowerCase().includes(lowerCaseQuery) && !relevantFolders.has(doc.folderId)) {
                        return;
                    }
                    items.push({ type: 'document', data: doc });
                });
            return items;
        };

        if (documentSearchQuery && relevantDocuments.length === 0 && relevantFolders.size === 0) {
            return [];
        }

        return buildTree(null);
    }, [documents, folders, documentSearchQuery]);


    // --- Insert Backlinks for an Entity ---
    const handleInsertBacklinks = async (entityId) => {
        if (!contentEditableRef.current || !currentDocument) {
            console.error("Please select a document to insert backlinks into.");
            return;
        }

        const relatedBlocks = assignedTextBlocks.filter(block => block.entityId === entityId);
        const entity = entities.find(e => e.id === entityId);

        if (!entity || relatedBlocks.length === 0) {
            console.error(`No text blocks assigned to "${entity ? entity.primaryName : 'this entity'}".`);
            return;
        }

        // Generate HTML for the backlinks section
        const generateBacklinksHtml = (blocks, entityName) => {
            let html = `
                <div contenteditable="false" data-backlink-entity-id="${entityId}" class="backlinks-container" style="border: 1px solid #ccc; padding: 10px; margin-top: 20px; background-color: #f0f0f0; border-radius: 8px;">
                    <h4 style="font-weight: bold; margin-bottom: 10px; color: #333;">Backlinks for "${entityName}"</h4>
                    <ul style="list-style-type: disc; margin-left: 20px;">
            `;

            blocks.forEach(block => {
                const sourceDoc = documents.find(doc => doc.id === block.documentId);
                const docTitle = sourceDoc ? sourceDoc.title : 'Unknown Document';
                html += `
                    <li style="margin-bottom: 5px;">
                        <strong class="backlink-doc-title cursor-pointer text-blue-700 hover:underline" data-doc-id="${block.documentId}" data-block-id="${block.id}">From: ${docTitle}</strong> <br/>
                        <blockquote style="margin: 5px 0 5px 15px; padding: 5px 10px; border-left: 3px solid #ccc; background-color: #e9e9e9; border-radius: 4px;">
                            ${block.htmlContent}
                        </blockquote>
                    </li>
                `;
            });

            html += `
                    </ul>
                </div>
                <p><br/></p>
            `;
            return html;
        };

        const backlinksHtml = generateBacklinksHtml(relatedBlocks, entity.primaryName);

        const selection = window.getSelection();
        let range = savedSelectionRange.current; // Use saved selection if available

        if (!range || !contentEditableRef.current.contains(range.commonAncestorContainer)) {
            // Fallback to current selection if saved one is invalid or doesn't exist
            if (selection.rangeCount > 0) {
                range = selection.getRangeAt(0);
            } else {
                // If no selection, put cursor at end of editor
                range = document.createRange();
                range.selectNodeContents(contentEditableRef.current);
                range.collapse(false);
            }
        }

        savedSelectionRange.current = saveSelection(); // Save selection before modifying DOM

        range.deleteContents(); // Delete selected content (if any)
        range.insertNode(range.createContextualFragment(backlinksHtml)); // Insert new content

        // Restore cursor to where it was before the insertion
        if (savedSelectionRange.current) {
            restoreSelection(savedSelectionRange.current);
            savedSelectionRange.current = null;
        } else {
            // Fallback: put cursor at end of inserted content
            range.setStartAfter(contentEditableRef.current.lastChild);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        await handleContentInput(); // Sync updated DOM with React state and backend
        setOpenDropdownEntityId(null);
    };

    // --- Function to refresh all backlink blocks in the current document ---
    const handleRefreshAllBacklinks = async () => {
        if (!contentEditableRef.current || !currentDocument) {
            console.error("No document selected to refresh backlinks.");
            return;
        }

        const editorElement = contentEditableRef.current;
        const currentSelection = saveSelection(); // Save current selection

        let contentChanged = false;

        editorElement.querySelectorAll('.backlinks-container[data-backlink-entity-id]').forEach(backlinkContainer => {
            const entityId = backlinkContainer.dataset.backlinkEntityId;
            const entity = entities.find(e => e.id === entityId);

            if (entity) {
                const relatedBlocks = assignedTextBlocks.filter(block => block.entityId === entityId);

                let newBacklinksContent = `
                    <h4 style="font-weight: bold; margin-bottom: 10px; color: #333;">Backlinks for "${entity.primaryName}"</h4>
                    <ul style="list-style-type: disc; margin-left: 20px;">
                `;

                if (relatedBlocks.length === 0) {
                    newBacklinksContent += `<li style="margin-bottom: 5px; color: #666;">No assigned text blocks found for this entity.</li>`;
                } else {
                    relatedBacklinks.forEach(block => {
                        const sourceDoc = documents.find(doc => doc.id === block.documentId);
                        const docTitle = sourceDoc ? sourceDoc.title : 'Unknown Document';
                        newBacklinksContent += `
                            <li style="margin-bottom: 5px;">
                                <strong class="backlink-doc-title cursor-pointer text-blue-700 hover:underline" data-doc-id="${block.documentId}" data-block-id="${block.id}">From: ${docTitle}</strong> <br/>
                                <blockquote style="margin: 5px 0 5px 15px; padding: 5px 10px; border-left: 3px solid #ccc; background-color: #e9e9e9; border-radius: 4px;">
                                    ${block.htmlContent}
                                </blockquote>
                            </li>
                        `;
                    });
                }
                newBacklinksContent += `</ul>`;

                // Update the innerHTML of the existing container if content has changed
                if (backlinkContainer.innerHTML !== newBacklinksContent) {
                    backlinkContainer.innerHTML = newBacklinksContent;
                    contentChanged = true;
                }

            } else {
                // Handle cases where entity is deleted: remove or mark backlink container
                if (backlinkContainer.parentNode) {
                    backlinkContainer.parentNode.removeChild(backlinkContainer);
                    contentChanged = true;
                }
            }
        });

        if (contentChanged) {
            await handleContentInput(); // Sync updated DOM with React state and backend
            if (currentSelection) { // Restore original cursor position
                restoreSelection(currentSelection);
            }
            console.log("Backlinks refreshed!");
        } else {
            console.log("No backlinks found or no changes needed.");
        }
    };


    // Drag and Drop handlers for the root document list
    const handleRootDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isRootDragOver) setIsRootDragOver(true);
    };

    const handleRootDragLeave = () => {
        setIsRootDragOver(false);
    };

    const handleRootDrop = (e) => {
        e.preventDefault();
        setIsRootDragOver(false);
        const draggedDocId = e.dataTransfer.getData('text/plain');
        if (draggedDocId) {
            handleMoveDocument(draggedDocId, null); // Move to root (folderId: null)
        }
    };


    return (
        <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
            {/* Sidebar for Documents */}
            <div className={`transition-all duration-300 ease-in-out ${showDocumentsSidebar ? 'w-1/4 min-w-[280px]' : 'w-12'}`}>
                <div className="bg-gray-800 text-white p-4 flex flex-col h-full rounded-l-lg shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        {showDocumentsSidebar && (
                            <h2 className="text-2xl font-bold text-indigo-300">Documents</h2>
                        )}
                        <button
                            onClick={() => setShowDocumentsSidebar(!showDocumentsSidebar)}
                            className="p-1 rounded-full hover:bg-gray-700 transition duration-200"
                            title={showDocumentsSidebar ? "Collapse Documents" : "Expand Documents"}
                        >
                            {showDocumentsSidebar ? <ChevronRight className="h-6 w-6 text-indigo-300 transform rotate-180" /> : <ChevronRight className="h-6 w-6 text-indigo-300" />}
                        </button>
                    </div>

                    {showDocumentsSidebar && (
                        <>
                            {/* Export/Import Buttons - Moved Here */}
                            <div className="mb-4 space-y-2">
                                <button
                                    onClick={handleExportTxt}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                >
                                    Export Current Doc (.txt)
                                </button>
                                <button
                                    onClick={handleExportAllData}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                    title="Export all documents and entities as a JSON file"
                                >
                                    Export All Data (.json)
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImportAllData}
                                    accept=".json"
                                    style={{ display: 'none' }}
                                />
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                    title="Import documents and entities from a JSON file (will overwrite existing data)"
                                >
                                    Import All Data (.json)
                                </button>
                            </div>

                            {/* Document Search Field */}
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search documents..."
                                        className="w-full p-2 pl-10 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={documentSearchQuery}
                                        onChange={(e) => setDocumentSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="mb-4 flex space-x-2">
                                <button
                                    onClick={handleOpenCreateDocumentModal}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                >
                                    <Plus className="inline-block h-5 w-5 mr-1" /> Doc
                                </button>
                                <button
                                    onClick={handleOpenCreateFolderModal}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                >
                                    <Folder className="inline-block h-5 w-5 mr-1" /> Folder
                                </button>
                            </div>
                            <div
                                className={`flex-grow overflow-y-auto pr-2 pb-4 ${isRootDragOver ? 'border-2 border-blue-400 rounded-md' : ''}`}
                                onDragOver={handleRootDragOver}
                                onDragEnter={handleRootDragOver}
                                onDragLeave={handleRootDragLeave}
                                onDrop={handleRootDrop}
                            >
                                {getFilteredAndOrganizedDocuments().length === 0 && documentSearchQuery ? (
                                    <p className="text-gray-400 p-2">No matching documents or folders.</p>
                                ) : getFilteredAndOrganizedDocuments().length === 0 && !documentSearchQuery ? (
                                    <p className="text-gray-400 p-2">No documents or folders yet. Create one!</p>
                                ) : (
                                    getFilteredAndOrganizedDocuments().map(item => (
                                        item.type === 'folder' ? (
                                            <FolderItem
                                                key={item.data.id}
                                                folder={item.data}
                                                documents={documents}
                                                folders={folders}
                                                onDocumentSelect={handleDocumentSelect}
                                                currentDocumentId={currentDocumentId}
                                                documentSearchQuery={documentSearchQuery}
                                                onEditDocument={startEditDocument}
                                                onDeleteDocument={handleDeleteDocument}
                                                onEditFolder={handleEditFolder}
                                                onDeleteFolder={handleDeleteFolder}
                                                onMoveDocument={handleMoveDocument}
                                                editingDocument={editingDocument}
                                                saveEditedDocument={saveEditedDocument}
                                                cancelEditDocument={cancelEditDocument}
                                            />
                                        ) : (
                                            <div
                                                key={item.data.id}
                                                draggable="true"
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('text/plain', item.data.id);
                                                    e.dataTransfer.effectAllowed = 'move';
                                                }}
                                                className={`flex items-center justify-between p-3 mb-2 rounded-md cursor-pointer transition duration-200
                                                    ${item.data.id === currentDocumentId ? 'bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                                            >
                                                {/* Corrected: Wrap the conditional content and buttons in a React.Fragment */}
                                                <>
                                                    {editingDocument && editingDocument.id === item.data.id ? (
                                                        <input
                                                            type="text"
                                                            value={editingDocument.title}
                                                            onChange={(e) => setEditingDocument({ ...editingDocument, title: e.target.value })}
                                                            onBlur={() => saveEditedDocument(item.data.id, editingDocument.title)}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    saveEditedDocument(item.data.id, editingDocument.title);
                                                                    e.target.blur(); // Remove focus
                                                                }
                                                            }}
                                                            className="flex-grow p-1 rounded-md bg-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span onClick={() => handleDocumentSelect(item.data.id)} className="flex-grow text-lg flex items-center">
                                                            <FileText className="h-5 w-5 mr-2" /> {item.data.title}
                                                        </span>
                                                    )}
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); startEditDocument(item.data); }}
                                                            className="text-yellow-400 hover:text-yellow-300"
                                                            title="Edit Document"
                                                        >
                                                            <Pencil className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteDocument(item.data.id); }}
                                                            className="text-red-400 hover:text-red-300"
                                                            title="Delete Document"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </>
                                            </div>
                                        )
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 p-8 flex flex-col bg-white rounded-r-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out
                ${showDocumentsSidebar && showEntitiesSidebar ? 'w-2/4' : showDocumentsSidebar || showEntitiesSidebar ? 'w-3/4' : 'w-full'}`}
            >
                {currentDocument ? (
                    <>
                        <h1 className="text-4xl font-extrabold mb-6 text-gray-900">{currentDocument.title}</h1>

                        <div className="mb-4 flex space-x-2 flex-wrap items-center">
                            {/* Rich Text Formatting Actions */}
                            <div className="flex space-x-2 mb-2 sm:mb-0">
                                <button
                                    onClick={toggleBold}
                                    className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700"
                                    title="Bold (Ctrl+B)"
                                >
                                    <Bold className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={toggleItalic}
                                    className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700"
                                    title="Italic (Ctrl+I)"
                                >
                                    <Italic className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={handleInsertLink}
                                    className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700"
                                    title="Insert Link (Ctrl+L)"
                                >
                                    <Link className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={handleUnlink}
                                    className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700"
                                    title="Remove Link (Ctrl+Shift+L)"
                                >
                                    <MinusCircle className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={handleInsertImage}
                                    className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700"
                                    title="Insert Image (Ctrl+G)"
                                >
                                    <Image className="h-5 w-5" />
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
                                        className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700 flex items-center"
                                        title="Heading/Paragraph"
                                    >
                                        <Heading className="h-5 w-5" />
                                        <ChevronRight className="h-4 w-4 ml-1 transform rotate-90" />
                                    </button>
                                    {showHeadingDropdown && (
                                        <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                            <button onClick={setParagraph} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block flex items-center">
                                                <Text className="h-4 w-4 mr-2" /> Paragraph
                                            </button>
                                            <button onClick={() => setHeading('h1')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block flex items-center">
                                                <Heading className="h-4 w-4 mr-2" /> Heading 1
                                            </button>
                                            <button onClick={() => setHeading('h2')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block flex items-center">
                                                <Heading className="h-4 w-4 mr-2" /> Heading 2
                                            </button>
                                            <button onClick={() => setHeading('h3')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block flex items-center">
                                                <Heading className="h-4 w-4 mr-2" /> Heading 3
                                            </button>
                                            <button onClick={() => setHeading('h4')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block flex items-center">
                                                <Heading className="h-4 w-4 mr-2" /> Heading 4
                                            </button>
                                            <button onClick={() => setHeading('h5')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block flex items-center">
                                                <Heading className="h-4 w-4 mr-2" /> Heading 5
                                            </button>
                                            <button onClick={() => setHeading('h6')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block flex items-center">
                                                <Heading className="h-4 w-4 mr-2" /> Heading 6
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={toggleUnorderedList}
                                    className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700"
                                    title="Bullet List (Ctrl+Shift+7)"
                                >
                                    <List className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={toggleOrderedList}
                                    className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700"
                                    title="Numbered List (Ctrl+Shift+8)"
                                >
                                    <ListOrdered className="h-5 w-5" />
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFontDropdown(!showFontDropdown)}
                                        className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700 flex items-center"
                                        title="Font"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-3.293-3.293a1 1 0 010-1.414z" />
                                        </svg>
                                        <span className="font-semibold">Aa</span>
                                        <ChevronRight className="h-4 w-4 ml-1 transform rotate-90" />
                                    </button>
                                    {showFontDropdown && (
                                        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                            <button onClick={() => changeFont('Arial')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block font-arial">Arial</button>
                                            <button onClick={() => changeFont('Verdana')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block font-verdana">Verdana</button>
                                            <button onClick={() => changeFont('Georgia')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block font-georgia">Georgia</button>
                                            <button onClick={() => changeFont('Times New Roman')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block font-times">Times New Roman</button>
                                            <button onClick={() => changeFont('Courier New')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block font-courier">Courier New</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Other Action Buttons */}
                            <button
                                onClick={handleAssignSelectedText}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                title="Assign selected text block to an entity"
                            >
                                Assign Selected Text
                            </button>
                            <button
                                onClick={handleRemoveAssignmentClick}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                title="Remove assigned text block(s) at current cursor position"
                            >
                                Remove Assignment
                            </button>
                            <button
                                onClick={toggleHighlights}
                                className={`font-semibold py-2 px-4 rounded-md shadow-md transition duration-200 ${
                                    showHighlights ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                                }`}
                                title={showHighlights ? "Hide assigned text highlights" : "Show assigned text highlights"}
                            >
                                {showHighlights ? <EyeOff className="inline-block h-5 w-5 mr-1" /> : <Eye className="inline-block h-5 w-5 mr-1" />}
                                {showHighlights ? 'Hide Highlights' : 'Show Highlights'}
                            </button>
                            <button
                                onClick={handleRefreshAllBacklinks}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                title="Refresh content of all backlink blocks in this document"
                            >
                                <CornerDownRight className="inline-block h-5 w-5 mr-1" /> Refresh Backlinks
                            </button>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={`font-semibold py-2 px-4 rounded-md shadow-md transition duration-200 ${
                                    showPreview ? 'bg-zinc-500 hover:bg-zinc-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                                }`}
                                title={showPreview ? "Hide preview window" : "Show preview window"}
                            >
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </button>
                            <button
                                onClick={() => setShowShortcutsModal(true)}
                                className="p-2 rounded-full bg-gray-400 hover:bg-gray-500 transition duration-200 text-gray-800 ml-2"
                                title="View Keyboard Shortcuts"
                            >
                                <HelpCircle className="h-5 w-5" />
                            </button>
                        </div>

                        <div
                            key={currentDocumentId}
                            ref={contentEditableRef}
                            contentEditable="true"
                            className="editor-content flex-grow p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg leading-relaxed resize-y overflow-auto"
                            onInput={handleContentInput}
                        />

                        {showPreview && (
                            <div
                                className="mt-6 p-4 border border-gray-200 bg-gray-50 rounded-lg text-lg leading-relaxed overflow-auto"
                                dangerouslySetInnerHTML={{ __html: parsePreviewContent(currentDocument.content) }}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onClick={handleClickContent}
                            />
                        )}

                        {hoverPreview && (
                            <div
                                className="hover-preview"
                                style={{ top: hoverPreview.y + 10, left: hoverPreview.x }}
                            >
                                <h3 className="font-bold text-lg mb-1">{hoverPreview.name}</h3>
                                <p className="text-sm">{hoverPreview.description}</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-2xl">
                        <p>Select a document or create a new one to start writing!</p>
                    </div>
                )}
            </div>

            {/* Sidebar for Entities */}
            <div className={`transition-all duration-300 ease-in-out ${showEntitiesSidebar ? 'w-1/4 min-w-[280px]' : 'w-12'}`}>
                <div className="bg-gray-800 text-white p-4 flex flex-col h-full rounded-r-lg shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        {showEntitiesSidebar && (
                            <h2 className="text-2xl font-bold text-purple-300">Entities</h2>
                        )}
                        <button
                            onClick={() => setShowEntitiesSidebar(!showEntitiesSidebar)}
                            className="p-1 rounded-full hover:bg-gray-700 transition duration-200"
                            title={showEntitiesSidebar ? "Collapse Entities" : "Expand Entities"}
                        >
                            {showEntitiesSidebar ? <ChevronRight className="h-6 w-6 text-purple-300" /> : <ChevronRight className="h-6 w-6 text-purple-300 transform rotate-180" />}
                        </button>
                    </div>

                    {showEntitiesSidebar && (
                        <>
                            {/* Entity Search Field */}
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search entities..."
                                        className="w-full p-2 pl-10 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        value={entitySearchQuery}
                                        onChange={(e) => setEntitySearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="mb-4 space-y-2">
                                <input
                                    type="text"
                                    placeholder="Primary Name (e.g., John Doe)"
                                    className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={newEntityPrimaryName}
                                    onChange={(e) => setNewEntityPrimaryName(e.target.value)}
                                />
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Add new alias"
                                        className="flex-grow p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        value={newAliasInput}
                                        onChange={(e) => setNewAliasInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') handleAddNewAlias();
                                        }}
                                    />
                                    <button
                                        onClick={handleAddNewAlias}
                                        className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                    >
                                        <Plus className="inline-block h-5 w-5" /> Alias
                                    </button>
                                </div>
                                {newEntityAliases.length > 0 && (
                                    <div className="flex flex-col gap-2 mt-2">
                                        {newEntityAliases.map((alias) => (
                                            <div key={alias.id} className="flex items-center space-x-2 bg-gray-700 p-2 rounded-md">
                                                <input
                                                    type="text"
                                                    value={alias.name}
                                                    onChange={(e) => handleUpdateAlias(alias.id, e.target.value)}
                                                    onBlur={(e) => handleUpdateAlias(alias.id, e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') e.target.blur();
                                                    }}
                                                    className="flex-grow bg-gray-600 text-white rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400"
                                                />
                                                <button
                                                    onClick={() => handleRemoveAlias(alias.id)}
                                                    className="text-red-400 hover:text-red-300"
                                                    title="Remove Alias"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center space-x-2 mt-2">
                                    <label htmlFor="entityColor" className="text-gray-300">Highlight Color:</label>
                                    <input
                                        type="color"
                                        id="entityColor"
                                        className="p-1 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                                        value={newEntityColor}
                                        onChange={(e) => setNewEntityColor(e.target.value)}
                                    />
                                </div>
                                <textarea
                                    placeholder="Description"
                                    className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={newEntityDescription}
                                    onChange={(e) => setNewEntityDescription(e.target.value)}
                                    rows="3"
                                />
                                <div className="mb-2">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-5 w-5 text-purple-600 rounded"
                                            checked={isExternalLink}
                                            onChange={(e) => setIsExternalLink(e.target.checked)}
                                        />
                                        <span className="ml-2 text-gray-300">Link to External URL</span>
                                    </label>
                                </div>
                                {isExternalLink ? (
                                    <input
                                        type="text"
                                        placeholder="External URL (e.g., https://example.com)"
                                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        value={newEntityLink}
                                        onChange={(e) => setNewEntityLink(e.target.value)}
                                    />
                                ) : (
                                    <select
                                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        value={newEntityLink}
                                        onChange={(e) => setNewEntityLink(e.target.value)}
                                    >
                                        <option value="">Select a document to link</option>
                                        {documents.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.title}</option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    onClick={handleSaveEntity}
                                    className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                >
                                    {editingEntity ? 'Update Entity' : 'Create Entity'}
                                </button>
                                {editingEntity && (
                                    <button
                                        onClick={clearEntityForm}
                                        className="mt-2 w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                            <div className="flex-grow overflow-y-auto pr-2">
                                {filteredEntities.length === 0 ? (
                                    <p className="text-gray-400">No entities found.</p>
                                ) : (
                                    filteredEntities.map(entity => (
                                        <div
                                            key={entity.id}
                                            className="flex flex-col p-3 mb-2 bg-gray-700 rounded-md shadow-sm"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-purple-200">{entity.primaryName}</h3>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleInsertEntity(entity, entity.primaryName, 'primary')}
                                                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 text-sm rounded-md shadow-sm transition duration-200"
                                                        title="Insert Primary Name"
                                                    >
                                                        Insert
                                                    </button>

                                                    {entity.aliases && entity.aliases.length > 0 && (
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setOpenDropdownEntityId(openDropdownEntityId === entity.id ? null : entity.id)}
                                                                className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-1 px-2 text-sm rounded-md shadow-sm transition duration-200 flex items-center"
                                                                title="Insert Alias"
                                                            >
                                                                Alias
                                                                <ChevronRight className="h-4 w-4 ml-1 transform rotate-90" />
                                                            </button>
                                                            {openDropdownEntityId === entity.id && (
                                                                <ul className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10 overflow-hidden">
                                                                    {entity.aliases.map(alias => (
                                                                        <li
                                                                            key={alias.id}
                                                                            onClick={() => {
                                                                                handleInsertEntity(entity, alias.name, 'alias', alias.id);
                                                                                setOpenDropdownEntityId(null);
                                                                            }}
                                                                            className="px-4 py-2 text-sm text-white hover:bg-gray-600 cursor-pointer"
                                                                        >
                                                                            {alias.name}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => handleInsertBacklinks(entity.id)}
                                                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-1 px-2 text-sm rounded-md shadow-sm transition duration-200"
                                                        title="Insert backlinks for this entity"
                                                    >
                                                        Backlinks
                                                    </button>

                                                    <button
                                                        onClick={() => startEditEntity(entity)}
                                                        className="text-yellow-400 hover:text-yellow-300"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEntity(entity.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Conflict Resolution Modal (now simplified for confirmation) */}
            <ConflictResolutionModal
                isOpen={isConflictModalOpen}
                conflicts={conflictData} // Still pass conflicts for display
                onResolve={applyImportResolution}
                onCancel={handleConflictModalCancel}
            />

            {/* Entity Selection Modal for Text Assignment */}
            <EntitySelectionModal
                isOpen={isEntitySelectionModalOpen}
                entities={entities}
                onSelectEntity={handleSelectEntityForAssignment}
                onCancel={handleCancelEntitySelection}
            />

            {/* Remove Assignment Modal */}
            <RemoveAssignmentModal
                isOpen={isRemoveAssignmentModalOpen}
                blocks={blocksAtCursor}
                onRemoveBlock={handleRemoveAssignedBlock}
                onCancel={handleCancelRemoveAssignment}
            />

            {/* Create Document Modal */}
            <CreateDocumentModal
                isOpen={isCreateDocumentModalOpen}
                folders={folders}
                onCreate={handleCreateDocument}
                onCancel={() => setIsCreateDocumentModalOpen(false)}
            />

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={isCreateFolderModalOpen}
                folders={folders}
                onCreate={handleCreateFolder}
                onCancel={() => setIsCreateFolderModalOpen(false)}
            />

            {/* Link Modal */}
            <LinkModal
                isOpen={isLinkModalOpen}
                onConfirm={handleConfirmLink}
                onCancel={() => { setIsLinkModalOpen(false); savedSelectionRange.current = null; }}
            />

            {/* Image Modal */}
            <ImageModal
                isOpen={isImageModalOpen}
                onConfirm={handleConfirmImage}
                onCancel={() => { setIsImageModalOpen(false); savedSelectionRange.current = null; }}
            />

            {/* Shortcuts Modal */}
            <ShortcutsModal
                isOpen={showShortcutsModal}
                onClose={() => setShowShortcutsModal(false)}
            />

            {/* Global Styles for Assigned Text Blocks and Fonts*/}
            <style>
                {`
                .assigned-text-block {
                    border-radius: 4px;
                    padding: 0 2px;
                    /* Changed to inline-block to correctly handle line breaks */
                    display: inline-block;
                    transition: background-color 0.3s ease; /* Smooth transition for color change */
                    /* Use custom property for dynamic color */
                    background-color: var(--entity-highlight-color, transparent);
                }
                .assigned-text-block.highlight {
                    /* This class is now primarily for toggling visibility, color is handled by the custom property */
                }
                .assigned-text-block.flash-highlight {
                    animation: flashHighlight 1s forwards; /* Animation for scrolling to block */
                }
                @keyframes flashHighlight {
                    0% { outline: 2px solid rgba(0, 123, 255, 0.7); background-color: rgba(0, 123, 255, 0.2); }
                    50% { outline: 2px solid rgba(0, 123, 255, 0.7); background-color: rgba(0, 123, 255, 0.2); }
                    100% { outline: none; background-color: var(--entity-highlight-color, transparent); } /* revert to original highlight or no highlight */
                }
                .hover-preview {
                    position: absolute;
                    background-color: #333;
                    color: white;
                    border-radius: 8px;
                    padding: 10px 15px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    z-index: 100;
                    max-width: 300px;
                    animation: fadeIn 0.2s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                /* Optional: Style for nested highlights if desired */
                .assigned-text-block.highlight .assigned-text-block.highlight {
                    outline: 1px dotted rgba(0,0,0,0.2);
                }
                /* Font styles for preview/editor content */
                .font-arial { font-family: Arial, sans-serif; }
                .font-verdana { font-family: Verdana, sans-serif; }
                .font-georgia { font-family: Georgia, serif; }
                .font-times { font-family: "Times New Roman", serif; }
                .font-courier { font-family: "Courier New", monospace; }

                /* Default editor content styles */
                .editor-content h1 { font-size: 2.25em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em;}
                .editor-content h2 { font-size: 1.75em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em;}
                .editor-content h3 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em;}
                .editor-content h4 { font-size: 1.25em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em;}
                .editor-content h5 { font-size: 1.125em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em;}
                .editor-content h6 { font-size: 1em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em;}
                .editor-content ul, .editor-content ol { list-style-position: inside; margin-left: 1.5em; margin-bottom: 1em; }
                .editor-content li { margin-bottom: 0.5em; }
                .editor-content p { margin-bottom: 1em; }
                .editor-content b, .editor-content strong { font-weight: bold; }
                .editor-content i, .editor-content em { font-style: italic; }
                .editor-content a { color: #2563eb; text-decoration: underline; cursor: pointer; }
                .editor-content img { max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                `}
            </style>
        </div>
    );
};

export default App;
