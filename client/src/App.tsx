import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { LogOut, RotateCw, ClipboardCheck, ClipboardList, RefreshCw } from 'lucide-react';
import { api, getStoredUser, type Todo } from './api';
import AuthCard from './components/AuthCard';
import TodoForm from './components/TodoForm';
import TodoItem from './components/TodoItem';
import SkeletonLoader from './components/SkeletonLoader';

function App() {
  const [user, setUser] = useState(getStoredUser());
  const [showSyncNotice, setShowSyncNotice] = useState(false);

  // Fetch Todos Query
  const { 
    data: todos = [], 
    isLoading, 
    isError, 
    error, 
    refetch, 
    isRefetching 
  } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: api.getTodos,
    enabled: !!user,
  });

  // Create Todo Mutation (no automatic query invalidation)
  const createTodoMutation = useMutation({
    mutationFn: api.createTodo,
    onSuccess: () => {
      // Show notice that cache is not invalidated and needs manual refresh
      setShowSyncNotice(true);
      // Auto-hide notice after 8 seconds
      setTimeout(() => setShowSyncNotice(false), 8000);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to create todo');
    }
  });

  const handleAuthSuccess = () => {
    setUser(getStoredUser());
    setShowSyncNotice(false);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setShowSyncNotice(false);
  };

  const handleManualRefresh = () => {
    refetch();
    setShowSyncNotice(false);
  };

  // If not authenticated, render the Auth card
  if (!user) {
    return (
      <main className="w-full flex justify-center items-center p-4">
        <AuthCard onAuthSuccess={handleAuthSuccess} />
      </main>
    );
  }

  return (
    <main className="w-full max-w-2xl mx-auto p-4 md:p-8 animate-fade-in">
      {/* Header Panel */}
      <header className="glass-panel p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-hover)))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px 0 hsl(var(--accent-glow))'
            }}
          >
            <ClipboardList className="text-white" size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#fff', lineHeight: 1.2 }}>
              Todo Kit
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
              Logged in as <strong style={{ color: 'hsl(var(--accent-hover))' }}>{user.username}</strong>
            </span>
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          className="btn-danger"
          style={{ height: '40px', padding: '0 1rem' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Todo Form Section */}
      <section className="glass-panel p-6 mb-6">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', margin: '0 0 1rem 0' }}>
          Create New Task
        </h3>
        <TodoForm 
          onSubmit={async (title) => {
            await createTodoMutation.mutateAsync(title);
          }} 
          isPending={createTodoMutation.isPending} 
        />
      </section>

      {/* Sync Warning / Info Notification */}
      {showSyncNotice && (
        <div 
          className="animate-fade-in"
          style={{ 
            background: 'hsl(var(--accent-glow))',
            border: '1px solid hsl(var(--accent) / 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'between',
            gap: '1rem'
          }}
        >
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
              Task Created! (Cache Untouched)
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
              As requested, mutations do not trigger automatic cache invalidation. Click refresh to sync.
            </p>
          </div>
          <button 
            onClick={handleManualRefresh} 
            style={{ 
              background: 'hsl(var(--accent))', 
              fontSize: '0.85rem', 
              padding: '0.5rem 0.75rem', 
              height: '34px' 
            }}
          >
            <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      )}

      {/* Todos List Section */}
      <section className="glass-panel p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', margin: 0 }}>
            My Todo Tasks
          </h3>
          <button 
            onClick={handleManualRefresh} 
            disabled={isLoading || isRefetching}
            className="btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', height: '32px' }}
          >
            <RotateCw className={isRefetching ? 'animate-spin' : ''} size={14} />
            <span>{isRefetching ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>

        {isLoading ? (
          <SkeletonLoader />
        ) : isError ? (
          <div 
            style={{ 
              textAlign: 'center', 
              padding: '2rem 1rem', 
              color: 'hsl(var(--rose))',
              background: 'hsl(var(--rose-glow))',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--rose) / 0.1)'
            }}
          >
            <p style={{ margin: '0 0 1rem 0', fontWeight: 500 }}>
              {error?.message || 'Failed to load todos'}
            </p>
            <button onClick={handleManualRefresh} style={{ background: 'hsl(var(--rose))' }}>
              Retry Connection
            </button>
          </div>
        ) : todos.length === 0 ? (
          <div 
            style={{ 
              textAlign: 'center', 
              padding: '3rem 1rem', 
              color: 'hsl(var(--text-muted))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <ClipboardCheck size={48} strokeWidth={1.5} className="text-muted" style={{ opacity: 0.5 }} />
            <div>
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: '#fff' }}>No tasks for today</p>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Create a task above to get started.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
