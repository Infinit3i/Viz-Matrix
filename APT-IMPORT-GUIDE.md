# APT Management Guide

## Infrastructure-Conditional APT Relevance

The Viz-Matrix now features **smart APT filtering** based on your actual infrastructure:
- **Left Sidebar**: Sourcetypes (Your defensive capabilities)  
- **Right Sidebar**: APT Groups (Only threats relevant to YOUR environment)
- **Background Storage**: All APT layers imported, filtered by infrastructure relevance

## Features Implemented

### APT Detection
- **Automatic Detection**: Identifies APT layers based on uniform scoring, threat colors, and technique patterns
- **Threat Level Classification**: High/Medium/Low/Mixed based on colors and scores
- **Red Color Detection**: Automatically detects threat-indicator colors (red variants)

### Color & Weight Preservation
- **Exact Colors**: Preserves original hex colors from Navigator layer (`#e60d0d` etc.)
- **Original Scores**: Maintains technique weights/scores as they appear in Navigator
- **Tactic Awareness**: Handles technique-specific tactic associations

### Visual Indicators
- **APT Banner**: Shows layer name, threat level, and controls in header
- **Color Override**: APT colors override normal coverage colors
- **Technique Indicators**: ⚠️ icon on APT techniques
- **Enhanced Tooltips**: Shows "🚨 APT TECHNIQUE" prefix with comments

## 📁 Test Files

- `apt-layer-example.json` - Your APT layer from Downloads (64 techniques, all red #e60d0d)
- `example-export.json` - Normal coverage export for comparison

## Infrastructure-Based APT Filtering

### How It Works:
1. **Import APT layers** → Stored in background (not immediately visible)
2. **Configure Environment** → Select your infrastructure (Windows, Linux, Cloud, etc.)
3. **Auto-Filtering** → Only APT groups targeting YOUR infrastructure appear
4. **Relevance Scoring** → Shows how much each APT group applies to you

### Relevance Indicators:
- **Technique Count**: `12/64` = 12 relevant techniques out of 64 total
- **Relevance Score**: `18%` = percentage of APT techniques that apply to your infrastructure
- **Stats**: `2/5` = 2 relevant groups out of 5 total imported

### Dynamic Behavior:
- **No Infrastructure**: APT panel shows "No relevant APT threats"
- **Add Infrastructure**: Relevant APT groups automatically appear
- **Change Infrastructure**: APT relevance updates in real-time

### Import APT Layers:
1. **Header**: Click Import button (single import/export location)
2. **Select**: `apt-layer-example.json`
3. **APT Panel**: New group appears with threat level indicator
4. **Matrix**: 64 red techniques with warning icons
5. **Left sidebar**: Manually select your actual sourcetypes
6. **Analysis**: Red cells with no coverage = blind spots

### Example Workflow:
1. **Import APT Layer**: Load `apt-layer-example.json` (64 techniques)
2. **No Environment Set**: APT panel shows "No relevant APT threats" 
3. **Configure Environment**: Select "Windows + Cloud" infrastructure
4. **APT Appears**: Shows "layer" group with `32/64` techniques (50% relevant)
5. **Matrix Update**: Only 32 red cells appear (techniques targeting Windows/Cloud)
6. **Add Coverage**: Select sourcetypes to see gaps in your 32 relevant techniques

### Manage APT Groups:
- **Rename**: Click edit icon next to APT name
- **Delete**: Click trash icon to remove APT group  
- **Toggle**: Checkbox to enable/disable individual groups
- **Controls**: All/None buttons for bulk enable/disable
- **Relevance**: Green percentage shows infrastructure match

## 🔧 APT Layer Structure Analysis

Your layer contains:
- **64 APT techniques** across all tactics
- **Uniform threat color**: #e60d0d (bright red)
- **Uniform score**: 1 (indicating presence/activity)
- **Multi-tactic techniques**: Same technique across different tactics

## 🎯 Threat Level Detection

**HIGH** - Red colors (#e60d0d) + uniform scoring
- Your layer: ✅ Detected as HIGH threat
- Triggers: Red-dominant colors (R>180, R>G, R>B)

**MEDIUM** - Uniform colors + moderate scoring
**LOW** - Single/few techniques
**MIXED** - Multiple diverse colors

## 🔄 Export Compatibility

APT layers can still be exported with:
- Original technique coverage from sourcetypes
- APT metadata preserved in comments
- Full Navigator compatibility maintained

## Correct Workflow

### **Dual Panel Operation:**
1. **Right Panel**: Import/manage APT groups (threat intelligence)
2. **Left Panel**: Select actual sourcetypes (your capabilities)  
3. **Matrix Analysis**: Overlay comparison shows gaps

### **APT Management:**
- **Import**: Add new APT groups to right panel
- **Toggle**: Enable/disable individual APT groups
- **Multiple APTs**: Compare against multiple threat groups
- **Threat Levels**: Visual indicators (high/medium/low/mixed)

### **Gap Analysis:**
```
Left (Defense):    Your actual detection capabilities
Right (Threat):    APT group techniques and TTPs
Matrix (Gaps):     Where threats can operate undetected
```

## 💡 Usage Notes

- **APT Override**: APT colors take precedence over normal coverage colors
- **Clear APT**: Click "×" in APT banner to return to normal view  
- **Preserved State**: APT layer info persists until cleared or new import
- **Independent Control**: APT layer + sourcetypes are completely separate
- **Manual Coverage**: You control what sourcetypes you claim to have