import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transcript, OrderSummary, CallDetails, Order, InterfaceLayer, CallSummary, ServiceRequest, ActiveOrder } from '@/types';
import { initVapi, vapiInstance, FORCE_BASIC_SUMMARY } from '@/lib/vapiClient';
import { apiRequest } from '@/lib/queryClient';
import { parseSummaryToOrderDetails } from '@/lib/summaryParser';
import { format } from 'date-fns';

interface AssistantContextType {
  currentInterface: InterfaceLayer;
  setCurrentInterface: (layer: InterfaceLayer) => void;
  transcripts: Transcript[];
  addTranscript: (transcript: Omit<Transcript, 'id' | 'timestamp'>) => void;
  orderSummary: OrderSummary | null;
  setOrderSummary: (summary: OrderSummary) => void;
  callDetails: CallDetails | null;
  setCallDetails: (details: CallDetails) => void;
  order: Order | null;
  setOrder: (order: Order) => void;
  callDuration: number;
  isMuted: boolean;
  toggleMute: () => void;
  startCall: () => Promise<void>;
  endCall: () => void;
  callSummary: CallSummary | null;
  setCallSummary: (summary: CallSummary) => void;
  serviceRequests: ServiceRequest[];
  setServiceRequests: (requests: ServiceRequest[]) => void;
  vietnameseSummary: string | null;
  setVietnameseSummary: (summary: string) => void;
  translateToVietnamese: (text: string) => Promise<string>;
  emailSentForCurrentSession: boolean;
  setEmailSentForCurrentSession: (sent: boolean) => void;
  requestReceivedAt: Date | null;
  setRequestReceivedAt: (date: Date | null) => void;
  activeOrders: ActiveOrder[];
  addActiveOrder: (order: ActiveOrder) => void;
  micLevel: number;
  resetToCheckpoint: () => void;
  checkpoints: Checkpoint[];
  saveCheckpoint: (name?: string) => void;
  loadCheckpoint: (checkpointId: string) => void;
}

interface Checkpoint {
  id: string;
  name?: string;
  timestamp: Date;
  transcripts: Transcript[];
  orderSummary: OrderSummary | null;
  callSummary: CallSummary | null;
  serviceRequests: ServiceRequest[];
  vietnameseSummary: string | null;
  emailSentForCurrentSession: boolean;
  requestReceivedAt: Date | null;
  activeOrders: ActiveOrder[];
}

const initialOrderSummary: OrderSummary = {
  orderType: 'Room Service',
  deliveryTime: 'asap',
  roomNumber: '',
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  specialInstructions: '',
  items: [
    {
      id: '1',
      name: 'Club Sandwich',
      description: 'Served with french fries and side salad',
      quantity: 1,
      price: 15.00
    },
    {
      id: '2', 
      name: 'Fresh Orange Juice',
      description: 'Large size',
      quantity: 1,
      price: 8.00
    }
  ],
  totalAmount: 23.00
};

