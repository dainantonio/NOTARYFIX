import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from './UI';
import { FileText, Upload, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';

const DocumentChecklist = ({ documents, sessionId, onUpdateDocument }) => {
  const [expandedDocId, setExpandedDocId] = useState(null);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'pending upload':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'uploaded':
        return 'success';
      case 'pending upload':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getESignBadgeColor = (eSignReady) => {
    return eSignReady ? 'success' : 'default';
  };

  const handleMockUpload = (docId) => {
    if (onUpdateDocument) {
      onUpdateDocument(docId, {
        status: 'uploaded',
        eSignReady: true,
        fileUrl: `/docs/document_${docId}.pdf`,
      });
    }
  };

  const sessionDocuments = documents.filter((doc) => doc.sessionId === sessionId);

  if (sessionDocuments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400">No documents assigned to this session yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Document Checklist</CardTitle>
          <Badge variant="blue">{sessionDocuments.length} documents</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessionDocuments.map((doc) => (
          <div key={doc.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(doc.status)}
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{doc.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Document ID: {doc.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(doc.status)}>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </Badge>
                {doc.status === 'uploaded' && (
                  <Badge variant={getESignBadgeColor(doc.eSignReady)}>
                    {doc.eSignReady ? 'eSign Ready' : 'Pending'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedDocId === doc.id && (
              <div className="bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  <p className="font-semibold mb-2">Document Details</p>
                  <div className="space-y-1">
                    <p><span className="text-slate-500">Status:</span> {doc.status}</p>
                    <p><span className="text-slate-500">eSign Ready:</span> {doc.eSignReady ? 'Yes' : 'No'}</p>
                    {doc.fileUrl && <p><span className="text-slate-500">File URL:</span> {doc.fileUrl}</p>}
                  </div>
                </div>

                {doc.status === 'pending upload' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleMockUpload(doc.id)}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Simulate Upload
                    </Button>
                  </div>
                )}

                {doc.status === 'uploaded' && doc.fileUrl && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DocumentChecklist;
