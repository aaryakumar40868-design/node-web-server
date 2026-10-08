/**
 * NEXUS WORKSPACE — MODERN SAAS DASHBOARD APPLICATION
 * Complete SPA Architecture for Notes, Tasks, Calendar, and Analytics.
 */

class NexusApp {
  constructor() {
    this.settings = this.loadSettings();
    this.profile = this.loadProfile();
    this.notes = this.loadNotes();
    this.tasks = this.loadTasks();
    this.activities = this.loadActivities();
    this.notifications = this.loadNotifications();

    this.currentSection = 'dashboard';
    this.currentMonth = new Date();
    this.selectedDate = new Date();
    this.charts = {};
    
    this.editingNoteId = null;
    this.editingTaskId = null;

    this.notesFilter = 'all';
    this.notesSort = 'newest';
    this.tasksFilter = 'all';
    this.tasksSort = 'dueDate';

    // Populate default demo data on first visit
    if (this.notes.length === 0 && this.tasks.length === 0) {
      this.populateDemoData();
    }

    this.init();
  }

  // ========================================================
  // INITIALIZATION & LIFECYCLE
  // ========================================================

  init() {
    this.applyTheme();
    this.applyAccentColor();
    this.renderUserProfile();
    this.startLiveClock();
    this.updateGreeting();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    
    // Check for deadline reminders
    this.checkTaskDeadlines();

    // Initial renders
    this.updateDashboardMetrics();
    this.renderDashboardRecentNotes();
    this.renderDashboardTasks();
    this.renderDashboardSchedule();
    this.renderDashboardActivity();
    this.updateNavBadges();
    this.renderNotificationsList();

    // Chart.js initialization
    this.initCharts();

    // Try synchronizing with the backend REST API if available
    this.syncWithBackend();

    console.log('Nexus Workspace App Initialized Successfully.');
  }

  // ========================================================
  // THEME & STYLES
  // ========================================================

  applyTheme() {
    const isDark = Boolean(this.settings.darkMode);
    document.body.classList.toggle('dark-mode', isDark);

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      themeToggleBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }

    const settingsToggle = document.getElementById('settings-dark-mode-toggle');
    if (settingsToggle) {
      settingsToggle.classList.toggle('active', isDark);
    }

