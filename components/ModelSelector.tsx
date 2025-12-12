'use client';

import { useState, useEffect } from 'react';
import { OpenRouterModel } from '@/lib/types';

interface ModelSelectorProps {
  onSelect: (model: OpenRouterModel) => void;
}

export default function ModelSelector({ onSelect }: ModelSelectorProps) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch('/api/models');
        if (!res.ok) {
            throw new Error('Failed to fetch models');
        }
        const data = await res.json();
        if (data.error) {
            throw new Error(data.error);
        }
        setModels(data.models || []);
      } catch (err) {
        setError('Failed to load free models. Please check your API key.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchModels();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    const model = models.find(m => m.id === id);
    if (model) {
      onSelect(model);
    }
  };

  if (loading) return <div className="subtitle">Loading models...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="form">
      <label className="label" htmlFor="model-select">Select a Free Model</label>
      <select 
        id="model-select"
        className="input" 
        value={selectedId} 
        onChange={handleChange}
        disabled={models.length === 0}
      >
        <option value="" disabled>-- Choose a model --</option>
        {models.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      
      {selectedId && (
        <div className="smallNote">
          {models.find(m => m.id === selectedId)?.description || 'No description available.'}
        </div>
      )}
    </div>
  );
}
