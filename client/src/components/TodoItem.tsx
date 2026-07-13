import { useState, useEffect, type FC } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Trash2, Loader2, Check } from 'lucide-react';
import { type Todo, api } from '../api';

interface TodoItemProps {
  todo: Todo;
}

export const TodoItem: FC<TodoItemProps> = ({ todo }) => {
  const [completed, setCompleted] = useState(todo.completed);
  const [isDeleted, setIsDeleted] = useState(false);

  // Synchronize local completed state when props change
  useEffect(() => {
    setCompleted(todo.completed);
  }, [todo.completed]);

  // Toggle completion mutation
  const toggleMutation = useMutation({
    mutationFn: async () => {
      const targetState = !completed;
      setCompleted(targetState); // Optimistic update
      return api.updateTodo(todo.id, { completed: targetState });
    },
    onError: (error: any) => {
      setCompleted(todo.completed); // Revert on error
      alert(error.message || 'Failed to update todo status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.deleteTodo(todo.id);
    },
    onSuccess: () => {
      setIsDeleted(true); // Locally hide the deleted item
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to delete todo');
    },
  });

  const isPending = toggleMutation.isPending || deleteMutation.isPending;

  if (isDeleted) return null;

  return (
    <div 
      className={`glass-panel glow-hover animate-fade-in flex items-center justify-between p-4 ${isPending ? 'opacity-60' : ''}`}
      style={{
        border: '1px solid hsl(var(--card-border))',
        background: completed ? 'hsl(var(--emerald-glow))' : 'hsl(var(--card-bg))',
        borderColor: completed ? 'hsl(var(--emerald) / 0.25)' : 'hsl(var(--card-border))'
      }}
    >
      <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
        {/* Custom Checkbox Button */}
        <button
          onClick={() => !isPending && toggleMutation.mutate()}
          disabled={isPending}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: completed ? 'hsl(var(--emerald))' : 'hsl(224 71% 2% / 0.6)',
            border: `1.5px solid ${completed ? 'hsl(var(--emerald))' : 'hsl(var(--text-muted) / 0.4)'}`,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isPending ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transform: 'none',
            boxShadow: 'none'
          }}
        >
          {isPending && toggleMutation.isPending ? (
            <Loader2 className="animate-spin text-white" size={14} />
          ) : completed ? (
            <Check className="text-white" size={16} strokeWidth={3} />
          ) : null}
        </button>

        {/* Todo Title */}
        <span 
          style={{
            textDecoration: completed ? 'line-through' : 'none',
            color: completed ? 'hsl(var(--text-muted))' : '#ffffff',
            fontSize: '1rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingLeft: '0.25rem'
          }}
        >
          {todo.title}
        </span>
      </div>

      {/* Delete Action */}
      <button
        onClick={() => {
          if (confirm('Are you sure you want to delete this task?')) {
            deleteMutation.mutate();
          }
        }}
        disabled={isPending}
        className="btn-danger"
        style={{
          width: '32px',
          height: '32px',
          padding: 0,
          borderRadius: '8px',
          flexShrink: 0
        }}
      >
        {deleteMutation.isPending ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Trash2 size={16} />
        )}
      </button>
    </div>
  );
};
export default TodoItem;
