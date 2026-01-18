/**
 * FitTrack - Personal Fitness Tracker
 * 
 * A lightweight, privacy-focused fitness tracker that stores all data locally
 * in the browser's localStorage. No server required - works offline after first load.
 * 
 * DATA MODEL:
 * -----------
 * Entries are stored under 'fittrack_entries' as a JSON array.
 * Each entry contains:
 *   - id: unique identifier (UUID)
 *   - date: ISO date string (YYYY-MM-DD)
 *   - weight_kg: weight in kilograms (null if not recorded)
 *   - waist_cm: waist circumference in cm (null if not recorded, typically weekly)
 *   - steps: step count (null if not recorded)
 *   - workout: boolean indicating workout completion
 *   - workout_notes: free text workout description
 *   - protein_palms: { breakfast, lunch, dinner } - integers for each meal
 *   - notes: free text daily notes
 *   - created_at: ISO timestamp of creation
 *   - updated_at: ISO timestamp of last edit
 * 
 * Settings are stored under 'fittrack_settings':
 *   - step_goal: daily step target (default: 10000)
 *   - protein_target: daily protein palms target (default: 6)
 *   - weight_unit: 'kg' or 'lb' (default: 'kg')
 * 
 * WEEKLY AVERAGE ALGORITHM:
 * -------------------------
 * For any given date, the 7-day rolling average is calculated as:
 * 1. Collect all weight entries from the 7 calendar days ending on that date
 * 2. If no entries exist, show "No data"
 * 3. If 1 entry exists, show the average but flag as "insufficient data"
 * 4. If 2+ entries exist, show the arithmetic mean
 * 
 * This approach provides immediate feedback while encouraging consistent tracking.
 */

// ============================================
// Constants & Configuration
// ============================================

const STORAGE_KEYS = {
  entries: 'fittrack_entries',
  settings: 'fittrack_settings'
};

const DEFAULT_SETTINGS = {
  step_goal: 10000,
  protein_target: 6,
  weight_unit: 'kg'
};

const WORKOUT_PRESETS = ['Pushups', 'Split Squats', 'Rows', 'Stepper'];

// ============================================
// State Management
// ============================================

let state = {
  entries: [],
  settings: { ...DEFAULT_SETTINGS },
  currentMonth: new Date(),
  selectedDate: null,
  weightChart: null,
  stepsChart: null
};

// ============================================
// Storage Functions
// ============================================

/**
 * Load entries from localStorage
 * @returns {Array} Array of fitness entries
 */
function loadEntries() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.entries);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load entries:', e);
    return [];
  }
}

/**
 * Save entries to localStorage
 * @param {Array} entries - Array of fitness entries
 */
function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
}

/**
 * Load settings from localStorage
 * @returns {Object} Settings object
 */
function loadSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.settings);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
  } catch (e) {
    console.error('Failed to load settings:', e);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings object
 */
function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

/**
 * Get entry by date
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {Object|undefined} Entry or undefined
 */
function getEntryByDate(dateStr) {
  return state.entries.find(e => e.date === dateStr);
}

/**
 * Create or update an entry
 * @param {Object} entryData - Entry data (without id/timestamps)
 * @returns {Object} Created/updated entry
 */
function saveEntry(entryData) {
  const existingIndex = state.entries.findIndex(e => e.date === entryData.date);
  const now = new Date().toISOString();
  
  const entry = {
    ...entryData,
    id: existingIndex >= 0 ? state.entries[existingIndex].id : generateUUID(),
    created_at: existingIndex >= 0 ? state.entries[existingIndex].created_at : now,
    updated_at: now
  };
  
  if (existingIndex >= 0) {
    state.entries[existingIndex] = entry;
  } else {
    state.entries.push(entry);
  }
  
  // Sort by date descending
  state.entries.sort((a, b) => b.date.localeCompare(a.date));
  saveEntries(state.entries);
  
  return entry;
}

/**
 * Delete an entry by ID
 * @param {string} id - Entry ID
 */
function deleteEntry(id) {
  state.entries = state.entries.filter(e => e.id !== id);
  saveEntries(state.entries);
}

/**
 * Reset all data
 */
function resetAllData() {
  localStorage.removeItem(STORAGE_KEYS.entries);
  localStorage.removeItem(STORAGE_KEYS.settings);
  state.entries = [];
  state.settings = { ...DEFAULT_SETTINGS };
}

/**
 * Export all data as JSON string
 * @returns {string} JSON string
 */
function exportData() {
  return JSON.stringify({
    entries: state.entries,
    settings: state.settings,
    exported_at: new Date().toISOString()
  }, null, 2);
}

/**
 * Import data from JSON string
 * @param {string} jsonStr - JSON string
 * @returns {boolean} Success status
 */
function importData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.entries && Array.isArray(data.entries)) {
      state.entries = data.entries;
      saveEntries(state.entries);
    }
    if (data.settings) {
      state.settings = { ...DEFAULT_SETTINGS, ...data.settings };
      saveSettings(state.settings);
    }
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a UUID v4
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., "Mon, Jan 15")
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDisplayDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Format date for full display (e.g., "Monday, January 15, 2025")
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatFullDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Convert weight between units
 * @param {number} kg - Weight in kg
 * @param {string} unit - Target unit ('kg' or 'lb')
 * @returns {number} Converted weight
 */
