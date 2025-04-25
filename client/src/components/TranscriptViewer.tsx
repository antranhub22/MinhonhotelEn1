import React, { useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

const TranscriptViewer: React.FC = () => {
  const { transcripts } = useWebSocket();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Scroll to top for newest first, then back to top
      containerRef.current.scrollTop = 0;
    }
  }, [transcripts]);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto p-2">
      {[...transcripts].reverse().map((t) => (
        <div key={t.id} className="mb-2">
          <p className="text-xs text-gray-500">{new Date(t.timestamp).toLocaleTimeString()}</p>
          <p className="text-gray-800">{t.content}</p>
        </div>
      ))}
    </div>
  );
};

export default TranscriptViewer; 