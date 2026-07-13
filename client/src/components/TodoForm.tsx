import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

interface TodoFormProps {
  onSubmit: (title: string) => Promise<void>;
  isPending: boolean;
}

export const TodoForm: React.FC<TodoFormProps> = ({ onSubmit, isPending }) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError(null);
    try {
      await onSubmit(title.trim());
      setTitle('');
    } catch (err: any) {
      setError(err.message || 'Failed to create todo');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a new task..."
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          disabled={isPending}
          autoFocus
        />
        <button type="submit" disabled={isPending || !title.trim()} style={{ flexShrink: 0 }}>
          {isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Plus size={18} />
          )}
          <span>Add</span>
        </button>
      </div>
      {error && (
        <span style={{ color: 'hsl(var(--rose))', fontSize: '0.85rem', paddingLeft: '0.5rem' }}>
          {error}
        </span>
      )}
    </form>
  );
};
export default TodoForm;
