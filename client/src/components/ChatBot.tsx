import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Box, VStack, HStack, Text, IconButton, useColorModeValue } from '@chakra-ui/react';
import { FiSend, FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import { findBestMatch } from '@/utils/knowledgeBase';
import { searchTrieveKnowledge } from '@/services/trieve';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Xin chào! Tôi là trợ lý ảo của Minhon Hotel. Tôi có thể giúp gì cho bạn?\nBạn có thể hỏi tôi về:\n- Các loại phòng\n- Giá phòng\n- Tiện nghi khách sạn\n- Cách đặt phòng\n- Phương thức thanh toán\n- Hoặc bất kỳ thông tin nào về khách sạn",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // First try to get response from Trieve
      const trieveResults = await searchTrieveKnowledge(inputMessage);
      
      if (trieveResults.length > 0) {
        // Use the best matching result from Trieve
        const bestResult = trieveResults[0];
        const botResponse: Message = {
          text: bestResult.text,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      } else {
        // Fallback to local knowledge base
        const localResponse = getBotResponse(inputMessage);
        const botResponse: Message = {
          text: localResponse,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      }
    } catch (error) {
      console.error('Error getting response:', error);
      // Fallback to local knowledge base
      const localResponse = getBotResponse(inputMessage);
      const botResponse: Message = {
        text: localResponse,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Check for greetings first
    if (input.includes('xin chào') || input.includes('hello') || input.includes('hi')) {
      return 'Xin chào! Tôi có thể giúp gì cho bạn?';
    }

    // Check for thank you messages
    if (input.includes('thank') || input.includes('cảm ơn')) {
      return 'Rất vui được giúp đỡ bạn! Nếu bạn cần thêm thông tin gì, đừng ngần ngại hỏi tôi nhé.';
    }

    // Search in local knowledge base
    const match = findBestMatch(input);
    if (match) {
      return match.answer;
    }
    
    return 'Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi về:\n- Các loại phòng\n- Giá phòng\n- Tiện nghi khách sạn\n- Cách đặt phòng\n- Phương thức thanh toán\nHoặc bất kỳ thông tin nào về khách sạn';
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <Box
      position="fixed"
      bottom="20px"
      right="20px"
      width="350px"
      height={isMinimized ? "auto" : "500px"}
      bg={bg}
      borderRadius="lg"
      boxShadow="lg"
      border="1px"
      borderColor={borderColor}
      zIndex={1000}
    >
      <VStack h="100%" spacing={0}>
        <Box
          w="100%"
          p={4}
          borderBottom={isMinimized ? "none" : "1px"}
          borderColor={borderColor}
          bg="blue.500"
          color="white"
          borderTopRadius="lg"
          cursor="pointer"
          onClick={toggleMinimize}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text fontWeight="bold">Minhon Hotel Assistant</Text>
          <IconButton
            aria-label={isMinimized ? "Maximize" : "Minimize"}
            icon={isMinimized ? <FiMaximize2 /> : <FiMinimize2 />}
            size="sm"
            variant="ghost"
            color="white"
            _hover={{ bg: 'blue.600' }}
            onClick={toggleMinimize}
          />
        </Box>

        {!isMinimized && (
          <>
            <VStack
              flex={1}
              w="100%"
              overflowY="auto"
              spacing={4}
              p={4}
              alignItems="stretch"
            >
              {messages.map((message, index) => (
                <HStack
                  key={index}
                  alignSelf={message.isUser ? 'flex-end' : 'flex-start'}
                  maxW="80%"
                >
                  <Box
                    bg={message.isUser ? 'blue.500' : 'gray.100'}
                    color={message.isUser ? 'white' : 'black'}
                    px={4}
                    py={2}
                    borderRadius="lg"
                  >
                    <Text fontSize="sm" whiteSpace="pre-line">{message.text}</Text>
                  </Box>
                </HStack>
              ))}
              <div ref={messagesEndRef} />
            </VStack>

            <HStack p={4} w="100%" spacing={2}>
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                placeholder={isLoading ? "Đang xử lý..." : "Nhập tin nhắn..."}
                size="md"
                disabled={isLoading}
              />
              <IconButton
                aria-label="Send message"
                icon={<FiSend />}
                onClick={handleSendMessage}
                colorScheme="blue"
                isLoading={isLoading}
                disabled={isLoading}
              />
            </HStack>
          </>
        )}
      </VStack>
    </Box>
  );
}; 