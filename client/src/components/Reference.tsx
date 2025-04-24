import React from 'react';
import { saveAs } from 'file-saver';
import { ReferenceItem } from '@/services/ReferenceService';

interface ReferenceProps {
  references: ReferenceItem[];
}

const Reference: React.FC<ReferenceProps> = ({ references }) => {
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      saveAs(blob, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank');
  };

  const renderReference = (reference: ReferenceItem) => {
    switch (reference.type) {
      case 'image':
        return (
          <div className="relative group">
            <img
              src={reference.url}
              alt={reference.title}
              className="w-full h-48 object-cover rounded-lg cursor-pointer"
              onClick={() => handleOpenLink(reference.url)}
            />
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-sm font-medium">{reference.title}</p>
              {reference.description && (
                <p className="text-xs">{reference.description}</p>
              )}
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="material-icons text-gray-500 mr-3">description</span>
            <div className="flex-grow">
              <p className="font-medium">{reference.title}</p>
              {reference.description && (
                <p className="text-sm text-gray-500">{reference.description}</p>
              )}
            </div>
            <button
              onClick={() => handleDownload(reference.url, reference.title)}
              className="ml-3 p-2 text-primary hover:bg-primary hover:text-white rounded-full transition-colors"
            >
              <span className="material-icons">download</span>
            </button>
          </div>
        );

      case 'link':
        return (
          <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="material-icons text-gray-500 mr-3">link</span>
            <div className="flex-grow">
              <p className="font-medium">{reference.title}</p>
              {reference.description && (
                <p className="text-sm text-gray-500">{reference.description}</p>
              )}
            </div>
            <button
              onClick={() => handleOpenLink(reference.url)}
              className="ml-3 p-2 text-primary hover:bg-primary hover:text-white rounded-full transition-colors"
            >
              <span className="material-icons">open_in_new</span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <h3 className="font-poppins font-semibold text-xl text-primary mb-4">References</h3>
      <div className="grid grid-cols-1 gap-4">
        {references.map((reference, index) => (
          <div key={`${reference.url}-${index}`}>{renderReference(reference)}</div>
        ))}
      </div>
    </div>
  );
};

export default Reference; 