// Context definition
const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [currentInterface, setCurrentInterface] = useState<InterfaceLayer>('interface1');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [callDetails, setCallDetails] = useState<CallDetails | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callSummary, setCallSummary] = useState<CallSummary | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [vietnameseSummary, setVietnameseSummary] = useState<string | null>(null);
  const [emailSentForCurrentSession, setEmailSentForCurrentSession] = useState<boolean>(false);
  const [requestReceivedAt, setRequestReceivedAt] = useState<Date | null>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('activeOrders');
      if (!stored) return [];
      const parsed = JSON.parse(stored) as (ActiveOrder & { requestedAt: string })[];
      // Convert requestedAt string back into Date
      return parsed.map(o => ({
        ...o,
        requestedAt: new Date(o.requestedAt)
      }));
    } catch (err) {
      console.error('Failed to parse activeOrders from localStorage', err);
      return [];
    }
  });
  const [micLevel, setMicLevel] = useState<number>(0);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('checkpoints');
      if (!stored) return [];
      const parsed = JSON.parse(stored) as (Checkpoint & { timestamp: string })[];
      return parsed.map(cp => ({
        ...cp,
        timestamp: new Date(cp.timestamp)
      }));
    } catch (err) {
      console.error('Failed to parse checkpoints from localStorage', err);
      return [];
    }
  });

  // Persist activeOrders to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('activeOrders', JSON.stringify(activeOrders));
    } catch {
      console.error('Failed to persist activeOrders to localStorage');
    }
  }, [activeOrders]);

  const addActiveOrder = (order: ActiveOrder) => {
    setActiveOrders(prev => [...prev, order]);
  };

  // Add transcript to the list
  const addTranscript = React.useCallback((transcript: Omit<Transcript, 'id' | 'timestamp' | 'callId'>) => {
    const newTranscript: Transcript = {
      ...transcript,
      id: Date.now() as unknown as number,
      callId: callDetails?.id || `call-${Date.now()}`,
      timestamp: new Date()
    };
    setTranscripts(prev => [...prev, newTranscript]);
  }, []);

  // Initialize Vapi when component mounts
  useEffect(() => {
    const vapi = initVapi();
    
    // Set up message listener to handle transcripts and end of call reports
    if (vapi) {
      // Listen to volume-level events to update micLevel
      vapi.on('volume-level', (level: number) => {
        setMicLevel(level);
      });
      // Message handler for transcripts and reports
      const handleMessage = async (message: any) => {
        console.log('Message received in AssistantContext:', message);
        
        // Debug all message types from Vapi
        if (message.type) {
          console.log(`Message type: ${message.type}`);
          console.log(`Transcript type: ${message.transcriptType}`);
          console.log(`Message role: ${message.role}`);
          console.log(`Message content: ${message.transcript || message.content}`);
        }
        
        // Handle transcripts
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          console.log('Adding new transcript to state');
          const newTranscript: Transcript = {
            id: Date.now() as unknown as number,
            callId: callDetails?.id || `call-${Date.now()}`,
            role: message.role,
            content: message.transcript,
            timestamp: new Date()
          };
          console.log('New transcript:', newTranscript);
          setTranscripts(prev => {
            console.log('Previous transcripts:', prev);
            const updated = [...prev, newTranscript];
            console.log('Updated transcripts:', updated);
            return updated;
          });
        }
        
        // Handle end of call report with summary
        if (message.type === 'end_of_call_report') {
          console.log('End of call report received:', message);
          
          // Get the summary content, with fallback if it's missing
          const summaryContent = message.summary || "No summary was provided by the assistant for this conversation.";
          
          // Create a new summary object
          const newSummary: CallSummary = {
            id: Date.now() as unknown as number,
            callId: callDetails?.id || `call-${Date.now()}`,
            content: summaryContent,
            timestamp: new Date()
          };
          
          // Set the summary in state so we can use it in Interface3
          setCallSummary(newSummary);
          
          console.log('Summary saved to context state:', newSummary);
          
          // Extract order details from summary
          try {
            console.log('Parsing Vapi summary to extract order details...');
            
            // Get the parsed details
            const parsedDetails = parseSummaryToOrderDetails(summaryContent);
            
            // Only update orderSummary if useful information was extracted
            if (Object.keys(parsedDetails).length > 0) {
              setOrderSummary(prevSummary => {
                if (!prevSummary) return initialOrderSummary;
                
                // Start with existing order summary
                const updatedSummary = { ...prevSummary };
                
                // Update with extracted information
                if (parsedDetails.orderType) updatedSummary.orderType = parsedDetails.orderType;
                if (parsedDetails.deliveryTime) updatedSummary.deliveryTime = parsedDetails.deliveryTime;
                if (parsedDetails.roomNumber) updatedSummary.roomNumber = parsedDetails.roomNumber;
                if (parsedDetails.specialInstructions) updatedSummary.specialInstructions = parsedDetails.specialInstructions;
                
                // Only update items if we extracted some
                if (parsedDetails.items && parsedDetails.items.length > 0) {
                  updatedSummary.items = parsedDetails.items;
                }
                
                // Update total amount
                if (parsedDetails.totalAmount) {
                  updatedSummary.totalAmount = parsedDetails.totalAmount;
                } else {
                  // Recalculate based on current items
                  updatedSummary.totalAmount = updatedSummary.items.reduce(
                    (total, item) => total + (item.price * item.quantity), 
                    0
                  );
                }
                
                console.log('Updated order summary with Vapi-extracted information:', updatedSummary);
                return updatedSummary;
              });
            }
          } catch (parseError) {
            console.error('Error extracting order details from Vapi summary:', parseError);
            // Keep existing order summary on error
          }
          
          // No need to manually update the container or send to server
          // This is now handled in vapiClient.ts to follow the vanilla JS approach
        }
      };
      
      vapi.on('message', handleMessage);
    }
    
    return () => {
      if (vapiInstance) {
        vapiInstance.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (currentInterface === 'interface2') {
      // Start call timer when in interface2
      console.log('Starting call duration timer in interface2');
      const timer = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
          console.log('Call duration updated:', newDuration);
          return newDuration;
        });
      }, 1000);
      setCallTimer(timer);
    } else {
      // Clear timer when not in interface2
      if (callTimer) {
        console.log('Clearing call duration timer when leaving interface2');
        clearInterval(callTimer);
        setCallTimer(null);
      }
    }

    return () => {
      if (callTimer) {
        console.log('Cleaning up call duration timer');
        clearInterval(callTimer);
      }
    };
  }, [currentInterface, callTimer]);

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  // Toggle mute state
  const toggleMute = () => {
    if (vapiInstance) {
      vapiInstance.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  // Start call function
  const startCall = async () => {
    console.log('Starting call...');
    // Record request received time
    setRequestReceivedAt(new Date());
    if (vapiInstance) {
      try {
        const assistant = import.meta.env.VITE_VAPI_ASSISTANT_ID || "demo";
        console.log('Starting call with assistant:', assistant);
        const call = await vapiInstance.start(assistant);
        console.log('Call started:', call);
        
        // Reset email sent flag for new call
        setEmailSentForCurrentSession(false);
        
        if (call) {
          console.log('Initializing call details');
          // Initialize call details - we don't set roomNumber here
          // as it should be asked for and extracted from conversation
          setCallDetails({
            id: call.id || `call-${Date.now()}`,
            roomNumber: '',
            duration: '00:00',
            category: 'Room Service'
          });
        } else {
          console.error("Failed to initialize call: call object is null");
        }
        
        // Clear previous transcripts
        console.log('Clearing previous transcripts');
        setTranscripts([]);
        
        // Change interface to call in progress
        console.log('Switching to interface2');
        setCurrentInterface('interface2');
        
        // Reset call duration
        console.log('Resetting call duration');
        setCallDuration(0);
      } catch (error) {
        console.error("Failed to start call:", error);
      }
    } else {
      console.error("Cannot start call: vapiInstance is null");
    }
  };

  // End call function
  const endCall = () => {
    if (vapiInstance) {
      vapiInstance.stop();
    }
    
    // Stop the timer
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    
    // Initialize with default values
    setOrderSummary(initialOrderSummary);
    
    // We'll update this with AI-generated data once the summary is received
    
    // Request OpenAI-generated summary from server using transcripts
    console.log('Requesting AI-generated summary from server...');
    
    // Format call duration for API
    const formattedDuration = callDuration ? 
      `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}` : 
      '0:00';
      
    console.log('Sending call duration to summary endpoint:', formattedDuration);
    
    // Prepare transcripts for the API
    const transcriptData = transcripts.map(message => ({
      role: message.role,
      content: message.content
    }));
    
    // Check if we have enough transcript data
    if (transcriptData.length < 2) {
      console.log('Not enough transcript data to generate summary');
      const noTranscriptSummary: CallSummary = {
        id: Date.now() as unknown as number,
        callId: callDetails?.id || `call-${Date.now()}`,
        content: "Call was too short to generate a summary. Please try a more detailed conversation.",
        timestamp: new Date()
      };
      setCallSummary(noTranscriptSummary);
      setCurrentInterface('interface3');
      return;
    }
    
    // Show loading state for summary
    const loadingSummary: CallSummary = {
      id: Date.now() as unknown as number,
      callId: callDetails?.id || `call-${Date.now()}`,
      content: "Generating AI summary of your conversation...",
      timestamp: new Date()
    };
    setCallSummary(loadingSummary);
    
    // Send transcript data to server for OpenAI processing
    fetch('/api/store-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Send empty summary so backend knows to generate one with OpenAI
        summary: '', 
        transcripts: transcriptData,
        timestamp: new Date().toISOString(),
        callId: callDetails?.id || `call-${Date.now()}`,
        // Send the call duration for storage
        callDuration: formattedDuration,
        // Use flag from vapiClient to force basic summary if needed
        forceBasicSummary: FORCE_BASIC_SUMMARY
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('AI-generated summary received:', data);
      
      // Update the call summary in state with the AI-generated one
      if (data.success && data.summary && data.summary.content) {
        const summaryContent = data.summary.content;
        
        // Create summary object
        const aiSummary: CallSummary = {
          id: Date.now() as unknown as number,
          callId: callDetails?.id || `call-${Date.now()}`,
          content: summaryContent,
          timestamp: new Date(data.summary.timestamp || Date.now())
        };
        setCallSummary(aiSummary);
        
        // Store any extracted service requests if available
        if (data.serviceRequests && Array.isArray(data.serviceRequests) && data.serviceRequests.length > 0) {
          console.log('Service requests extracted:', data.serviceRequests);
          setServiceRequests(data.serviceRequests);
        }
        
        // Extract order details from AI summary
        try {
          console.log('Parsing AI summary to extract order details...');
          
          // Get the parsed details
          const parsedDetails = parseSummaryToOrderDetails(summaryContent);
          
          // Only update orderSummary if the AI parsed useful information
          if (Object.keys(parsedDetails).length > 0) {
            // Create a new order summary by merging parsed details with defaults
            setOrderSummary(prevSummary => {
              if (!prevSummary) return initialOrderSummary;
              
              // Start with existing order summary
              const updatedSummary = { ...prevSummary };
              
              // Update with AI-extracted information, only if present
              if (parsedDetails.orderType) updatedSummary.orderType = parsedDetails.orderType;
              if (parsedDetails.deliveryTime) updatedSummary.deliveryTime = parsedDetails.deliveryTime;
              if (parsedDetails.roomNumber) updatedSummary.roomNumber = parsedDetails.roomNumber;
              if (parsedDetails.specialInstructions) updatedSummary.specialInstructions = parsedDetails.specialInstructions;
              
              // Only update items if we extracted some
              if (parsedDetails.items && parsedDetails.items.length > 0) {
                updatedSummary.items = parsedDetails.items;
              }
              
              // Update total amount based on items or extracted value
              if (parsedDetails.totalAmount) {
                updatedSummary.totalAmount = parsedDetails.totalAmount;
              } else {
                // Recalculate based on current items
                updatedSummary.totalAmount = updatedSummary.items.reduce(
                  (total, item) => total + (item.price * item.quantity), 
                  0
                );
              }
              
              console.log('Updated order summary with AI-extracted information:', updatedSummary);
              return updatedSummary;
            });
          }
        } catch (parseError) {
          console.error('Error extracting order details from AI summary:', parseError);
          // Keep existing order summary on error
        }
      }
    })
    .catch(error => {
      console.error('Error getting AI-generated summary:', error);
      
      // Fallback to basic summary if OpenAI fails
      const fallbackSummary: CallSummary = {
        id: Date.now() as unknown as number,
        callId: callDetails?.id || `call-${Date.now()}`,
        content: "Summary could not be generated. Please review the conversation transcript.",
        timestamp: new Date()
      };
      setCallSummary(fallbackSummary);
    });
    
    // Change interface to summary
    setCurrentInterface('interface3');
  };

  // Function to translate text to Vietnamese
  const translateToVietnamese = async (text: string): Promise<string> => {
    try {
      console.log('Requesting Vietnamese translation for summary...');
      const response = await fetch('/api/translate-to-vietnamese', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.translatedText) {
        // Save the translated text
        setVietnameseSummary(data.translatedText);
        return data.translatedText;
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Error translating to Vietnamese:', error);
      return 'Không thể dịch nội dung này sang tiếng Việt. Vui lòng thử lại sau.';
    }
  };

  const resetToCheckpoint = () => {
    setTranscripts([]);
    setOrderSummary(null);
    setCallSummary(null);
    setServiceRequests([]);
    setVietnameseSummary(null);
    setEmailSentForCurrentSession(false);
    setRequestReceivedAt(null);
    setActiveOrders([]);
    localStorage.removeItem('activeOrders');
  };

  // Save current state as a checkpoint
  const saveCheckpoint = (name?: string) => {
    const newCheckpoint: Checkpoint = {
      id: Date.now().toString(),
      name: name || `Checkpoint ${new Date().toLocaleString()}`,
      timestamp: new Date(),
      transcripts: [...transcripts],
      orderSummary: orderSummary ? { ...orderSummary } : null,
      callSummary: callSummary ? { ...callSummary } : null,
      serviceRequests: [...serviceRequests],
      vietnameseSummary,
      emailSentForCurrentSession,
      requestReceivedAt,
      activeOrders: [...activeOrders]
    };

    setCheckpoints(prev => {
      const updated = [...prev, newCheckpoint];
      // Keep only the last 10 checkpoints
      const trimmed = updated.slice(-10);
      localStorage.setItem('checkpoints', JSON.stringify(trimmed));
      return trimmed;
    });
  };

  // Load a specific checkpoint
  const loadCheckpoint = (checkpointId: string) => {
    const checkpoint = checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) return;

    setTranscripts([...checkpoint.transcripts]);
    setOrderSummary(checkpoint.orderSummary ? { ...checkpoint.orderSummary } : null);
    setCallSummary(checkpoint.callSummary ? { ...checkpoint.callSummary } : null);
    setServiceRequests([...checkpoint.serviceRequests]);
    setVietnameseSummary(checkpoint.vietnameseSummary);
    setEmailSentForCurrentSession(checkpoint.emailSentForCurrentSession);
    setRequestReceivedAt(checkpoint.requestReceivedAt);
    setActiveOrders([...checkpoint.activeOrders]);
    localStorage.setItem('activeOrders', JSON.stringify(checkpoint.activeOrders));
  };

  // Add function to check and fix checkpoint storage
  const checkAndFixCheckpointStorage = () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Check if checkpoints exist in localStorage
      const storedCheckpoints = localStorage.getItem('checkpoints');
      if (!storedCheckpoints) {
        console.log('No checkpoints found in localStorage');
        return;
      }

      // Try to parse the checkpoints
      const parsedCheckpoints = JSON.parse(storedCheckpoints);
      console.log('Current checkpoints in storage:', parsedCheckpoints);

      // Check if any checkpoints are from yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

      const yesterdayCheckpoints = parsedCheckpoints.filter((cp: any) => {
        const cpDate = format(new Date(cp.timestamp), 'yyyy-MM-dd');
        return cpDate === yesterdayStr;
      });

      console.log('Checkpoints from yesterday:', yesterdayCheckpoints);

      if (yesterdayCheckpoints.length === 0) {
        console.log('No checkpoints found from yesterday');
      }
    } catch (error) {
      console.error('Error checking checkpoint storage:', error);
    }
  };

  // Call the check function when component mounts
  useEffect(() => {
    checkAndFixCheckpointStorage();
  }, []);

  const value: AssistantContextType = {
    currentInterface,
    setCurrentInterface,
    transcripts,
    addTranscript,
    orderSummary,
    setOrderSummary,
    callDetails,
    setCallDetails,
    order,
    setOrder,
    callDuration,
    isMuted,
    toggleMute,
    startCall,
    endCall,
    callSummary,
    setCallSummary,
    serviceRequests,
    setServiceRequests,
    vietnameseSummary,
    setVietnameseSummary,
    translateToVietnamese,
    emailSentForCurrentSession,
    setEmailSentForCurrentSession,
    requestReceivedAt,
    setRequestReceivedAt,
    activeOrders,
    addActiveOrder,
    micLevel,
    resetToCheckpoint,
    checkpoints,
    saveCheckpoint,
    loadCheckpoint,
  };

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}