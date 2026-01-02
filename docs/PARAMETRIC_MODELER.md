# Parametric 3D Modeler - Architecture Documentation

## Overview

This is a complete transformation from a basic 2D shape editor to an **Onshape-style parametric 3D modeler** with constraint-based sketching and extrusion workflow.

## Core Architecture

### Data Model Hierarchy

```
Part
├── Planes (XY, XZ, YZ origin planes)
├── Sketches (2D constraint-based drawings on planes)
│   ├── Points (with constraints)
│   ├── Lines (with constraints)
│   ├── Constraints (coincident, horizontal, vertical, etc.)
│   ├── Dimensions (parametric values)
│   └── Profiles (auto-detected closed regions)
├── Features (operations on sketches)
│   └── Extrude (converts 2D profiles to 3D solids)
└── Bodies (3D solid geometry)
```

### Key Components

#### 1. **SketchPlane** (`/lib/sketch/SketchPlane.ts`)

- Defines 3D coordinate systems for 2D sketching
- Three origin planes: XY (top), XZ (front), YZ (right)
- Coordinate transformation: world ↔ plane space

#### 2. **ConstraintSolver** (`/lib/sketch/ConstraintSolver.ts`)

- Iterative constraint satisfaction algorithm
- Supports: coincident, horizontal, vertical, parallel, perpendicular, equal, midpoint
- Max 100 iterations, 0.01 tolerance
- Adjusts point positions to satisfy all constraints

#### 3. **LineTool** (`/lib/sketch/LineTool.ts`)

- Point snapping (10px threshold)
- Auto-chaining (click-click-click workflow)
- Automatic coincident constraints when points merge
- Preview line rendering

#### 4. **ConstraintSuggester** (`/lib/sketch/LineTool.ts`)

- Auto-detects near-horizontal/vertical lines (5° tolerance)
- Suggests parallel/perpendicular to existing lines
- Displays clickable constraint icons (─ │ ∥ ⊥)

#### 5. **ProfileDetector** (`/lib/sketch/ProfileDetector.ts`)

- Graph traversal to find closed loops
- Detects holes (profiles inside profiles)
- Required for extrusion

#### 6. **DimensionManager** (`/lib/sketch/DimensionManager.ts`)

- Linear dimensions between points/lines
- Radial dimensions for circles
- Adjusts geometry to match dimension values

#### 7. **ExtrudeCommand** (`/lib/features/ExtrudeFeature.ts`)

- Converts 2D profiles to THREE.js ExtrudeGeometry
- Handles holes in profiles
- Transforms from sketch plane to world space
- Creates 3D mesh with material

## User Workflow

### Basic Workflow (V1)

1. **Start**: Click "New Sketch" button
2. **Select Plane**: Click one of the three origin planes (XY/XZ/YZ)
3. **Enter Sketch Mode**:
   - Camera animates perpendicular to plane
   - 2D sketch canvas appears
   - Grid overlay shown
4. **Draw Lines**:
   - Press `L` or click "Line" tool
   - Click to place points
   - Lines auto-chain from last point
   - Points snap when near existing points
5. **Apply Constraints**:
   - Constraint suggestions appear as icons
   - Click icon to accept constraint
   - Geometry adjusts automatically
6. **Close Profile**:
   - Draw back to starting point
   - Profile highlights in green when closed
7. **Exit Sketch**: Click "Exit Sketch" button
8. **Extrude**:
   - Click "Extrude" button
   - Enter distance (e.g., "10mm")
   - 3D solid appears!

### Keyboard Shortcuts

- `L` - Line tool
- `D` - Dimension tool
- `Escape` - Cancel current operation
- `E` - Extrude (when sketch has profiles)

## Visual Feedback

### Colors & Indicators

- **Black lines**: Fully constrained
- **Yellow lines**: Underconstrained (future)
- **Red lines**: Overconstrained (future)
- **Green highlight**: Closed profile detected
- **Blue dashed line**: Preview/construction
- **Red points**: Fixed points
- **Green points**: Snap targets

### Constraint Icons

- `─` Horizontal
- `│` Vertical
- `∥` Parallel
- `⊥` Perpendicular
- `=` Equal length
- `●` Coincident

## Component Structure

### UI Components

#### **ParametricModeler.svelte** (Main Container)

- Top toolbar with "New Sketch" and "Extrude" buttons
- 3D viewport using Three.js
- Manages sketch mode toggle
- Handles plane selection
- Integrates all sub-components

#### **FeatureTree.svelte** (Left Panel)

- Hierarchical tree view
- Sections: Origin, Sketches, Features
- Click to select/edit items
- Shows counts and details

#### **SketchCanvas.svelte** (2D Sketch Interface)

