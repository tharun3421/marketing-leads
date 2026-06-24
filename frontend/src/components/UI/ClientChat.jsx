import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, CornerDownRight, X, MessageSquare, Clock, User } from 'lucide-react';
import Button from './Button';

export default function ClientChat({ leadId }) {
  const { user, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('Work Notes');
  const [localMessages, setLocalMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const userSentRef = useRef(false);
  const prevLengthRef = useRef(0);
  const activeTabRef = useRef(activeTab);

  // Poll latest client communications every 3 seconds
  useEffect(() => {
    if (!leadId) return;

    const fetchLatestMessages = async () => {
      try {
        const res = await authFetch(`/api/leads/${leadId}`);
        if (res.ok) {
          const data = await res.json();
          const nextMsgs = data.communications || [];
          setLocalMessages(prev => {
            if (prev.length === nextMsgs.length) {
              const hasChanged = prev.some((msg, idx) => 
                msg._id !== nextMsgs[idx]._id || 
                msg.message !== nextMsgs[idx].message || 
                msg.timestamp !== nextMsgs[idx].timestamp
              );
              if (!hasChanged) return prev;
            }
            return nextMsgs;
          });
        }
      } catch (err) {
        console.error('Error fetching communications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestMessages();
    const interval = setInterval(fetchLatestMessages, 3000);

    return () => {
      clearInterval(interval);
      setReplyingTo(null);
      setInputText('');
    };
  }, [leadId, authFetch]);

  const filteredMessages = localMessages.filter(msg => msg.category === activeTab);

  // Scroll to bottom under proper conditions (without affecting outer page viewports)
  useEffect(() => {
    if (!messagesEndRef.current || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;

    if (activeTabRef.current !== activeTab) {
      activeTabRef.current = activeTab;
      prevLengthRef.current = 0;
    }

    const currentLength = filteredMessages.length;
    const hasNewMessage = currentLength > prevLengthRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;

    if (userSentRef.current || prevLengthRef.current === 0 || (hasNewMessage && isNearBottom)) {
      const behavior = userSentRef.current ? 'smooth' : 'auto';
      // Wait for DOM layout/render to complete before scrolling
      setTimeout(() => {
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior
          });
        }
      }, 50);
      userSentRef.current = false;
    }

    prevLengthRef.current = currentLength;
  }, [filteredMessages, activeTab]);

  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || !leadId) return;

    setIsSending(true);
    try {
      const payload = {
        category: activeTab,
        message: cleanText
      };

      if (replyingTo) {
        payload.replyTo = {
          senderName: replyingTo.senderName,
          message: replyingTo.message
        };
      }

      const res = await authFetch(`/api/leads/${leadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedLead = await res.json();
        userSentRef.current = true;
        setLocalMessages(updatedLead.communications || []);
        setInputText('');
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Failed to post message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleReplyClick = (msg) => {
    setReplyingTo({
      senderName: msg.senderName,
      message: msg.message
    });
  };

  const formatMessageTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs h-[300px] mt-4">
      
      {/* Tabs Header */}
      <div className="flex bg-slate-50 dark:bg-slate-955/40 border-b border-gray-150 dark:border-slate-850">
        <button
          type="button"
          onClick={() => setActiveTab('Work Notes')}
          className={`flex-1 py-3 text-xs font-bold transition-all relative outline-hidden select-none cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'Work Notes'
              ? 'text-indigo-650 dark:text-indigo-400 bg-white dark:bg-slate-900'
              : 'text-gray-400 hover:text-gray-650 dark:hover:text-gray-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Work Notes (Internal)
          {activeTab === 'Work Notes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Customer Notes')}
          className={`flex-1 py-3 text-xs font-bold transition-all relative outline-hidden select-none cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'Customer Notes'
              ? 'text-indigo-650 dark:text-indigo-400 bg-white dark:bg-slate-900'
              : 'text-gray-400 hover:text-gray-650 dark:hover:text-gray-300'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Customer Notes
          {activeTab === 'Customer Notes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
      </div>

      {/* Messages List Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-500/2 dark:bg-slate-950/5">
        {isLoading && localMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-gray-400">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400 dark:text-gray-550">
            <MessageSquare className="w-8 h-8 text-gray-350 dark:text-slate-800 mb-2 animate-bounce" />
            <p className="text-xs font-bold">No discussions posted yet in {activeTab}</p>
            <p className="text-[10px] mt-0.5 max-w-[220px]">Type a note below to start collaborating with the teams.</p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isMe = msg.sender === user?.id || msg.senderName === user?.name;
            return (
              <div key={msg._id || index} className={`flex flex-col max-w-[85%] group ${isMe ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
                {/* Meta details */}
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-405 dark:text-gray-500 mb-0.5 px-1.5">
                  <span>{msg.senderName}</span>
                  <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-1 rounded-sm text-gray-500 font-semibold">{msg.senderRole}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {formatMessageTime(msg.timestamp)}</span>
                </div>

                {/* Bubble Container */}
                <div className={`p-3.5 rounded-2xl text-xs relative border shadow-2xs leading-relaxed transition-all ${
                  isMe
                    ? 'bg-indigo-600 border-indigo-650 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-850 border-gray-150 dark:border-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                }`}>
                  
                  {/* Replied Info block */}
                  {msg.replyTo && (
                    <div className={`mb-2 p-1.5 px-2.5 rounded-lg text-[10px] flex items-start gap-1 ${
                      isMe 
                        ? 'bg-indigo-700/60 border border-indigo-800/40 text-indigo-100'
                        : 'bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800/50 text-gray-450 dark:text-gray-400'
                    }`}>
                      <CornerDownRight className="w-3 h-3 mt-0.5 shrink-0" />
                      <div className="truncate">
                        <strong className="block text-[9px] font-bold opacity-80">{msg.replyTo.senderName}</strong>
                        <span className="italic">{msg.replyTo.message}</span>
                      </div>
                    </div>
                  )}

                  {/* Message body */}
                  <p className="whitespace-pre-line break-words font-medium">{msg.message}</p>

                  {/* Reply Button hover overlay */}
                  <button
                    type="button"
                    onClick={() => handleReplyClick(msg)}
                    className={`absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:underline font-bold text-[9px] cursor-pointer ${
                      isMe ? 'text-indigo-200 hover:text-white' : 'text-indigo-500 hover:text-indigo-600'
                    }`}
                    style={{ position: 'relative', display: 'block', float: 'right', marginTop: '4px' }}
                  >
                    Reply
                  </button>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Panel */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-150 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-2">
        {/* Reply Quote Banner */}
        {replyingTo && (
          <div className="flex items-center justify-between p-1.5 px-2.5 bg-indigo-500/5 dark:bg-indigo-500/2 border border-indigo-500/10 rounded-lg text-[10px]">
            <div className="flex items-center gap-1.5 truncate text-gray-650 dark:text-gray-300">
              <CornerDownRight className="w-3 h-3 text-indigo-500" />
              <span>Replying to <strong>{replyingTo.senderName}</strong>: <span className="italic opacity-80">"{replyingTo.message}"</span></span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Text Input Row */}
        <div className="flex gap-2 items-end">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Post note to ${activeTab}...`}
            rows="1"
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-slate-800 p-2.5 text-xs bg-slate-500/2 dark:bg-slate-950/20 text-gray-900 dark:text-white outline-hidden focus:border-indigo-500 max-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            type="submit"
            variant="primary"
            className="rounded-xl px-3 py-2.5 shrink-0 cursor-pointer"
            disabled={!inputText.trim() || isSending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

    </div>
  );
}