function convertWeight(kg, unit) {
  return unit === 'lb' ? kg * 2.20462 : kg;
}

/**
 * Convert weight to kg
 * @param {number} value - Weight value
 * @param {string} unit - Source unit ('kg' or 'lb')
 * @returns {number} Weight in kg
 */
function convertToKg(value, unit) {
  return unit === 'lb' ? value / 2.20462 : value;
}

/**
 * Display weight with unit
 * @param {number|null} kg - Weight in kg
 * @returns {string} Formatted weight
 */
function displayWeight(kg) {
  if (kg === null || kg === undefined) return '—';
  const val = convertWeight(kg, state.settings.weight_unit);
  return `${val.toFixed(1)} ${state.settings.weight_unit}`;
}

/**
 * Convert waist between units
 * @param {number} cm - Waist in cm
 * @param {string} unit - Weight unit (used to determine cm vs inches)
 * @returns {number} Converted waist
 */
function convertWaist(cm, unit) {
  return unit === 'lb' ? cm / 2.54 : cm;
}

/**
 * Convert waist to cm
 * @param {number} value - Waist value
 * @param {string} unit - Weight unit (determines source unit)
 * @returns {number} Waist in cm
 */
function convertWaistToCm(value, unit) {
  return unit === 'lb' ? value * 2.54 : value;
}

/**
 * Display waist with unit
 * @param {number|null} cm - Waist in cm
 * @returns {string} Formatted waist
 */
function displayWaist(cm) {
  if (cm === null || cm === undefined) return null;
  const val = convertWaist(cm, state.settings.weight_unit);
  const unit = state.settings.weight_unit === 'lb' ? 'in' : 'cm';
  return `${val.toFixed(1)} ${unit}`;
}

/**
 * Validate weight value
 * @param {number} value - Weight value
 * @param {string} unit - Unit ('kg' or 'lb')
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateWeight(value, unit) {
  const minKg = 20, maxKg = 300;
  const valueKg = convertToKg(value, unit);
  
  if (valueKg < minKg || valueKg > maxKg) {
    const min = unit === 'lb' ? 44 : 20;
    const max = unit === 'lb' ? 661 : 300;
    return { valid: false, message: `Weight should be between ${min} and ${max} ${unit}` };
  }
  return { valid: true };
}

/**
 * Validate steps value
 * @param {number} value - Steps count
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateSteps(value) {
  if (value < 0 || value > 100000) {
    return { valid: false, message: 'Steps should be between 0 and 100,000' };
  }
  return { valid: true };
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate 7-day rolling average for weight
 * 
 * Algorithm:
 * 1. Look back 6 days from the target date (7 days total including target)
 * 2. Filter entries that have weight data within this range
 * 3. Calculate arithmetic mean
 * 4. Flag as "insufficient" if fewer than 2 entries
 * 
 * @param {string} targetDate - End date in YYYY-MM-DD format
 * @returns {Object} { value: number, count: number, isInsufficient: boolean }
 */
