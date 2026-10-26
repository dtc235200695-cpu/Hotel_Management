import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Bot, User, Sparkles, RefreshCw, 
  ChevronDown, Phone, Calendar, Bed, Check, ExternalLink, HelpCircle
} from 'lucide-react';

export default function HotelChatbot({ viewMode = 'PUBLIC', user = null, onAction = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: viewMode === 'PMS'
        ? `Xin chào **${user?.full_name || 'Quản lý / Lễ tân'}**! 👋 Tôi là **HotelCloud PMS Assistant**. Bạn có thể hỏi tôi về: tình trạng phòng trống, báo cáo doanh thu, danh sách phòng cần dọn dẹp hoặc tra cứu hồ sơ khách hàng.`
        : `Kính chào Quý khách! 🌟 Tôi là **HotelCloud AI Concierge** — Trợ lý ảo 24/7 của khách sạn.\n\nTôi có thể hỗ trợ Quý khách:\n• 🏨 **Báo giá & gợi ý hạng phòng** (Standard, Deluxe, Suite...)\n• 🔍 **Tra cứu đơn đặt phòng** qua mã hoặc số điện thoại\n• ⏰ **Quy định Check-in (14h) & Check-out (12h)**\n• 🏊 **Dịch vụ Spa, Buffet sáng, xe đưa đón sân bay**`,
      cards: null,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load suggestions on mode change or open
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/chatbot/suggestions?mode=${viewMode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.suggestions) {
            setSuggestions(data.suggestions);
          }
        }
      } catch (e) {
        // Fallback default suggestions
        setSuggestions(viewMode === 'PMS' ? [
          '📊 Báo cáo doanh thu & công suất',
          '🛎️ Hiện có bao nhiêu phòng trống?',
          '🧹 Danh sách phòng cần dọn'
        ] : [
          '🏨 Khách sạn có những hạng phòng nào?',
          '🔍 Tra cứu đơn đặt phòng của tôi',
          '⏰ Quy định giờ nhận & trả phòng',
          '🚗 Xe đưa đón sân bay'
        ]);
      }
    };
    fetchSuggestions();
  }, [viewMode]);

  // Hide tooltip after 8s
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context: {
            viewMode,
            role: user?.role || 'GUEST',
            userName: user?.full_name || 'Quý khách'
          }
        })
      });

      if (!res.ok) throw new Error('Không thể kết nối đến máy chủ chatbot');

      const data = await res.json();
      
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply || 'Cảm ơn bạn. Tôi đã ghi nhận yêu cầu của bạn.',
        cards: data.cards || null,
        action: data.action || null,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: '⚠️ Xin lỗi quý khách, hiện tại hệ thống AI đang bận. Quý khách vui lòng thử lại hoặc gọi hotline lễ tân: **0236 3888 999** để được hỗ trợ tức thì.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: 'Cuộc trò chuyện đã được làm mới. Tôi có thể hỗ trợ thông tin gì cho quý khách?',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Helper to format text with basic markdown (bold, bullet points)
  const renderFormattedText = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold replacement
      let parsed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic replacement
      parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Code replacement
      parsed = parsed.replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: #f59e0b;">$1</code>');

      return (
        <p 
          key={idx} 
          style={{ margin: line === '' ? '0.4rem 0' : '0.2rem 0', minHeight: line === '' ? '0.5rem' : 'auto' }}
          dangerouslySetInnerHTML={{ __html: parsed }} 
        />
      );
    });
  };

  return (
    <>
      {/* Tooltip hint on initial load */}
      {!isOpen && showTooltip && (
        <div 
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            borderRadius: '16px',
            padding: '12px 18px',
            maxWidth: '280px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.2)',
            zIndex: 999,
            cursor: 'pointer',
            animation: 'fadeInUp 0.4s ease-out'
          }}
          onClick={() => {
            setIsOpen(true);
            setShowTooltip(false);
            setHasUnread(false);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.2rem' }}>🛎️</span>
            <strong style={{ color: '#d4af37', fontSize: '0.85rem' }}>HotelCloud AI Concierge</strong>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', marginLeft: 'auto', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            Hỏi giá phòng, tra cứu đơn hoặc dịch vụ 24/7. Nhấp để trò chuyện!
          </p>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setShowTooltip(false);
            setHasUnread(false);
          }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #d4af37 0%, #aa8010 100%)',
            color: '#0f172a',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.45), 0 2px 6px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: 'scale(1)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Mở Trợ lý ảo HotelCloud AI"
        >
          <MessageSquare size={26} strokeWidth={2.2} />
          {hasUnread && (
            <span 
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ef4444',
                border: '2px solid #0f172a',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s infinite'
              }}
            >
              1
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            height: '600px',
            maxHeight: 'calc(100vh - 48px)',
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 25px rgba(212, 175, 55, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1001,
            animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
              borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{
                  position: 'relative',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #d4af37, #996515)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f172a',
                  boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
                }}
              >
                <Bot size={24} />
                <span 
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2px solid #0f172a'
                  }}
                  title="Đang trực tuyến 24/7"
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#fff', fontWeight: 600, letterSpacing: '0.3px' }}>
                    HotelCloud AI
                  </h4>
                  <span 
                    style={{
                      fontSize: '0.65rem',
                      background: viewMode === 'PMS' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                      color: viewMode === 'PMS' ? '#60a5fa' : '#d4af37',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      border: viewMode === 'PMS' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)'
                    }}
                  >
                    {viewMode === 'PMS' ? 'PMS Staff' : 'Guest 24/7'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Sparkles size={11} color="#d4af37" />
                  <span>Trợ lý thông minh khách sạn</span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handleResetChat}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="Làm mới cuộc trò chuyện"
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                <RefreshCw size={15} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="Thu nhỏ"
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'radial-gradient(circle at top right, rgba(212, 175, 55, 0.03), transparent 60%)'
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: '4px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    maxWidth: '88%',
                    flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: msg.sender === 'user' 
                        ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                        : 'linear-gradient(135deg, #d4af37, #996515)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: msg.sender === 'user' ? '#fff' : '#0f172a',
                      flexShrink: 0,
                      marginTop: '2px',
                      fontSize: '12px'
                    }}
                  >
                    {msg.sender === 'user' ? <User size={14} /> : <Bot size={15} />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: msg.sender === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      background: msg.sender === 'user' 
                        ? 'linear-gradient(135deg, #2563eb, #1e40af)' 
                        : 'rgba(30, 41, 59, 0.85)',
                      border: msg.sender === 'user' 
                        ? '1px solid rgba(59, 130, 246, 0.4)' 
                        : '1px solid rgba(212, 175, 55, 0.2)',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      lineHeight: '1.5',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      wordBreak: 'break-word'
                    }}
                  >
                    {renderFormattedText(msg.text)}

                    {/* Interactive Cards (if any) */}
                    {msg.cards && msg.cards.length > 0 && (
                      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {msg.cards.map((card, cIdx) => (
                          <div 
                            key={cIdx}
                            style={{
                              background: 'rgba(15, 23, 42, 0.75)',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              fontSize: '0.82rem'
                            }}
                          >
                            {card.booking_code && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <strong style={{ color: '#d4af37' }}>#{card.booking_code}</strong>
                                  <span style={{ 
                                    background: 'rgba(16, 185, 129, 0.2)', 
                                    color: '#34d399', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600 
                                  }}>
                                    {card.status}
                                  </span>
                                </div>
                                <div style={{ color: '#cbd5e1' }}>👤 {card.customer_name} ({card.phone})</div>
                                <div style={{ color: '#94a3b8' }}>🏨 {card.room}</div>
                                <div style={{ color: '#94a3b8' }}>📅 {card.dates}</div>
                                <div style={{ marginTop: '4px', color: '#f59e0b', fontWeight: 600 }}>💰 {card.total}</div>
                              </div>
                            )}

                            {card.id && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong style={{ color: '#d4af37' }}>{card.name}</strong>
                                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{card.price}</span>
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '4px 0' }}>
                                  Sức chứa: {card.capacity} • Còn {card.available} phòng
                                </div>
                                {onAction && (
                                  <button
                                    onClick={() => onAction({ type: 'BOOK_ROOM_TYPE', roomTypeId: card.id })}
                                    style={{
                                      marginTop: '6px',
                                      width: '100%',
                                      padding: '5px 10px',
                                      background: 'linear-gradient(135deg, #d4af37, #996515)',
                                      color: '#0f172a',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontWeight: 600,
                                      fontSize: '0.78rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    🛎️ Đặt Ngay Hạng Phòng Này
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <span style={{ fontSize: '0.7rem', color: '#64748b', padding: '0 36px' }}>
                  {msg.time}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #d4af37, #996515)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f172a'
                  }}
                >
                  <Bot size={15} />
                </div>
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: '4px 18px 18px 18px',
                    background: 'rgba(30, 41, 59, 0.85)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d4af37', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d4af37', animation: 'bounce 1.4s infinite ease-in-out both 0.2s' }} />
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d4af37', animation: 'bounce 1.4s infinite ease-in-out both 0.4s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          {suggestions.length > 0 && (
            <div
              style={{
                padding: '8px 14px',
                background: 'rgba(15, 23, 42, 0.95)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'none'
              }}
            >
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug)}
                  style={{
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    color: '#f8fafc',
                    padding: '5px 11px',
                    borderRadius: '14px',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.25)';
                    e.currentTarget.style.borderColor = '#d4af37';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.25)';
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(15, 23, 42, 0.98)',
              borderTop: '1px solid rgba(212, 175, 55, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi (giá phòng, mã đơn, dịch vụ...)..."
              disabled={isTyping}
              style={{
                flex: 1,
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '0.86rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#d4af37'}
              onBlur={e => e.target.style.borderColor = 'rgba(212, 175, 55, 0.3)'}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: inputMessage.trim() && !isTyping 
                  ? 'linear-gradient(135deg, #d4af37, #996515)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: inputMessage.trim() && !isTyping ? '#0f172a' : '#64748b',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputMessage.trim() && !isTyping ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
              title="Gửi câu hỏi"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
