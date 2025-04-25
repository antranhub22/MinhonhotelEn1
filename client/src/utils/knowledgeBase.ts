interface KnowledgeItem {
  keywords: string[];
  question: string;
  answer: string;
}

export const knowledgeBase: KnowledgeItem[] = [
  {
    keywords: ['phòng', 'room', 'loại phòng'],
    question: 'Khách sạn có những loại phòng nào?',
    answer: 'Khách sạn Minhon có các loại phòng:\n1. Phòng Standard (25m²)\n2. Phòng Deluxe (35m²)\n3. Phòng Suite (50m²)\n4. Phòng Family (45m²)\nMỗi loại phòng đều được trang bị đầy đủ tiện nghi hiện đại.'
  },
  {
    keywords: ['giá', 'price', 'chi phí', 'cost'],
    question: 'Giá phòng như thế nào?',
    answer: 'Giá phòng của chúng tôi:\n- Standard: từ 800.000đ/đêm\n- Deluxe: từ 1.200.000đ/đêm\n- Suite: từ 2.000.000đ/đêm\n- Family: từ 1.800.000đ/đêm\n(Giá có thể thay đổi theo mùa và các chương trình khuyến mãi)'
  },
  {
    keywords: ['tiện nghi', 'amenities', 'facilities', 'dịch vụ', 'service'],
    question: 'Khách sạn có những tiện nghi gì?',
    answer: 'Khách sạn cung cấp đầy đủ tiện nghi:\n- Nhà hàng phục vụ 24/7\n- Hồ bơi ngoài trời\n- Phòng gym hiện đại\n- Spa & massage\n- Dịch vụ đưa đón sân bay\n- Phòng họp & hội nghị\n- WiFi miễn phí tốc độ cao\n- Bãi đậu xe riêng'
  },
  {
    keywords: ['địa chỉ', 'location', 'đường', 'where'],
    question: 'Khách sạn ở đâu?',
    answer: 'Khách sạn Minhon tọa lạc tại trung tâm thành phố, địa chỉ: [Địa chỉ của khách sạn]. Cách sân bay 15 phút di chuyển, gần các điểm tham quan và trung tâm mua sắm.'
  },
  {
    keywords: ['đặt phòng', 'booking', 'reserve'],
    question: 'Làm thế nào để đặt phòng?',
    answer: 'Bạn có thể đặt phòng qua các cách sau:\n1. Đặt trực tiếp trên website của chúng tôi\n2. Gọi số hotline: [Số điện thoại]\n3. Email về: [Email]\n4. Đặt qua các đối tác như Booking.com, Agoda\nChúng tôi sẽ xác nhận đặt phòng trong vòng 24 giờ.'
  },
  {
    keywords: ['thanh toán', 'payment', 'trả tiền'],
    question: 'Có những hình thức thanh toán nào?',
    answer: 'Chúng tôi chấp nhận các hình thức thanh toán:\n- Tiền mặt\n- Thẻ tín dụng/ghi nợ (Visa, Mastercard, JCB)\n- Chuyển khoản ngân hàng\n- Ví điện tử (Momo, VNPay, ZaloPay)\nĐặt phòng online yêu cầu đặt cọc 30% giá trị.'
  }
];

export const findBestMatch = (input: string): KnowledgeItem | null => {
  const normalizedInput = input.toLowerCase();
  let bestMatch: KnowledgeItem | null = null;
  let maxMatches = 0;

  for (const item of knowledgeBase) {
    const matches = item.keywords.filter(keyword => 
      normalizedInput.includes(keyword.toLowerCase())
    ).length;

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = item;
    }
  }

  return maxMatches > 0 ? bestMatch : null;
}; 