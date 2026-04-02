# Pomodoro Timer - Design Specification

**Version:** 1.0  
**Date:** 2026-04-03  
**Status:** Approved

---

## Overview

Enhance an existing Pomodoro timer app built with Svelte 5 and shadcn-svelte. Improve visual design, add missing features (persistence, notifications, statistics, long breaks), and strengthen accessibility.

---

## Visual Design

### Style

Clean, minimal aesthetic with subtle refinements. No radical redesigns - evolution over revolution.

### Color Scheme

- **Work Mode:** Warm palette - primary `#E85D04` (burnt orange), backgrounds in neutral grays
- **Break Mode:** Cool palette - primary `#0EA5E9` (sky blue), same neutral backgrounds
- Smooth 300ms color transitions between modes

### Typography

- Timer display: Large, bold monospace (`font-mono`) with relaxed line-height
- Headings: Medium weight, clear hierarchy
- Body: Regular weight, comfortable reading size

### Layout

- Single page centered layout (existing)
- Timer as visual centerpiece with progress ring
- Stats badge displayed prominently near pomodoro count
- Drawer for Settings + Tasks (tabbed navigation)

### Components

1. **Progress Ring** - SVG circular progress around timer (thin stroke, no fill)
2. **Mode Toggle** - Visual indicator of current mode with color accent
3. **Pomodoro Progress** - "🍅 🍅 🍅 ○" icons showing progress toward long break
4. **Stats Card** - Compact card showing "Today: X | This week: Y"
5. **Sound Controls** - Toggle switch + volume slider in settings
6. **Keyboard Hints** - Subtle "Press Space to start/pause" text

---

## Functionality

### 1. State Persistence

- **Store:** Svelte writable stores with localStorage sync
- **Persisted data:**
  - Timer state (current time, running/paused, mode)
  - Tasks list
  - Settings (durations, sound preferences)
  - Statistics (daily/weekly counts)
- **Behavior:** Auto-save on every change, restore on page load

### 2. Timer Logic

- Standard Pomodoro (default 25 min) → Break (default 5 min) cycle
- **Long Break:** After 4 pomodoros (configurable), prompt for long break (15-30 min)
- Visual countdown with progress ring
- Keyboard shortcut: Space to start/pause

### 3. Task Management

- Add tasks with Enter key
- Checkbox to complete (strikethrough style)
- Delete tasks
- Tasks persist across sessions

### 4. Browser Notifications

- Request permission on first timer start
- Show notification when timer completes
- Notification includes: current mode and "Time for [break/work]"
- Fallback: Audio-only if notifications denied

### 5. Statistics

- Track: completed pomodoros per day
- Display: Today's count, Weekly count
- Data stored in localStorage (JSON object with date keys)

### 6. Settings

- Pomodoro duration (1-60 min)
- Break duration (1-30 min)
- Long break duration (10-60 min)
- Long break interval (how many pomodoros before long break)
- Sound toggle (on/off)
- Sound volume slider (0-100%)
- Notification permission status

---

## Accessibility

### Timer Accessibility

- `role="timer"` with `aria-live="polite"`
- `aria-label` with full time description ("25 minutes remaining")
- `aria-pressed` on start/pause button

### Drawer Accessibility

- Focus trap inside drawer when open
- Escape key to close
- Proper heading hierarchy

### General

- `prefers-reduced-motion` respected (disable animations)
- Visible focus indicators on all interactive elements
- Skip to main content link
- High contrast text on all backgrounds

---

## Component Structure

```
src/
├── lib/
│   ├── stores/
│   │   ├── timer.ts      # Timer state & logic
│   │   ├── tasks.ts     # Task list state
│   │   ├── settings.ts  # User preferences
│   │   └── stats.ts     # Statistics tracking
│   ├── components/
│   │   ├── ProgressRing.svelte
│   │   ├── StatsBadge.svelte
│   │   ├── ModeIndicator.svelte
│   │   └── KeyboardHint.svelte
│   └── utils.ts
└── routes/
    └── +page.svelte
```

---

## Acceptance Criteria

1. Timer starts, pauses, resets correctly with visual progress ring
2. Mode switches between work/break with color transitions
3. After 4 pomodoros, long break option appears
4. All state persists after page refresh
5. Browser notification fires when timer ends (if permitted)
6. Stats display correct counts for today and this week
7. Keyboard shortcut (Space) works for start/pause
8. All interactive elements have visible focus states
9. Reduced motion preference disables animations
10. Screen reader announces timer changes appropriately
