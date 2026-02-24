import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '../components/UI';
import { useData } from '../context/DataContext';
import PortalKPIDashboard from '../components/PortalKPIDashboard';
import SessionDetailView from '../components/SessionDetailView';
import SessionSummaryCard from '../components/SessionSummaryCard';
import { Plus, Search } from 'lucide-react';
import {
  getKPIMetrics,
  calculateDocumentProgress,
  calculateTaskProgress,
  getESignReadyStatus,
} from '../utils/signerPortalUtils';

const SignerPortal = () => {
  const { data, updateSignerDocument, addPortalMessage, updateSignerSession } = useData();
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { signerSessions, signerDocuments, portalMessages } = data;

  // Calculate KPI metrics
  const kpiMetrics = getKPIMetrics(signerSessions, signerDocuments, portalMessages);

  // Filter sessions based on search term
  const filteredSessions = signerSessions.filter((session) =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.id.toString().includes(searchTerm)
  );

  // Handle document update
  const handleUpdateDocument = (docId, updates) => {
    updateSignerDocument(docId, updates);
  };

  // Handle send message
  const handleSendMessage = (messageData) => {
    const newMessage = {
      id: Math.max(...portalMessages.map((m) => m.id), 0) + 1,
      ...messageData,
    };
    addPortalMessage(newMessage);
  };

  // Handle toggle task
  const handleToggleTask = (sessionId, taskId) => {
    const session = signerSessions.find((s) => s.id === sessionId);
    if (session && session.tasks) {
      const updatedTasks = session.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      updateSignerSession(sessionId, { tasks: updatedTasks });
    }
  };

  // Handle delete task
  const handleDeleteTask = (sessionId, taskId) => {
    const session = signerSessions.find((s) => s.id === sessionId);
    if (session && session.tasks) {
      const updatedTasks = session.tasks.filter((task) => task.id !== taskId);
      updateSignerSession(sessionId, { tasks: updatedTasks });
    }
  };

  // Handle add task
  const handleAddTask = (sessionId, description) => {
    const session = signerSessions.find((s) => s.id === sessionId);
    if (session) {
      const newTask = {
        id: Math.max(...(session.tasks || []).map((t) => t.id), 0) + 1,
        description: description,
        completed: false,
      };
      const updatedTasks = [...(session.tasks || []), newTask];
      updateSignerSession(sessionId, { tasks: updatedTasks });
    }
  };

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 mx-auto max-w-[1400px] space-y-5 sm:space-y-6 pb-20">
      {/* Header */}
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Client Experience</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Signer Portal</h1>
          <p className="mt-1 text-sm text-slate-200">
            Centralize document requests, signer updates, and secure status visibility.
          </p>
        </CardContent>
      </Card>

      {/* KPI Dashboard */}
      <PortalKPIDashboard kpiMetrics={kpiMetrics} />

      {/* Sessions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Signing Sessions</CardTitle>
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Session
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search sessions by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sessions List */}
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">
                {searchTerm ? 'No sessions match your search.' : 'No active signing sessions yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="cursor-pointer"
                >
                  <SessionSummaryCard
                    session={session}
                    documentProgress={calculateDocumentProgress(signerDocuments, session.id)}
                    taskProgress={calculateTaskProgress(session.tasks)}
                    eSignReady={getESignReadyStatus(signerDocuments, session.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailView
          session={selectedSession}
          documents={signerDocuments}
          messages={portalMessages}
          onClose={() => setSelectedSession(null)}
          onUpdateDocument={handleUpdateDocument}
          onSendMessage={handleSendMessage}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleAddTask}
        />
      )}
    </div>
  );
};

export default SignerPortal;
