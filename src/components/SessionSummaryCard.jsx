import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress } from './UI';
import { Calendar, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const SessionSummaryCard = ({ session, documentProgress, taskProgress, eSignReady }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in-progress':
        return 'blue';
      case 'completed':
        return 'success';
      case 'closed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{session.title}</CardTitle>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Session ID: {session.id}</p>
          </div>
          <Badge variant={getStatusColor(session.status)}>
            {getStatusLabel(session.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300">{session.signingDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300">{session.signingTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300">{session.location}</span>
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Document Upload Progress</label>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{documentProgress}%</span>
            </div>
            <Progress value={documentProgress} max={100} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Task Completion Progress</label>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{taskProgress}%</span>
            </div>
            <Progress value={taskProgress} max={100} />
          </div>
        </div>

        {/* eSign Ready Indicator */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
          {eSignReady ? (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">eSign Ready</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Awaiting Documents</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionSummaryCard;
