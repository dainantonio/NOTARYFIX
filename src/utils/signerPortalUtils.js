// Utility functions for Signer Portal operations

export const getSessionById = (sessions, sessionId) => {
  return sessions.find((session) => session.id === sessionId);
};

export const getDocumentsBySessionId = (documents, sessionId) => {
  return documents.filter((doc) => doc.sessionId === sessionId);
};

export const getMessagesBySessionId = (messages, sessionId) => {
  return messages.filter((msg) => msg.sessionId === sessionId);
};

export const getSessionsByClientId = (sessions, clientId) => {
  return sessions.filter((session) => session.clientId === clientId);
};

export const calculateDocumentProgress = (documents, sessionId) => {
  const sessionDocs = getDocumentsBySessionId(documents, sessionId);
  if (sessionDocs.length === 0) return 0;
  const uploadedCount = sessionDocs.filter((doc) => doc.status === 'uploaded').length;
  return Math.round((uploadedCount / sessionDocs.length) * 100);
};

export const calculateTaskProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completedCount = tasks.filter((task) => task.completed).length;
  return Math.round((completedCount / tasks.length) * 100);
};

export const getESignReadyStatus = (documents, sessionId) => {
  const sessionDocs = getDocumentsBySessionId(documents, sessionId);
  return sessionDocs.every((doc) => doc.eSignReady);
};

export const getPendingSignerActions = (sessions, documents) => {
  return sessions.map((session) => {
    const docs = getDocumentsBySessionId(documents, session.id);
    const pendingDocs = docs.filter((doc) => doc.status === 'pending upload');
    const pendingTasks = session.tasks ? session.tasks.filter((task) => !task.completed) : [];
    return {
      sessionId: session.id,
      title: session.title,
      pendingDocuments: pendingDocs.length,
      pendingTasks: pendingTasks.length,
      totalPending: pendingDocs.length + pendingTasks.length,
    };
  }).filter((action) => action.totalPending > 0);
};

export const getSessionsReadyToClose = (sessions, documents) => {
  return sessions.filter((session) => {
    const docs = getDocumentsBySessionId(documents, session.id);
    const allDocsUploaded = docs.every((doc) => doc.status === 'uploaded');
    const allTasksCompleted = !session.tasks || session.tasks.every((task) => task.completed);
    return allDocsUploaded && allTasksCompleted && session.status !== 'closed';
  });
};

export const generateSessionSummary = (session, documents, messages) => {
  const sessionDocs = getDocumentsBySessionId(documents, session.id);
  const sessionMessages = getMessagesBySessionId(messages, session.id);
  const docProgress = calculateDocumentProgress(documents, session.id);
  const taskProgress = calculateTaskProgress(session.tasks);
  const eSignReady = getESignReadyStatus(documents, session.id);

  return {
    sessionId: session.id,
    title: session.title,
    signingDate: session.signingDate,
    signingTime: session.signingTime,
    location: session.location,
    status: session.status,
    documentProgress: docProgress,
    taskProgress: taskProgress,
    eSignReady: eSignReady,
    totalDocuments: sessionDocs.length,
    uploadedDocuments: sessionDocs.filter((doc) => doc.status === 'uploaded').length,
    totalTasks: session.tasks ? session.tasks.length : 0,
    completedTasks: session.tasks ? session.tasks.filter((task) => task.completed).length : 0,
    messageCount: sessionMessages.length,
  };
};

export const getKPIMetrics = (sessions, documents, messages) => {
  const allSessions = sessions || [];
  const allDocuments = documents || [];
  const allMessages = messages || [];

  const pendingActions = getPendingSignerActions(allSessions, allDocuments);
  const readyToClose = getSessionsReadyToClose(allSessions, allDocuments);

  const totalPendingDocuments = allDocuments.filter((doc) => doc.status === 'pending upload').length;
  const totalUploadedDocuments = allDocuments.filter((doc) => doc.status === 'uploaded').length;
  const eSignReadyDocuments = allDocuments.filter((doc) => doc.eSignReady).length;

  const activeSessions = allSessions.filter((session) => session.status !== 'closed').length;
  const completedSessions = allSessions.filter((session) => session.status === 'closed').length;

  return {
    totalSessions: allSessions.length,
    activeSessions: activeSessions,
    completedSessions: completedSessions,
    sessionsReadyToClose: readyToClose.length,
    pendingSignerActions: pendingActions.length,
    totalPendingDocuments: totalPendingDocuments,
    totalUploadedDocuments: totalUploadedDocuments,
    eSignReadyDocuments: eSignReadyDocuments,
    totalMessages: allMessages.length,
  };
};