function calculate7DayRollingAverage(targetDate) {
  const target = new Date(targetDate + 'T12:00:00');
  const startDate = new Date(target);
  startDate.setDate(startDate.getDate() - 6);
  
  // Filter entries within the 7-day window that have weight data
  const relevantEntries = state.entries.filter(e => {
    if (e.weight_kg === null) return false;
    const entryDate = new Date(e.date + 'T12:00:00');
    return entryDate >= startDate && entryDate <= target;
  });
  
  if (relevantEntries.length === 0) {
    return { value: 0, count: 0, isInsufficient: true };
  }
  
  const sum = relevantEntries.reduce((acc, e) => acc + e.weight_kg, 0);
  const avg = sum / relevantEntries.length;
  
  return {
    value: avg,
    count: relevantEntries.length,
    isInsufficient: relevantEntries.length < 2
  };
}

/**
 * Get weekly statistics for a given week start date
 * @param {Date} weekStart - Start of week (Monday)
 * @returns {Object} Weekly stats
 */
function getWeeklyStats(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const weekEntries = state.entries.filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d >= weekStart && d <= weekEnd;
  });
  
  // Average weight for the week
  const weightEntries = weekEntries.filter(e => e.weight_kg !== null);
  const avgWeight = weightEntries.length > 0
    ? weightEntries.reduce((sum, e) => sum + e.weight_kg, 0) / weightEntries.length
    : null;
  
  // Previous week comparison
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekEnd);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
  
  const prevWeekEntries = state.entries.filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d >= prevWeekStart && d <= prevWeekEnd && e.weight_kg !== null;
  });
  
  const prevAvgWeight = prevWeekEntries.length > 0
    ? prevWeekEntries.reduce((sum, e) => sum + e.weight_kg, 0) / prevWeekEntries.length
    : null;
  
  const weightChange = avgWeight !== null && prevAvgWeight !== null
    ? avgWeight - prevAvgWeight
    : null;
  
  // Workouts
  const workoutsCompleted = weekEntries.filter(e => e.workout).length;
  
  // Protein average
  const proteinSum = weekEntries.reduce((sum, e) => 
    sum + e.protein_palms.breakfast + e.protein_palms.lunch + e.protein_palms.dinner, 0);
  const proteinEntries = weekEntries.filter(e => 
    e.protein_palms.breakfast + e.protein_palms.lunch + e.protein_palms.dinner > 0);
  const avgProtein = proteinEntries.length > 0 ? proteinSum / proteinEntries.length : 0;
  
  // Adherence
  const daysWithEntries = weekEntries.length;
  const adherence = (daysWithEntries / 7) * 100;
  
  return {
    avgWeight,
    weightChange,
    workoutsCompleted,
    avgProtein,
    adherence,
    daysWithEntries
  };
}

/**
 * Get daily progress stats
 * @param {Object} entry - Entry object
 * @returns {Object} Daily stats
 */
function getDailyStats(entry) {
  if (!entry) {
    return { totalProtein: 0, proteinProgress: 0, stepsProgress: 0, hasWorkout: false };
  }
  
  const totalProtein = entry.protein_palms.breakfast + entry.protein_palms.lunch + entry.protein_palms.dinner;
  const proteinProgress = Math.min((totalProtein / state.settings.protein_target) * 100, 100);
  const stepsProgress = entry.steps ? Math.min((entry.steps / state.settings.step_goal) * 100, 100) : 0;
  
  return {
    totalProtein,
    proteinProgress,
    stepsProgress,
    hasWorkout: entry.workout
  };
}

/**
 * Get chart data for weight and steps
 * @param {number} days - Number of days to include
 * @returns {Object} { weightData, stepsData }
 */
function getChartData(days = 30) {
  const today = new Date();
  const dateRange = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dateRange.push(formatDate(d));
  }
  
  const weightData = dateRange.map(date => {
    const entry = getEntryByDate(date);
    const rolling = calculate7DayRollingAverage(date);
    return {
      date,
      label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: entry?.weight_kg || null,
      rollingAvg: rolling.count > 0 ? rolling.value : null
    };
  });
  
  // Weekly steps (last 4 weeks)
  const stepsData = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1 - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekEntries = state.entries.filter(e => {
      const d = new Date(e.date + 'T12:00:00');
      return d >= weekStart && d <= weekEnd;
    });
    
    const totalSteps = weekEntries.reduce((sum, e) => sum + (e.steps || 0), 0);
    stepsData.push({
      week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      steps: totalSteps
    });
  }
  
  return { weightData, stepsData };
}

// ============================================
// Seed Data (14 days of sample data)
// ============================================

/**
 * Generate seed data for demonstration
 * Creates 14 days of realistic sample data
 */
