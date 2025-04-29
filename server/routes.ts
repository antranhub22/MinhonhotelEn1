import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from 'ws';
import { insertTranscriptSchema, insertOrderSchema, insertCallSummarySchema } from "@shared/schema";
import { z } from "zod";
import { generateCallSummary, generateBasicSummary, extractServiceRequests, translateToVietnamese } from "./openai";
import OpenAI from "openai";
// import { sendServiceConfirmation, sendCallSummary } from "./email";
import { sendServiceConfirmation, sendCallSummary } from "./gmail";
import { sendMobileEmail, sendMobileCallSummary } from "./mobileMail";
import axios from "axios";
import { Reference, IReference } from './models/Reference';
import express, { type Request, Response } from 'express';
import { verifyJWT } from './middleware/auth';

// Initialize OpenAI client 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define WebSocket client interface
interface WebSocketClient extends WebSocket {
  callId?: string;
  isAlive?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server for express app
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections
  const clients = new Set<WebSocketClient>();
  
  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocketClient) => {
    console.log('WebSocket client connected');
    
    // Add client to set
    clients.add(ws);
    ws.isAlive = true;
    
    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle initialization message
        if (data.type === 'init' && data.callId) {
          ws.callId = data.callId;
          console.log(`Client associated with call ID: ${data.callId}`);
        }
        
        // Xử lý cả transcript và transcript(final)
        if (
          (data.type === 'transcript' || data.type === 'transcript(final)') &&
          data.callId && data.role && data.content
        ) {
          const validatedData = {
            callId: data.callId,
            role: data.role,
            content: data.content,
            isFinal: data.type === 'transcript(final)',
            segmentId: data.segmentId,
            utteranceId: data.utteranceId
          };
          // Nếu schema chưa có các trường này, cần cập nhật schema InsertTranscript
          await storage.addTranscript(validatedData);

          // Broadcast lại cho client
          const outMsg = JSON.stringify({
            type: data.type,
            callId: data.callId,
            role: data.role,
            content: data.content,
            isFinal: data.type === 'transcript(final)',
            segmentId: data.segmentId,
            utteranceId: data.utteranceId,
            timestamp: new Date()
          });

          clients.forEach((client) => {
            if (client.callId === data.callId && client.readyState === WebSocket.OPEN) {
              client.send(outMsg);
            }
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
    
    // Send initial welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to Mi Nhon Hotel Voice Assistant'
    }));
  });
  
  // Set up ping interval to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocketClient) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  // API routes
  
  // Test OpenAI API endpoint
  app.post('/api/test-openai', async (req, res) => {
    try {
      const { message } = req.body;
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message || "Hello, give me a quick test response." }],
        max_tokens: 30
      });
      
      res.json({ 
        success: true, 
        message: response.choices[0].message.content,
        model: response.model,
        usage: response.usage
      });
    } catch (error: any) {
      console.error("OpenAI API test error:", error);
      res.status(500).json({ 
        error: "Error testing OpenAI API", 
        details: error.message,
        code: error.code
      });
    }
  });
  
  // API endpoints for call summaries will be defined below
  
  // Get transcripts by call ID
  app.get('/api/transcripts/:callId', async (req, res) => {
    try {
      const callId = req.params.callId;
      const transcripts = await storage.getTranscriptsByCallId(callId);
      res.json(transcripts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve transcripts' });
    }
  });
  
  // Create new order
  app.post('/api/orders', async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid order data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create order' });
      }
    }
  });
  
  // Get order by ID
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve order' });
    }
  });
  
  // Get orders by room number
  app.get('/api/orders/room/:roomNumber', async (req, res) => {
    try {
      const roomNumber = req.params.roomNumber;
      const orders = await storage.getOrdersByRoomNumber(roomNumber);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve orders' });
    }
  });
  
  // Update order status
  app.patch('/api/orders/:id/status', verifyJWT, async (req: Request, res: Response) => {
    // Parse order ID to number
    const idNum = parseInt(req.params.id, 10);
    const { status } = req.body;
    
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const updatedOrder = await storage.updateOrderStatus(idNum, status);
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(updatedOrder);
  });
  
  // Staff: get all orders, optionally filter by status, room, time
  app.get('/api/staff/orders', verifyJWT, async (req: Request, res: Response) => {
    try {
      const { status, roomNumber } = req.query;
      const orders = await storage.getAllOrders({
        status: status as string,
        roomNumber: roomNumber as string
      });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve staff orders' });
    }
  });
  
  // Endpoint to update status via POST
  app.post('/api/orders/:id/update-status', verifyJWT, async (req: Request, res: Response) => {
    // Parse order ID to number
    const idNum = parseInt(req.params.id, 10);
    const { status } = req.body;
    try {
      const updatedOrder = await storage.updateOrderStatus(idNum, status);
      // Emit WebSocket notification
      const io = req.app.get('io');
      io.to(String(idNum)).emit('order_status_update', { orderId: String(idNum), status });
      res.json(updatedOrder);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });
  
  // Store call summary from Vapi or generate with OpenAI
  app.post('/api/store-summary', async (req, res) => {
    try {
      const { callId, transcripts } = req.body;
      if (!callId || !transcripts) {
        return res.status(400).json({ error: "Missing callId or transcripts" });
      }

      let fullSummary = '';
      // Use streaming summary generation and broadcast each chunk
      fullSummary = await generateCallSummary(transcripts, (chunk) => {
        broadcastAssistantResponse(callId, chunk, true); // true = isChunk
      });

      // After streaming, send the full summary as the final message
      broadcastAssistantResponse(callId, fullSummary, false); // false = isChunk

      return res.json({ summary: fullSummary });
    } catch (error) {
      console.error("Error in /api/store-summary:", error);
      return res.status(500).json({ error: "Failed to store summary" });
    }
  });
  
  // Get call summary by call ID
  app.get('/api/summaries/:callId', async (req, res) => {
    try {
      const callId = req.params.callId;
      
      // Don't process if the parameter looks like a number (hours)
      if (/^\d+$/.test(callId)) {
        return res.status(404).json({ error: 'Call summary not found' });
      }
      
      const summary = await storage.getCallSummaryByCallId(callId);
      
      if (!summary) {
        return res.status(404).json({ error: 'Call summary not found' });
      }
      
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve call summary' });
    }
  });
  
  // Get recent call summaries (within the last X hours)
  app.get('/api/summaries/recent/:hours', async (req, res) => {
    try {
      const hours = parseInt(req.params.hours) || 24; // Default to 24 hours if not specified
      
      // Ensure hours is a reasonable value
      const validHours = Math.min(Math.max(1, hours), 72); // Between 1 and 72 hours
      
      const summaries = await storage.getRecentCallSummaries(validHours);
      
      // Pass through orderReference for each summary
      const mapped = summaries.map(s => ({
        id: s.id,
        callId: s.callId,
        roomNumber: s.roomNumber,
        content: s.content,
        timestamp: s.timestamp,
        duration: s.duration
      }));
      res.json({
        success: true,
        count: summaries.length,
        timeframe: `${validHours} hours`,
        summaries: mapped
      });
    } catch (error) {
      console.error('Error retrieving recent call summaries:', error);
      res.status(500).json({ error: 'Failed to retrieve recent call summaries' });
    }
  });

  // Translate text to Vietnamese
  app.post('/api/translate-to-vietnamese', async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text content is required' });
      }
      
      const translatedText = await translateToVietnamese(text);
      
      res.json({
        success: true,
        translatedText
      });
    } catch (error) {
      console.error('Error translating text to Vietnamese:', error);
      res.status(500).json({ error: 'Failed to translate text to Vietnamese' });
    }
  });

  // Send service confirmation email
  app.post('/api/send-service-email', async (req, res) => {
    try {
      const { toEmail, serviceDetails } = req.body;
      
      if (!toEmail || !serviceDetails || !serviceDetails.serviceType || !serviceDetails.roomNumber) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Tạo mã tham chiếu nếu chưa có
      const orderReference = serviceDetails.orderReference || 
                           `#ORD-${Math.floor(10000 + Math.random() * 90000)}`;
      
      // Kiểm tra và dịch details sang tiếng Việt nếu cần
      let vietnameseDetails = serviceDetails.details || '';
      
      if (vietnameseDetails && !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(vietnameseDetails)) {
        try {
          console.log('Dịch chi tiết dịch vụ sang tiếng Việt trước khi gửi email');
          vietnameseDetails = await translateToVietnamese(vietnameseDetails);
        } catch (translateError) {
          console.error('Lỗi khi dịch chi tiết dịch vụ sang tiếng Việt:', translateError);
          // Tiếp tục sử dụng bản chi tiết gốc nếu không dịch được
        }
      }
      
      const result = await sendServiceConfirmation(toEmail, {
        serviceType: serviceDetails.serviceType,
        roomNumber: serviceDetails.roomNumber,
        timestamp: new Date(serviceDetails.timestamp || Date.now()),
        details: vietnameseDetails,
        orderReference: orderReference // Thêm mã tham chiếu
      });
      
      if (result.success) {
        res.json({
          success: true,
          messageId: result.messageId,
          orderReference: orderReference // Trả về mã tham chiếu để hiển thị cho người dùng
        });
      } else {
        throw new Error(result.error?.toString() || 'Unknown error');
      }
    } catch (error) {
      console.error('Error sending service confirmation email:', error);
      res.status(500).json({ error: 'Failed to send service confirmation email' });
    }
  });
  
  // Send call summary email
  app.post('/api/send-call-summary-email', async (req, res) => {
    try {
      const { callDetails } = req.body;
      // Read recipients list from env (comma-separated), fallback to req.body.toEmail
      const recipientsEnv = process.env.SUMMARY_EMAILS || '';
      const toEmails = recipientsEnv
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      if (toEmails.length === 0 && req.body.toEmail) {
        toEmails.push(req.body.toEmail);
      }

      if (!callDetails || !callDetails.roomNumber || !callDetails.summary) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Tạo mã tham chiếu nếu chưa có
      const orderReference = callDetails.orderReference || 
                             `#ORD-${Math.floor(10000 + Math.random() * 90000)}`;
      
      // Nếu summary không phải tiếng Việt, thì dịch sang tiếng Việt
      let vietnameseSummary = callDetails.summary;
      
      if (!/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(callDetails.summary)) {
        try {
          console.log('Dịch tóm tắt sang tiếng Việt trước khi gửi email');
          vietnameseSummary = await translateToVietnamese(callDetails.summary);
        } catch (translateError) {
          console.error('Lỗi khi dịch tóm tắt sang tiếng Việt:', translateError);
          // Tiếp tục sử dụng bản tóm tắt gốc nếu không dịch được
        }
      }
      
      // Dịch cả danh sách dịch vụ nếu có
      const vietnameseServiceRequests = [];
      if (callDetails.serviceRequests && callDetails.serviceRequests.length > 0) {
        for (const request of callDetails.serviceRequests) {
          if (!/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(request)) {
            try {
              const translatedRequest = await translateToVietnamese(request);
              vietnameseServiceRequests.push(translatedRequest);
            } catch (error) {
              console.error('Lỗi khi dịch yêu cầu dịch vụ:', error);
              vietnameseServiceRequests.push(request); // Sử dụng bản gốc nếu không dịch được
            }
          } else {
            vietnameseServiceRequests.push(request); // Đã là tiếng Việt
          }
        }
      }
      
      // Send call summary to each recipient
      const results = [];
      for (const toEmail of toEmails) {
        const result = await sendCallSummary(toEmail, {
          callId: callDetails.callId || 'unknown',
          roomNumber: callDetails.roomNumber,
          timestamp: new Date(callDetails.timestamp || Date.now()),
          duration: callDetails.duration || '0:00',
          summary: vietnameseSummary, // Sử dụng bản tóm tắt tiếng Việt
          serviceRequests: vietnameseServiceRequests.length > 0 ? vietnameseServiceRequests : callDetails.serviceRequests || [],
          orderReference: orderReference // Thêm mã tham chiếu
        });
        results.push(result);
      }
      
      // Respond based on overall success
      if (results.every((r) => r.success)) {
        res.json({ success: true, recipients: toEmails, orderReference });
      } else {
        throw new Error('Failed to send call summary to all recipients');
      }
    } catch (error) {
      console.error('Error sending call summary email:', error);
      res.status(500).json({ error: 'Failed to send call summary email' });
    }
  });
  
  // Test email configuration
  app.post('/api/test-email', async (req, res) => {
    try {
      // Check Gmail credentials first (preferred method)
      if (process.env.GMAIL_APP_PASSWORD) {
        console.log('Using Gmail for test email');
      } else if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
        console.log('Using Mailjet for test email');
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Email credentials not configured',
          missingEnv: true
        });
      }
      
      const { toEmail, isMobile } = req.body;
      
      if (!toEmail) {
        return res.status(400).json({ error: 'Recipient email is required' });
      }
      
      console.log(`Sending test email to ${toEmail} (${isMobile ? 'mobile device' : 'desktop'})`);
      
      // Send a simple test email
      const result = await sendServiceConfirmation(toEmail, {
        serviceType: 'Mobile Test Email',
        roomNumber: isMobile ? 'MOBILE-TEST' : 'DESKTOP-TEST',
        timestamp: new Date(),
        details: `Đây là email kiểm tra từ Mi Nhon Hotel Voice Assistant. Sent from ${isMobile ? 'MOBILE' : 'DESKTOP'} at ${new Date().toISOString()}`,
      });
      
      console.log('Email test result:', result);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Test email sent successfully',
          messageId: result.messageId,
          provider: process.env.GMAIL_APP_PASSWORD ? 'gmail' : 'mailjet'
        });
      } else {
        throw new Error(result.error?.toString() || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to send test email',
        details: error?.message || String(error)
      });
    }
  });
  
  // Mobile-friendly test endpoint with simplified response
  app.post('/api/mobile-test-email', async (req, res) => {
    try {
      console.log('Mobile test email requested');
      
      // Default email if not provided
      const toEmail = req.body.toEmail || 'tuans2@gmail.com';
      
      // Xác định loại thiết bị gửi request
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = /iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry/i.test(userAgent);
      
      // Ghi log chi tiết
      console.log('=================== MOBILE EMAIL TEST ===================');
      console.log('Time:', new Date().toISOString());
      console.log('Device info:', userAgent);
      console.log('Device type:', isMobile ? 'MOBILE' : 'DESKTOP');
      console.log('Recipient:', toEmail);
      console.log('=========================================================');
      
      // Send with timeout to ensure request completes and return response immediately
      setTimeout(async () => {
        try {
          // Sử dụng phương thức đặc biệt cho thiết bị di động
          if (isMobile) {
            console.log('Gửi email qua phương thức chuyên biệt cho thiết bị di động...');
            
            const result = await sendMobileEmail(
              toEmail,
              'Mi Nhon Hotel - Test từ thiết bị di động',
              `Đây là email kiểm tra được gửi từ thiết bị di động lúc ${new Date().toLocaleTimeString()}.
              
Thiết bị: ${userAgent}
              
Thông báo này xác nhận rằng hệ thống gửi email trên thiết bị di động đang hoạt động bình thường.
              
Trân trọng,
Mi Nhon Hotel Mui Ne`
            );
            
            console.log('Kết quả gửi email qua mobile mail:', result);
          } 
          // Cho thiết bị desktop sử dụng phương thức thông thường
          else {
            console.log('Gửi email với phương thức thông thường...');
            const result = await sendServiceConfirmation(toEmail, {
              serviceType: 'Mobile Test',
              roomNumber: 'DEVICE-TEST',
              timestamp: new Date(),
              details: `Email kiểm tra gửi từ thiết bị ${isMobile ? 'di động' : 'desktop'} lúc ${new Date().toLocaleTimeString()}. UA: ${userAgent}`,
            });
            
            console.log('Kết quả gửi email thông thường:', result);
          }
        } catch (innerError) {
          console.error('Lỗi trong timeout callback:', innerError);
          console.error('Chi tiết lỗi:', JSON.stringify(innerError));
        }
      }, 50); // Giảm thời gian chờ xuống để di động xử lý nhanh hơn
      
      // Return success immediately to avoid mobile browser timeout
      res.status(200).json({
        success: true,
        message: 'Email đang được xử lý, vui lòng kiểm tra hộp thư sau giây lát',
        deviceType: isMobile ? 'mobile' : 'desktop',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error in mobile test email endpoint:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });
  
  // Endpoint gửi email tóm tắt cuộc gọi từ thiết bị di động
  app.post('/api/mobile-call-summary-email', async (req, res) => {
    try {
      const { toEmail, callDetails } = req.body;
      
      // Kiểm tra dữ liệu đầu vào
      if (!toEmail || !callDetails || !callDetails.roomNumber || !callDetails.summary) {
        return res.status(400).json({ 
          success: false, 
          error: 'Thiếu thông tin cần thiết để gửi email',
          missingFields: true
        });
      }
      
      // Xác định thiết bị
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = /iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry/i.test(userAgent);
      
      console.log('=================== MOBILE CALL SUMMARY EMAIL ===================');
      console.log('Time:', new Date().toISOString());
      console.log('Device:', isMobile ? 'MOBILE' : 'DESKTOP');
      console.log('Room:', callDetails.roomNumber);
      console.log('Recipient:', toEmail);
      console.log('==============================================================');
      
      // Tạo mã tham chiếu
      const orderReference = callDetails.orderReference || 
                           `#ORD-${Math.floor(10000 + Math.random() * 90000)}`;
      
      // Gửi email ngay lập tức và trả về kết quả thành công trước
      res.status(200).json({
        success: true,
        message: 'Email đang được xử lý, vui lòng kiểm tra hộp thư sau giây lát',
        orderReference: orderReference,
        timestamp: new Date().toISOString()
      });
      
      // Phần xử lý bất đồng bộ gửi email
      try {
        console.log('Đang xử lý gửi email tóm tắt cuộc gọi từ thiết bị di động...');
        
        // Thực hiện gửi email
        const result = await sendMobileCallSummary(toEmail, {
          callId: callDetails.callId || 'unknown',
          roomNumber: callDetails.roomNumber,
          timestamp: new Date(callDetails.timestamp || Date.now()),
          duration: callDetails.duration || '0:00',
          summary: callDetails.summary,
          serviceRequests: callDetails.serviceRequests || [],
          orderReference: orderReference
        });
        
        console.log('Kết quả gửi email tóm tắt cuộc gọi từ thiết bị di động:', result);
      } catch (sendError) {
        console.error('Lỗi khi gửi email tóm tắt từ thiết bị di động:', sendError);
        // Không cần trả về lỗi cho client vì đã trả về success trước đó
      }
    } catch (error: any) {
      console.error('Lỗi trong endpoint mobile-call-summary-email:', error);
      // Trường hợp lỗi ngay từ đầu, trả về lỗi cho client
      res.status(500).json({ 
        success: false, 
        error: 'Lỗi server khi xử lý yêu cầu gửi email từ thiết bị di động' 
      });
    }
  });
  
  // Kiểm tra API key và trạng thái của Mailjet
  app.get('/api/mailjet-status', async (req, res) => {
    try {
      // Kiểm tra xem API key của Mailjet có được thiết lập hay không
      if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
        return res.status(400).json({ 
          success: false, 
          error: 'Mailjet credentials not configured',
          missingEnv: true
        });
      }
      
      // Gửi request kiểm tra đến Mailjet API
      try {
        const response = await axios.get('https://api.mailjet.com/v3/REST/sender', {
          auth: {
            username: process.env.MAILJET_API_KEY,
            password: process.env.MAILJET_SECRET_KEY
          }
        });
        
        // Nếu API trả về thành công, trả về thông tin sender (công ty gửi email)
        res.json({
          success: true,
          mailjetConnected: true,
          apiKey: `${process.env.MAILJET_API_KEY.substring(0, 4)}...`,
          totalSenders: response.data.Count,
          senders: response.data.Data.map((sender: any) => ({
            email: sender.Email,
            name: sender.Name,
            status: sender.Status
          }))
        });
      } catch (apiError: any) {
        console.error('Lỗi khi kết nối đến Mailjet API:', apiError.message);
        // Nếu kết nối thất bại, trả về thông tin lỗi
        res.status(500).json({
          success: false,
          mailjetConnected: false,
          error: 'Không thể kết nối đến Mailjet API',
          details: apiError.response?.data || apiError.message
        });
      }
    } catch (error: any) {
      console.error('Lỗi khi kiểm tra trạng thái Mailjet:', error);
      res.status(500).json({ 
        success: false,
        error: 'Lỗi khi kiểm tra trạng thái Mailjet',
        details: error.message || String(error)
      });
    }
  });
  
  // Kiểm tra tất cả các email đã gửi gần đây
  app.get('/api/recent-emails', async (req, res) => {
    try {
      if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
        return res.status(400).json({ 
          success: false, 
          error: 'Mailjet credentials not configured',
          missingEnv: true
        });
      }
      
      console.log('Lấy danh sách email gần đây từ Mailjet');
      
      // Gửi request trực tiếp đến Mailjet API
      try {
        const result = await axios.get('https://api.mailjet.com/v3/REST/message?Limit=20', {
          auth: {
            username: process.env.MAILJET_API_KEY as string,
            password: process.env.MAILJET_SECRET_KEY as string
          }
        });
        
        // Kiểm tra và xử lý kết quả
        if (result && result.data && Array.isArray(result.data.Data)) {
          console.log(`Tìm thấy ${result.data.Count} email gần đây`);
          
          // Chuyển đổi kết quả thành định dạng dễ đọc
          const emails = result.data.Data.map((message: any) => ({
            messageId: message.ID,
            status: message.Status || 'Unknown',
            to: message.Recipients && message.Recipients[0] ? message.Recipients[0].Email : 'Unknown',
            from: message.Sender ? message.Sender.Email : 'Unknown',
            subject: message.Subject || 'No subject',
            sentAt: message.ArrivedAt || 'Unknown',
          }));
          
          res.json({
            success: true,
            count: emails.length,
            emails: emails
          });
        } else {
          throw new Error('Định dạng dữ liệu không hợp lệ từ Mailjet API');
        }
      } catch (apiError: any) {
        console.error('Lỗi khi lấy dữ liệu email từ Mailjet:', apiError.message);
        res.status(500).json({
          success: false,
          error: 'Không thể lấy dữ liệu email từ Mailjet',
          details: apiError.response?.data || apiError.message
        });
      }
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách email gần đây:', error);
      res.status(500).json({ 
        success: false,
        error: 'Lỗi khi lấy danh sách email gần đây',
        details: error.message || String(error)
      });
    }
  });

  // Simple endpoint to test database connectivity
  app.get('/api/db-test', async (req, res) => {
    try {
      // Try a simple read operation
      const recent = await storage.getRecentCallSummaries(1);
      return res.json({ success: true, count: recent.length });
    } catch (dbError: any) {
      console.error('DB test error:', dbError);
      return res.status(500).json({ success: false, error: dbError.message });
    }
  });

  // Get references for a specific call
  app.get('/api/references/:callId', async (req, res) => {
    try {
      const { callId } = req.params;
      const references = await Reference.find({ callId }).sort({ createdAt: -1 });
      res.json(references);
    } catch (error) {
      console.error('Error fetching references:', error);
      res.status(500).json({ error: 'Failed to fetch references' });
    }
  });

  // Add a new reference
  app.post('/api/references', async (req, res) => {
    try {
      const referenceData: IReference = req.body;
      const reference = new Reference(referenceData);
      await reference.save();
      res.status(201).json(reference);
    } catch (error) {
      console.error('Error creating reference:', error);
      res.status(500).json({ error: 'Failed to create reference' });
    }
  });

  // Delete a reference
  app.delete('/api/references/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await Reference.findByIdAndDelete(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting reference:', error);
      res.status(500).json({ error: 'Failed to delete reference' });
    }
  });

  // Serve reference map from environment variable
  app.get('/api/reference-map', (_req, res) => {
    try {
      const raw = process.env.REFERENCE_MAP || '{}';
      const map = JSON.parse(raw);
      res.json(map);
    } catch (error) {
      console.error('Invalid REFERENCE_MAP env var:', error);
      res.status(500).json({ error: 'Invalid REFERENCE_MAP JSON' });
    }
  });

  // Utility function to broadcast assistant response to all clients with the same callId
  function broadcastAssistantResponse(callId: string, assistantReplyText: string, isChunk: boolean) {
    clients.forEach((client) => {
      if (client.callId === callId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'assistantResponse',
          callId,
          assistant_reply_text: isChunk ? assistantReplyText : '',
          timestamp: new Date()
        }));
      }
    });
  }

  return httpServer;
}
