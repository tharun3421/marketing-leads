import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, CornerDownRight, X, MessageSquare, Clock, User, Layers, Briefcase } from 'lucide-react';
import Button from './Button';

export default function ClientChat({ leadId, layout = 'grid' }) {
  const { user, authFetch } = useAuth();
  const [localMessages, setLocalMessages] = useState([]);
  
  // States for Work Notes (Workflow Card)
  const [workInput, setWorkInput] = useState('');
  const [replyingToWork, setReplyingToWork] = useState(null);
  const [isSendingWork, setIsSendingWork] = useState(false);

  // States for Customer Notes (Client Notes Card)
  const [clientInput, setClientInput] = useState('');
  const [replyingToClient, setReplyingToClient] = useState(null);
  const [isSendingClient, setIsSendingClient] = useState(false);

  // States for Sales Notes
  const [salesInput, setSalesInput] = useState('');
  const [replyingToSales, setReplyingToSales] = useState(null);
  const [isSendingSales, setIsSendingSales] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  // Refs for Work Notes scrolling
  const workScrollContainerRef = useRef(null);
  const workEndRef = useRef(null);
  const workUserSentRef = useRef(false);
  const prevWorkLengthRef = useRef(0);

  // Refs for Client Notes scrolling
  const clientScrollContainerRef = useRef(null);
  const clientEndRef = useRef(null);
  const clientUserSentRef = useRef(false);
  const prevClientLengthRef = useRef(0);

  // Refs for Sales Notes scrolling
  const salesScrollContainerRef = useRef(null);
  const salesEndRef = useRef(null);
  const salesUserSentRef = useRef(false);
  const prevSalesLengthRef = useRef(0);

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
      setReplyingToWork(null);
      setReplyingToClient(null);
      setReplyingToSales(null);
      setWorkInput('');
      setClientInput('');
      setSalesInput('');
    };
  }, [leadId, authFetch]);

  // Separate messages by category
  const workMessages = localMessages.filter(msg => msg.category === 'Work Notes');
  const clientMessages = localMessages.filter(msg => msg.category === 'Customer Notes');
  const salesMessages = localMessages.filter(msg => msg.category === 'Sales Notes');

  // Auto-scroll for Work Notes Card
  useEffect(() => {
    if (!workEndRef.current || !workScrollContainerRef.current) return;

    const container = workScrollContainerRef.current;
    const currentLength = workMessages.length;
    const hasNewMessage = currentLength > prevWorkLengthRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;

    if (workUserSentRef.current || prevWorkLengthRef.current === 0 || (hasNewMessage && isNearBottom)) {
      const behavior = workUserSentRef.current ? 'smooth' : 'auto';
      setTimeout(() => {
        if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior });
        }
      }, 50);
      workUserSentRef.current = false;
    }

    prevWorkLengthRef.current = currentLength;
  }, [workMessages]);

  // Auto-scroll for Client Notes Card
  useEffect(() => {
    if (!clientEndRef.current || !clientScrollContainerRef.current) return;

    const container = clientScrollContainerRef.current;
    const currentLength = clientMessages.length;
    const hasNewMessage = currentLength > prevClientLengthRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;

    if (clientUserSentRef.current || prevClientLengthRef.current === 0 || (hasNewMessage && isNearBottom)) {
      const behavior = clientUserSentRef.current ? 'smooth' : 'auto';
      setTimeout(() => {
        if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior });
        }
      }, 50);
      clientUserSentRef.current = false;
    }

    prevClientLengthRef.current = currentLength;
  }, [clientMessages]);

  // Auto-scroll for Sales Notes Card
  useEffect(() => {
    if (!salesEndRef.current || !salesScrollContainerRef.current) return;

    const container = salesScrollContainerRef.current;
    const currentLength = salesMessages.length;
    const hasNewMessage = currentLength > prevSalesLengthRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;

    if (salesUserSentRef.current || prevSalesLengthRef.current === 0 || (hasNewMessage && isNearBottom)) {
      const behavior = salesUserSentRef.current ? 'smooth' : 'auto';
      setTimeout(() => {
        if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior });
        }
      }, 50);
      salesUserSentRef.current = false;
    }

    prevSalesLengthRef.current = currentLength;
  }, [salesMessages]);

  const handleSendMessage = async (category, text, replyingTo, setInputText, setReplyingTo, setIsSending, userSentRef) => {
    const cleanText = text.trim();
    if (!cleanText || !leadId) return;

    setIsSending(true);
    try {
      const payload = {
        category,
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
      console.error(`Failed to post ${category} message:`, err);
    } finally {
      setIsSending(false);
    }
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

  const renderChatCard = (
    title,
    category,
    messages,
    inputText,
    setInputText,
    replyingTo,
    setReplyingTo,
    isSending,
    setIsSending,
    scrollContainerRef,
    endRef,
    userSentRef,
    Icon,
    badgeText,
    badgeColor
  ) => {
    return (
      <div className={`flex flex-col bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs ${
        layout === 'stack' ? 'h-[420px]' : 'h-[480px]'
      }`}>
        
        {/* Card Header */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-955/40 border-b border-gray-150 dark:border-slate-850">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{title}</span>
          </div>
          <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}>
            {badgeText}
          </span>
        </div>

        {/* Messages List Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-500/2 dark:bg-slate-955/5 scrollbar-thin">
          {isLoading && localMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-gray-400">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-405 dark:text-gray-550">
              <MessageSquare className="w-7 h-7 text-gray-300 dark:text-slate-800 mb-2 animate-bounce" />
              <p className="text-[11px] font-bold">No notes posted yet in this card</p>
              <p className="text-[9.5px] mt-0.5 max-w-[200px] text-gray-400">Type a note below to start collaborating with the teams.</p>
            </div>
          ) : (
            messages.map((msg, index) => {
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
                  <div className={`p-3 rounded-xl text-xs relative border shadow-2xs leading-relaxed transition-all ${
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
                      onClick={() => setReplyingTo({ senderName: msg.senderName, message: msg.message })}
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
          <div ref={endRef} />
        </div>

        {/* Input Composer Panel */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(category, inputText, replyingTo, setInputText, setReplyingTo, setIsSending, userSentRef);
          }} 
          className="p-2.5 border-t border-gray-150 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-2"
        >
          {/* Reply Quote Banner */}
          {replyingTo && (
            <div className="flex items-center justify-between p-1.5 px-2 bg-indigo-500/5 dark:bg-indigo-500/2 border border-indigo-500/10 rounded-lg text-[9.5px]">
              <div className="flex items-center gap-1 truncate text-gray-650 dark:text-gray-300">
                <CornerDownRight className="w-3 h-3 text-indigo-500" />
                <span>Replying to <strong>{replyingTo.senderName}</strong>: <span className="italic opacity-80">"{replyingTo.message}"</span></span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Text Input Row */}
          <div className="flex gap-2 items-end">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Post note to ${title}...`}
              rows="1"
              className="flex-1 resize-none rounded-lg border border-gray-250 dark:border-slate-800 p-2 text-xs bg-slate-500/2 dark:bg-slate-950/20 text-gray-900 dark:text-white outline-hidden focus:border-indigo-500 max-h-[70px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputText.trim() && !isSending) {
                    handleSendMessage(category, inputText, replyingTo, setInputText, setReplyingTo, setIsSending, userSentRef);
                  }
                }
              }}
            />
            <Button
              type="submit"
              variant="primary"
              className="rounded-lg p-2 shrink-0 cursor-pointer"
              disabled={!inputText.trim() || isSending}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      </div>
    );
  };

  const containerClass = layout === 'stack'
    ? 'flex flex-col gap-4 mt-2 w-full'
    : 'grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 w-full';

  const isSalesOrAdmin = user?.role === 'admin' || user?.role === 'salesperson';

  return (
    <div className={containerClass}>
      {/* Workflow Card */}
      {renderChatCard(
        'Workflow Notes',
        'Work Notes',
        workMessages,
        workInput,
        setWorkInput,
        replyingToWork,
        setReplyingToWork,
        isSendingWork,
        setIsSendingWork,
        workScrollContainerRef,
        workEndRef,
        workUserSentRef,
        Layers,
        'Internal Team',
        'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10'
      )}

      {/* Client Notes Card */}
      {renderChatCard(
        'Client Notes',
        'Customer Notes',
        clientMessages,
        clientInput,
        setClientInput,
        replyingToClient,
        setReplyingToClient,
        isSendingClient,
        setIsSendingClient,
        clientScrollContainerRef,
        clientEndRef,
        clientUserSentRef,
        User,
        'Customer Facing',
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10'
      )}

      {/* Sales Notes Card — only visible to admin and salesperson */}
      {isSalesOrAdmin && renderChatCard(
        'Sales Notes',
        'Sales Notes',
        salesMessages,
        salesInput,
        setSalesInput,
        replyingToSales,
        setReplyingToSales,
        isSendingSales,
        setIsSendingSales,
        salesScrollContainerRef,
        salesEndRef,
        salesUserSentRef,
        Briefcase,
        'Sales & Admin',
        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10'
      )}
    </div>
  );
}