function generateSeedData() {
  // Only seed if no data exists
  if (state.entries.length > 0) return;
  
  const today = new Date();
  const entries = [];
  
  // Starting weight around 75kg with slight variations
  let baseWeight = 75.0;
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    
    // Randomize data with realistic patterns
    const hasWeight = Math.random() > 0.15; // 85% chance of weight entry
    const hasSteps = Math.random() > 0.1;  // 90% chance of steps
    const hasWorkout = Math.random() > 0.4; // 60% chance of workout
    
    // Weight trends slightly down with daily variation
    baseWeight -= (Math.random() * 0.1) - 0.03;
    const weight = hasWeight ? parseFloat((baseWeight + (Math.random() * 0.6 - 0.3)).toFixed(1)) : null;
    
    // Steps between 5000-15000
    const steps = hasSteps ? Math.floor(6000 + Math.random() * 9000) : null;
    
    // Random protein portions
    const protein = {
      breakfast: Math.floor(Math.random() * 3),
      lunch: Math.floor(Math.random() * 3) + 1,
      dinner: Math.floor(Math.random() * 3) + 1
    };
    
    const workoutOptions = ['Pushups, Rows', 'Split Squats, Stepper', 'Full body workout', 'Rows, Pushups, Stepper'];
    
    // Add waist measurement once per week (every 7 days)
    const hasWaist = i % 7 === 0;
    const waist = hasWaist ? parseFloat((82 - (13 - i) * 0.1 + (Math.random() * 0.6 - 0.3)).toFixed(1)) : null;
    
    entries.push({
      id: generateUUID(),
      date: dateStr,
      weight_kg: weight,
      waist_cm: waist,
      steps: steps,
      workout: hasWorkout,
      workout_notes: hasWorkout ? workoutOptions[Math.floor(Math.random() * workoutOptions.length)] : '',
      protein_palms: protein,
      notes: '',
      created_at: new Date(date).toISOString(),
      updated_at: new Date(date).toISOString()
    });
  }
  
  state.entries = entries;
  saveEntries(entries);
}

// ============================================
// UI Update Functions
// ============================================

/**
 * Update the entire UI
 */
function updateUI() {
  updateDailySummary();
  updateWeightCard();
  updateWeeklySummary();
  updateCalendar();
  updateEntryList();
  updateCharts();
  updateSettingsDisplay();
}

/**
 * Update daily summary card
 */
function updateDailySummary() {
  const today = formatDate(new Date());
  const entry = getEntryByDate(today);
  const stats = getDailyStats(entry);
  
  document.getElementById('todayDate').textContent = 
    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  document.getElementById('todaySteps').textContent = 
    entry?.steps?.toLocaleString() || '0';
  document.getElementById('stepsProgress').style.width = `${stats.stepsProgress}%`;
  document.getElementById('stepGoalDisplay').textContent = 
    state.settings.step_goal.toLocaleString();
  
  document.getElementById('todayProtein').textContent = stats.totalProtein;
  document.getElementById('proteinProgress').style.width = `${stats.proteinProgress}%`;
  document.getElementById('proteinTargetDisplay').textContent = state.settings.protein_target;
  
  const workoutStatus = document.getElementById('workoutStatus');
  if (stats.hasWorkout) {
    workoutStatus.innerHTML = '<span class="badge badge-success">✓ Done</span>';
  } else {
    workoutStatus.innerHTML = '<span class="badge badge-muted">Not yet</span>';
  }
}

/**
 * Update weight tracking card
 */
function updateWeightCard() {
  const today = formatDate(new Date());
  const entry = getEntryByDate(today);
  const rolling = calculate7DayRollingAverage(today);
  
  document.getElementById('currentWeight').textContent = displayWeight(entry?.weight_kg);
  
  if (rolling.count === 0) {
    document.getElementById('rollingAvg').textContent = 'No data';
    document.getElementById('avgWarning').textContent = '';
  } else {
    document.getElementById('rollingAvg').textContent = displayWeight(rolling.value);
    if (rolling.isInsufficient) {
      document.getElementById('avgWarning').textContent = 
        `Insufficient data (${rolling.count}/7 days)`;
    } else {
      document.getElementById('avgWarning').textContent = '';
    }
  }
}

/**
 * Update weekly summary card
 */
