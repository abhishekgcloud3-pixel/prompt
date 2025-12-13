'use client';

import { useState } from 'react';
import Link from 'next/link';
import ModelSelector from '@/components/ModelSelector';
import LogoutButton from '@/components/LogoutButton';
import PromptEnhancer from '@/components/PromptEnhancer';
import { OpenRouterModel } from '@/lib/types';

export default function MainApp() {
  const [selectedModel, setSelectedModel] = useState<OpenRouterModel | null>(null);

  const handleModelSelect = (model: OpenRouterModel) => {
    setSelectedModel(model);
  };

  return (
    <div className="card cardWide">
      <h1 className="title">Video Prompt Enhancement Engine</h1>
      <p className="subtitle">Select a model, then enhance your video generation prompts with professional cinematography, camera work, and visual storytelling.</p>

      <ModelSelector onSelect={handleModelSelect} />

      {selectedModel ? (
        <div className="selectedModel">
          <div className="selectedModelTitle">Selected Model</div>
          <div>{selectedModel.name}</div>
          <div className="selectedModelId">{selectedModel.id}</div>
        </div>
      ) : null}

      {selectedModel ? <PromptEnhancer selectedModel={selectedModel} /> : null}

      <div className="actions" style={{ marginTop: '24px' }}>
        <Link className="button" href="/">
          Landing
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
