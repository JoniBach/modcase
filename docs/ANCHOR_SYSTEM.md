# Anchor System Documentation

## Overview

The anchor system allows you to control the reference point (origin) of each shape. By default, shapes are positioned from their bottom-left corner, but you can configure this to be any point on the shape using:

- **Preset anchors** (center, top-left, bottom-right, etc.)
- **Percentage values** (0-100 for x and y)
- **Absolute positions** (in any unit: mm, in, cm, etc.)

## Anchor Presets

Use string presets for common anchor positions:

| Preset            | Description                  | X%  | Y%  |
| ----------------- | ---------------------------- | --- | --- |
| `'center'`        | Center of shape              | 50  | 50  |
| `'top-left'`      | Top-left corner              | 0   | 0   |
| `'top-center'`    | Top edge center              | 50  | 0   |
| `'top-right'`     | Top-right corner             | 100 | 0   |
| `'center-left'`   | Left edge center             | 0   | 50  |
| `'center-right'`  | Right edge center            | 100 | 50  |
| `'bottom-left'`   | Bottom-left corner (default) | 0   | 100 |
| `'bottom-center'` | Bottom edge center           | 50  | 100 |
| `'bottom-right'`  | Bottom-right corner          | 100 | 100 |

### Example: Preset Anchors

```typescript
import { rectangle, circle } from '$lib/jscad/shapes';

// Rectangle centered at origin
const rect1 = rectangle({
	width: 40,
	height: 40,
	x: 0,
	y: 0,
	anchor: 'center',
	unit: 'mm'
});

// Circle with top-right corner at (10, 10)
const circle1 = circle({
	radius: 5,
	x: 10,
	y: 10,
	anchor: 'top-right',
	unit: 'mm'
});
```

## Percentage Anchors

Specify anchor as `[x%, y%]` where values are 0-100:

- `[0, 0]` = top-left
- `[50, 50]` = center
- `[100, 100]` = bottom-right
- `[25, 75]` = 25% from left, 75% from top

### Example: Percentage Anchors

```typescript
// Rectangle with anchor at 25% from left, 50% from top
const rect2 = rectangle({
	width: 50,
	height: 30,
	x: 0,
	y: 0,
	anchor: [25, 50],
	unit: 'mm'
});

// Circle with custom percentage anchor
const circle2 = circle({
	radius: 10,
	x: 20,
	y: 20,
	anchor: [75, 25],
	unit: 'mm'
});

// You can also use string percentages
const rect3 = rectangle({
	width: 40,
	height: 20,
	x: 0,
	y: 0,
	anchor: ['50%', '50%'],
	unit: 'mm'
});
```

## Absolute Position Anchors

Specify anchor as an absolute offset from the shape's natural origin:

```typescript
// Anchor at 5mm from left, 5mm from top
const rect4 = rectangle({
	width: 50,
	height: 30,
	x: 0,
	y: 0,
	anchor: { x: '5mm', y: '5mm' },
	unit: 'mm'
});

// Anchor in inches
const circle3 = circle({
	radius: 10,
	x: 0,
	y: 0,
	anchor: { x: '0.2in', y: '0.2in', unit: 'in' },
	unit: 'mm'
});

// Mixed units - anchor in different unit than shape
const rect5 = rectangle({
	width: 2,
	height: 1,
	x: 0,
	y: 0,
	unit: 'in',
	anchor: { x: '10mm', y: '5mm' }
});
```

## JSON Format

All anchor types work in the JSON format:

```typescript
import { tools } from '$lib/jscad/tools';

const shape = tools.json({
	operation: 'union',
	ops: [
		// Preset anchor
		{
			shape: 'rectangle',
			params: { width: '40', height: '40', x: '0', y: '0' },
			unit: 'mm',
			anchor: 'center'
		},
		// Percentage anchor
		{
			shape: 'rectangle',
			params: { width: '20', height: '20', x: '30', y: '30' },
			unit: 'mm',
			anchor: [50, 50]
		},
		// Absolute anchor
		{
			shape: 'circle',
			params: { radius: '10', x: '-30', y: '30' },
			unit: 'mm',
			anchor: { x: '5mm', y: '5mm' }
		},
		// Anchor can also be in params
		{
			shape: 'rectangle',
			params: {
				width: '15',
				height: '25',
				x: '0',
				y: '-30',
				anchor: 'bottom-center'
			},
			unit: 'mm'
		}
	]
});
```

## How Anchors Work

### For Rectangles

The anchor point is calculated based on the rectangle's width and height:

- **Percentage**: `anchorX = width * (x% / 100)`, `anchorY = height * (y% / 100)`
- **Absolute**: Uses the exact values provided

The shape is then offset so the anchor point aligns with the specified (x, y) position.

### For Circles