function updateWeeklySummary() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1);
  
  document.getElementById('weekLabel').textContent = 
    `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  
  const stats = getWeeklyStats(weekStart);
  
  document.getElementById('weeklyAvgWeight').textContent = 
    stats.avgWeight ? displayWeight(stats.avgWeight) : '—';
  
  const changeEl = document.getElementById('weightChange');
  if (stats.weightChange !== null) {
    const change = convertWeight(stats.weightChange, state.settings.weight_unit);
    const sign = change > 0 ? '+' : '';
    changeEl.textContent = `${sign}${change.toFixed(1)} ${state.settings.weight_unit} vs last week`;
    changeEl.className = `summary-change ${change < 0 ? 'negative' : change > 0 ? 'positive' : ''}`;
  } else {
    changeEl.textContent = '';
  }
  
  document.getElementById('weeklyWorkouts').textContent = stats.workoutsCompleted;
  document.getElementById('weeklyProtein').textContent = stats.avgProtein.toFixed(1);
  document.getElementById('weeklyAdherence').textContent = stats.adherence.toFixed(0);
  document.getElementById('daysTracked').textContent = stats.daysWithEntries;
}

/**
 * Update calendar view
 */
function updateCalendar() {
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();
  
  document.getElementById('calendarMonth').textContent = 
    state.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Adjust to start week on Monday
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  
  const daysContainer = document.getElementById('calendarDays');
  daysContainer.innerHTML = '';
  
  const today = formatDate(new Date());
  
  // Previous month days
  const prevMonth = new Date(year, month, 0);
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonth.getDate() - i;
    const dateStr = formatDate(new Date(year, month - 1, day));
    daysContainer.appendChild(createCalendarDay(day, dateStr, true));
  }
  
  // Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = formatDate(new Date(year, month, day));
    daysContainer.appendChild(createCalendarDay(day, dateStr, false, dateStr === today));
  }
  
  // Next month days
  const totalCells = Math.ceil((startDay + lastDay.getDate()) / 7) * 7;
  const remaining = totalCells - (startDay + lastDay.getDate());
  for (let day = 1; day <= remaining; day++) {
    const dateStr = formatDate(new Date(year, month + 1, day));
    daysContainer.appendChild(createCalendarDay(day, dateStr, true));
  }
}

/**
 * Create a calendar day element
 */
function createCalendarDay(day, dateStr, isOtherMonth, isToday = false) {
  const div = document.createElement('div');
  div.className = 'calendar-day';
  div.textContent = day;
  div.dataset.date = dateStr;
  
  if (isOtherMonth) div.classList.add('other-month');
  if (isToday) div.classList.add('today');
  
  const entry = getEntryByDate(dateStr);
  if (entry) {
    if (entry.weight_kg !== null) div.classList.add('has-weight');
    if (entry.workout) div.classList.add('has-workout');
  }
  
  div.addEventListener('click', () => openEntryModal(dateStr));
  
  return div;
}

/**
 * Update entry list view
 */
function updateEntryList() {
  const container = document.getElementById('entryList');
  const entries = state.entries.filter(e => 
    e.weight_kg !== null || e.steps !== null || e.workout
  ).slice(0, 20);
  
  if (entries.length === 0) {
    container.innerHTML = '<div class="empty-state">No entries yet. Start tracking today!</div>';
    return;
  }
  
  container.innerHTML = entries.map(e => `
    <div class="entry-item" data-date="${e.date}">
      <div>
        <div class="entry-date">${formatDisplayDate(e.date)}</div>
        <div class="entry-stats">
          ${e.weight_kg ? `<span>⚖️ ${displayWeight(e.weight_kg)}</span>` : ''}
          ${e.waist_cm ? `<span>📏 ${displayWaist(e.waist_cm)}</span>` : ''}
          ${e.steps ? `<span>👣 ${e.steps.toLocaleString()}</span>` : ''}
          ${e.workout ? '<span class="workout-done">💪 ✓</span>' : ''}
        </div>
      </div>
      <span>›</span>
    </div>
  `).join('');
  
  // Add click handlers
  container.querySelectorAll('.entry-item').forEach(item => {
    item.addEventListener('click', () => openEntryModal(item.dataset.date));
  });
}

/**
 * Update charts
 */
function updateCharts() {
  const { weightData, stepsData } = getChartData();
  
  // Filter out days with no data for cleaner charts
  const filteredWeightData = weightData.filter(d => d.weight !== null || d.rollingAvg !== null);
  
  // Weight chart
  const weightCtx = document.getElementById('weightChart').getContext('2d');
  
  if (state.weightChart) {
    state.weightChart.destroy();
  }
  
  const unit = state.settings.weight_unit;
  
  state.weightChart = new Chart(weightCtx, {
    type: 'line',
    data: {
      labels: filteredWeightData.map(d => d.label),
      datasets: [
        {
          label: 'Daily Weight',
          data: filteredWeightData.map(d => d.weight ? convertWeight(d.weight, unit) : null),
          borderColor: 'hsl(168, 76%, 36%)',
          backgroundColor: 'hsla(168, 76%, 36%, 0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'hsl(168, 76%, 36%)',
          tension: 0.1,
          spanGaps: true
        },
        {
          label: '7-Day Average',
          data: filteredWeightData.map(d => d.rollingAvg ? convertWeight(d.rollingAvg, unit) : null),
          borderColor: 'hsl(200, 70%, 50%)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0.3,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, padding: 15 }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw?.toFixed(1)} ${unit}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: val => `${val} ${unit}`
          }
        }
      }
    }
  });
  
  // Steps chart
  const stepsCtx = document.getElementById('stepsChart').getContext('2d');
  
  if (state.stepsChart) {
    state.stepsChart.destroy();
  }
  
  state.stepsChart = new Chart(stepsCtx, {
    type: 'bar',
    data: {
      labels: stepsData.map(d => d.week),
      datasets: [{
        label: 'Weekly Steps',
        data: stepsData.map(d => d.steps),
        backgroundColor: 'hsl(168, 76%, 36%)',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw.toLocaleString()} steps`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => val >= 1000 ? `${val/1000}k` : val
          }
        }
      }
    }
  });
}

