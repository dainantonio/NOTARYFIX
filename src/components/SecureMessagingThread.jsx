import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from './UI';
import { Send, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SecureMessagingThread = ({ messages, sessionId, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');

  const sessionMessages = messages.filter((msg) => msg.sessionId === sessionId);

  const handleSendMessage = () => {
    if (newMessage.trim() && onSendMessage) {
      onSendMessage({
        sessionId: sessionId,
        sender: 'notary',
        timestamp: new Date().toISOString(),
        message: newMessage,
      });
      setNewMessage('');
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const getSenderLabel = (sender) => {
    return sender === 'notary' ? 'You (Notary)' : 'Signer';
  };

  const getSenderColor = (sender) => {
    return sender === 'notary' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-700/30';
  };

  const getSenderBorderColor = (sender) => {
    return sender === 'notary' ? 'border-l-blue-500' : 'border-l-slate-400';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <CardTitle>Secure Messaging</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Message Thread */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sessionMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            sessionMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg border-l-4 ${getSenderColor(msg.sender)} ${getSenderBorderColor(msg.sender)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {getSenderLabel(msg.sender)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{msg.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Send Message</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              className="flex-1"
            />
            <Button
              size="icon"
              variant="primary"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecureMessagingThread;
