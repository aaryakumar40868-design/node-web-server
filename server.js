const express = require('express');
const path = require('path');

const app = express();
const publicDirectory = path.join(__dirname, 'public');
const port = Number(process.env.PORT) || 3000;

// Middleware for body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// In-memory initial data store for the dashboard
let store = {
  profile: {
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    role: 'Product Lead & Developer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    bio: 'Building modern web experiences and managing daily productivity.'
  },
  notes: [
    {
      id: 'note_1',
      title: 'Project Architecture & Roadmap',
      content: 'Refactoring client modules into modular widgets. Evaluating WebSockets for live notifications and indexedDB for client offline caching. Target milestone for Q4 delivery.',
      category: 'work',
      color: '#3b82f6',
      pinned: true,
      favorite: true,
      created: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'note_2',
      title: 'Productivity & Daily Workflow',
      content: 'Morning: Deep work blocks (3x 50min Pomodoro). Afternoon: Code reviews and architecture alignment. Keep meetings under 30 minutes.',
      category: 'personal',
      color: '#10b981',
      pinned: true,
      favorite: false,
      created: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'note_3',
      title: 'SaaS UI Inspiration Ideas',
      content: 'Study design tokens from Linear, Raycast, and Stripe. Focus on micro-interactions, clean borders, high-contrast dark mode, and seamless keyboard navigation (Ctrl+K).',
      category: 'ideas',
      color: '#8b5cf6',
      pinned: false,
      favorite: true,
      created: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'note_4',
      title: 'Database Schema Optimization',
      content: 'Add composite indexes for frequently queried user_id + timestamp columns. Evaluate Redis caching layer for read-heavy statistics endpoints.',
      category: 'work',
      color: '#f59e0b',
      pinned: false,
      favorite: false,
      created: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'note_5',
      title: 'Reading List - Tech & Design',
      content: '1. Designing Data-Intensive Applications\n2. Refactoring UI by Adam Wathan\n3. Staff Engineer: Leadership beyond the management track',
      category: 'study',
      color: '#ec4899',
      pinned: false,
      favorite: true,
      created: new Date(Date.now() - 6 * 86400000).toISOString(),
      updated: new Date(Date.now() - 6 * 86400000).toISOString()
    }
  ],
  tasks: [
    {
      id: 'task_1',
      title: 'Finalize Modern Dashboard Design System',
      description: 'Audit color tokens, glassmorphism card elevation, responsive layout, and dark mode palette.',
      priority: 'high',
      dueDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
      category: 'work',
      completed: true,
      favorite: true,
      created: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'task_2',
      title: 'Implement Interactive Calendar & Event Sync',
      description: 'Connect calendar day picker to active tasks and render upcoming events panel with quick action.',
      priority: 'high',
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      category: 'work',
      completed: false,
      favorite: true,
      created: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'task_3',
      title: 'Configure Chart.js Analytics Suite',
      description: 'Set up donut overview, weekly productivity velocity, notes distribution, and priority charts.',
      priority: 'medium',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      category: 'work',
      completed: false,
      favorite: false,
      created: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'task_4',
      title: 'Review Pull Requests & Merge CI fixes',
      description: 'Check automated tests, linter output, and Express server routes for contact form.',
      priority: 'high',
      dueDate: new Date(Date.now() + 0 * 86400000).toISOString().split('T')[0],
      category: 'work',
      completed: false,
      favorite: false,
      created: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'task_5',
      title: 'Weekly Team Sync & Sprint Retrospective',
      description: 'Present prototype milestones to stakeholders and gather user feedback.',
      priority: 'medium',
      dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      category: 'work',
      completed: false,
      favorite: false,
      created: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'task_6',
      title: 'Hydration & 30-minute Cardio Session',
      description: 'Drink 2L water and complete outdoor jogging routine.',
      priority: 'low',
      dueDate: new Date().toISOString().split('T')[0],
      category: 'personal',
      completed: true,
      favorite: false,
      created: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ],
  settings: {
    darkMode: false,
    notifications: true,
    compactView: false,
    accentColor: '#2563eb'
  }
};

// -------------------------------------------------------------
// Existing Static & Demonstration Routes (Preserved Exactly)
// -------------------------------------------------------------

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDirectory, 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(publicDirectory, 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(publicDirectory, 'contact.html'));
});

