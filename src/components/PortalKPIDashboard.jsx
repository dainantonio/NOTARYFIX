import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from './UI';
import {
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp,
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, subtext, variant = 'default' }) => {
  const variantStyles = {
    default: 'bg-slate-50 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    danger: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  };

  return (
    <div className={`p-4 rounded-lg border ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-75 mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtext && <p className="text-xs mt-1 opacity-75">{subtext}</p>}
        </div>
        <Icon className="w-6 h-6 opacity-50 flex-shrink-0" />
      </div>
    </div>
  );
};

const PortalKPIDashboard = ({ kpiMetrics }) => {
  const {
    totalSessions = 0,
    activeSessions = 0,
    completedSessions = 0,
    sessionsReadyToClose = 0,
    pendingSignerActions = 0,
    totalPendingDocuments = 0,
    totalUploadedDocuments = 0,
    eSignReadyDocuments = 0,
    totalMessages = 0,
  } = kpiMetrics || {};

  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const documentUploadRate = (totalUploadedDocuments + totalPendingDocuments) > 0
    ? Math.round((totalUploadedDocuments / (totalUploadedDocuments + totalPendingDocuments)) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Portal KPI Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sessions Overview */}
          <StatCard
            icon={Users}
            label="Total Sessions"
            value={totalSessions}
            subtext={`${completedSessions} completed`}
            variant="blue"
          />

          <StatCard
            icon={Clock}
            label="Active Sessions"
            value={activeSessions}
            subtext={`${sessionsReadyToClose} ready to close`}
            variant="warning"
          />

          <StatCard
            icon={CheckCircle}
            label="Completed Sessions"
            value={completedSessions}
            subtext={`${completionRate}% completion rate`}
            variant="success"
          />

          {/* Document Metrics */}
          <StatCard
            icon={FileText}
            label="Documents Uploaded"
            value={totalUploadedDocuments}
            subtext={`${totalPendingDocuments} pending`}
            variant="blue"
          />

          <StatCard
            icon={CheckCircle}
            label="eSign Ready"
            value={eSignReadyDocuments}
            subtext={`${documentUploadRate}% upload rate`}
            variant="success"
          />

          {/* Action Items */}
          <StatCard
            icon={AlertCircle}
            label="Pending Signer Actions"
            value={pendingSignerActions}
            subtext="Requires attention"
            variant={pendingSignerActions > 0 ? 'warning' : 'default'}
          />

          <StatCard
            icon={FileText}
            label="Pending Documents"
            value={totalPendingDocuments}
            subtext="Awaiting upload"
            variant={totalPendingDocuments > 0 ? 'danger' : 'default'}
          />

          {/* Communication */}
          <StatCard
            icon={AlertCircle}
            label="Total Messages"
            value={totalMessages}
            subtext="Portal communications"
            variant="default"
          />
        </div>

        {/* Summary Section */}
        <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Portal Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Session Completion</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{completionRate}%</span>
                <span className="text-xs text-slate-500">({completedSessions}/{totalSessions})</span>
              </div>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Document Upload Rate</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{documentUploadRate}%</span>
                <span className="text-xs text-slate-500">({totalUploadedDocuments}/{totalUploadedDocuments + totalPendingDocuments})</span>
              </div>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Action Items</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${pendingSignerActions > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {pendingSignerActions}
                </span>
                <span className="text-xs text-slate-500">pending</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortalKPIDashboard;
