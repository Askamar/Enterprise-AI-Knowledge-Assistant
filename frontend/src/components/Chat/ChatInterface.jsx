import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, FileText, Info, HelpCircle, X } from "lucide-react";
import { sendChatMessage } from "../../services/api";

const ChatInterface = ({ activeSettings }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your Enterprise AI Knowledge Assistant. Upload corporate files or documents, and ask me questions. I'll search through them to give you accurate answers with source citations.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeReference, setActiveReference] = useState(null); // Reference details modal state
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Append user message
    const userMsgObj = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    
    setMessages((prev) => [...prev, userMsgObj]);
    setLoading(true);

    try {
      // Send chat history (excluding current user message which is sent in 'query')
      const response = await sendChatMessage(userMessage, messages);
      
      const assistantMsgObj = {
        role: "assistant",
        content: response.answer,
        references: response.references,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      
      setMessages((prev) => [...prev, assistantMsgObj]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.message || "Could not retrieve answer. Check if backend is active and LLM settings are correct."}`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Messages Window */}
      <div className="messages-list">
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.role}`}>
            <div className="message-bubble">
              {/* Formatted Text rendering */}
              <div style={{ whiteSpace: "pre-line" }}>{msg.content}</div>
              
              {/* References citations list */}
              {msg.references && msg.references.length > 0 && (
                <div className="references-container">
                  <div className="references-header">
                    <FileText size={12} />
                    <span>Sources Cited:</span>
                  </div>
                  <div className="references-list">
                    {msg.references.map((ref, idx) => (
                      <span 
                        key={idx} 
                        className="ref-tag"
                        onClick={() => setActiveReference(ref)}
                      >
                        {ref.filename}
                        {ref.page ? ` (p. ${ref.page})` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="message-time">{msg.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="message-wrapper assistant">
            <div className="message-bubble" style={{ padding: "10px 14px" }}>
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Field */}
      <div className="chat-input-panel">
        <form onSubmit={handleSend} className="chat-input-form">
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              loading 
                ? "Processing your knowledge query..." 
                : "Ask anything about your corporate knowledge base..."
            }
            disabled={loading}
          />
          <button type="submit" className="btn" style={{ padding: "8px 16px", borderRadius: "8px" }} disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Reference inspector overlay modal */}
      {activeReference && (
        <div className="modal-overlay" onClick={() => setActiveReference(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent)" }}>
                <FileText size={18} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: "600" }}>Source Inspector</h3>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: "4px", borderRadius: "50%" }}
                onClick={() => setActiveReference(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: "12px", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Document: </span>
                <strong style={{ color: "var(--text-primary)" }}>{activeReference.filename}</strong>
                {activeReference.page && (
                  <>
                    <span style={{ color: "var(--text-muted)" }}> • Page: </span>
                    <strong style={{ color: "var(--text-primary)" }}>{activeReference.page}</strong>
                  </>
                )}
              </div>
              <div 
                style={{ 
                  background: "rgba(0,0,0,0.3)", 
                  padding: "16px", 
                  borderRadius: "8px", 
                  fontSize: "0.85rem", 
                  lineHeight: "1.6", 
                  whiteSpace: "pre-wrap",
                  maxHeight: "350px",
                  overflowY: "auto",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)"
                }}
              >
                {activeReference.content}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setActiveReference(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
