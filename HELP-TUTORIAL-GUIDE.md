# Interactive Help Tutorial

## First-Time User Experience

When you first open Viz-Matrix, an interactive tutorial automatically appears to guide you through the interface.

### Tutorial Flow

**Direct Start** - No welcome screen, starts immediately when help button is clicked

**Step-by-Step Highlights:**
1. **Matrix (Center)**: Your attack surface - what you own
2. **Left Sidebar**: Your detection capabilities - what you can see
3. **Right Sidebar**: Threat intelligence - what attacks you
4. **Import/Export**: Data management and sharing

### Interactive Features

- **Visual Highlighting**: Blue outline and glow on targeted areas
- **Auto-Scrolling**: Smoothly centers highlighted elements
- **Progress Indicator**: Shows current step (1/4, 2/4, etc.)
- **Direct Start**: Begins immediately when help button clicked
- **Simple Navigation**: Only "Next" and "Finish" buttons

### Re-Access Tutorial

- **Help Button**: Click the question mark icon in header
- **Always Available**: Can restart tutorial anytime
- **Fresh Experience**: Each run highlights the same key areas

## Tutorial Content

### Step 1: Attack Matrix (Center)
> "This matrix represents YOUR attack surface - what you own and operate. Each cell is a MITRE ATT&CK technique that could target your infrastructure."

### Step 2: Detection Capabilities (Left)
> "Select what you can SEE - your security tools and data sources. These are your defensive detection capabilities."

### Step 3: Threat Intelligence (Right)  
> "See what ATTACKS you - APT groups and threat actors that target your type of infrastructure. Only relevant threats appear."

### Step 4: Import & Export
> "Import MITRE Navigator layers and export your coverage analysis. Share configurations with your team."

## Technical Implementation

- **Auto-Start**: Checks localStorage for first-time users
- **CSS Highlighting**: Adds `.tutorial-highlight` class with glow effects
- **Smooth Scrolling**: Uses `scrollIntoView` for element focus
- **Responsive Design**: Works on both desktop and mobile
- **State Management**: Tracks tutorial progress and user preferences

## Benefits

- **Immediate Clarity**: Users understand the three-panel concept instantly
- **Reduced Support**: Self-explanatory interface with guided onboarding
- **Confidence Building**: Users know where to start and what each area does
- **Professional Feel**: Polished first impression with helpful guidance