import React, { useState, useEffect } from "react";
import { Sparkles, BrainCircuit, RefreshCw, Folder, Loader2 } from "lucide-react";
import SettingsPanel from "./components/Settings/SettingsPanel";
import DocumentManager from "./components/Documents/DocumentManager";
import ChatInterface from "./components/Chat/ChatInterface";
import { listDocuments, deleteDocument } from "./services/api";

function App() {
  const [documents, setDocuments] = useState([]);
  const [activeSettings, setActiveSettings] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingFile, setDeletingFile] = useState(null); // File currently being deleted

  const fetchDocs = async () => {
    setRefreshing(true);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents list:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUploadSuccess = (newDoc) => {
    // Append to documents list
    setDocuments((prev) => [...prev, newDoc]);
  };

  const handleDeleteClick = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}" and remove its embeddings from ChromaDB?`)) {
      return;
    }
    
    setDeletingFile(filename);
    try {
      await deleteDocument(filename);
      // Remove from state
      setDocuments((prev) => prev.filter((d) => d.filename !== filename));
    } catch (err) {
      alert(`Error deleting document: ${err.message || "Please try again."}`);
    } finally {
      setDeletingFile(null);
    }
  };

  const handleSettingsChange = (newSettings) => {
    setActiveSettings(newSettings);
  };

  return (
    <div className="app-container">
      {/* 1. Left Sidebar: Branding & System Configurations */}
      <aside className="sidebar glass">
        <div className="sidebar-header">
          <div className="logo-container">
            <BrainCircuit className="logo-icon" size={24} />
            <h1 className="logo-text">FortisCore AI</h1>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
            Enterprise Knowledge Assistant
          </span>
        </div>
        
        <div className="sidebar-content">
          <SettingsPanel onSettingsChange={handleSettingsChange} />
        </div>
      </aside>

      {/* 2. Main Chat Panel (Flexible Center) */}
      <main className="chat-container">
        <header className="chat-header glass">
          <div className="chat-header-info">
            <h2>RAG Assistant Session</h2>
            <p>
              <span className="status-dot"></span>
              <span>Llama 3 • Connected</span>
            </p>
          </div>
          
          <button 
            className="btn btn-secondary" 
            style={{ padding: "8px 12px" }} 
            onClick={fetchDocs} 
            title="Refresh Knowledge Index"
          >
            <RefreshCw size={14} className={refreshing ? "spin" : ""} style={{ animation: refreshing ? "spin 2s linear infinite" : "none" }} />
          </button>
        </header>

        <ChatInterface activeSettings={activeSettings} />
      </main>

      {/* 3. Right Drawer: Knowledge Base Document Manager */}
      <section className="doc-drawer glass">
        <div className="doc-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Folder size={18} style={{ color: "var(--primary)" }} />
            <h3>Knowledge Repository</h3>
          </div>
        </div>
        
        <div className="doc-drawer-content">
          <DocumentManager 
            documents={documents} 
            onUploadSuccess={handleUploadSuccess} 
            onDeleteClick={handleDeleteClick}
            refreshing={refreshing || !!deletingFile}
          />
        </div>
      </section>
    </div>
  );
}

export default App;
