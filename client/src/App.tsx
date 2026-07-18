import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, ClipboardList, LogOut, RotateCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useReStale } from 'restale-kit/react';
import { useTanstackQueryAdapter } from 'restale-kit/tanstack-query';
import { api, getStoredUser, type Todo } from './api';
import AuthCard from './components/AuthCard';
import SkeletonLoader from './components/SkeletonLoader';
import TodoForm from './components/TodoForm';
import TodoItem from './components/TodoItem';

const SSE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api') + '/sse';

function App() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const queryClient = useQueryClient();
  const onInvalidate = useTanstackQueryAdapter(queryClient);

  useEffect(() => {
    api.getMe()
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setCheckingSession(false);
      });
  }, []);

  // Setup real-time cache invalidation over Server-Sent Events (SSE)
  const { connectionId } = useReStale(SSE_URL, {
    onInvalidate,
    disabled: !user,
    withCredentials: true,
    debug:true,

  });

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

  // Create Todo Mutation
  const createTodoMutation = useMutation({
    mutationFn: api.createTodo,
    onError: (err) => {
      alert(err.message || 'Failed to create todo');
    }
  });

  const handleAuthSuccess = () => {
    setUser(getStoredUser());
  };

  const handleLogout = async () => {
    try {
      await api.logout(connectionId);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
      queryClient.clear();
    }
  };

  const handleManualRefresh = () => {
    refetch();
  };

  if (checkingSession) {
    return (
      <main className="w-full flex justify-center items-center p-4 min-h-screen">
        <div className="glass-panel p-8 w-full max-w-md flex justify-center items-center">
          <SkeletonLoader />
        </div>
      </main>
    );
  }

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
