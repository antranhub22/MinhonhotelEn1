import React, { useEffect, useState } from 'react';
import { setupModelOutputListener } from '../../server/vapi';

const ModelOutput: React.FC = () => {
  const [modelOutput, setModelOutput] = useState<string | null>(null);

  useEffect(() => {
    // Set up listener for model output
    setupModelOutputListener((output) => {
      setModelOutput(output);
    });
  }, []);

  if (!modelOutput) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <h2 className="text-lg font-semibold mb-2">Model Output</h2>
      <div className="whitespace-pre-wrap">{modelOutput}</div>
    </div>
  );
};

export default ModelOutput; 