/**
 * Update settings display
 */
function updateSettingsDisplay() {
  document.getElementById('stepGoalSetting').value = state.settings.step_goal;
  document.getElementById('proteinTargetSetting').value = state.settings.protein_target;
  document.getElementById('weightUnitSetting').value = state.settings.weight_unit;
  document.getElementById('weightUnitLabel').textContent = state.settings.weight_unit;
  document.getElementById('waistUnitLabel').textContent = state.settings.weight_unit === 'lb' ? 'in' : 'cm';
}

// ============================================
// Modal Functions
// ============================================

/**
 * Open entry modal for a specific date
 * @param {string} dateStr - Date in YYYY-MM-DD format
 */
function openEntryModal(dateStr) {
  state.selectedDate = dateStr;
  const entry = getEntryByDate(dateStr);
  
  document.getElementById('entryModalTitle').textContent = formatFullDate(dateStr);
  document.getElementById('entryDate').value = dateStr;
  document.getElementById('weightUnitLabel').textContent = state.settings.weight_unit;
  
  // Update waist unit label
  document.getElementById('waistUnitLabel').textContent = state.settings.weight_unit === 'lb' ? 'in' : 'cm';
  
  // Populate form
  if (entry) {
    const weightVal = entry.weight_kg ? convertWeight(entry.weight_kg, state.settings.weight_unit) : '';
    const waistVal = entry.waist_cm ? convertWaist(entry.waist_cm, state.settings.weight_unit) : '';
    document.getElementById('weightInput').value = weightVal ? weightVal.toFixed(1) : '';
    document.getElementById('waistInput').value = waistVal ? waistVal.toFixed(1) : '';
    document.getElementById('stepsInput').value = entry.steps || '';
    document.getElementById('workoutCheck').checked = entry.workout;
    document.getElementById('workoutNotes').value = entry.workout_notes;
    document.getElementById('proteinBreakfast').value = entry.protein_palms.breakfast;
    document.getElementById('proteinLunch').value = entry.protein_palms.lunch;
    document.getElementById('proteinDinner').value = entry.protein_palms.dinner;
    document.getElementById('notesInput').value = entry.notes;
    document.getElementById('deleteEntryBtn').classList.remove('hidden');
  } else {
    document.getElementById('weightInput').value = '';
    document.getElementById('waistInput').value = '';
    document.getElementById('stepsInput').value = '';
    document.getElementById('workoutCheck').checked = false;
    document.getElementById('workoutNotes').value = '';
    document.getElementById('proteinBreakfast').value = 0;
    document.getElementById('proteinLunch').value = 0;
    document.getElementById('proteinDinner').value = 0;
    document.getElementById('notesInput').value = '';
    document.getElementById('deleteEntryBtn').classList.add('hidden');
  }
  
  // Toggle workout notes visibility
  toggleWorkoutNotes();
  
  // Clear errors
  document.getElementById('weightError').textContent = '';
  document.getElementById('stepsError').textContent = '';
  
  document.getElementById('entryModal').classList.remove('hidden');
}

