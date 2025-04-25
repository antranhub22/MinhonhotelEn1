const TRIEVE_API_URL = process.env.NEXT_PUBLIC_TRIEVE_API_URL || 'https://api.trieve.ai';
const TRIEVE_API_KEY = process.env.NEXT_PUBLIC_TRIEVE_API_KEY;
const DATASET_ID = process.env.NEXT_PUBLIC_TRIEVE_DATASET_ID;

interface SearchResult {
  text: string;
  score: number;
  metadata?: any;
}

export const searchTrieveKnowledge = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch(`${TRIEVE_API_URL}/api/chunk/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRIEVE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        dataset_id: DATASET_ID,
        filters: {},
        page: 1,
        limit: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.chunks.map((chunk: any) => ({
      text: chunk.text,
      score: chunk.score,
      metadata: chunk.metadata,
    }));
  } catch (error) {
    console.error('Error searching Trieve knowledge base:', error);
    return [];
  }
};

export const addToTrieveKnowledge = async (text: string, metadata: any = {}): Promise<boolean> => {
  try {
    const response = await fetch(`${TRIEVE_API_URL}/api/chunk/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRIEVE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        dataset_id: DATASET_ID,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error adding to Trieve knowledge base:', error);
    return false;
  }
}; 