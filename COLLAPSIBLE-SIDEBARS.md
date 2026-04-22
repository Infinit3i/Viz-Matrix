# Collapsible Sidebars (Desktop)

## Obsidian-Style Collapse Handles

The Viz-Matrix now features elegant collapsible sidebars on desktop, similar to Obsidian's interface design.

### Visual Design

- **Floating Handles**: Positioned at the inner edges of each sidebar
- **Glassmorphism Effect**: Gradient backgrounds with backdrop blur
- **Smooth Animations**: Cubic-bezier easing for professional feel
- **Chevron Icons**: Flip direction based on collapse state
- **Desktop Only**: Mobile behavior unchanged (overlay toggles)

### Handle Positioning

**Left Sidebar Handle:**
- Positioned at right edge of left sidebar
- Moves with sidebar collapse state
- Chevron points left when expanded, right when collapsed

**Right Sidebar Handle:**
- Positioned at left edge of right sidebar  
- Moves with sidebar collapse state
- Chevron points right when expanded, left when collapsed

### Behavior

**Expanded State:**
- Sidebars: 256px wide with full content visible
- Handles: Positioned at outer edges
- Main content: Centered between sidebars

**Collapsed State:**
- Sidebars: 0px wide with content hidden
- Handles: Positioned at screen edges
- Main content: Expands to use full width

### Interaction

- **Click Handle**: Toggle sidebar collapse state
- **Smooth Transitions**: 300ms duration with ease-out curve
- **Independent Control**: Each sidebar collapses separately
- **Persistent State**: Remembers state during session
- **Hover Effects**: Subtle highlight and elevation

### CSS Implementation

```css
.sidebar-handle {
  background: linear-gradient(135deg, rgba(39, 39, 42, 0.95), rgba(63, 63, 70, 0.95));
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.sidebar-transition {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
```

### Benefits

- **Maximum Space**: Collapse unused panels for larger matrix view
- **Focus Mode**: Hide distractions when analyzing specific areas
- **Professional Feel**: Polished interface matching modern IDE standards
- **Responsive Design**: Adapts to different desktop screen sizes
- **Accessibility**: Clear visual indicators and tooltips