/**
 * Close entry modal
 */
function closeEntryModal() {
  document.getElementById('entryModal').classList.add('hidden');
  state.selectedDate = null;
}

/**
 * Toggle workout notes visibility
 */
function toggleWorkoutNotes() {
  const isChecked = document.getElementById('workoutCheck').checked;
  const notesGroup = document.getElementById('workoutNotesGroup');
  if (isChecked) {
    notesGroup.classList.remove('hidden');
  } else {
    notesGroup.classList.add('hidden');
  }
}

/**
 * Show confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {Function} onConfirm - Callback on confirm
 */
function showConfirmDialog(title, message, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmModal').classList.remove('hidden');
  
  const confirmBtn = document.getElementById('confirmOk');
  const cancelBtn = document.getElementById('confirmCancel');
  
  const cleanup = () => {
    document.getElementById('confirmModal').classList.add('hidden');
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  const handleConfirm = () => {
    cleanup();
    onConfirm();
  };
  
  const handleCancel = () => {
    cleanup();
  };
  
  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
}

// ============================================
// Event Handlers
// ============================================

/**
 * Initialize all event listeners
 */
function initEventListeners() {
  // Quick add presets
  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      const today = formatDate(new Date());
      const entry = getEntryByDate(today);
      
      const currentNotes = entry?.workout_notes || '';
      const newNotes = currentNotes ? `${currentNotes}, ${preset}` : preset;
      
      saveEntry({
        date: today,
        weight_kg: entry?.weight_kg || null,
        waist_cm: entry?.waist_cm || null,
        steps: entry?.steps || null,
        workout: true,
        workout_notes: newNotes,
        protein_palms: entry?.protein_palms || { breakfast: 0, lunch: 0, dinner: 0 },
        notes: entry?.notes || ''
      });
      
      updateUI();
    });
  });
  
  // Add full entry button
  document.getElementById('addFullEntryBtn').addEventListener('click', () => {
    openEntryModal(formatDate(new Date()));
  });
  
  // Entry form
  document.getElementById('entryForm').addEventListener('submit', e => {
    e.preventDefault();
    
    const weightVal = document.getElementById('weightInput').value;
    const waistVal = document.getElementById('waistInput').value;
    const stepsVal = document.getElementById('stepsInput').value;
    
    // Validation
    let hasErrors = false;
    
    if (weightVal) {
      const validation = validateWeight(parseFloat(weightVal), state.settings.weight_unit);
      if (!validation.valid) {
        document.getElementById('weightError').textContent = validation.message;
        hasErrors = true;
      }
    }
    
    if (stepsVal) {
      const validation = validateSteps(parseInt(stepsVal));
      if (!validation.valid) {
        document.getElementById('stepsError').textContent = validation.message;
        hasErrors = true;
      }
    }
    
    if (hasErrors) return;
    
    // Save entry
    const weightKg = weightVal ? convertToKg(parseFloat(weightVal), state.settings.weight_unit) : null;
    const waistCm = waistVal ? convertWaistToCm(parseFloat(waistVal), state.settings.weight_unit) : null;
    
    saveEntry({
      date: state.selectedDate,
      weight_kg: weightKg,
      waist_cm: waistCm,
      steps: stepsVal ? parseInt(stepsVal) : null,
      workout: document.getElementById('workoutCheck').checked,
      workout_notes: document.getElementById('workoutNotes').value,
      protein_palms: {
        breakfast: parseInt(document.getElementById('proteinBreakfast').value) || 0,
        lunch: parseInt(document.getElementById('proteinLunch').value) || 0,
        dinner: parseInt(document.getElementById('proteinDinner').value) || 0
      },
      notes: document.getElementById('notesInput').value
    });
    
    closeEntryModal();
    updateUI();
  });
  
  // Close entry modal
  document.getElementById('closeEntryModal').addEventListener('click', closeEntryModal);
  
  // Workout checkbox
  document.getElementById('workoutCheck').addEventListener('change', toggleWorkoutNotes);
  
  // Workout preset buttons in form
  document.querySelectorAll('[data-workout-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.workoutPreset;
      const notes = document.getElementById('workoutNotes');
      notes.value = notes.value ? `${notes.value}, ${preset}` : preset;
    });
  });
  
  // Protein steppers
  document.querySelectorAll('.stepper-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      const current = parseInt(target.value) || 0;
      const newVal = btn.dataset.action === 'inc' 
        ? Math.min(10, current + 1) 
        : Math.max(0, current - 1);
      target.value = newVal;
    });
  });
  
  // Delete entry
  document.getElementById('deleteEntryBtn').addEventListener('click', () => {
    const entry = getEntryByDate(state.selectedDate);
    if (entry) {
      showConfirmDialog(
        'Delete Entry',
        `Are you sure you want to delete the entry for ${formatFullDate(state.selectedDate)}?`,
        () => {
          deleteEntry(entry.id);
          closeEntryModal();
          updateUI();
        }
      );
    }
  });
  
  // View tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const view = tab.dataset.view;
      document.getElementById('calendarView').classList.toggle('hidden', view !== 'calendar');
      document.getElementById('listView').classList.toggle('hidden', view !== 'list');
    });
  });
  
  // Calendar navigation
  document.getElementById('prevMonth').addEventListener('click', () => {
    state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
    updateCalendar();
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
    updateCalendar();
  });
  
  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    updateSettingsDisplay();
    document.getElementById('settingsModal').classList.remove('hidden');
  });
  
  document.getElementById('closeSettingsModal').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.add('hidden');
  });
  
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    state.settings.step_goal = parseInt(document.getElementById('stepGoalSetting').value) || 10000;
    state.settings.protein_target = parseInt(document.getElementById('proteinTargetSetting').value) || 6;
    state.settings.weight_unit = document.getElementById('weightUnitSetting').value;
    
    saveSettings(state.settings);
    document.getElementById('settingsModal').classList.add('hidden');
    updateUI();
  });
  
  // Export/Import
  document.getElementById('exportBtn').addEventListener('click', () => {
    const data = exportData();
    navigator.clipboard.writeText(data).then(() => {
      alert('Data copied to clipboard!');
    });
  });
  
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.add('hidden');
    document.getElementById('importModal').classList.remove('hidden');
  });
  
  document.getElementById('closeImportModal').addEventListener('click', () => {
    document.getElementById('importModal').classList.add('hidden');
  });
  
  document.getElementById('cancelImportBtn').addEventListener('click', () => {
    document.getElementById('importModal').classList.add('hidden');
  });
  
  document.getElementById('confirmImportBtn').addEventListener('click', () => {
    const data = document.getElementById('importData').value;
    if (importData(data)) {
      document.getElementById('importModal').classList.add('hidden');
      document.getElementById('importData').value = '';
      updateUI();
      alert('Data imported successfully!');
    } else {
      alert('Failed to import data. Please check the JSON format.');
    }
  });
  
  // Reset data
  document.getElementById('resetBtn').addEventListener('click', () => {
    showConfirmDialog(
      'Reset All Data',
      'This will permanently delete all your fitness data. This action cannot be undone.',
      () => {
        resetAllData();
        document.getElementById('settingsModal').classList.add('hidden');
        updateUI();
      }
    );
  });
  
  // Palm tooltips
  document.getElementById('palmTooltip').addEventListener('click', () => {
    document.getElementById('palmModal').classList.remove('hidden');
  });
  
  document.getElementById('palmTooltip2').addEventListener('click', () => {
    document.getElementById('palmModal').classList.remove('hidden');
  });
  
  document.getElementById('closePalmModal').addEventListener('click', () => {
    document.getElementById('palmModal').classList.add('hidden');
  });
  
  document.getElementById('closePalmBtn').addEventListener('click', () => {
    document.getElementById('palmModal').classList.add('hidden');
  });
  
  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
      }
    });
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }
  });
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
function init() {
  // Load data from localStorage
  state.entries = loadEntries();
  state.settings = loadSettings();
  
  // Generate seed data if empty (for demo purposes)
  generateSeedData();
  
  // Set current month
  state.currentMonth = new Date();
  
  // Initialize UI
  initEventListeners();
  updateUI();
  
  console.log('FitTrack initialized. All data is stored locally in your browser.');
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', init);
