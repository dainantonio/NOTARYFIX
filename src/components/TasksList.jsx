import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from './UI';
import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react';

const TasksList = ({ tasks, sessionId, onToggleTask, onDeleteTask, onAddTask }) => {
  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleTask = (taskId) => {
    if (onToggleTask) {
      onToggleTask(sessionId, taskId);
    }
  };

  const handleDeleteTask = (taskId) => {
    if (onDeleteTask) {
      onDeleteTask(sessionId, taskId);
    }
  };

  const handleAddTask = () => {
    if (onAddTask) {
      const newTaskDescription = prompt('Enter task description:');
      if (newTaskDescription && newTaskDescription.trim()) {
        onAddTask(sessionId, newTaskDescription);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Required Tasks</CardTitle>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {completedCount} of {totalCount} completed ({completionPercentage}%)
            </p>
          </div>
          <Badge variant="blue">{completedCount}/{totalCount}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {totalCount === 0 ? (
          <div className="text-center py-6">
            <Circle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No tasks assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                <button
                  onClick={() => handleToggleTask(task.id)}
                  className="flex-shrink-0 focus:outline-none transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                  )}
                </button>

                <div className="flex-1">
                  <p
                    className={`text-sm font-medium transition-all ${
                      task.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {task.description}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="flex-shrink-0 text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Task Button */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAddTask}
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TasksList;