The anchor is calculated based on the circle's diameter (2 × radius):

- **Percentage**: `anchorX = diameter * (x% / 100)`, `anchorY = diameter * (y% / 100)`
- **Absolute**: Uses the exact values provided

### Coordinate System

- **X-axis**: 0% = left edge, 100% = right edge
- **Y-axis**: 0% = top edge, 100% = bottom edge (note: Y increases downward in the default coordinate system)

## Practical Examples

### Aligning Shapes

```typescript
// All shapes centered at origin
const alignedShapes = tools.json({
	operation: 'union',
	ops: [
		{
			shape: 'rectangle',
			params: { width: '100', height: '50', x: '0', y: '0' },
			unit: 'mm',
			anchor: 'center'
		},
		{
			shape: 'rectangle',
			params: { width: '80', height: '30', x: '0', y: '0' },
			unit: 'mm',
			anchor: 'center'
		},
		{
			shape: 'circle',
			params: { radius: '15', x: '0', y: '0' },
			unit: 'mm',
			anchor: 'center'
		}
	]
});
```

### Mounting Holes Pattern

```typescript
// Create mounting holes at corners, measured from center
const plate = tools.json({
	operation: 'subtract',
	ops: [
		// Base plate centered at origin
		{
			shape: 'rectangle',
			params: { width: '100', height: '80', x: '0', y: '0' },
			id: 'base',
			unit: 'mm',
			anchor: 'center'
		},
		// Holes at corners (offset from edges)
		{
			shape: 'circle',
			params: { radius: '2', x: '45', y: '35' },
			id: 'hole-tr',
			unit: 'mm',
			anchor: 'center'
		},
		{
			shape: 'circle',
			params: { radius: '2', x: '-45', y: '35' },
			id: 'hole-tl',
			unit: 'mm',
			anchor: 'center'
		},
		{
			shape: 'circle',
			params: { radius: '2', x: '45', y: '-35' },
			id: 'hole-br',
			unit: 'mm',
			anchor: 'center'
		},
		{
			shape: 'circle',
			params: { radius: '2', x: '-45', y: '-35' },
			id: 'hole-bl',
			unit: 'mm',
			anchor: 'center'
		}
	]
});
```

### Text-like Alignment

```typescript
// Shapes aligned like text (left-aligned, baseline)
const textAlign = tools.json({
	operation: 'union',
	ops: [
		{
			shape: 'rectangle',
			params: { width: '20', height: '30', x: '0', y: '0' },
			unit: 'mm',
			anchor: 'bottom-left'
		},
		{
			shape: 'rectangle',
			params: { width: '15', height: '25', x: '25', y: '0' },
			unit: 'mm',
			anchor: 'bottom-left'
		},
		{
			shape: 'circle',
			params: { radius: '10', x: '45', y: '0' },
			unit: 'mm',
			anchor: 'bottom-center'
		}
	]
});
```

## Default Behavior

If no anchor is specified, the default is `'bottom-left'` (equivalent to `[0, 100]`), which maintains backward compatibility with the original positioning system.

## Combining with Units

Anchors work seamlessly with the unit system:

```typescript
const mixedExample = tools.json({
	operation: 'union',
	ops: [
		// Shape in mm with percentage anchor
		{
			shape: 'rectangle',
			params: { width: '50', height: '30', x: '0', y: '0' },
			unit: 'mm',
			anchor: [50, 50]
		},
		// Shape in inches with preset anchor
		{
			shape: 'circle',
			params: { radius: '0.5', x: '1', y: '0' },
			unit: 'in',
			anchor: 'center'
		},
		// Shape in mm with absolute anchor in inches
		{
			shape: 'rectangle',
			params: { width: '20', height: '10', x: '30', y: '0' },
			unit: 'mm',
			anchor: { x: '0.1in', y: '0.1in' }
		}
	]
});
```

## Best Practices

1. **Use presets for common cases**: They're more readable than percentages
2. **Use 'center' for symmetric operations**: Makes boolean operations more intuitive
3. **Use percentages for custom alignment**: When presets don't fit your needs
4. **Use absolute anchors for precise offsets**: When you need exact positioning
5. **Be consistent**: Use the same anchor strategy within related shapes
6. **Document your anchors**: Add comments explaining non-obvious anchor choices

## Troubleshooting

### Shape appears in wrong location

- Check if anchor is set correctly
- Remember Y-axis: 0% = top, 100% = bottom
- Verify units match your expectations

### Shapes don't align as expected

- Use 'center' anchor for both shapes when centering
- Check that x, y positions account for the anchor point
- Visualize: the anchor point of the shape will be placed at (x, y)

### Percentage vs Absolute confusion

- Values 0-100 without units = percentage
- Values with units (mm, in, etc.) = absolute
- String with % suffix = percentage (e.g., "50%")
