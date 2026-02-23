import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './UI';
import { X, Plus } from 'lucide-react';
import SessionSummaryCard from './SessionSummaryCard';
import DocumentChecklist from './DocumentChecklist';
import SecureMessagingThread from './SecureMessagingThread';
import TasksList from './TasksList';
import {
  calculateDocumentProgress,
  calculateTaskProgress,
  getESignReadyStatus,
} from '../utils/signerPortalUtils';

const SessionDetailView = ({
  session,
  documents,
  messages,
  onClose,
  onUpdateDocument,
  onSendMessage,
  onToggleTask,
  onDeleteTask,
  onAddTask,
}) => {
  if (!session) {
    return null;
  }

  const documentProgress = calculateDocumentProgress(documents, session.id);
  const taskProgress = calculateTaskProgress(session.tasks);
  const eSignReady = getESignReadyStatus(documents, session.id);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{session.title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Session ID: {session.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Session Summary */}
          <SessionSummaryCard
            session={session}
            documentProgress={documentProgress}
            taskProgress={taskProgress}
            eSignReady={eSignReady}
          />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Document Checklist */}
              <DocumentChecklist
                documents={documents}
                sessionId={session.id}
                onUpdateDocument={onUpdateDocument}
              />

              {/* Tasks */}
              <TasksList
                tasks={session.tasks || []}
                sessionId={session.id}
                onToggleTask={onToggleTask}
                onDeleteTask={onDeleteTask}
                onAddTask={onAddTask}
              />
            </div>

            {/* Right Column */}
            <div>
              {/* Secure Messaging */}
              <SecureMessagingThread
                messages={messages}
                sessionId={session.id}
                onSendMessage={onSendMessage}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
          <div className="flex items-center gap-2">
            <Badge variant={session.status === 'closed' ? 'success' : 'warning'}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {session.status !== 'closed' && eSignReady && (
              <Button variant="primary">
                Mark as Ready for Signing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailView;