app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  const validName = typeof name === 'string' && name.trim().length >= 1 && name.trim().length <= 100;
  const validEmail = typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validMessage = typeof message === 'string' && message.trim().length >= 1 && message.trim().length <= 2000;

  if (!validName || !validEmail || !validMessage) {
    return res.redirect(303, '/contact?error=1');
  }

  // Validates the message and redirects with success
  return res.redirect(303, '/contact?sent=1');
});

// -------------------------------------------------------------
// REST API Endpoints for Dashboard
// -------------------------------------------------------------

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET & POST Notes
app.get('/api/notes', (req, res) => {
  res.json(store.notes);
});

app.post('/api/notes', (req, res) => {
  const { title, content, category, color, pinned, favorite } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const newNote = {
    id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    title: String(title).trim(),
    content: String(content || '').trim(),
    category: category || 'personal',
    color: color || '#3b82f6',
    pinned: Boolean(pinned),
    favorite: Boolean(favorite),
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };
  store.notes.unshift(newNote);
  res.status(201).json(newNote);
});

app.put('/api/notes/:id', (req, res) => {
  const index = store.notes.findIndex(n => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  const existing = store.notes[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    created: existing.created,
    updated: new Date().toISOString()
  };
  store.notes[index] = updated;
  res.json(updated);
});

app.delete('/api/notes/:id', (req, res) => {
  const initialLen = store.notes.length;
  store.notes = store.notes.filter(n => n.id !== req.params.id);
  if (store.notes.length === initialLen) {
    return res.status(404).json({ error: 'Note not found' });
  }
  res.json({ success: true, id: req.params.id });
});

// GET & POST Tasks
app.get('/api/tasks', (req, res) => {
  res.json(store.tasks);
});

app.post('/api/tasks', (req, res) => {
  const { title, description, priority, dueDate, category, favorite } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    title: String(title).trim(),
    description: String(description || '').trim(),
    priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
    dueDate: dueDate || '',
    category: category || 'work',
    completed: false,
    favorite: Boolean(favorite),
    created: new Date().toISOString()
  };
  store.tasks.unshift(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const index = store.tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const existing = store.tasks[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    created: existing.created
  };
  store.tasks[index] = updated;
  res.json(updated);
});

app.delete('/api/tasks/:id', (req, res) => {
  const initialLen = store.tasks.length;
  store.tasks = store.tasks.filter(t => t.id !== req.params.id);
  if (store.tasks.length === initialLen) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({ success: true, id: req.params.id });
});

// Profile & Settings
app.get('/api/profile', (req, res) => {
  res.json(store.profile);
});

app.put('/api/profile', (req, res) => {
  store.profile = { ...store.profile, ...req.body };
  res.json(store.profile);
});

app.get('/api/stats', (req, res) => {
  const totalNotes = store.notes.length;
  const totalTasks = store.tasks.length;
  const completedTasks = store.tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const favorites = store.notes.filter(n => n.favorite).length + store.tasks.filter(t => t.favorite).length;
  const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  res.json({
    totalNotes,
    totalTasks,
    completedTasks,
    pendingTasks,
    favorites,
    productivity
  });
});

// Export & Import
app.get('/api/export', (req, res) => {
  res.json({
    ...store,
    exportedAt: new Date().toISOString()
  });
});

app.post('/api/import', (req, res) => {
  const { notes, tasks, profile, settings } = req.body;
  if (Array.isArray(notes)) store.notes = notes;
  if (Array.isArray(tasks)) store.tasks = tasks;
  if (profile && typeof profile === 'object') store.profile = profile;
  if (settings && typeof settings === 'object') store.settings = settings;
  res.json({ success: true, message: 'Data imported successfully' });
});

// Static assets
app.use(express.static(publicDirectory));

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDirectory, '404.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