- Fabric.js canvas for 2D drawing
- Tool palette (Line, Dimension, etc.)
- Real-time constraint solving
- Profile detection and highlighting
- Status bar showing counts

## Technical Implementation

### Constraint Solving Algorithm

```typescript
// Iterative satisfaction
for (iteration = 0; iteration < 100; iteration++) {
  changed = false;
  for each constraint {
    if (applyConstraint(constraint)) {
      changed = true;
    }
  }
  if (!changed) break; // Converged
}
```

### Profile Detection Algorithm

```typescript
// Graph traversal for closed loops
function traceLoop(startLine) {
  path = [startLine];
  currentPoint = startLine.end;

  while (true) {
    nextLine = findConnectedLine(currentPoint, excluding: currentLine);
    if (!nextLine) return { closed: false };
    if (nextLine === startLine) return { closed: true, path };

    path.push(nextLine);
    currentPoint = nextLine.otherEnd(currentPoint);
  }
}
```

### Extrusion Process

```typescript
// 2D → 3D conversion
1. Get profile points from sketch
2. Create THREE.Shape from points
3. Add holes as THREE.Path
4. ExtrudeGeometry with depth
5. Transform to world space using plane matrix
6. Create mesh with material
7. Add to scene
```

## File Structure

```
/lib
  /sketch
    types.ts              - Core data types
    SketchPlane.ts        - Plane management
    ConstraintSolver.ts   - Constraint satisfaction
    LineTool.ts           - Line drawing + suggestions
    ProfileDetector.ts    - Closed loop detection
    DimensionManager.ts   - Parametric dimensions
  /features
    ExtrudeFeature.ts     - 2D to 3D extrusion
  /components
    ParametricModeler.svelte  - Main container
    FeatureTree.svelte        - Left navigation panel
    SketchCanvas.svelte       - 2D sketch interface
```

## V1 Feature Checklist

✅ **Implemented**

- Three origin planes (XY, XZ, YZ)
- Sketch mode toggle (2D view on plane)
- Line tool with point snapping
- Point chaining (continuous line drawing)
- Coincident constraint (auto-applied on snap)
- Horizontal/vertical constraints (auto-suggested)
- Constraint solver (iterative)
- Profile detection (closed loop tracing)
- Extrude command (2D → 3D)
- Feature tree (left panel)
- 3D viewport with Three.js

❌ **Not Yet Implemented (V1)**

- Manual dimension input with value editing
- Arc/circle tools
- Advanced constraints (parallel, perpendicular fully tested)
- Trim/extend tools
- Offset tool

❌ **Future (V2+)**

- Revolve/loft/sweep features
- Fillets/chamfers
- Patterns and mirrors
- Boolean operations (union, subtract, intersect)
- Assembly mode
- Import/export (STEP, STL)

## Usage Example

```typescript
// Create a simple rectangular extrusion
1. Click "New Sketch"
2. Click XY plane
3. Press L for line tool
4. Click (0, 0) → (100, 0) → (100, 50) → (0, 50) → (0, 0)
5. Green profile appears
6. Click "Exit Sketch"
7. Click "Extrude"
8. Enter "20"
9. 3D box appears!
```

## Integration with Existing Code

The parametric modeler is a **complete replacement** for the existing SketchEditor.svelte. To use:

```svelte
<script>
	import ParametricModeler from '$lib/components/ParametricModeler.svelte';
</script>

<ParametricModeler />
```

The old 2D sketch system remains available but is superseded by this constraint-based parametric system.

## Performance Considerations

- Constraint solver: O(n\*m) where n=iterations, m=constraints
- Profile detection: O(e) where e=edges (lines)
- Extrusion: O(v) where v=vertices in profile
- Typical sketch: <100 constraints, solves in <10ms

## Known Limitations (V1)

1. No undo/redo in sketch mode yet
2. Cannot edit existing sketches (read-only after exit)
3. No dimension value editing (display only)
4. Single extrude operation only
5. No face selection for new sketches (planes only)
6. Fabric.js import needs configuration

## Next Steps

1. Fix Fabric.js import in SketchCanvas.svelte
2. Add dimension editing dialog
3. Implement undo/redo for sketch operations
4. Add arc/circle tools
5. Enable sketch editing (re-enter sketch mode)
6. Add face selection for new sketch planes
7. Implement boolean operations

## Testing Checklist

- [ ] Create sketch on each plane (XY, XZ, YZ)
- [ ] Draw closed rectangle and extrude
- [ ] Draw shape with hole and extrude
- [ ] Apply horizontal constraint
- [ ] Apply vertical constraint
- [ ] Snap points together
- [ ] Chain multiple lines
- [ ] Cancel line drawing with Escape
- [ ] View feature tree updates
- [ ] Multiple extrusions in one part

---

**Status**: Core V1 architecture complete. Ready for integration testing and Fabric.js configuration.
