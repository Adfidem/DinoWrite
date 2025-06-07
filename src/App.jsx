import React, { useState, useEffect, useRef, useCallback } from 'react';

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

// Custom Modal Component for Conflict Resolution
const ConflictResolutionModal = ({ isOpen, conflicts, onResolve, onCancel }) => {
    const [resolutions, setResolutions] = useState({});

    useEffect(() => {
        if (isOpen) {
            // Initialize resolutions: default to 'keep_original' for safety
            const initialResolutions = {};
            conflicts.documents.forEach(doc => {
                initialResolutions[`doc-${doc.id}`] = 'keep_original'; // Corrected typo here
            });
            conflicts.entities.forEach(entity => {
                initialResolutions[`entity-${entity.id}`] = 'keep_original';
            });
            if (conflicts.textBlocks) {
                conflicts.textBlocks.forEach(block => {
                    initialResolutions[`textblock-${block.id}`] = 'keep_original';
                });
            }
            if (conflicts.folders) { // New: Initialize for folders
                conflicts.folders.forEach(folder => {
                    initialResolutions[`folder-${folder.id}`] = 'keep_original';
                });
            }
            setResolutions(initialResolutions);
        }
    }, [isOpen, conflicts]);

    if (!isOpen) return null;

    const handleResolutionChange = (id, type, choice) => {
        setResolutions(prev => ({
            ...prev,
            [`${type}-${id}`]: choice
        }));
    };

    const handleApply = () => {
        onResolve(resolutions);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Import Conflict Resolution</h2>
                <p className="mb-4 text-gray-700">
                    The imported data contains items with IDs that already exist. Please choose whether to "Keep Original" or "Overwrite with Imported" for each conflicting item.
                </p>

                {conflicts.documents.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3 text-indigo-700">Conflicting Documents:</h3>
                        {conflicts.documents.map(doc => (
                            <div key={doc.id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-100 p-3 rounded-md mb-2">
                                <span className="font-medium text-gray-800 mb-2 md:mb-0 md:w-1/2 break-words">
                                    Document: "{doc.title}" (ID: {doc.id})
                                </span>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name={`doc-${doc.id}`}
                                            value="keep_original"
                                            checked={resolutions[`doc-${doc.id}`] === 'keep_original'}
                                            onChange={() => handleResolutionChange(doc.id, 'doc', 'keep_original')}
                                            className="form-radio text-indigo-600"
                                        />
                                        <span className="ml-2 text-gray-700">Keep Original</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name={`doc-${doc.id}`}
                                            value="overwrite"
                                            checked={resolutions[`doc-${doc.id}`] === 'overwrite'}
                                            onChange={() => handleResolutionChange(doc.id, 'doc', 'overwrite')}
                                            className="form-radio text-indigo-600"
                                        />
                                        <span className="ml-2 text-gray-700">Overwrite with Imported</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {conflicts.entities.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3 text-purple-700">Conflicting Entities:</h3>
                        {conflicts.entities.map(entity => (
                            <div key={entity.id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-100 p-3 rounded-md mb-2">
                                <span className="font-medium text-gray-800 mb-2 md:mb-0 md:w-1/2 break-words">
                                    Entity: "{entity.primaryName}" (ID: {entity.id})
                                </span>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name={`entity-${entity.id}`}
                                            value="keep_original"
                                            checked={resolutions[`entity-${entity.id}`] === 'keep_original'}
                                            onChange={() => handleResolutionChange(entity.id, 'entity', 'keep_original')}
                                            className="form-radio text-purple-600"
                                        />
                                        <span className="ml-2 text-gray-700">Keep Original</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name={`entity-${entity.id}`}
                                            value="overwrite"
                                            checked={resolutions[`entity-${entity.id}`] === 'overwrite'}
                                            onChange={() => handleResolutionChange(entity.id, 'entity', 'overwrite')}
                                            className="form-radio text-purple-600"
                                        />
                                        <span className="ml-2 text-gray-700">Overwrite with Imported</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {conflicts.textBlocks && conflicts.textBlocks.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3 text-emerald-700">Conflicting Text Blocks:</h3>
                        {conflicts.textBlocks.map(block => (
                            <div key={block.id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-100 p-3 rounded-md mb-2">
                                <span className="font-medium text-gray-800 mb-2 md:mb-0 md:w-1/2 break-words">
                                    Block: "{block.plainText.substring(0, 50)}..." (ID: {block.id})
                                </span>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name={`textblock-${block.id}`}
                                            value="keep_original"
                                            checked={resolutions[`textblock-${block.id}`] === 'keep_original'}
                                            onChange={() => handleResolutionChange(block.id, 'textblock', 'keep_original')}
                                            className="form-radio text-emerald-600"
                                        />
                                        <span className="ml-2 text-gray-700">Keep Original</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name={`textblock-${block.id}`}
                                            value="overwrite"
                                            checked={resolutions[`textblock-${block.id}`] === 'overwrite'}
                                            onChange={() => handleResolutionChange(block.id, 'textblock', 'overwrite')}
                                            className="form-radio text-emerald-600"
                                        />
                                        <span className="ml-2 text-gray-700">Overwrite with Imported</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {conflicts.folders && conflicts.folders.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3 text-pink-700">Conflicting Folders:</h3>
                        {conflicts.folders.map(folder => (
                            <div key={folder.id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-100 p-3 rounded-md mb-2">
                                <span className="font-medium text-gray-800 mb-2 md:mb-0 md:w-1/2 break-words">
                                    Folder: "{folder.name}" (ID: {folder.id})
                                </span>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name={`folder-${folder.id}`}
                                            value="keep_original"
                                            checked={resolutions[`folder-${folder.id}`] === 'keep_original'}
                                            onChange={() => handleResolutionChange(folder.id, 'folder', 'keep_original')}
                                            className="form-radio text-pink-600"
                                        />
                                        <span className="ml-2 text-gray-700">Keep Original</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name={`folder-${folder.id}`}
                                            value="overwrite"
                                            checked={resolutions[`folder-${folder.id}`] === 'overwrite'}
                                            onChange={() => handleResolutionChange(folder.id, 'folder', 'overwrite')}
                                            className="form-radio text-pink-600"
                                        />
                                        <span className="ml-2 text-gray-700">Overwrite with Imported</span>
                                    </label>
                                </div>
                            </div>
                        ))}
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
                        onClick={handleApply}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
                    >
                        Apply Choices
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
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
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
            alert('Document title cannot be empty.');
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
            alert('Folder name cannot be empty.');
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
const FolderItem = ({ folder, documents, folders, onDocumentSelect, currentDocumentId, documentSearchQuery, onEditDocument, onDeleteDocument, onEditFolder, onDeleteFolder, onMoveDocument }) => {
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
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <span>{folder.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }} className="text-yellow-400 hover:text-yellow-300" title="Edit Folder">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }} className="text-red-400 hover:text-red-300" title="Delete Folder">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                        </svg>
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
                            onMoveDocument={onMoveDocument} // Pass down move function
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
                                <span onClick={() => onDocumentSelect(doc.id)} className="flex-grow text-md">
                                    {doc.title}
                                </span>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEditDocument(doc); }}
                                        className="text-yellow-400 hover:text-yellow-300"
                                        title="Edit Document"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteDocument(doc.id); }}
                                        className="text-red-400 hover:text-red-300"
                                        title="Delete Document"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
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


// Main App Component
const App = () => {
    const [documents, setDocuments] = useState(() => {
        const storedDocuments = localStorage.getItem('bookEditorDocuments');
        const parsedDocs = storedDocuments ? JSON.parse(storedDocuments) : [];
        // Ensure old documents have a folderId of null (root)
        return parsedDocs.map(doc => ({ ...doc, folderId: doc.folderId !== undefined ? doc.folderId : null }));
    });

    const [folders, setFolders] = useState(() => {
        const storedFolders = localStorage.getItem('bookEditorFolders');
        return storedFolders ? JSON.parse(storedFolders) : [];
    });

    const [entities, setEntities] = useState(() => {
        const storedEntities = localStorage.getItem('bookEditorEntities');
        return storedEntities ? JSON.parse(storedEntities).map(e => ({ ...e, color: e.color || '#fffacd' })) : [];
    });

    const [assignedTextBlocks, setAssignedTextBlocks] = useState(() => {
        const storedAssignedBlocks = localStorage.getItem('bookEditorAssignedTextBlocks');
        return storedAssignedBlocks ? JSON.parse(storedAssignedBlocks) : [];
    });

    const [currentDocumentId, setCurrentDocumentId] = useState(() => {
        const storedDocuments = localStorage.getItem('bookEditorDocuments');
        const parsedDocs = storedDocuments ? JSON.parse(storedDocuments) : [];
        return parsedDocs.length > 0 ? parsedDocs[0].id : null;
    });

    const [isCreateDocumentModalOpen, setIsCreateDocumentModalOpen] = useState(false);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);


    const [newEntityPrimaryName, setNewEntityPrimaryName] = useState('');
    const [newEntityAliases, setNewEntityAliases] = useState([]);
    const [newEntityDescription, setNewEntityDescription] = useState('');
    const [newEntityLink, setNewEntityLink] = useState('');
    const [isExternalLink, setIsExternalLink] = useState(false);
    const [editingEntity, setEditingEntity] = useState(null);
    const [newAliasInput, setNewAliasInput] = useState('');
    const [newEntityColor, setNewEntityColor] = useState('#fffacd');

    const contentEditableRef = useRef(null);
    const savedSelectionRange = useRef(null); // Used to save selection before programmatic DOM updates
    const fileInputRef = useRef(null);
    const blockToScrollToRef = useRef(null); // New: Ref to store block ID to scroll to

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

    const [isRootDragOver, setIsRootDragOver] = useState(false); // New state for root drag over

    const [showDocumentsSidebar, setShowDocumentsSidebar] = useState(true); // New: state for document sidebar visibility
    const [showEntitiesSidebar, setShowEntitiesSidebar] = useState(true);   // New: state for entities sidebar visibility
    const [showPreview, setShowPreview] = useState(true);                  // New: state for preview window visibility

    const [showShortcutsModal, setShowShortcutsModal] = useState(false); // New: state for shortcuts modal
    const [showFontDropdown, setShowFontDropdown] = useState(false); // New: state for font dropdown
    const [showHeadingDropdown, setShowHeadingDropdown] = useState(false); // New: state for heading dropdown


    // --- Persistence (localStorage) ---
    useEffect(() => {
        localStorage.setItem('bookEditorDocuments', JSON.stringify(documents));
    }, [documents]);

    useEffect(() => {
        localStorage.setItem('bookEditorFolders', JSON.stringify(folders));
    }, [folders]);

    useEffect(() => {
        localStorage.setItem('bookEditorEntities', JSON.stringify(entities));
    }, [entities]);

    useEffect(() => {
        localStorage.setItem('bookEditorAssignedTextBlocks', JSON.stringify(assignedTextBlocks));
    }, [assignedTextBlocks]);


    // --- Browser Close Prompt ---
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            event.returnValue = 'Are you sure you want to leave? Your unsaved changes might be lost.';
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

    const handleCreateDocument = (title, folderId) => {
        if (title.trim()) {
            const newDoc = {
                id: Date.now().toString(),
                title: title.trim(),
                content: '',
                folderId: folderId,
            };
            setDocuments([...documents, newDoc]);
            setCurrentDocumentId(newDoc.id);
            setIsCreateDocumentModalOpen(false);
        }
    };

    const handleDeleteDocument = (id) => {
        const updatedDocuments = documents.filter(doc => doc.id !== id);
        setDocuments(updatedDocuments);
        setAssignedTextBlocks(prev => prev.filter(block => block.documentId !== id));
        if (currentDocumentId === id) {
            setCurrentDocumentId(updatedDocuments.length > 0 ? updatedDocuments[0].id : null);
        }
    };

    // New: Handle moving a document to a different folder or root
    const handleMoveDocument = (documentId, targetFolderId) => {
        setDocuments(prevDocs => prevDocs.map(doc =>
            doc.id === documentId ? { ...doc, folderId: targetFolderId } : doc
        ));
    };


    const [editingDocument, setEditingDocument] = useState(null);

    const startEditDocument = (doc) => {
        setEditingDocument(doc);
    };

    const saveEditedDocument = (id, newTitle) => {
        setDocuments(documents.map(doc =>
            doc.id === id ? { ...doc, title: newTitle.trim() } : doc
        ));
        setEditingDocument(null);
    };

    const cancelEditDocument = () => {
        setEditingDocument(null);
    };

    const currentDocument = documents.find(doc => doc.id === currentDocumentId);

    // This useCallback reads the content directly from the contentEditable div
    // and updates the React state. It does NOT modify the DOM.
    const handleContentInput = useCallback(() => {
        if (contentEditableRef.current && currentDocument) {
            const currentContentInDOM = contentEditableRef.current.innerHTML;
            setDocuments(prevDocs => prevDocs.map(doc =>
                doc.id === currentDocument.id ? { ...doc, content: currentContentInDOM } : doc
            ));
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
    }, [currentDocumentId, currentDocument]); // Changed dependency from currentDocument.content to currentDocument to satisfy ESLint

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
    }, [currentDocumentId]); // Only setup/teardown when document changes.

    // --- Rich Text Formatting Functions ---
    const applyFormatting = (command, value = null) => {
        if (!contentEditableRef.current) return;
        savedSelectionRange.current = saveSelection(); // Save selection before command
        document.execCommand(command, false, value);
        restoreSelection(savedSelectionRange.current); // Restore selection after command
        handleContentInput(); // Sync DOM changes back to React state
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

    // --- Keyboard Shortcuts Listener ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey) {
                // Formatting shortcuts
                if (e.key === 'b') { e.preventDefault(); toggleBold(); }
                if (e.key === 'i') { e.preventDefault(); toggleItalic(); }
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
                setShowFontDropdown(false);
                setShowHeadingDropdown(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleBold, toggleItalic, toggleUnorderedList, toggleOrderedList, setParagraph, setHeading]);


    // --- Folder Management ---
    const handleOpenCreateFolderModal = () => {
        setIsCreateFolderModalOpen(true);
    };

    const handleCreateFolder = (name, parentId) => {
        const newFolder = {
            id: Date.now().toString(),
            name: name,
            parentId: parentId,
            isOpen: false,
        };
        setFolders([...folders, newFolder]);
        setIsCreateFolderModalOpen(false);
    };

    const handleDeleteFolder = (id) => {
        const docsInFolder = documents.filter(doc => doc.folderId === id);
        const childFolders = folders.filter(folder => folder.parentId === id);

        if (docsInFolder.length > 0) {
            alert("Cannot delete a folder that contains documents. Please move or delete its documents first.");
            return;
        }
        if (childFolders.length > 0) {
            alert("Cannot delete a folder that contains sub-folders. Please delete its sub-folders first.");
            return;
        }

        setFolders(folders.filter(folder => folder.id !== id));
    };

    const handleEditFolder = (folderToEdit) => {
        const newName = prompt("Enter new folder name:", folderToEdit.name);
        if (newName && newName.trim()) {
            setFolders(folders.map(folder =>
                folder.id === folderToEdit.id ? { ...folder, name: newName.trim() } : folder
            ));
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

    const handleSaveEntity = () => {
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

        if (editingEntity) {
            setEntities(entities.map(entity =>
                entity.id === editingEntity.id
                    ? { ...entity, ...entityData }
                    : entity
            ));
        } else {
            const newEnt = {
                id: Date.now().toString(),
                ...entityData,
            };
            setEntities([...entities, newEnt]);
        }
        clearEntityForm();
    };

    const handleDeleteEntity = (id) => {
        setEntities(entities.filter(entity => entity.id !== id));
        setAssignedTextBlocks(prev => prev.filter(block => block.entityId !== id));
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
            handleContentInput(); // Sync the DOM changes to React state
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

        handleContentInput(); // Sync updated DOM with React state
        savedSelectionRange.current = saveSelection(); // Save new cursor position
        setOpenDropdownEntityId(null);
    };

    // --- Assign Selected Text to Entity ---
    const handleAssignSelectedText = () => {
        const selection = window.getSelection();
        if (!selection.rangeCount || selection.isCollapsed) {
            alert("Please select some text in the editor to assign.");
            return;
        }
        if (!currentDocument) {
            alert("Please select or create a document first.");
            return;
        }

        savedSelectionRange.current = saveSelection(); // Save selection before opening modal
        setIsEntitySelectionModalOpen(true);
    };

    const handleSelectEntityForAssignment = (entityId) => {
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
            alert("Selected text is not within the editable document content.");
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
            // Background color is now applied via CSS class using data attribute
            // It will pick up the color from the data-assigned-entity-color in the CSS rule
        }
        assignedSpan.appendChild(range.extractContents());
        range.insertNode(assignedSpan);

        setAssignedTextBlocks(prev => [
            ...prev,
            {
                id: blockId,
                entityId: entityId,
                documentId: currentDocument.id,
                plainText: plainText,
                htmlContent: assignedHtml
            }
        ]);

        handleContentInput(); // Sync state with DOM
        savedSelectionRange.current = saveSelection(); // Save new cursor position after DOM change

        setIsEntitySelectionModalOpen(false);
    };

    const handleCancelEntitySelection = () => {
        setIsEntitySelectionModalOpen(false);
        savedSelectionRange.current = null; // Clear saved selection if cancelled
    };

    // --- Remove Text Block Assignments ---
    const handleRemoveAssignmentClick = () => {
        if (!currentDocument || !contentEditableRef.current) {
            alert("Please select a document.");
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
            alert("Please place your cursor or select text within an assigned block.");
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
            alert("No assigned text blocks found at the current cursor position or within the selection.");
            return;
        }
        savedSelectionRange.current = saveSelection(); // Save selection before opening modal
        setBlocksAtCursor(blocksAtCursor);
        setIsRemoveAssignmentModalOpen(true);
    };

    const handleRemoveAssignedBlock = (blockIdToRemove) => {
        const editorElement = contentEditableRef.current;
        const assignedSpan = editorElement.querySelector(`span[data-assigned-block-id="${blockIdToRemove}"]`);

        if (assignedSpan) {
            // Restore selection if it was saved before modal opened
            if (savedSelectionRange.current) {
                restoreSelection(savedSelectionRange.current);
                savedSelectionRange.current = null; // Clear after restoring
            }

            const children = Array.from(assignedSpan.childNodes);

            children.forEach(child => {
                assignedSpan.parentNode.insertBefore(child, assignedSpan);
            });
            assignedSpan.parentNode.removeChild(assignedSpan);

            editorElement.normalize(); // Clean up merged text nodes
        }

        setAssignedTextBlocks(prev => prev.filter(block => block.id !== blockIdToRemove));

        handleContentInput(); // Sync state with DOM
        // No need to save selection again here; the useEffect for cursor will handle it if needed
        // or the native contenteditable behavior takes over.

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

        finalHtml = finalHtml.replace(/^#\s(.+)/gm, '<h1>$1</h1>');
        finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        finalHtml = finalHtml.replace(/\*(.*?)\*/g, '<em>$1</em>');

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
                        alert("Linked document not found. It might have been deleted or moved.");
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
                    setCurrentDocumentId(docId);
                } else {
                    console.warn("Crosslink target document not found:", docId);
                    alert("Linked document not found. It might have been deleted or moved.");
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
                    alert("Backlinked document not found. It might have been deleted or moved.");
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
            alert("Please select a document to export.");
        }
    };

    const handleExportAllData = () => {
        const dataToExport = {
            documents: documents,
            entities: entities,
            assignedTextBlocks: assignedTextBlocks,
            folders: folders,
        };
        const filename = `book_editor_backup_${Date.now()}.json`;
        const element = document.createElement('a');
        const file = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href);
    };

    // --- Import All Data (Documents & Entities) ---
    const handleImportAllData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.documents && Array.isArray(importedData.documents) &&
                    importedData.entities && Array.isArray(importedData.entities) &&
                    importedData.assignedTextBlocks && Array.isArray(importedData.assignedTextBlocks) &&
                    importedData.folders && Array.isArray(importedData.folders)) {

                    importedDataRef.current = importedData;

                    const existingDocumentIds = new Set(documents.map(doc => doc.id));
                    const existingEntityIds = new Set(entities.map(entity => entity.id));
                    const existingTextBlockIds = new Set(assignedTextBlocks.map(block => block.id));
                    const existingFolderIds = new Set(folders.map(folder => folder.id));


                    const conflictingDocuments = importedData.documents.filter(doc => existingDocumentIds.has(doc.id));
                    const conflictingEntities = importedData.entities.filter(entity => existingEntityIds.has(entity.id));
                    const conflictingTextBlocks = importedData.assignedTextBlocks.filter(block => existingTextBlockIds.has(block.id));
                    const conflictingFolders = importedData.folders.filter(folder => existingFolderIds.has(folder.id));


                    if (conflictingDocuments.length > 0 || conflictingEntities.length > 0 || conflictingTextBlocks.length > 0 || conflictingFolders.length > 0) {
                        setConflictData({
                            documents: conflictingDocuments,
                            entities: conflictingEntities,
                            textBlocks: conflictingTextBlocks,
                            folders: conflictingFolders
                        });
                        setIsConflictModalOpen(true);
                    } else {
                        applyImportResolution({});
                        console.log('No conflicts detected, data merged automatically.');
                    }

                } else {
                    alert('Invalid JSON structure: Expected "documents", "entities", "assignedTextBlocks", and "folders" arrays.');
                    console.error('Invalid JSON structure for import:', importedData);
                }
            } catch (error) {
                alert('Failed to import data. Please ensure it is a valid JSON file.');
                console.error('Error parsing imported JSON:', error);
            }
            event.target.value = '';
        };
        reader.onerror = (error) => {
            alert('Error reading file.');
            console.error('Error reading file:', error);
        };
        reader.readAsText(file);
    };

    const applyImportResolution = (resolutions) => {
        const importedData = importedDataRef.current;
        if (!importedData) return;

        let newDocuments = [...documents];
        let newEntities = [...entities];
        let newAssignedTextBlocks = [...assignedTextBlocks];
        let newFolders = [...folders];

        // Process documents
        importedData.documents.forEach(importedDoc => {
            const resolutionKey = `doc-${importedDoc.id}`;
            const existingIndex = newDocuments.findIndex(doc => doc.id === importedDoc.id);
            if (resolutions[resolutionKey] === 'overwrite') {
                if (existingIndex !== -1) {
                    newDocuments[existingIndex] = { ...importedDoc, folderId: importedDoc.folderId !== undefined ? importedDoc.folderId : null };
                } else {
                    newDocuments.push({ ...importedDoc, folderId: importedDoc.folderId !== undefined ? importedDoc.folderId : null });
                }
            } else if (resolutions[resolutionKey] !== 'keep_original') {
                if (existingIndex !== -1) {
                    // If no explicit resolution, assume keep original (or skip if exists)
                    // For simplicity, if not overwrite, and exists, do nothing (keep original)
                } else {
                    newDocuments.push({ ...importedDoc, folderId: importedDoc.folderId !== undefined ? importedDoc.folderId : null });
                }
            }
        });

        // Process entities
        importedData.entities.forEach(importedEntity => {
            const resolutionKey = `entity-${importedEntity.id}`;
            const existingIndex = newEntities.findIndex(entity => entity.id === importedEntity.id);
            if (resolutions[resolutionKey] === 'overwrite') {
                if (existingIndex !== -1) {
                    newEntities[existingIndex] = { ...importedEntity, color: importedEntity.color || '#fffacd' };
                } else {
                    newEntities.push({ ...importedEntity, color: importedEntity.color || '#fffacd' });
                }
            } else if (resolutions[resolutionKey] !== 'keep_original') {
                if (existingIndex !== -1) {
                    // If no explicit resolution, assume keep original (or skip if exists)
                } else {
                    newEntities.push({ ...importedEntity, color: importedEntity.color || '#fffacd' });
                }
            }
        });

        // Process assigned text blocks
        importedData.assignedTextBlocks.forEach(importedBlock => {
            const resolutionKey = `textblock-${importedBlock.id}`;
            const existingIndex = newAssignedTextBlocks.findIndex(block => block.id === importedBlock.id);
            if (resolutions[resolutionKey] === 'overwrite') {
                if (existingIndex !== -1) {
                    newAssignedTextBlocks[existingIndex] = importedBlock;
                } else {
                    newAssignedTextBlocks.push(importedBlock);
                }
            } else if (resolutions[resolutionKey] !== 'keep_original') {
                if (existingIndex !== -1) {
                    // If no explicit resolution, assume keep original (or skip if exists)
                } else {
                    newAssignedTextBlocks.push(importedBlock);
                }
            }
        });

        // Process folders
        importedData.folders.forEach(importedFolder => {
            const resolutionKey = `folder-${importedFolder.id}`;
            const existingIndex = newFolders.findIndex(folder => folder.id === importedFolder.id);
            if (resolutions[resolutionKey] === 'overwrite') {
                if (existingIndex !== -1) {
                    newFolders[existingIndex] = importedFolder;
                } else {
                    newFolders.push(importedFolder);
                }
            } else if (resolutions[resolutionKey] !== 'keep_original') {
                if (existingIndex !== -1) {
                    // If no explicit resolution, assume keep original (or skip if exists)
                } else {
                    newFolders.push(importedFolder);
                }
            }
        });


        setDocuments(newDocuments);
        setEntities(newEntities);
        setAssignedTextBlocks(newAssignedTextBlocks);
        setFolders(newFolders);

        if (newDocuments.length > 0) {
            const currentDocStillExists = newDocuments.some(doc => doc.id === currentDocumentId);
            if (!currentDocStillExists) {
                setCurrentDocumentId(newDocuments[0].id);
            }
        } else {
            setCurrentDocumentId(null);
        }

        setIsConflictModalOpen(false);
        importedDataRef.current = null;
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
    const handleInsertBacklinks = (entityId) => {
        if (!contentEditableRef.current || !currentDocument) {
            alert("Please select a document to insert backlinks into.");
            return;
        }

        const relatedBlocks = assignedTextBlocks.filter(block => block.entityId === entityId);
        const entity = entities.find(e => e.id === entityId);

        if (!entity || relatedBlocks.length === 0) {
            alert(`No text blocks assigned to "${entity ? entity.primaryName : 'this entity'}".`);
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

        handleContentInput(); // Sync updated DOM with React state
        setOpenDropdownEntityId(null);
    };

    // --- Function to refresh all backlink blocks in the current document ---
    const handleRefreshAllBacklinks = () => {
        if (!contentEditableRef.current || !currentDocument) {
            alert("No document selected to refresh backlinks.");
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
                    relatedBlocks.forEach(block => {
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
            handleContentInput(); // Sync updated DOM with React state
            if (currentSelection) { // Restore original cursor position
                restoreSelection(currentSelection);
            }
            alert("Backlinks refreshed!");
        } else {
            alert("No backlinks found or no changes needed.");
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
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-indigo-300 transform transition-transform ${showDocumentsSidebar ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
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
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={documentSearchQuery}
                                    onChange={(e) => setDocumentSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="mb-4 flex space-x-2">
                                <button
                                    onClick={handleOpenCreateDocumentModal}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                >
                                    Create Document
                                </button>
                                <button
                                    onClick={handleOpenCreateFolderModal}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                >
                                    Create Folder
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
                                    getFilteredAndOrganizedDocuments(null).map(item => (
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
                                                onMoveDocument={handleMoveDocument} // Pass down move function
                                            />
                                        ) : (
                                            <div
                                                key={item.data.id}
                                                draggable="true" // Make documents draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('text/plain', item.data.id); // Store document ID
                                                    e.dataTransfer.effectAllowed = 'move';
                                                }}
                                                className={`flex items-center justify-between p-3 mb-2 rounded-md cursor-pointer transition duration-200
                                                    ${item.data.id === currentDocumentId ? 'bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                                            >
                                                {editingDocument && editingDocument.id === item.data.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingDocument.title}
                                                        onChange={(e) => setEditingDocument({ ...editingDocument, title: e.target.value })}
                                                        onBlur={() => saveEditedDocument(item.data.id, editingDocument.title)}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') saveEditedDocument(item.data.id, editingDocument.title);
                                                        }}
                                                        className="flex-grow p-1 rounded-md bg-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span onClick={() => handleDocumentSelect(item.data.id)} className="flex-grow text-lg">
                                                        {item.data.title}
                                                    </span>
                                                )}
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); startEditDocument(item.data); }}
                                                        className="text-yellow-400 hover:text-yellow-300"
                                                        title="Edit Document"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteDocument(item.data.id); }}
                                                        className="text-red-400 hover:text-red-300"
                                                        title="Delete Document"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9.707 3.293a1 1 0 010 1.414L6.414 8H13a1 1 0 110 2H6.414l3.293 3.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z" clipRule="evenodd" />
                                        <path d="M12 4.5v11h-1.5v-11H12zM8 4.5v11H6.5v-11H8z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={toggleItalic}
                                    className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700"
                                    title="Italic (Ctrl+I)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 3.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5v10.5h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75v-12z" clipRule="evenodd" />
                                        <path fillRule="evenodd" d="M11 3.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5v10.5h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75v-12z" />
                                        <path d="M14 3.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5v10.5h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75v-12z" />
                                    </svg>
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
                                        className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700 flex items-center"
                                        title="Heading/Paragraph"
                                    >
                                        <span className="font-bold">H</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    {showHeadingDropdown && (
                                        <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                            <button onClick={setParagraph} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block">Paragraph</button>
                                            <button onClick={() => setHeading('h1')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block">Heading 1</button>
                                            <button onClick={() => setHeading('h2')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block">Heading 2</button>
                                            <button onClick={() => setHeading('h3')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block">Heading 3</button>
                                            <button onClick={() => setHeading('h4')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block">Heading 4</button>
                                            <button onClick={() => setHeading('h5')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block">Heading 5</button>
                                            <button onClick={() => setHeading('h6')} className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 block">Heading 6</button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={toggleUnorderedList}
                                    className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700"
                                    title="Bullet List (Ctrl+Shift+7)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 4.25A.75.75 0 013.75 3h12.5A.75.75 0 0117 3.75v.5A.75.75 0 0116.25 5H3.75A.75.75 0 013 4.25v-.5zM3 9.25A.75.75 0 013.75 8h12.5A.75.75 0 0117 8.75v.5A.75.75 0 0116.25 10H3.75A.75.75 0 013 9.25v-.5zM3 14.25A.75.75 0 013.75 13h12.5A.75.75 0 0117 13.75v.5A.75.75 0 0116.25 15H3.75A.75.75 0 013 14.25v-.5z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={toggleOrderedList}
                                    className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition duration-200 text-gray-700"
                                    title="Numbered List (Ctrl+Shift+8)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12 4a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 5a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zM12 9a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 10a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zM12 14a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 15a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
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
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
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
                                {showHighlights ? 'Hide Highlights' : 'Show Highlights'}
                            </button>
                            <button
                                onClick={handleRefreshAllBacklinks}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-200"
                                title="Refresh content of all backlink blocks in this document"
                            >
                                Refresh Backlinks
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
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
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
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-purple-300 transform transition-transform ${showEntitiesSidebar ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {showEntitiesSidebar && (
                        <>
                        {/* Entity Search Field */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search entities..."
                                className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={entitySearchQuery}
                                onChange={(e) => setEntitySearchQuery(e.target.value)}
                            />
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
                                    Add Alias
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
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                                                </svg>
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
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
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
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEntity(entity.id)}
                                                    className="text-red-400 hover:text-red-300"
                                                    title="Delete"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                                                    </svg>
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

                    {/* Conflict Resolution Modal */}
                        <ConflictResolutionModal
                        isOpen={isConflictModalOpen}
                     conflicts={conflictData}
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
                `}
                </style>
            </div>
            );
            };

            export default App;
