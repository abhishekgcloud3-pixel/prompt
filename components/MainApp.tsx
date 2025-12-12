'use client';

import { useState } from 'react';
import Link from 'next/link';
import ModelSelector from '@/components/ModelSelector';
import LogoutButton from '@/components/LogoutButton';
import { OpenRouterModel } from '@/lib/types';

export default function MainApp() {
  const [selectedModel, setSelectedModel] = useState<OpenRouterModel | null>(null);

  const handleModelSelect = (model: OpenRouterModel) => {
    setSelectedModel(model);
  };

  return (
    <div className="card">
      <h1 className="title">Prompt Enhancement App</h1>
      <p className="subtitle">
        Select a free model to get started.
      </p>

      <ModelSelector onSelect={handleModelSelect} />

      {selectedModel && (
        <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Selected Model:</div>
          <div>{selectedModel.name}</div>
          <div style={{ fontSize: '0.8em', opacity: 0.7 }}>{selectedModel.id}</div>
        </div>
      )}

      <div className="actions" style={{ marginTop: '24px' }}>
        <Link className="button" href="/">
          Landing
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