    // Refresh charts colors if they exist
    this.updateChartsTheme();
  }

  toggleTheme() {
    this.settings.darkMode = !this.settings.darkMode;
    this.saveSettings();
    this.applyTheme();
    this.showToast(this.settings.darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
  }

  applyAccentColor() {
    const color = this.settings.accentColor || '#2563eb';
    document.documentElement.style.setProperty('--primary', color);
    
    document.querySelectorAll('#accent-color-picker .color-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.color === color);
    });
  }

  setAccentColor(color) {
    this.settings.accentColor = color;
    this.saveSettings();
    this.applyAccentColor();
    this.showToast('Accent color updated', 'info');
  }

  // ========================================================
  // LIVE CLOCK & GREETING
  // ========================================================

  startLiveClock() {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      const liveTimeEl = document.getElementById('live-time');
      const liveDateEl = document.getElementById('live-date');
      if (liveTimeEl) liveTimeEl.textContent = timeStr;
      if (liveDateEl) liveDateEl.textContent = dateStr;
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'Good Evening';

    if (hour >= 5 && hour < 12) {
      greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 22) {
      greeting = 'Good Evening';
    } else {
      greeting = 'Good Night';
    }

    const name = this.profile.name ? this.profile.name.split(' ')[0] : 'there';
    const greetingEl = document.getElementById('welcome-greeting');
    if (greetingEl) {
      greetingEl.textContent = `${greeting}, ${name}! 👋`;
    }

    const quotes = [
      '"Focus on being productive instead of busy. Small consistent steps create massive results."',
      '"The secret of getting ahead is getting started. Break complex tasks into manageable pieces."',
      '"Simplicity boils down to two steps: Identify the essential. Eliminate the rest."',
      '"Excellence is not an act, but a habit. Make every priority deliberate and intentional."',
      '"Action is the foundational key to all success. Complete your high-impact deliverables first."'
    ];
    const quoteEl = document.getElementById('welcome-quote');
    if (quoteEl) {
      const dayIndex = now.getDate() % quotes.length;
      quoteEl.textContent = quotes[dayIndex];
    }

    const dateTextEl = document.getElementById('welcome-date-text');
    if (dateTextEl) {
      dateTextEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  }

  // ========================================================
  // SPA NAVIGATION
  // ========================================================

  navigateToSection(sectionId) {
    this.currentSection = sectionId;

    // Update nav items
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === sectionId);
    });

    // Update Page titles
    const titles = {
      dashboard: { title: 'Dashboard', subtitle: 'Workspace Overview & Productivity' },
      notes: { title: 'Notes Vault', subtitle: 'Organize, Tag, and Pin Your Documentation' },
      tasks: { title: 'Task Management', subtitle: 'Track Deliverables, Priority & Deadlines' },
      calendar: { title: 'Calendar & Schedule', subtitle: 'Monthly Timeline & Deadline Planner' },
      analytics: { title: 'Analytics & Insights', subtitle: 'Performance Metrics & Completion Velocity' },
      favorites: { title: 'Starred & Favorites', subtitle: 'High Priority Notes & Key Deliverables' },
      settings: { title: 'Settings & Preferences', subtitle: 'System Config, Portability & Aesthetics' },
      help: { title: 'Help & Documentation', subtitle: 'Productivity Tips & Shortcuts' }
    };

    const info = titles[sectionId] || { title: 'Dashboard', subtitle: 'Workspace Overview' };
    const titleEl = document.getElementById('page-title');
    const subEl = document.getElementById('page-subtitle');
    if (titleEl) titleEl.textContent = info.title;
    if (subEl) subEl.textContent = info.subtitle;

    // Hide/show page sections
    document.querySelectorAll('.page-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Close mobile sidebar if open
    document.getElementById('sidebar')?.classList.remove('active');

    // Section-specific refresh triggers
    if (sectionId === 'dashboard') {
      this.updateDashboardMetrics();
      this.renderDashboardRecentNotes();
      this.renderDashboardTasks();
      this.renderDashboardSchedule();
      this.renderDashboardActivity();
    } else if (sectionId === 'notes') {
      this.renderNotes();
    } else if (sectionId === 'tasks') {
      this.renderTasks();
    } else if (sectionId === 'calendar') {
      this.renderCalendar();
    } else if (sectionId === 'analytics') {
      this.updateCharts();
    } else if (sectionId === 'favorites') {
      this.renderFavorites();
    } else if (sectionId === 'settings') {
      this.populateSettingsForm();
    }

    // Smooth scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateNavBadges() {
    const notesBadge = document.getElementById('nav-notes-badge');
    if (notesBadge) notesBadge.textContent = this.notes.length;

    const pendingCount = this.tasks.filter(t => !t.completed).length;
    const tasksBadge = document.getElementById('nav-tasks-badge');
    if (tasksBadge) tasksBadge.textContent = pendingCount;

    const favoritesCount = this.notes.filter(n => n.favorite).length + this.tasks.filter(t => t.favorite).length;
    const favBadge = document.getElementById('nav-favorites-badge');
    if (favBadge) favBadge.textContent = favoritesCount;
  }

  // ========================================================
  // DASHBOARD METRICS & WIDGETS
  // ========================================================

  updateDashboardMetrics() {
    const totalNotes = this.notes.length;
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const favoritesCount = this.notes.filter(n => n.favorite).length + this.tasks.filter(t => t.favorite).length;
    const productivityRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const statNotesEl = document.getElementById('stat-total-notes');
    const statCompEl = document.getElementById('stat-completed-tasks');
    const statPendEl = document.getElementById('stat-pending-tasks');
    const statFavEl = document.getElementById('stat-favorites-count');
    const heroRateEl = document.getElementById('hero-productivity-rate');
    const dashProgressPctEl = document.getElementById('dash-progress-percentage');
    const dashProgressFillEl = document.getElementById('dash-progress-fill');

    if (statNotesEl) statNotesEl.textContent = totalNotes;
    if (statCompEl) statCompEl.textContent = completedTasks;
    if (statPendEl) statPendEl.textContent = pendingTasks;
    if (statFavEl) statFavEl.textContent = favoritesCount;
    if (heroRateEl) heroRateEl.textContent = `${productivityRate}%`;
    if (dashProgressPctEl) dashProgressPctEl.textContent = `${productivityRate}% (${completedTasks}/${totalTasks})`;
    if (dashProgressFillEl) dashProgressFillEl.style.width = `${productivityRate}%`;

    this.updateNavBadges();
  }

  renderDashboardRecentNotes() {
    const container = document.getElementById('dashboard-recent-notes');
    if (!container) return;

    const recentNotes = [...this.notes]
      .sort((a, b) => new Date(b.updated || b.created) - new Date(a.updated || a.created))
      .slice(0, 4);

    if (recentNotes.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="padding: 1.5rem;">
          <div class="empty-state-icon" style="width: 40px; height: 40px; font-size: 1.2rem;"><i class="fas fa-feather"></i></div>
          <div class="empty-state-title" style="font-size: 0.95rem;">No notes yet</div>
          <p class="empty-state-desc" style="font-size: 0.78rem;">Create your first note to organize your thoughts.</p>
          <button class="btn-primary-sm" onclick="app.openNoteModal()"><i class="fas fa-plus"></i> Create Note</button>
        </div>
      `;
      return;
    }

    container.innerHTML = recentNotes.map(note => `
      <div class="dash-note-card" style="--note-color: ${note.color || '#3b82f6'};">
        <div class="dash-note-header">
          <div class="dash-note-title">${this.escapeHtml(note.title)}</div>
          <div class="dash-note-actions">
            <button class="icon-btn-tiny ${note.favorite ? 'favorited' : ''}" title="Favorite" onclick="app.toggleNoteFavorite('${note.id}')">
              <i class="fa${note.favorite ? 's' : 'r'} fa-star"></i>
            </button>
            <button class="icon-btn-tiny" title="Edit" onclick="app.openNoteModal('${note.id}')">
              <i class="fas fa-pen"></i>
            </button>
            <button class="icon-btn-tiny" title="Delete" onclick="app.deleteNote('${note.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="dash-note-body">${this.escapeHtml(note.content || 'No content')}</div>
        <div class="dash-note-footer">
          <span class="category-badge ${note.category}">${note.category}</span>
          <span>${this.formatDateShort(note.updated || note.created)}</span>
        </div>
      </div>
    `).join('');
  }

  renderDashboardTasks() {
    const container = document.getElementById('dashboard-tasks-list');
    if (!container) return;

    let tasksToRender = [...this.tasks];
    const activeFilterBtn = document.querySelector('.filter-pills-mini .mini-pill.active');
    const filter = activeFilterBtn ? activeFilterBtn.dataset.taskFilter : 'all';

    if (filter === 'pending') {
      tasksToRender = tasksToRender.filter(t => !t.completed);
    } else if (filter === 'completed') {
      tasksToRender = tasksToRender.filter(t => t.completed);
    }

    // Sort: uncompleted high priority first
    tasksToRender.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const prioOrder = { high: 3, medium: 2, low: 1 };
      return (prioOrder[b.priority] || 0) - (prioOrder[a.priority] || 0);
    });

    const displayTasks = tasksToRender.slice(0, 5);

    if (displayTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="padding: 1.5rem;">
          <div class="empty-state-icon" style="width: 40px; height: 40px; font-size: 1.2rem;"><i class="fas fa-check-double"></i></div>
          <div class="empty-state-title" style="font-size: 0.95rem;">Queue is empty</div>
          <p class="empty-state-desc" style="font-size: 0.78rem;">No tasks matching this filter. You're all caught up!</p>
          <button class="btn-primary-sm" onclick="app.openTaskModal()"><i class="fas fa-plus"></i> Add Task</button>
        </div>
      `;
      return;
    }

    container.innerHTML = displayTasks.map(task => {
      const dueInfo = this.formatDueBadge(task.dueDate);
      return `
        <div class="task-item-row ${task.completed ? 'completed' : ''}">
          <div class="custom-checkbox ${task.completed ? 'checked' : ''}" onclick="app.toggleTaskCompleted('${task.id}')"></div>
          <div class="task-row-content">
            <div class="task-row-title">${this.escapeHtml(task.title)}</div>
            <div class="task-row-meta">
              <span class="priority-pill ${task.priority}">${task.priority.toUpperCase()}</span>
              ${dueInfo}
            </div>
          </div>
          <div class="task-row-actions">
            <button class="icon-btn-tiny ${task.favorite ? 'favorited' : ''}" title="Favorite" onclick="app.toggleTaskFavorite('${task.id}')">
              <i class="fa${task.favorite ? 's' : 'r'} fa-star"></i>
            </button>
            <button class="icon-btn-tiny" title="Edit" onclick="app.openTaskModal('${task.id}')">
              <i class="fas fa-pen"></i>
            </button>
            <button class="icon-btn-tiny" title="Delete" onclick="app.deleteTask('${task.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderDashboardSchedule() {
    const container = document.getElementById('dashboard-upcoming-events');
    if (!container) return;

    // Find upcoming tasks with dueDate
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = this.tasks
      .filter(t => t.dueDate && !t.completed)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3);

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.84rem;">
          <i class="far fa-calendar-check" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
          No upcoming deadlines scheduled.
        </div>
      `;
      return;
    }

    container.innerHTML = upcoming.map(item => {
      const date = new Date(item.dueDate);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      return `
        <div class="event-snapshot-card">
          <div class="event-date-chip">
            <span class="event-chip-day">${day}</span>
            <span class="event-chip-month">${month}</span>
          </div>
          <div class="event-details">
            <div class="event-title">${this.escapeHtml(item.title)}</div>
            <div class="event-time-tag">
              <i class="fas fa-flag ${item.priority === 'high' ? 'text-danger' : 'text-warning'}"></i> ${item.priority.toUpperCase()} priority
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderDashboardActivity() {
    const container = document.getElementById('dashboard-activity-stream');
    if (!container) return;

    if (this.activities.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 1rem;">No recent activities logged yet.</div>';
      return;
    }

    const recents = this.activities.slice(-5).reverse();
    container.innerHTML = recents.map(act => `
      <div class="activity-node">
        <div class="activity-node-icon" style="background-color: ${act.color}25; color: ${act.color};">
          <i class="${act.icon}"></i>
        </div>
        <div class="activity-node-info">
          <div class="activity-node-text">${this.escapeHtml(act.title)}</div>
          <div class="activity-node-time">${this.timeAgo(act.timestamp)}</div>
        </div>
      </div>
    `).join('');
  }

  // ========================================================
  // NOTES MANAGEMENT (CRUD, FILTER, SORT, PIN, FAVORITE)
  // ========================================================

  openNoteModal(noteId = null) {
    const modal = document.getElementById('note-modal');
    const titleText = document.getElementById('note-modal-title-text');
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    const catSelect = document.getElementById('note-category-select');
    const pinCheck = document.getElementById('note-pinned-checkbox');
    const favCheck = document.getElementById('note-favorite-checkbox');

    if (noteId) {
      const note = this.notes.find(n => n.id === noteId);
      if (!note) return;
      this.editingNoteId = noteId;
      titleText.textContent = 'Edit Note';
      titleInput.value = note.title;
      contentInput.value = note.content || '';
      catSelect.value = note.category || 'personal';
      pinCheck.checked = Boolean(note.pinned);
      favCheck.checked = Boolean(note.favorite);

      const colorRadios = document.querySelectorAll('input[name="note-color"]');
      colorRadios.forEach(radio => {
        radio.checked = radio.value === (note.color || '#3b82f6');
      });
    } else {
      this.editingNoteId = null;
      titleText.textContent = 'New Note';
      titleInput.value = '';
      contentInput.value = '';
      catSelect.value = 'work';
      pinCheck.checked = false;
      favCheck.checked = false;

      const firstRadio = document.querySelector('input[name="note-color"][value="#3b82f6"]');
      if (firstRadio) firstRadio.checked = true;
    }

    modal.hidden = false;
    titleInput.focus();
  }

  saveNoteFromForm(e) {
    e.preventDefault();
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    const catSelect = document.getElementById('note-category-select');
    const pinCheck = document.getElementById('note-pinned-checkbox');
    const favCheck = document.getElementById('note-favorite-checkbox');
    const colorRadio = document.querySelector('input[name="note-color"]:checked');

    const title = titleInput.value.trim();
    if (!title) {
      this.showToast('Please provide a title for the note', 'error');
      return;
    }

    const content = contentInput.value.trim();
    const category = catSelect.value;
    const color = colorRadio ? colorRadio.value : '#3b82f6';
    const pinned = pinCheck.checked;
    const favorite = favCheck.checked;

    if (this.editingNoteId) {
      const note = this.notes.find(n => n.id === this.editingNoteId);
      if (note) {
        note.title = title;
        note.content = content;
        note.category = category;
        note.color = color;
        note.pinned = pinned;
        note.favorite = favorite;
        note.updated = new Date().toISOString();

        this.showToast('Note updated successfully', 'success');
        this.logActivity(`Updated note "${title}"`, 'fas fa-pen-to-square', '#3b82f6');
        this.addNotification('Note Updated', `"${title}" was modified`, 'info');
      }
    } else {
      const newNote = {
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        title,
        content,
        category,
        color,
        pinned,
        favorite,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      this.notes.unshift(newNote);
      this.showToast('Note created successfully', 'success');
      this.logActivity(`Created note "${title}"`, 'fas fa-sticky-note', '#10b981');
      this.addNotification('New Note Created', `"${title}" has been saved to your vault`, 'success');
    }

    this.saveNotes();
    document.getElementById('note-modal').hidden = true;
    this.renderNotes();
    this.renderDashboardRecentNotes();
    this.updateDashboardMetrics();
  }

  deleteNote(noteId) {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;

    this.showConfirmDialog(
      'Delete Note',
      `Are you sure you want to delete note "${note.title}"? This action cannot be reversed.`,
      () => {
        this.notes = this.notes.filter(n => n.id !== noteId);
        this.saveNotes();
        this.showToast('Note deleted', 'info');
        this.logActivity(`Deleted note "${note.title}"`, 'fas fa-trash', '#ef4444');
        this.renderNotes();
        this.renderDashboardRecentNotes();
        this.renderFavorites();
        this.updateDashboardMetrics();
      }
    );
  }

  toggleNotePin(noteId) {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.pinned = !note.pinned;
      note.updated = new Date().toISOString();
      this.saveNotes();
      this.renderNotes();
      this.showToast(note.pinned ? 'Note pinned to top' : 'Note unpinned', 'info');
    }
  }

  toggleNoteFavorite(noteId) {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.favorite = !note.favorite;
      note.updated = new Date().toISOString();
      this.saveNotes();
      this.renderNotes();
      this.renderDashboardRecentNotes();
      this.renderFavorites();
      this.updateDashboardMetrics();
      this.showToast(note.favorite ? 'Added to Starred Favorites' : 'Removed from Favorites', 'info');
    }
  }

  renderNotes() {
    const container = document.getElementById('notes-cards-grid');
    if (!container) return;

    const searchInput = document.getElementById('notes-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let list = [...this.notes];

    // Filter by category or status
    if (this.notesFilter === 'pinned') {
      list = list.filter(n => n.pinned);
    } else if (this.notesFilter === 'favorite') {
      list = list.filter(n => n.favorite);
    } else if (this.notesFilter !== 'all') {
      list = list.filter(n => n.category === this.notesFilter);
    }

    // Filter by search query
    if (query) {
      list = list.filter(n =>
        n.title.toLowerCase().includes(query) ||
        (n.content && n.content.toLowerCase().includes(query)) ||
        (n.category && n.category.toLowerCase().includes(query))
      );
    }

    // Sort list
    if (this.notesSort === 'newest') {
      list.sort((a, b) => new Date(b.created) - new Date(a.created));
    } else if (this.notesSort === 'oldest') {
      list.sort((a, b) => new Date(a.created) - new Date(b.created));
    } else if (this.notesSort === 'alpha-asc') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.notesSort === 'alpha-desc') {
      list.sort((a, b) => b.title.localeCompare(a.title));
    } else if (this.notesSort === 'category') {
      list.sort((a, b) => a.category.localeCompare(b.category));
    }

    // Always float pinned notes to the very top unless sorting alphabetically
    if (this.notesSort === 'newest' || this.notesSort === 'oldest') {
      list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-state-icon"><i class="fas fa-note-sticky"></i></div>
          <div class="empty-state-title">No Notes Found</div>
          <p class="empty-state-desc">Try clearing your filters or create a new note to start capturing your ideas.</p>
          <button class="btn-primary" onclick="app.openNoteModal()"><i class="fas fa-plus"></i> Create Note</button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(note => `
      <div class="note-vault-card ${note.pinned ? 'pinned' : ''}" style="--note-accent: ${note.color || '#3b82f6'};">
        <div class="note-color-stripe"></div>
        <div class="note-card-top-row">
          <div class="note-card-title">${this.escapeHtml(note.title)}</div>
          <div class="note-card-actions">
            <button class="action-btn-pill ${note.pinned ? 'active-pin' : ''}" title="${note.pinned ? 'Unpin' : 'Pin'}" onclick="app.toggleNotePin('${note.id}')">
              <i class="fas fa-thumbtack"></i>
            </button>
            <button class="action-btn-pill ${note.favorite ? 'active-fav' : ''}" title="Favorite" onclick="app.toggleNoteFavorite('${note.id}')">
              <i class="fa${note.favorite ? 's' : 'r'} fa-star"></i>
            </button>
            <button class="action-btn-pill" title="Edit" onclick="app.openNoteModal('${note.id}')">
              <i class="fas fa-pen"></i>
            </button>
            <button class="action-btn-pill danger" title="Delete" onclick="app.deleteNote('${note.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="note-card-content">${this.escapeHtml(note.content || 'No details added.')}</div>
        <div class="note-card-footer">
          <span class="category-badge ${note.category}">${note.category}</span>
          <div class="note-timestamp-meta">
            <span>Created: ${this.formatDateShort(note.created)}</span>
            ${note.updated && note.updated !== note.created ? `<span style="font-size: 0.65rem; opacity: 0.7;">Edited: ${this.formatDateShort(note.updated)}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  // ========================================================
  // TASK MANAGEMENT (CRUD, COMPLETE, FILTER, SORT, PRIORITY)
  // ========================================================

  openTaskModal(taskId = null, defaultDate = null) {
    const modal = document.getElementById('task-modal');
    const titleText = document.getElementById('task-modal-title-text');
    const titleInput = document.getElementById('task-title-input');
    const descInput = document.getElementById('task-desc-input');
    const prioritySelect = document.getElementById('task-priority-select');
    const dueDateInput = document.getElementById('task-due-date-input');
    const catSelect = document.getElementById('task-category-select');
    const favCheck = document.getElementById('task-favorite-checkbox');

    if (taskId) {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return;
      this.editingTaskId = taskId;
      titleText.textContent = 'Edit Task';
      titleInput.value = task.title;
      descInput.value = task.description || '';
      prioritySelect.value = task.priority || 'medium';
      dueDateInput.value = task.dueDate || '';
      catSelect.value = task.category || 'work';
      favCheck.checked = Boolean(task.favorite);
    } else {
      this.editingTaskId = null;
      titleText.textContent = 'New Task';
      titleInput.value = '';
      descInput.value = '';
      prioritySelect.value = 'medium';
      dueDateInput.value = defaultDate || new Date().toISOString().split('T')[0];
      catSelect.value = 'work';
      favCheck.checked = false;
    }

    modal.hidden = false;
    titleInput.focus();
  }

  saveTaskFromForm(e) {
    e.preventDefault();
    const titleInput = document.getElementById('task-title-input');
    const descInput = document.getElementById('task-desc-input');
    const prioritySelect = document.getElementById('task-priority-select');
    const dueDateInput = document.getElementById('task-due-date-input');
    const catSelect = document.getElementById('task-category-select');
    const favCheck = document.getElementById('task-favorite-checkbox');

    const title = titleInput.value.trim();
    if (!title) {
      this.showToast('Please enter a task title', 'error');
      return;
    }

    const description = descInput.value.trim();
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value;
    const category = catSelect.value;
    const favorite = favCheck.checked;

    if (this.editingTaskId) {
      const task = this.tasks.find(t => t.id === this.editingTaskId);
      if (task) {
        task.title = title;
        task.description = description;
        task.priority = priority;
        task.dueDate = dueDate;
        task.category = category;
        task.favorite = favorite;

        this.showToast('Task updated successfully', 'success');
        this.logActivity(`Updated task "${title}"`, 'fas fa-pen-to-square', '#f59e0b');
      }
    } else {
      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        title,
        description,
        priority,
        dueDate,
        category,
        completed: false,
        favorite,
        created: new Date().toISOString()
      };
      this.tasks.unshift(newTask);
      this.showToast('Task created successfully', 'success');
      this.logActivity(`Created task "${title}"`, 'fas fa-plus-circle', '#10b981');
      this.addNotification('New Task Added', `"${title}" has been assigned to queue`, 'info');
    }

    this.saveTasks();
    document.getElementById('task-modal').hidden = true;
    this.renderTasks();
    this.renderDashboardTasks();
    this.renderDashboardSchedule();
    this.updateDashboardMetrics();
    this.updateCalendarAgenda();
  }

  toggleTaskCompleted(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.renderDashboardTasks();
      this.renderFavorites();
      this.updateDashboardMetrics();
      this.updateCalendarAgenda();

      if (task.completed) {
        this.showToast(`Task "${task.title}" completed! 🎉`, 'success');
        this.logActivity(`Completed task "${task.title}"`, 'fas fa-circle-check', '#10b981');
        this.addNotification('Task Completed', `Great job on finishing "${task.title}"`, 'success');
      } else {
        this.showToast(`Task marked pending`, 'info');
      }
    }
  }

  toggleTaskFavorite(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.favorite = !task.favorite;
      this.saveTasks();
      this.renderTasks();
      this.renderDashboardTasks();
      this.renderFavorites();
      this.updateDashboardMetrics();
      this.showToast(task.favorite ? 'Task starred as favorite' : 'Removed from favorites', 'info');
    }
  }

  deleteTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.showConfirmDialog(
      'Delete Task',
      `Are you sure you want to permanently delete task "${task.title}"?`,
      () => {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.showToast('Task deleted', 'info');
        this.logActivity(`Deleted task "${task.title}"`, 'fas fa-trash', '#ef4444');
        this.renderTasks();
        this.renderDashboardTasks();
        this.renderDashboardSchedule();
        this.renderFavorites();
        this.updateDashboardMetrics();
        this.updateCalendarAgenda();
      }
    );
  }

  renderTasks() {
    const container = document.getElementById('tasks-full-list');
    if (!container) return;

    // Update Banner metrics
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const metComp = document.getElementById('tasks-metric-completed');
    const metPend = document.getElementById('tasks-metric-pending');
    const metRate = document.getElementById('tasks-metric-rate');
    const wideFill = document.getElementById('tasks-progress-wide-fill');
    const wideCaption = document.getElementById('tasks-progress-caption');

    if (metComp) metComp.textContent = completed;
    if (metPend) metPend.textContent = pending;
    if (metRate) metRate.textContent = `${rate}%`;
    if (wideFill) wideFill.style.width = `${rate}%`;
    if (wideCaption) wideCaption.textContent = `${completed} of ${total} deliverables completed (${rate}%)`;

    // Filter tasks
    const searchInput = document.getElementById('tasks-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let list = [...this.tasks];

    if (this.tasksFilter === 'pending') {
      list = list.filter(t => !t.completed);
    } else if (this.tasksFilter === 'completed') {
      list = list.filter(t => t.completed);
    } else if (['high', 'medium', 'low'].includes(this.tasksFilter)) {
      list = list.filter(t => t.priority === this.tasksFilter);
    }

    if (query) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // Sort tasks
    if (this.tasksSort === 'dueDate') {
      list.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else if (this.tasksSort === 'priority') {
      const order = { high: 3, medium: 2, low: 1 };
      list.sort((a, b) => (order[b.priority] || 0) - (order[a.priority] || 0));
    } else if (this.tasksSort === 'newest') {
      list.sort((a, b) => new Date(b.created) - new Date(a.created));
    } else if (this.tasksSort === 'alpha') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-state-icon"><i class="fas fa-list-check"></i></div>
          <div class="empty-state-title">No Tasks Match Filter</div>
          <p class="empty-state-desc">You have no tasks matching this criteria. Create a new task or modify filters.</p>
          <button class="btn-primary" onclick="app.openTaskModal()"><i class="fas fa-plus"></i> New Task</button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(task => {
      const dueInfo = this.formatDueBadge(task.dueDate);
      return `
        <div class="task-card-full ${task.completed ? 'completed' : ''}">
          <div class="custom-checkbox ${task.completed ? 'checked' : ''}" onclick="app.toggleTaskCompleted('${task.id}')"></div>
          <div class="task-card-body">
            <div class="task-card-title">${this.escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-card-desc">${this.escapeHtml(task.description)}</div>` : ''}
            <div class="task-card-tags">
              <span class="priority-pill ${task.priority}"><i class="fas fa-flag"></i> ${task.priority.toUpperCase()}</span>
              ${dueInfo}
              ${task.category ? `<span class="category-badge ${task.category}">${task.category}</span>` : ''}
            </div>
          </div>
          <div class="task-row-actions">
            <button class="action-btn-pill ${task.favorite ? 'active-fav' : ''}" title="Favorite" onclick="app.toggleTaskFavorite('${task.id}')">
              <i class="fa${task.favorite ? 's' : 'r'} fa-star"></i>
            </button>
            <button class="action-btn-pill" title="Edit" onclick="app.openTaskModal('${task.id}')">
              <i class="fas fa-pen"></i>
            </button>
            <button class="action-btn-pill danger" title="Delete" onclick="app.deleteTask('${task.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ========================================================
  // CALENDAR MANAGEMENT (MONTH VIEW, EVENT SYNC)
  // ========================================================

  renderCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthDisplay = document.getElementById('calendar-month-display');
    if (monthDisplay) {
      monthDisplay.textContent = `${monthNames[month]} ${year}`;
    }

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const daysGrid = document.getElementById('calendar-days-grid');
    if (!daysGrid) return;
    daysGrid.innerHTML = '';

    const today = new Date();
    const todayStr = today.toDateString();
    const selectedStr = this.selectedDate.toDateString();

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-cell other-month';
      dayEl.textContent = dayNum;
      daysGrid.appendChild(dayEl);
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateIso = dateObj.toISOString().split('T')[0];
      const isToday = dateObj.toDateString() === todayStr;
      const isSelected = dateObj.toDateString() === selectedStr;
      
      const hasEvents = this.tasks.some(t => t.dueDate === dateIso) || 
                        this.notes.some(n => n.created.split('T')[0] === dateIso);

      const cell = document.createElement('div');
      cell.className = `calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvents ? 'has-events' : ''}`;
      cell.textContent = d;
      cell.onclick = () => {
        this.selectedDate = dateObj;
        this.renderCalendar();
        this.updateCalendarAgenda();
      };
      daysGrid.appendChild(cell);
    }

    // Next month fill days (keep 6 rows = 42 cells)
    const totalCells = daysGrid.children.length;
    const remaining = 42 - totalCells;
    for (let j = 1; j <= remaining; j++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-cell other-month';
      dayEl.textContent = j;
      daysGrid.appendChild(dayEl);
    }

    this.updateCalendarAgenda();
  }

  updateCalendarAgenda() {
    const heading = document.getElementById('agenda-date-heading');
    const dayLabel = document.getElementById('agenda-day-name');
    const container = document.getElementById('calendar-events-list');

    if (!container) return;

    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const dateFormatted = this.selectedDate.toLocaleDateString('en-US', options);
    const dayOfWeek = this.selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    if (heading) heading.textContent = dateFormatted;
    if (dayLabel) dayLabel.textContent = dayOfWeek;

    const selectedIso = this.selectedDate.toISOString().split('T')[0];

    // Find tasks on this date
    const matchingTasks = this.tasks.filter(t => t.dueDate === selectedIso);
    // Find notes created on this date
    const matchingNotes = this.notes.filter(n => n.created.split('T')[0] === selectedIso);

    if (matchingTasks.length === 0 && matchingNotes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 2rem 1rem;">
          <i class="far fa-calendar-times" style="font-size: 1.8rem; margin-bottom: 0.6rem; display: block; opacity: 0.5;"></i>
          No items scheduled for this date.
          <div style="margin-top: 1rem;">
            <button class="btn-primary-sm" onclick="app.openTaskModal(null, '${selectedIso}')">
              <i class="fas fa-plus"></i> Add Task for this Day
            </button>
          </div>
        </div>
      `;
      return;
    }

    let html = '';

    if (matchingTasks.length > 0) {
      html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem;">Tasks (${matchingTasks.length})</div>`;
      html += matchingTasks.map(t => `
        <div class="task-item-row ${t.completed ? 'completed' : ''}" style="padding: 0.55rem 0.75rem;">
          <div class="custom-checkbox ${t.completed ? 'checked' : ''}" onclick="app.toggleTaskCompleted('${t.id}')"></div>
          <div class="task-row-content">
            <div class="task-row-title" style="font-size: 0.82rem;">${this.escapeHtml(t.title)}</div>
            <div class="task-row-meta">
              <span class="priority-pill ${t.priority}">${t.priority}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    if (matchingNotes.length > 0) {
      html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 0.8rem 0 0.4rem;">Notes Created (${matchingNotes.length})</div>`;
      html += matchingNotes.map(n => `
        <div class="dash-note-card" style="padding: 0.75rem; margin-bottom: 0.4rem; --note-color: ${n.color || '#3b82f6'};">
          <div class="dash-note-header">
            <div class="dash-note-title" style="font-size: 0.84rem;">${this.escapeHtml(n.title)}</div>
            <button class="icon-btn-tiny" onclick="app.openNoteModal('${n.id}')"><i class="fas fa-pen"></i></button>
          </div>
          <div class="dash-note-body" style="font-size: 0.75rem; -webkit-line-clamp: 1;">${this.escapeHtml(n.content || '')}</div>
        </div>
      `).join('');
    }

    container.innerHTML = html;
  }

  // ========================================================
  // ANALYTICS & CHART.JS SUITE
  // ========================================================

  initCharts() {
    if (typeof Chart === 'undefined') {
      setTimeout(() => this.initCharts(), 500);
      return;
    }

    // Chart.js default global options
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = this.settings.darkMode ? '#94a3b8' : '#64748b';

    // 1. Tasks Status Donut Chart
    const tasksCtx = document.getElementById('tasksChart');
    if (tasksCtx) {
      this.charts.tasks = new Chart(tasksCtx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Pending'],
          datasets: [{
            data: [0, 0],
            backgroundColor: ['#10b981', '#f59e0b'],
            borderWidth: 2,
            borderColor: this.settings.darkMode ? '#111827' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } }
          }
        }
      });
    }

    // 2. Weekly Productivity Velocity Line Chart
    const prodCtx = document.getElementById('productivityChart');
    if (prodCtx) {
      this.charts.productivity = new Chart(prodCtx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Tasks Finished',
            data: [3, 5, 2, 8, 6, 4, 7],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: this.settings.darkMode ? '#1e293b' : '#f1f5f9' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // 3. Notes by Category Bar Chart
    const notesCtx = document.getElementById('notesChart');
    if (notesCtx) {
      this.charts.notes = new Chart(notesCtx, {
        type: 'bar',
        data: {
          labels: ['Work', 'Personal', 'Ideas', 'Study', 'Other'],
          datasets: [{
            label: 'Notes',
            data: [0, 0, 0, 0, 0],
            backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: this.settings.darkMode ? '#1e293b' : '#f1f5f9' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // 4. Task Priority Breakdown Chart
    const priorityCtx = document.getElementById('priorityChart');
    if (priorityCtx) {
      this.charts.priority = new Chart(priorityCtx, {
        type: 'doughnut',
        data: {
          labels: ['High', 'Medium', 'Low'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#ef4444', '#f59e0b', '#0ea5e9'],
            borderWidth: 2,
            borderColor: this.settings.darkMode ? '#111827' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } }
          }
        }
      });
    }

    this.updateCharts();
  }

  updateCharts() {
    if (!this.charts.tasks) return;

    // KPI values
    const kpiNotes = document.getElementById('kpi-notes-count');
    const kpiTasks = document.getElementById('kpi-tasks-completed');
    const kpiRate = document.getElementById('kpi-completion-rate');
    const kpiFavs = document.getElementById('kpi-favorites-count');

    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const favCount = this.notes.filter(n => n.favorite).length + this.tasks.filter(t => t.favorite).length;

    if (kpiNotes) kpiNotes.textContent = this.notes.length;
    if (kpiTasks) kpiTasks.textContent = completedTasks;
    if (kpiRate) kpiRate.textContent = `${rate}%`;
    if (kpiFavs) kpiFavs.textContent = favCount;

    // 1. Update Tasks Chart
    if (this.charts.tasks) {
      this.charts.tasks.data.datasets[0].data = [completedTasks, pendingTasks];
      this.charts.tasks.update();
    }

    // 2. Update Notes by category
    if (this.charts.notes) {
      const cats = ['work', 'personal', 'ideas', 'study', 'other'];
      const counts = cats.map(c => this.notes.filter(n => n.category === c).length);
      this.charts.notes.data.datasets[0].data = counts;
      this.charts.notes.update();
    }

    // 3. Update Priority Chart
    if (this.charts.priority) {
      const high = this.tasks.filter(t => t.priority === 'high').length;
      const medium = this.tasks.filter(t => t.priority === 'medium').length;
      const low = this.tasks.filter(t => t.priority === 'low').length;
      this.charts.priority.data.datasets[0].data = [high, medium, low];
      this.charts.priority.update();
    }
  }

  updateChartsTheme() {
    const isDark = Boolean(this.settings.darkMode);
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#1e293b' : '#f1f5f9';
    const borderColor = isDark ? '#111827' : '#ffffff';

    Object.values(this.charts).forEach(chart => {
      if (!chart) return;
      if (chart.options.scales) {
        if (chart.options.scales.x) chart.options.scales.x.ticks.color = textColor;
        if (chart.options.scales.y) {
          chart.options.scales.y.ticks.color = textColor;
          chart.options.scales.y.grid.color = gridColor;
        }
      }
      if (chart.options.plugins?.legend?.labels) {
        chart.options.plugins.legend.labels.color = textColor;
      }
      if (chart.data.datasets[0] && chart.config.type === 'doughnut') {
        chart.data.datasets[0].borderColor = borderColor;
      }
      chart.update();
    });
  }

  // ========================================================
  // FAVORITES SECTION
  // ========================================================

  renderFavorites() {
    const notesContainer = document.getElementById('fav-notes-grid');
    const tasksContainer = document.getElementById('fav-tasks-list');
    const notesCountEl = document.getElementById('fav-notes-count');
    const tasksCountEl = document.getElementById('fav-tasks-count');

    const favNotes = this.notes.filter(n => n.favorite);
    const favTasks = this.tasks.filter(t => t.favorite);

    if (notesCountEl) notesCountEl.textContent = favNotes.length;
    if (tasksCountEl) tasksCountEl.textContent = favTasks.length;

    if (notesContainer) {
      if (favNotes.length === 0) {
        notesContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">No starred notes yet. Click the star icon on any note to bookmark it here.</div>';
      } else {
        notesContainer.innerHTML = favNotes.map(note => `
          <div class="note-vault-card" style="--note-accent: ${note.color || '#3b82f6'};">
            <div class="note-color-stripe"></div>
            <div class="note-card-top-row">
              <div class="note-card-title">${this.escapeHtml(note.title)}</div>
              <div class="note-card-actions">
                <button class="action-btn-pill active-fav" title="Unstar" onclick="app.toggleNoteFavorite('${note.id}')">
                  <i class="fas fa-star"></i>
                </button>
                <button class="action-btn-pill" title="Edit" onclick="app.openNoteModal('${note.id}')">
                  <i class="fas fa-pen"></i>
                </button>
              </div>
            </div>
            <div class="note-card-content">${this.escapeHtml(note.content || '')}</div>
            <div class="note-card-footer">
              <span class="category-badge ${note.category}">${note.category}</span>
              <span>${this.formatDateShort(note.created)}</span>
            </div>
          </div>
        `).join('');
      }
    }

    if (tasksContainer) {
      if (favTasks.length === 0) {
        tasksContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">No starred tasks yet. Click the star icon on any task to prioritize it here.</div>';
      } else {
        tasksContainer.innerHTML = favTasks.map(task => `
          <div class="task-card-full ${task.completed ? 'completed' : ''}">
            <div class="custom-checkbox ${task.completed ? 'checked' : ''}" onclick="app.toggleTaskCompleted('${task.id}')"></div>
            <div class="task-card-body">
              <div class="task-card-title">${this.escapeHtml(task.title)}</div>
              <div class="task-card-tags">
                <span class="priority-pill ${task.priority}">${task.priority.toUpperCase()}</span>
                ${this.formatDueBadge(task.dueDate)}
              </div>
            </div>
            <div class="task-row-actions">
              <button class="action-btn-pill active-fav" title="Unstar" onclick="app.toggleTaskFavorite('${task.id}')">
                <i class="fas fa-star"></i>
              </button>
              <button class="action-btn-pill" title="Edit" onclick="app.openTaskModal('${task.id}')">
                <i class="fas fa-pen"></i>
              </button>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // ========================================================
  // GLOBAL SEARCH ENGINE (NOTES, TASKS, TAGS)
  // ========================================================

  handleGlobalSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    const content = document.getElementById('search-results-content');
    const countEl = document.getElementById('search-results-count');

    if (!query || query.trim().length === 0) {
      if (dropdown) dropdown.hidden = true;
      return;
    }

    const q = query.toLowerCase().trim();
    const matchingNotes = this.notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      (n.content && n.content.toLowerCase().includes(q)) ||
      (n.category && n.category.toLowerCase().includes(q))
    );

    const matchingTasks = this.tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q))
    );

    const totalResults = matchingNotes.length + matchingTasks.length;
    if (countEl) countEl.textContent = `${totalResults} result${totalResults === 1 ? '' : 's'} for "${query}"`;

    if (totalResults === 0) {
      content.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.82rem;">No matching notes or tasks found.</div>';
      dropdown.hidden = false;
      return;
    }

    let html = '';

    if (matchingNotes.length > 0) {
      html += `<div class="search-group-title">Notes (${matchingNotes.length})</div>`;
      html += matchingNotes.slice(0, 4).map(n => `
        <div class="search-item" onclick="app.openNoteModal('${n.id}'); document.getElementById('search-results-dropdown').hidden = true;">
          <div class="search-item-icon" style="background-color: var(--primary-light); color: var(--primary);">
            <i class="fas fa-sticky-note"></i>
          </div>
          <div class="search-item-info">
            <div class="search-item-title">${this.escapeHtml(n.title)}</div>
            <div class="search-item-desc">${this.escapeHtml(n.content || 'Note')}</div>
          </div>
        </div>
      `).join('');
    }

    if (matchingTasks.length > 0) {
      html += `<div class="search-group-title" style="margin-top: 0.5rem;">Tasks (${matchingTasks.length})</div>`;
      html += matchingTasks.slice(0, 4).map(t => `
        <div class="search-item" onclick="app.openTaskModal('${t.id}'); document.getElementById('search-results-dropdown').hidden = true;">
          <div class="search-item-icon" style="background-color: var(--success-light); color: var(--success);">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="search-item-info">
            <div class="search-item-title">${this.escapeHtml(t.title)}</div>
            <div class="search-item-desc">${t.priority.toUpperCase()} Priority • ${t.dueDate ? 'Due ' + t.dueDate : 'No due date'}</div>
          </div>
        </div>
      `).join('');
    }

    content.innerHTML = html;
    dropdown.hidden = false;
  }

  // ========================================================
  // NOTIFICATIONS CENTER
  // ========================================================

  addNotification(title, message, type = 'info') {
    const item = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(item);
    if (this.notifications.length > 30) this.notifications = this.notifications.slice(0, 30);
    this.saveNotifications();
    this.renderNotificationsList();
  }

  renderNotificationsList() {
    const listEl = document.getElementById('notifications-list');
    const badgeEl = document.getElementById('notification-badge');

    const unreadCount = this.notifications.filter(n => !n.read).length;
    if (badgeEl) {
      badgeEl.textContent = unreadCount;
      badgeEl.hidden = unreadCount === 0;
    }

    if (!listEl) return;

    if (this.notifications.length === 0) {
      listEl.innerHTML = '<div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">No notifications right now.</div>';
      return;
    }

    const icons = {
      success: 'fas fa-check-circle text-success',
      error: 'fas fa-triangle-exclamation text-danger',
      warning: 'fas fa-clock text-warning',
      info: 'fas fa-circle-info text-info'
    };

    listEl.innerHTML = this.notifications.map(n => `
      <div class="notification-item ${n.read ? '' : 'unread'}" onclick="app.markNotificationAsRead('${n.id}')">
        <div class="notification-icon-box" style="background-color: var(--bg-subtle);">
          <i class="${icons[n.type] || icons.info}"></i>
        </div>
        <div class="notification-body">
          <div class="notification-title">${this.escapeHtml(n.title)}</div>
          <div class="notification-message">${this.escapeHtml(n.message)}</div>
          <div class="notification-time">${this.timeAgo(n.timestamp)}</div>
        </div>
      </div>
    `).join('');
  }

  markNotificationAsRead(id) {
    const item = this.notifications.find(n => n.id === id);
    if (item) {
      item.read = true;
      this.saveNotifications();
      this.renderNotificationsList();
    }
  }

  markAllNotificationsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.renderNotificationsList();
    this.showToast('All notifications marked as read', 'info');
  }

  clearNotifications() {
    this.notifications = [];
    this.saveNotifications();
    this.renderNotificationsList();
    this.showToast('Notifications cleared', 'info');
  }

  checkTaskDeadlines() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date(Date.now() + 86400000);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    this.tasks.forEach(t => {
      if (t.completed || !t.dueDate) return;

      if (t.dueDate < today) {
        const key = `alert_overdue_${t.id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          this.addNotification('Overdue Task Alert', `Task "${t.title}" is overdue (${t.dueDate})!`, 'error');
        }
      } else if (t.dueDate === today) {
        const key = `alert_today_${t.id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          this.addNotification('Due Today', `Task "${t.title}" is scheduled for completion today.`, 'warning');
        }
      }
    });
  }

  // ========================================================
  // USER PROFILE & SETTINGS
  // ========================================================

  renderUserProfile() {
    const nameDisplays = document.querySelectorAll('.user-name-display');
    const roleDisplays = document.querySelectorAll('.user-role-display');
    const emailDisplays = document.querySelectorAll('.user-email-display');
    const avatarImages = document.querySelectorAll('.user-avatar-src');

    nameDisplays.forEach(el => el.textContent = this.profile.name || 'Alex Morgan');
    roleDisplays.forEach(el => el.textContent = this.profile.role || 'Product Lead');
    emailDisplays.forEach(el => el.textContent = this.profile.email || 'alex.morgan@example.com');

    const avatarUrl = this.profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.profile.name || 'Alex'}`;
    avatarImages.forEach(img => img.src = avatarUrl);
  }

  openProfileModal() {
    const modal = document.getElementById('profile-modal');
    const nameInput = document.getElementById('profile-modal-name');
    const emailInput = document.getElementById('profile-modal-email');
    const roleInput = document.getElementById('profile-modal-role');
    const seedInput = document.getElementById('profile-modal-seed');
    const previewImg = document.getElementById('modal-avatar-preview');

    nameInput.value = this.profile.name || '';
    emailInput.value = this.profile.email || '';
    roleInput.value = this.profile.role || '';
    seedInput.value = this.profile.avatarSeed || this.profile.name || 'Alex';
    previewImg.src = this.profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedInput.value}`;

    modal.hidden = false;
  }

  saveProfileFromForm(e) {
    e.preventDefault();
    const name = document.getElementById('profile-modal-name').value.trim();
    const email = document.getElementById('profile-modal-email').value.trim();
    const role = document.getElementById('profile-modal-role').value.trim();
    const seed = document.getElementById('profile-modal-seed').value.trim() || name || 'Alex';

    this.profile.name = name;
    this.profile.email = email;
    this.profile.role = role;
    this.profile.avatarSeed = seed;
    this.profile.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

    this.saveProfile();
    this.renderUserProfile();
    this.updateGreeting();
    document.getElementById('profile-modal').hidden = true;
    this.showToast('Profile updated successfully', 'success');
  }

  populateSettingsForm() {
    const nameInput = document.getElementById('settings-profile-name');
    const emailInput = document.getElementById('settings-profile-email');
    const roleInput = document.getElementById('settings-profile-role');
    const seedInput = document.getElementById('settings-profile-avatar-seed');
    const bioInput = document.getElementById('settings-profile-bio');

    if (nameInput) nameInput.value = this.profile.name || '';
    if (emailInput) emailInput.value = this.profile.email || '';
    if (roleInput) roleInput.value = this.profile.role || '';
    if (seedInput) seedInput.value = this.profile.avatarSeed || '';
    if (bioInput) bioInput.value = this.profile.bio || '';

    const notifToggle = document.getElementById('settings-notifications-toggle');
    if (notifToggle) notifToggle.classList.toggle('active', Boolean(this.settings.notifications));

    const deadlineToggle = document.getElementById('settings-deadline-alerts-toggle');
    if (deadlineToggle) deadlineToggle.classList.toggle('active', Boolean(this.settings.deadlineAlerts));
  }

  saveSettingsProfile(e) {
    e.preventDefault();
    const name = document.getElementById('settings-profile-name').value.trim();
    const email = document.getElementById('settings-profile-email').value.trim();
    const role = document.getElementById('settings-profile-role').value.trim();
    const seed = document.getElementById('settings-profile-avatar-seed').value.trim() || name || 'Alex';
    const bio = document.getElementById('settings-profile-bio').value.trim();

    this.profile = {
      ...this.profile,
      name,
      email,
      role,
      avatarSeed: seed,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`,
      bio
    };

    this.saveProfile();
    this.renderUserProfile();
    this.updateGreeting();
    this.showToast('Settings saved successfully', 'success');
  }

  // ========================================================
  // DATA PORTABILITY (EXPORT, IMPORT, RESET, CLEAR)
  // ========================================================

  exportAllData() {
    const payload = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      profile: this.profile,
      settings: this.settings,
      notes: this.notes,
      tasks: this.tasks,
      activities: this.activities
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nexus-workspace-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    this.showToast('Workspace backup exported successfully', 'success');
  }

  importDataFromFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported.notes)) this.notes = imported.notes;
        if (Array.isArray(imported.tasks)) this.tasks = imported.tasks;
        if (imported.profile) this.profile = imported.profile;
        if (imported.settings) this.settings = imported.settings;
        if (Array.isArray(imported.activities)) this.activities = imported.activities;

        this.saveNotes();
        this.saveTasks();
        this.saveProfile();
        this.saveSettings();
        this.saveActivities();

        this.applyTheme();
        this.renderUserProfile();
        this.updateDashboardMetrics();
        this.showToast('Data imported successfully!', 'success');
        this.navigateToSection('dashboard');
      } catch (err) {
        this.showToast('Failed to import JSON file: invalid format', 'error');
      }
    };
    reader.readAsText(file);
  }

  confirmClearAllData() {
    this.showConfirmDialog(
      'Clear All Workspace Data',
      'This will erase all notes, tasks, activities, and restore default configurations. Do you wish to continue?',
      () => {
        localStorage.clear();
        this.notes = [];
        this.tasks = [];
        this.activities = [];
        this.notifications = [];
        this.saveNotes();
        this.saveTasks();
        this.saveActivities();
        this.saveNotifications();

        this.updateDashboardMetrics();
        this.renderNotes();
        this.renderTasks();
        this.renderDashboardRecentNotes();
        this.renderDashboardTasks();
        this.renderFavorites();
        this.updateCharts();

        this.showToast('All workspace data has been cleared', 'info');
      }
    );
  }

  populateDemoData() {
    this.notes = [
      {
        id: 'note_demo_1',
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
        id: 'note_demo_2',
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
        id: 'note_demo_3',
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
        id: 'note_demo_4',
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
        id: 'note_demo_5',
        title: 'Reading List - Tech & Design',
        content: '1. Designing Data-Intensive Applications\n2. Refactoring UI by Adam Wathan\n3. Staff Engineer: Leadership beyond the management track',
        category: 'study',
        color: '#ec4899',
        pinned: false,
        favorite: true,
        created: new Date(Date.now() - 6 * 86400000).toISOString(),
        updated: new Date(Date.now() - 6 * 86400000).toISOString()
      }
    ];

    const today = new Date();
    const plusDays = (days) => new Date(today.getTime() + days * 86400000).toISOString().split('T')[0];

    this.tasks = [
      {
        id: 'task_demo_1',
        title: 'Finalize Modern Dashboard Design System',
        description: 'Audit color tokens, glassmorphism card elevation, responsive layout, and dark mode palette.',
        priority: 'high',
        dueDate: plusDays(1),
        category: 'work',
        completed: true,
        favorite: true,
        created: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      {
        id: 'task_demo_2',
        title: 'Implement Interactive Calendar & Event Sync',
        description: 'Connect calendar day picker to active tasks and render upcoming events panel with quick action.',
        priority: 'high',
        dueDate: plusDays(2),
        category: 'work',
        completed: false,
        favorite: true,
        created: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'task_demo_3',
        title: 'Configure Chart.js Analytics Suite',
        description: 'Set up donut overview, weekly productivity velocity, notes distribution, and priority charts.',
        priority: 'medium',
        dueDate: plusDays(3),
        category: 'work',
        completed: false,
        favorite: false,
        created: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        id: 'task_demo_4',
        title: 'Review Pull Requests & Merge CI fixes',
        description: 'Check automated tests, linter output, and Express server routes for contact form.',
        priority: 'high',
        dueDate: plusDays(0),
        category: 'work',
        completed: false,
        favorite: false,
        created: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        id: 'task_demo_5',
        title: 'Weekly Team Sync & Sprint Retrospective',
        description: 'Present prototype milestones to stakeholders and gather user feedback.',
        priority: 'medium',
        dueDate: plusDays(4),
        category: 'work',
        completed: false,
        favorite: false,
        created: new Date(Date.now() - 4 * 86400000).toISOString()
      },
      {
        id: 'task_demo_6',
        title: 'Hydration & 30-minute Cardio Session',
        description: 'Drink 2L water and complete outdoor jogging routine.',
        priority: 'low',
        dueDate: plusDays(0),
        category: 'personal',
        completed: true,
        favorite: false,
        created: new Date(Date.now() - 1 * 86400000).toISOString()
      }
    ];

    this.activities = [
      { title: 'Loaded workspace demo environment', icon: 'fas fa-wand-magic-sparkles', color: '#10b981', timestamp: new Date().toISOString() },
      { title: 'Completed Dashboard Design System', icon: 'fas fa-circle-check', color: '#2563eb', timestamp: new Date(Date.now() - 86400000).toISOString() }
    ];

    this.saveNotes();
    this.saveTasks();
    this.saveActivities();
  }

  // ========================================================
  // BACKEND API SYNC (EXPRESS SERVER INTEGRATION)
  // ========================================================

  async syncWithBackend() {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        console.log('Nexus API server connected. Synchronizing state...');
        // Sync stats from API
        fetch('/api/stats')
          .then(res => res.json())
          .then(data => {
            console.log('Server stats:', data);
          })
          .catch(() => {});
      }
    } catch (e) {
      // Backend not running or static mode; fallback entirely to localStorage
      console.log('Standalone mode active (localStorage).');
    }
  }

  // ========================================================
  // EVENT LISTENERS & INTERACTION BINDINGS
  // ========================================================

  setupEventListeners() {
    // 1. Sidebar SPA Navigation
    document.querySelectorAll('.sidebar .nav-item[data-section]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigateToSection(btn.dataset.section);
      });
    });

    // 2. Mobile Hamburger menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => sidebar.classList.add('active'));
    }
    if (sidebarCloseBtn && sidebar) {
      sidebarCloseBtn.addEventListener('click', () => sidebar.classList.remove('active'));
    }
    if (sidebarOverlay && sidebar) {
      sidebarOverlay.addEventListener('click', () => sidebar.classList.remove('active'));
    }

    // 3. Theme Toggles
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());

    const settingsDarkToggle = document.getElementById('settings-dark-mode-toggle');
    if (settingsDarkToggle) settingsDarkToggle.addEventListener('click', () => this.toggleTheme());

    // 4. Accent Color Dots
    document.querySelectorAll('#accent-color-picker .color-dot').forEach(dot => {
      dot.addEventListener('click', () => this.setAccentColor(dot.dataset.color));
    });

    // 5. Global Search Input
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleGlobalSearch(e.target.value));
    }
    const clearSearchBtn = document.getElementById('clear-search-btn');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        document.getElementById('search-results-dropdown').hidden = true;
      });
    }

    // 6. Notifications Panel
    const notifBtn = document.getElementById('notifications-btn');
    const notifPanel = document.getElementById('notifications-panel');
    if (notifBtn && notifPanel) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifPanel.hidden = !notifPanel.hidden;
      });
    }
    const markReadBtn = document.getElementById('mark-notifications-read-btn');
    if (markReadBtn) markReadBtn.addEventListener('click', () => this.markAllNotificationsRead());

    const clearNotifsBtn = document.getElementById('clear-notifications-btn');
    if (clearNotifsBtn) clearNotifsBtn.addEventListener('click', () => this.clearNotifications());

    // 7. User Menu Dropdown
    const userProfileBtn = document.getElementById('user-profile-btn');
    const userMenu = document.getElementById('user-dropdown-menu');
    if (userProfileBtn && userMenu) {
      userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.hidden = !userMenu.hidden;
      });
    }

    // Outside click dismissal
    document.addEventListener('click', (e) => {
      if (userMenu && !userMenu.contains(e.target) && !userProfileBtn?.contains(e.target)) {
        userMenu.hidden = true;
      }
      if (notifPanel && !notifPanel.contains(e.target) && !notifBtn?.contains(e.target)) {
        notifPanel.hidden = true;
      }
      const searchBox = document.getElementById('global-search-container');
      const searchDrop = document.getElementById('search-results-dropdown');
      if (searchDrop && searchBox && !searchBox.contains(e.target)) {
        searchDrop.hidden = true;
      }
    });

    // 8. User Menu Triggers
    document.getElementById('menu-edit-profile-btn')?.addEventListener('click', () => {
      userMenu.hidden = true;
      this.openProfileModal();
    });
    document.getElementById('sidebar-user-trigger')?.addEventListener('click', () => this.openProfileModal());
    document.getElementById('menu-settings-btn')?.addEventListener('click', () => {
      userMenu.hidden = true;
      this.navigateToSection('settings');
    });

    const logoutHandler = () => {
      this.showConfirmDialog('Logout', 'Are you sure you want to log out of Nexus Workspace?', () => {
        this.showToast('You have successfully logged out.', 'info');
      });
    };
    document.getElementById('menu-logout-btn')?.addEventListener('click', logoutHandler);
    document.getElementById('sidebar-logout-btn')?.addEventListener('click', logoutHandler);

    // 9. Hero Quick Action Buttons
    document.getElementById('hero-create-note-btn')?.addEventListener('click', () => this.openNoteModal());
    document.getElementById('hero-create-task-btn')?.addEventListener('click', () => this.openTaskModal());
    document.getElementById('hero-view-calendar-btn')?.addEventListener('click', () => this.navigateToSection('calendar'));
    document.getElementById('hero-view-analytics-btn')?.addEventListener('click', () => this.navigateToSection('analytics'));
    document.getElementById('dash-view-all-notes-btn')?.addEventListener('click', () => this.navigateToSection('notes'));
    document.getElementById('dash-add-task-btn')?.addEventListener('click', () => this.openTaskModal());
    document.getElementById('dash-view-calendar-btn')?.addEventListener('click', () => this.navigateToSection('calendar'));

    // Dashboard task filter mini pills
    document.querySelectorAll('.filter-pills-mini .mini-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-pills-mini .mini-pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        this.renderDashboardTasks();
      });
    });

    // 10. Notes Section Controls
    document.getElementById('notes-new-btn')?.addEventListener('click', () => this.openNoteModal());
    document.getElementById('note-form')?.addEventListener('submit', (e) => this.saveNoteFromForm(e));
    document.getElementById('notes-search-input')?.addEventListener('input', () => this.renderNotes());

    document.querySelectorAll('#notes-category-chips .filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('#notes-category-chips .filter-chip').forEach(c => c.classList.remove('active'));
        const btn = e.target.closest('.filter-chip');
        btn.classList.add('active');
        this.notesFilter = btn.dataset.filter;
        this.renderNotes();
      });
    });

    document.getElementById('notes-sort-select')?.addEventListener('change', (e) => {
      this.notesSort = e.target.value;
      this.renderNotes();
    });

    // 11. Tasks Section Controls
    document.getElementById('tasks-new-btn')?.addEventListener('click', () => this.openTaskModal());
    document.getElementById('task-form')?.addEventListener('submit', (e) => this.saveTaskFromForm(e));
    document.getElementById('tasks-search-input')?.addEventListener('input', () => this.renderTasks());

    document.querySelectorAll('#tasks-filter-chips .filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('#tasks-filter-chips .filter-chip').forEach(c => c.classList.remove('active'));
        const btn = e.target.closest('.filter-chip');
        btn.classList.add('active');
        this.tasksFilter = btn.dataset.taskFilter;
        this.renderTasks();
      });
    });

    document.getElementById('tasks-sort-select')?.addEventListener('change', (e) => {
      this.tasksSort = e.target.value;
      this.renderTasks();
    });

    // 12. Calendar Controls
    document.getElementById('cal-prev-month')?.addEventListener('click', () => {
      this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
      this.renderCalendar();
    });
    document.getElementById('cal-next-month')?.addEventListener('click', () => {
      this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
      this.renderCalendar();
    });
    document.getElementById('cal-today-btn')?.addEventListener('click', () => {
      this.currentMonth = new Date();
      this.selectedDate = new Date();
      this.renderCalendar();
    });
    document.getElementById('calendar-add-event-btn')?.addEventListener('click', () => {
      const selectedIso = this.selectedDate.toISOString().split('T')[0];
      this.openTaskModal(null, selectedIso);
    });
    document.getElementById('agenda-quick-add-btn')?.addEventListener('click', () => {
      const selectedIso = this.selectedDate.toISOString().split('T')[0];
      this.openTaskModal(null, selectedIso);
    });

    // 13. Analytics Controls
    document.getElementById('analytics-refresh-btn')?.addEventListener('click', () => {
      this.updateCharts();
      this.showToast('Analytics refreshed', 'info');
    });

    // 14. Settings Form & Actions
    document.getElementById('settings-profile-form')?.addEventListener('submit', (e) => this.saveSettingsProfile(e));
    
    document.getElementById('settings-demo-data-btn')?.addEventListener('click', () => {
      this.populateDemoData();
      this.updateDashboardMetrics();
      this.renderNotes();
      this.renderTasks();
      this.updateCharts();
      this.showToast('Sample demo data loaded successfully', 'success');
    });

    document.getElementById('help-load-demo-btn')?.addEventListener('click', () => {
      this.populateDemoData();
      this.updateDashboardMetrics();
      this.renderNotes();
      this.renderTasks();
      this.updateCharts();
      this.showToast('Sample demo data loaded successfully', 'success');
    });

    document.getElementById('settings-export-btn')?.addEventListener('click', () => this.exportAllData());
    
    const importInput = document.getElementById('settings-import-file');
    document.getElementById('settings-import-btn')?.addEventListener('click', () => importInput?.click());
    if (importInput) {
      importInput.addEventListener('change', (e) => this.importDataFromFile(e.target.files[0]));
    }

    document.getElementById('settings-clear-all-btn')?.addEventListener('click', () => this.confirmClearAllData());

    // 15. Profile Modal
    document.getElementById('profile-modal-form')?.addEventListener('submit', (e) => this.saveProfileFromForm(e));
    document.querySelectorAll('.seed-preset-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const seed = e.target.dataset.seed;
        const seedInput = document.getElementById('profile-modal-seed');
        const previewImg = document.getElementById('modal-avatar-preview');
        if (seedInput) seedInput.value = seed;
        if (previewImg) previewImg.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
      });
    });

    // 16. Modal Dismissals (Buttons with [data-close-modal])
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.closeModal;
        const modal = document.getElementById(targetId);
        if (modal) modal.hidden = true;
      });
    });

    // Backdrop dismissal
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.hidden = true;
      });
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape closes open modals and menus
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(m => m.hidden = true);
        const searchDrop = document.getElementById('search-results-dropdown');
        if (searchDrop) searchDrop.hidden = true;
        const notifPanel = document.getElementById('notifications-panel');
        if (notifPanel) notifPanel.hidden = true;
        const userMenu = document.getElementById('user-dropdown-menu');
        if (userMenu) userMenu.hidden = true;
        return;
      }

      // Check for Ctrl or Meta (Cmd on Mac)
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
          const searchInput = document.getElementById('global-search-input');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          this.openNoteModal();
        } else if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          this.openTaskModal();
        }
      }
    });
  }

  // ========================================================
  // UTILITIES & HELPERS
  // ========================================================

  logActivity(title, icon, color) {
    this.activities.push({
      title,
      icon,
      color,
      timestamp: new Date().toISOString()
    });
    if (this.activities.length > 50) this.activities = this.activities.slice(-50);
    this.saveActivities();
    this.renderDashboardActivity();
  }

  showToast(message, type = 'info') {
    const stack = document.getElementById('toast-container');
    if (!stack) return;

    const icons = {
      success: 'fas fa-check',
      error: 'fas fa-xmark',
      warning: 'fas fa-triangle-exclamation',
      info: 'fas fa-info'
    };

    const toast = document.createElement('div');
    toast.className = `toast-card ${type}`;
    toast.innerHTML = `
      <div class="toast-icon"><i class="${icons[type] || icons.info}"></i></div>
      <div class="toast-msg">${this.escapeHtml(message)}</div>
      <button class="toast-close-btn" aria-label="Close notification"><i class="fas fa-times"></i></button>
    `;

    toast.querySelector('.toast-close-btn').addEventListener('click', () => toast.remove());
    stack.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  showConfirmDialog(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const titleText = document.getElementById('confirm-title-text');
    const msgText = document.getElementById('confirm-message-text');
    const confirmBtn = document.getElementById('confirm-action-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    if (!modal) return;

    if (titleText) titleText.textContent = title;
    if (msgText) msgText.textContent = message;

    // Reset handlers
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newConfirmBtn.addEventListener('click', () => {
      modal.hidden = true;
      if (typeof onConfirm === 'function') onConfirm();
    });

    newCancelBtn.addEventListener('click', () => {
      modal.hidden = true;
    });

    modal.hidden = false;
  }

  formatDueBadge(dueDateStr) {
    if (!dueDateStr) return '';
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = dueDateStr < today;
    const isToday = dueDateStr === today;

    if (isOverdue) {
      return `<span class="due-pill overdue"><i class="fas fa-triangle-exclamation"></i> Overdue (${dueDateStr})</span>`;
    }
    if (isToday) {
      return `<span class="due-pill today"><i class="fas fa-clock"></i> Due Today</span>`;
    }
    return `<span class="due-pill"><i class="far fa-calendar"></i> ${dueDateStr}</span>`;
  }

  formatDateShort(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  timeAgo(timestamp) {
    if (!timestamp) return 'recently';
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ========================================================
  // STORAGE HELPERS
  // ========================================================

  loadSettings() {
    try {
      const data = localStorage.getItem('nexus_settings');
      return data ? JSON.parse(data) : { darkMode: false, notifications: true, deadlineAlerts: true, accentColor: '#2563eb' };
    } catch (e) {
      return { darkMode: false, notifications: true, deadlineAlerts: true, accentColor: '#2563eb' };
    }
  }

  saveSettings() {
    localStorage.setItem('nexus_settings', JSON.stringify(this.settings));
  }

  loadProfile() {
    try {
      const data = localStorage.getItem('nexus_profile');
      return data ? JSON.parse(data) : {
        name: 'Alex Morgan',
        email: 'alex.morgan@example.com',
        role: 'Product Lead & Engineer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        avatarSeed: 'Alex',
        bio: 'Driving productivity and building modern cloud workflows.'
      };
    } catch (e) {
      return { name: 'Alex Morgan', email: 'alex.morgan@example.com', role: 'Product Lead' };
    }
  }

  saveProfile() {
    localStorage.setItem('nexus_profile', JSON.stringify(this.profile));
  }

  loadNotes() {
    try {
      const data = localStorage.getItem('nexus_notes');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveNotes() {
    localStorage.setItem('nexus_notes', JSON.stringify(this.notes));
  }

  loadTasks() {
    try {
      const data = localStorage.getItem('nexus_tasks');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveTasks() {
    localStorage.setItem('nexus_tasks', JSON.stringify(this.tasks));
  }

  loadActivities() {
    try {
      const data = localStorage.getItem('nexus_activities');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveActivities() {
    localStorage.setItem('nexus_activities', JSON.stringify(this.activities));
  }

  loadNotifications() {
    try {
      const data = localStorage.getItem('nexus_notifications');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveNotifications() {
    localStorage.setItem('nexus_notifications', JSON.stringify(this.notifications));
  }
}

// Global application bootstrap
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new NexusApp();
  window.app = app;
});
