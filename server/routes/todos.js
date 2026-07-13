import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { sseGroup } from '../sse.js';

const router = express.Router();

// Apply auth middleware to all todo routes
router.use(authMiddleware);

// GET /api/todos - Get all todos for the logged-in user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, completed, created_at, updated_at FROM todos WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return res.status(500).json({ error: 'An error occurred while fetching todos.' });
  }
});

// POST /api/todos - Create a new todo
router.post('/', async (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO todos (user_id, title) VALUES ($1, $2) RETURNING id, title, completed, created_at, updated_at',
      [req.user.id, title.trim()]
    );
    await sseGroup.publish(`user:${req.user.id}`, { key: ['todos'] });
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating todo:', error);
    return res.status(500).json({ error: 'An error occurred while creating the todo.' });
  }
});

// PUT /api/todos/:id - Update a specific todo
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  const todoId = parseInt(id, 10);
  if (isNaN(todoId)) {
    return res.status(400).json({ error: 'Invalid todo ID.' });
  }

  try {
    // 1. Fetch the todo to check existence and ownership
    const checkResult = await pool.query(
      'SELECT id, user_id, title, completed FROM todos WHERE id = $1',
      [todoId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found.' });
    }

    const todo = checkResult.rows[0];

    // 2. Enforce user isolation: return 404 to avoid leaking existence of others' todos
    if (todo.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Todo not found.' });
    }

    // 3. Prepare updated values
    const updatedTitle = title !== undefined ? title : todo.title;
    const updatedCompleted = completed !== undefined ? completed : todo.completed;

    if (typeof updatedTitle !== 'string' || updatedTitle.trim() === '') {
      return res.status(400).json({ error: 'Title must be a non-empty string.' });
    }
    if (typeof updatedCompleted !== 'boolean') {
      return res.status(400).json({ error: 'Completed must be a boolean value.' });
    }

    // 4. Update in database
    const updateResult = await pool.query(
      'UPDATE todos SET title = $1, completed = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, title, completed, created_at, updated_at',
      [updatedTitle.trim(), updatedCompleted, todoId]
    );
    await sseGroup.publish(`user:${req.user.id}`, { key: ['todos'] });
    return res.status(200).json(updateResult.rows[0]);
  } catch (error) {
    console.error('Error updating todo:', error);
    return res.status(500).json({ error: 'An error occurred while updating the todo.' });
  }
});

// DELETE /api/todos/:id - Delete a specific todo
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const todoId = parseInt(id, 10);
  if (isNaN(todoId)) {
    return res.status(400).json({ error: 'Invalid todo ID.' });
  }

  try {
    // We can delete directly with user_id check. If rowCount is 0, either not found or not owned.
    const result = await pool.query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id',
      [todoId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Todo not found.' });
    }
    await sseGroup.publish(`user:${req.user.id}`, { key: ['todos'] });
    return res.status(200).json({ message: 'Todo deleted successfully.' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return res.status(500).json({ error: 'An error occurred while deleting the todo.' });
  }
});

export default router;
