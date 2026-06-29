import React, { useState, useEffect } from "react";
import { Settings, Save, Server, Sliders, Cpu, Info } from "lucide-react";
import { getSettings, updateSettings } from "../../services/api";

const SettingsPanel = ({ onSettingsChange }) => {
  const [config, setConfig] = useState({
    llm_provider: "ollama",
    ollama_base_url: "http://localhost:11434",
    ollama_model: "llama3",
    groq_api_key: "",
    groq_model: "llama-3.1-8b-instant",
    temperature: 0.7,
    chunk_size: 1000,
    chunk_overlap: 200,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getSettings();
        setConfig(data);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: name === "temperature" || name === "chunk_size" || name === "chunk_overlap" 
        ? parseFloat(value) 
        : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await updateSettings(config);
      setConfig(updated);
      setSuccess(true);
      if (onSettingsChange) {
        onSettingsChange(updated);
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-panel">
      <div className="section-title">
        <Settings size={14} />
        <span>System Configuration</span>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="form-group">
          <label htmlFor="llm_provider">LLM Provider</label>
          <select
            id="llm_provider"
            name="llm_provider"
            className="form-control"
            value={config.llm_provider}
            onChange={handleChange}
          >
            <option value="ollama">Ollama (Local Llama 3)</option>
            <option value="groq">Groq Cloud API</option>
          </select>
        </div>

        {config.llm_provider === "ollama" ? (
          <>
            <div className="form-group">
              <label htmlFor="ollama_base_url">Ollama Base URL</label>
              <input
                type="text"
                id="ollama_base_url"
                name="ollama_base_url"
                className="form-control"
                value={config.ollama_base_url}
                onChange={handleChange}
                placeholder="e.g. http://localhost:11434"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ollama_model">Ollama Model</label>
              <input
                type="text"
                id="ollama_model"
                name="ollama_model"
                className="form-control"
                value={config.ollama_model}
                onChange={handleChange}
                placeholder="e.g. llama3"
              />
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="groq_api_key">Groq API Key</label>
              <input
                type="password"
                id="groq_api_key"
                name="groq_api_key"
                className="form-control"
                value={config.groq_api_key}
                onChange={handleChange}
                placeholder="Enter gsk_..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="groq_model">Groq Model</label>
              <select
                id="groq_model"
                name="groq_model"
                className="form-control"
                value={config.groq_model}
                onChange={handleChange}
              >
                <option value="llama-3.1-8b-instant">Llama 3.1 8B (llama-3.1-8b-instant)</option>
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (llama-3.3-70b-versatile)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B (mixtral-8x7b-32768)</option>
              </select>
            </div>
          </>
        )}

        <div className="slider-group">
          <div className="slider-header">
            <span>Temperature</span>
            <span>{config.temperature}</span>
          </div>
          <input
            type="range"
            name="temperature"
            min="0"
            max="1.2"
            step="0.1"
            className="slider"
            value={config.temperature}
            onChange={handleChange}
          />
        </div>

        <div className="section-title" style={{ marginTop: "10px" }}>
          <Sliders size={14} />
          <span>Text Splitter Parameters</span>
        </div>

        <div className="form-group">
          <label htmlFor="chunk_size">Chunk Size (chars)</label>
          <input
            type="number"
            id="chunk_size"
            name="chunk_size"
            className="form-control"
            value={config.chunk_size}
            onChange={handleChange}
            min="100"
            max="10000"
          />
        </div>

        <div className="form-group">
          <label htmlFor="chunk_overlap">Chunk Overlap (chars)</label>
          <input
            type="number"
            id="chunk_overlap"
            name="chunk_overlap"
            className="form-control"
            value={config.chunk_overlap}
            onChange={handleChange}
            min="0"
            max="2000"
          />
        </div>

        {error && <div style={{ color: "var(--error)", fontSize: "0.8rem" }}>{error}</div>}
        {success && <div style={{ color: "var(--success)", fontSize: "0.8rem" }}>Settings saved successfully!</div>}

        <button type="submit" className="btn" disabled={loading}>
          <Save size={16} />
          {loading ? "Saving..." : "Save Configuration"}
        </button>
      </form>
    </div>
  );
};

export default SettingsPanel;
