# FitTrack - Personal Fitness Tracker

A lightweight, privacy-focused fitness tracker that runs entirely in your browser. No server required – all data stays on your device.

## Features

- **Daily Tracking**: Log weight, steps, workouts, and protein intake
- **Quick Presets**: One-tap workout logging (Pushups, Split Squats, Rows, Stepper)
- **Visual Charts**: Weight trends with 7-day rolling average, weekly step totals
- **Weekly Summaries**: Track progress, adherence, and week-over-week changes
- **Calendar View**: See your activity at a glance
- **Privacy First**: All data stored locally in localStorage
- **Offline Ready**: Works without internet after first load
- **Mobile Friendly**: Responsive design optimized for phones

## Getting Started

### GitHub Pages Deployment

1. Fork or clone this repository
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" and choose `main` (or the branch with this folder)
4. Set folder to `/static-deploy` (or move files to root)
5. Your app will be live at `https://yourusername.github.io/repo-name/`

### Local Development

Simply open `index.html` in any modern browser. No build step required!

```bash
# Optional: serve with a local server
npx serve .
# or
python -m http.server 8000
```

## Data Model

All data is stored in your browser's `localStorage` under two keys:

### Entries (`fittrack_entries`)

An array of daily entries, each containing:

```javascript
{
  id: "uuid",                    // Unique identifier
  date: "2025-01-15",           // ISO date (YYYY-MM-DD)
  weight_kg: 75.5,              // Weight in kg (null if not recorded)
  waist_cm: 82.0,               // Waist in cm (null if not recorded, typically weekly)
  steps: 8500,                  // Step count (null if not recorded)
  workout: true,                // Whether workout was completed
  workout_notes: "Pushups, Rows", // Free text workout description
  protein_palms: {              // Protein portions per meal
    breakfast: 1,
    lunch: 2,
    dinner: 2
  },
  notes: "Feeling good today",  // Free text daily notes
  created_at: "2025-01-15T08:00:00Z",  // Creation timestamp
  updated_at: "2025-01-15T20:00:00Z"   // Last edit timestamp
}
```

### Settings (`fittrack_settings`)

User preferences:

```javascript
{
  step_goal: 10000,      // Daily step target
  protein_target: 6,     // Daily protein palms target
  weight_unit: "kg"      // "kg" or "lb"
}
```

## Weekly Average Algorithm

The 7-day rolling average for weight is calculated as follows:

1. **Window Definition**: For any given date, look back 6 days (7 days total including the target date)
2. **Data Collection**: Gather all entries within this window that have weight data
3. **Calculation**: Compute the arithmetic mean of available weights
4. **Sufficiency Check**:
   - If 0 entries: Display "No data"
   - If 1 entry: Display the average but flag as "Insufficient data (1/7 days)"
   - If 2+ entries: Display the average normally

This approach provides immediate feedback while encouraging consistent tracking. The "insufficient data" flag helps users understand that more data points would improve accuracy.

## Backup & Restore

### Export (Backup)

**Option 1 - Download File:**
1. Click the ⚙️ Settings button
2. Click "💾 Download File"
3. A JSON file (e.g., `fittrack-backup-2025-02-09.json`) will be saved to your device

**Option 2 - Copy to Clipboard:**
1. Click the ⚙️ Settings button
2. Click "📋 Copy to Clipboard"
3. Paste the JSON somewhere safe (notes app, text file, etc.)

### Import (Restore)

**Option 1 - Upload File:**
1. Click the ⚙️ Settings button
2. Click "📁 Import from File"
3. Select your backup JSON file
4. Data will be merged with existing entries

**Option 2 - Paste Text:**
1. Click the ⚙️ Settings button
2. Click "📥 Import from Text"
3. Paste your backup JSON
4. Click "Import"

Data is merged with existing entries (entries with the same date are updated).

### Reset Data

To start fresh:

1. Click the ⚙️ Settings button
2. Click "🗑️ Reset All Data"
3. Confirm the action

**Warning**: This permanently deletes all data and cannot be undone!

## What are "Protein Palms"?

A "palm" is a simple way to estimate protein portions without weighing food. One palm equals the size and thickness of your palm (excluding fingers).

### Quick Calibration

For accurate estimates, calibrate your palm:

1. For 2-3 days, weigh your protein portions with a food scale
2. Compare the weight to your palm size
3. Most people find 1 palm ≈ 20-30g of protein

### Examples of 1 Palm

- 🍗 1 chicken breast (palm-sized)
- 🥩 1 small steak
- 🐟 1 fish fillet
- 🥚 3 whole eggs
- 🫘 1 cup cooked beans/lentils

**Tip**: Aim for 1-2 palms per meal for most adults.

## File Structure

```
static-deploy/
├── index.html    # Main HTML structure
├── styles.css    # All styling
├── app.js        # Application logic
└── README.md     # This file
```

## Browser Support

Works in all modern browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Dependencies

- **Chart.js** (CDN): For weight and steps charts
- **Google Fonts**: Inter + Space Grotesk

No npm packages or build tools required!

## Privacy

- All data is stored in your browser's localStorage
- No data is ever sent to any server
- No cookies or tracking
- Works completely offline after first load

## License

MIT License - Use freely for personal or commercial projects.

---

Built with ❤️ for fitness enthusiasts who value their privacy.
