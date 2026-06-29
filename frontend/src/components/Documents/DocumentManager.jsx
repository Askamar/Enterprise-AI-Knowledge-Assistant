import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Trash2, Loader, Database, Check, AlertCircle } from "lucide-react";
import { uploadDocument } from "../../services/api";

const DocumentManager = ({ documents, onUploadSuccess, onDeleteClick, refreshing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError("");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    e.preventDefault();
    setUploadError("");
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadError("");
    try {
      const response = await uploadDocument(file);
      if (onUploadSuccess) {
        onUploadSuccess(response);
      }
    } catch (err) {
      setUploadError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="document-manager" style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
      {/* Upload Zone */}
      <div>
        <div className="section-title">
          <UploadCloud size={14} />
          <span>Upload Document</span>
        </div>
        
        <form
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onSubmit={(e) => e.preventDefault()}
          className={`upload-zone ${dragActive ? "dragging" : ""}`}
          onClick={onButtonClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="file-input"
            style={{ display: "none" }}
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileChange}
            disabled={uploading}
          />
          
          {uploading ? (
            <>
              <Loader size={36} className="upload-zone-icon" style={{ animation: "spin 2s linear infinite" }} />
              <p className="upload-zone-text">Uploading & chunking document...</p>
              <span className="upload-zone-limit">Computing embeddings & saving to ChromaDB</span>
            </>
          ) : (
            <>
              <UploadCloud size={36} className="upload-zone-icon" />
              <p className="upload-zone-text">
                Drag & drop or <span style={{ color: "var(--primary)", fontWeight: "600" }}>browse</span>
              </p>
              <span className="upload-zone-limit">Supports PDF, DOCX, TXT, MD (Max 10MB)</span>
            </>
          )}
        </form>
        {uploadError && (
          <div style={{ color: "var(--error)", fontSize: "0.8rem", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertCircle size={14} />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Database size={14} />
            <span>Knowledge Base ({documents.length})</span>
          </div>
          {refreshing && <Loader size={12} style={{ animation: "spin 2s linear infinite" }} />}
        </div>

        <div style={{ flex: 1, overflowY: "auto", marginTop: "8px" }}>
          {documents.length === 0 ? (
            <div className="empty-state">
              <FileText size={32} className="empty-state-icon" />
              <p style={{ fontSize: "0.85rem" }}>No documents uploaded yet</p>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Upload files to populate the vector database.
              </span>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.filename} className="doc-item-card">
                <div className="doc-info">
                  <FileText className="doc-file-icon" size={20} />
                  <div className="doc-details">
                    <span className="doc-name" title={doc.filename}>{doc.filename}</span>
                    <span className="doc-meta">
                      <span>{doc.file_size_kb} KB</span>
                      <span>•</span>
                      <span>{doc.chunk_count} chunks</span>
                      <span>•</span>
                      <span title={doc.upload_date}>{formatDate(doc.upload_date)}</span>
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-danger"
                  style={{ padding: "6px 8px" }}
                  onClick={() => onDeleteClick(doc.filename)}
                  title="Delete Document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentManager;
