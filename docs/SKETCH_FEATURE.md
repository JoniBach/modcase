# 2D Sketch to 3D Extrusion Feature

## Overview

This feature adds a 2D sketch editor to the OpenJSCAD 3D modeling application, allowing users to draw 2D shapes and extrude them into 3D models. The workflow is similar to professional CAD software like OnShape.

## Features

### 2D Sketch Editor

- **Drawing Tools:**
  - **Select Tool**: Move, resize, and manipulate existing shapes
  - **Rectangle Tool**: Click to place rectangles
  - **Circle Tool**: Click to place circles
  - **Polygon Tool**: Click to add points, creating custom polygons
  - **Freeform Path Tool**: Draw custom paths with the mouse

- **Editing Capabilities:**
  - Move shapes by dragging
  - Resize shapes using handles
  - Delete selected shapes
  - Clear entire canvas

### Extrusion Options

#### Linear Extrusion

Extends 2D shapes along the Z-axis to create 3D solids.

**Parameters:**

- **Height** (1-100): Distance to extrude along Z-axis
- **Twist** (0-360°): Rotation angle applied during extrusion
- **Scale** (0.1-3.0): Scaling factor applied at the top of the extrusion

#### Revolution (Rotate Extrusion)

Rotates 2D shapes around the Y-axis to create rotationally symmetric objects.

**Parameters:**

- **Angle** (30-360°): Rotation angle for the revolution
- **Segments** (8-64): Number of segments for smoothness

## Usage Workflow

### 1. Switch to Sketch Mode

Click the **"2D Sketch"** button in the mode switcher at the top of the sidebar.

### 2. Draw Your 2D Shape

1. Select a drawing tool from the toolbar
2. Draw your shape on the canvas:
   - **Rectangle/Circle**: Click to place
   - **Polygon**: Click to add points, then click "Finish Polygon" when done
   - **Path**: Click and drag to draw freeform paths
3. Use the **Select Tool** to adjust shapes as needed

### 3. Configure Extrusion Settings

In the sidebar, adjust the extrusion parameters:

- Choose between **Linear Extrude** or **Revolve**
- Adjust sliders for height, twist, scale, angle, or segments

### 4. Extrude to 3D

Click the **"Extrude to 3D"** button to convert your sketch into a 3D model.

### 5. View and Export

The application automatically switches to 3D view where you can:

- Rotate, pan, and zoom the 3D model
- Export as STL file for 3D printing

## Technical Implementation

### Coordinate System Conversion

The 2D canvas uses a standard screen coordinate system (origin at top-left), which is converted to OpenJSCAD's 3D coordinate system:

```
Canvas Coordinates → World Coordinates
- Canvas center (400, 300) → World origin (0, 0, 0)
- Canvas X-axis → World X-axis
- Canvas Y-axis → World Y-axis (inverted)
- Extrusion → World Z-axis
```

**Conversion Formula:**

```typescript
worldX = (canvasX - centerX) * scale
worldY = (centerY - canvasY) * scale  // Y is inverted
worldZ = 0 (sketch plane)
```

Default scale: 0.1 (10 canvas pixels = 1 world unit)

### Sketch Data Structure

Each shape is converted to a point array:

```typescript
interface SketchShape {
	type: 'rectangle' | 'circle' | 'polygon' | 'path';
	points: [number, number][]; // Array of [x, y] coordinates
}
```

**Shape Conversion:**

- **Rectangles**: 4 corner points
- **Circles**: 32-point approximation
- **Polygons**: User-defined points
- **Paths**: Extracted from SVG path data

### Extrusion Process

1. **Validation**: Ensure sketch has valid closed paths (≥3 points)
2. **Coordinate Conversion**: Transform canvas coordinates to world coordinates
3. **Path Closure**: Automatically close open paths
4. **2D Geometry Creation**: Use OpenJSCAD's `geom2.fromPoints()`
5. **3D Extrusion**: Apply `extrudeLinear()` or `extrudeRotate()`
6. **Rendering**: Display in Three.js 3D viewer

### Key Files

- **`src/lib/components/SketchEditor.svelte`**: 2D canvas editor with Fabric.js
- **`src/lib/utils/sketchTo3D.ts`**: Coordinate conversion and extrusion logic
- **`src/routes/+page.svelte`**: Main UI with mode switching and controls

## Tips and Best Practices

### Creating Good Sketches

1. **Keep shapes simple**: Complex overlapping shapes may not extrude correctly
2. **Close your paths**: Ensure polygons are closed for solid extrusions
3. **Center your design**: Shapes near canvas center convert better
4. **Test with simple shapes first**: Start with rectangles or circles

### Extrusion Guidelines

1. **Linear Extrusion**:
   - Use moderate heights (10-50) for best results
   - Twist creates spiral effects
   - Scale creates tapered shapes

2. **Revolution**:
   - Best for symmetric designs
   - Position shapes on one side of the canvas
   - Higher segment counts create smoother curves

### Performance

- Complex sketches with many shapes may take longer to extrude
- Higher segment counts in revolution increase processing time
- Simplify sketches if performance is an issue

## Examples

### Example 1: Simple Box

1. Switch to Sketch Mode
2. Use Rectangle Tool to draw a square
3. Set Height to 20
4. Click "Extrude to 3D"
   Result: A rectangular prism

### Example 2: Twisted Column

1. Draw a circle in Sketch Mode
2. Set Height to 50
3. Set Twist to 180°
4. Click "Extrude to 3D"
   Result: A twisted cylindrical column

### Example 3: Vase (Revolution)

1. Draw a vertical path on the right side of canvas
2. Select "Revolve" as extrusion type
3. Set Angle to 360°
4. Set Segments to 32
5. Click "Extrude to 3D"
   Result: A rotationally symmetric vase

## Troubleshooting

### "No shapes in sketch" Error

- Ensure you've drawn at least one shape on the canvas
- Check that shapes are visible (not deleted)

### "Insufficient points" Error

- Polygons need at least 3 points
- Click "Finish Polygon" button after adding points

### Extrusion Fails

- Simplify your sketch (fewer overlapping shapes)
- Ensure paths are closed
- Try reducing complexity of freeform paths

### Shape Not Visible in 3D

- Check extrusion height is not zero
- Ensure sketch was not empty
- Try switching back to 3D view manually

## Future Enhancements

Potential improvements for future versions:

- Boolean operations (union, subtract, intersect) on multiple sketches
- Dimension constraints and measurements
- Snap-to-grid functionality
- Import/export sketch files
- Parametric sketch constraints
- Offset and fillet operations
- Text tool for adding labels
- Layer management for complex designs
