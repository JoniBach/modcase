# Onshape-Style Workflow Guide

## Overview

The parametric modeler now follows Onshape's workflow with separate tools for placing points, selecting entities, creating lines, and applying alignment constraints.

## Core Workflow

### 1. Place Points (P)

**Tool**: Point Tool (Press `P` or click Point button)

- Click anywhere to place a point
- Points snap to existing points within 10 pixels
- Green highlight shows snap target
- Points are the foundation for all geometry

**Usage**:

```
1. Press P to activate Point tool
2. Click to place points at key locations
3. Points turn green when hovering near existing points
4. Click on green point to reuse it (no duplicate created)
```

### 2. Select Entities (S)

**Tool**: Select Tool (Press `S` or click Select button)

- Click on points or lines to select them
- Hold `Shift` to multi-select
- Drag to create selection box
- Selected items turn blue

**Selection Methods**:

- **Single Click**: Select one entity
- **Shift + Click**: Add to selection
- **Click + Drag**: Box selection (selects all inside)
- **Click Empty Space**: Clear selection

**Visual Feedback**:

- Selected points: Blue with blue outline
- Selected lines: Blue and thicker
- Hover: Green highlight

### 3. Create Lines (L)

**Tool**: Line Tool (Press `L` or click Line button)

**Method 1: Click-to-Click**

```
1. Press L to activate Line tool
2. Click first point (creates or snaps to existing)
3. Click second point (creates line)
4. Line is created and tool stays active
5. Next click starts from the last point (chaining)
6. Press Escape to stop chaining
```

**Method 2: From Selected Points** (Coming soon)

```
1. Select two points with Select tool
2. Press L to create line between them
```

**Features**:

- Auto-snapping to existing points
- Line chaining (continuous drawing)
- Preview line shows before clicking
- Dashed preview in blue

### 4. Apply Alignment Constraints

**Horizontal Constraint** (Press `H`)

```
1. Select one or more lines with Select tool
2. Press H or click "Horizontal" button
3. Lines become perfectly horizontal
4. Blue "H" marker appears above line
```

**Vertical Constraint** (Press `V`)

```
1. Select one or more lines with Select tool
2. Press V or click "Vertical" button
3. Lines become perfectly vertical
4. Blue "V" marker appears beside line
```

**Constraint Buttons**:

- Only enabled when lines are selected
- Can apply to multiple lines at once
- Constraints solve automatically
- Geometry adjusts to satisfy constraints

## Complete Example: Drawing a Rectangle

### Onshape-Style Method

**Step 1: Place Corner Points**

```
1. Press P (Point tool)
2. Click at (100, 100) - bottom-left
3. Click at (200, 100) - bottom-right
4. Click at (200, 200) - top-right
5. Click at (100, 200) - top-left
```

**Step 2: Create Lines**

```
1. Press L (Line tool)
2. Click bottom-left point (snaps, turns green)
3. Click bottom-right point (creates line)
4. Click top-right point (creates line, chaining)
5. Click top-left point (creates line)
6. Click bottom-left point (closes rectangle)
7. Press Escape to stop
```

**Step 3: Apply Constraints**

```
1. Press S (Select tool)
2. Click bottom line
3. Press H (make horizontal)
4. Click right line
5. Press V (make vertical)
6. Repeat for other sides
```

**Step 4: Verify Profile**

```
- Rectangle highlights in green (closed profile detected)
- Status bar shows: "Profiles: 1"
```

**Step 5: Extrude**

```
1. Click "Finish Sketch"
2. Click "Extrude"
3. Enter distance: 50
4. 3D box appears!
```

## Keyboard Shortcuts

### Tools

- `S` - Select tool
- `P` - Point tool
- `L` - Line tool

### Constraints

- `H` - Horizontal (selected lines)
- `V` - Vertical (selected lines)

### Actions

- `Escape` - Cancel/Clear selection
- `Delete` - Delete selected entities
- `Shift + Click` - Multi-select

## Visual Indicators

### Point Colors

- **Black**: Normal point
- **Blue**: Selected point
- **Green**: Snap target (hover)
- **Red**: Fixed point (constrained)

### Line Colors

- **Black**: Normal line (2px)
- **Blue**: Selected line (3px)
- **Gray**: Construction line (dashed)

### Constraint Markers

- **H**: Horizontal constraint (blue text above line)
- **V**: Vertical constraint (blue text beside line)

### Profile Highlighting

- **Green fill**: Closed profile (ready to extrude)
- **Green outline**: Profile boundary

## Status Bar

Bottom bar shows real-time counts:

- **Points**: Total points in sketch
- **Lines**: Total lines in sketch
- **Constraints**: Active constraints
- **Profiles**: Closed regions detected
- **Selected**: Current selection (when active)

## Tips & Best Practices

### 1. Place Points First

```
Onshape workflow: Place all key points first, then connect with lines
This gives you precise control over geometry
```

### 2. Use Snapping

```
Always look for green highlights when placing points/lines
Snapping ensures coincident constraints are automatically applied
```

### 3. Apply Constraints Early

```
Add horizontal/vertical constraints as you draw
This keeps geometry aligned and easier to dimension later
```

### 4. Box Selection for Efficiency

```
Drag a box to select multiple entities at once
Then apply constraints to all selected lines simultaneously
```

### 5. Line Chaining

```
When drawing connected lines, keep clicking
The tool automatically chains from the last point
Press Escape when done
```

## Common Workflows

### Creating Aligned Geometry

**L-Bracket Example**:

```
1. Place points for outer rectangle
2. Place points for inner cutout
3. Draw outer rectangle with Line tool
4. Draw inner rectangle
5. Select all horizontal lines → Press H
6. Select all vertical lines → Press V
7. Both profiles turn green
8. Extrude!
```

### Modifying Existing Geometry

**To Move a Point** (Coming soon):

```
1. Select point with Select tool
2. Drag to new location
3. Connected lines update automatically
4. Constraints re-solve
```

**To Delete Entities**:

```
1. Select points or lines
2. Press Delete
3. Connected geometry updates
```

## Differences from Original Workflow

### Old Way (Auto-Chain)

```
- Click-click-click to draw lines
- No separate point placement
- Limited selection capabilities
- Constraints suggested as icons
```

### New Way (Onshape-Style)

```
✓ Separate Point tool for precise placement
✓ Robust Select tool with multi-select
✓ Line tool works with existing points
✓ Constraint buttons in toolbar
✓ Box selection support
✓ Clear visual feedback
```

## What's Next

### Coming Soon

- Dimension tool with click-to-edit
- Parallel/Perpendicular constraints
- Equal length constraint
- Point dragging to modify geometry
- Arc and Circle tools
- Trim and Extend tools

### Future Features

- Tangent constraints
- Concentric constraints
- Pattern and mirror
- Construction geometry toggle
- Smart dimension inference

## Troubleshooting

### "Can't select my line"

- Make sure Select tool is active (press S)
- Click directly on the line (within 8 pixels)
- Lines must be visible (not behind other geometry)

### "Constraint button is disabled"

- You must select lines first
- Use Select tool (S) to click lines
- Selected lines turn blue when active

### "Points won't snap"

- Move within 10 pixels of existing point
- Look for green highlight
- Zoom in if points are close together

### "Profile not detected"

- Ensure lines form a complete closed loop
- Check that all endpoints connect
- Look for gaps in the geometry

## Summary

The Onshape-style workflow gives you precise control:

1. **Place Points** (P) - Define key locations
2. **Create Lines** (L) - Connect points
3. **Select Entities** (S) - Pick what to modify
4. **Apply Constraints** (H, V) - Align geometry
5. **Finish & Extrude** - Create 3D solid

This workflow is more explicit and controllable than auto-chaining, matching professional CAD tools like Onshape, SolidWorks, and Fusion 360.
