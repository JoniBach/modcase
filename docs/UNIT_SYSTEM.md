# Unit System Documentation

## Overview

The ModCase 2D CAD system now supports a comprehensive unit system that allows you to:

1. **Configure default units** (mm, cm, m, in, ft)
2. **Mix different units** in the same compound shape
3. **Automatic unit conversion** to millimeters internally
4. **Grid display** in your chosen units

## Configuration

### Setting Default Units

Use the unit configuration panel in the Parts page:

```typescript
import { setUnitConfig } from '$lib/jscad/units';

setUnitConfig({
	defaultUnit: 'mm', // or 'cm', 'm', 'in', 'ft'
	gridSpacing: 10 // spacing in the default unit
});
```

### Getting Current Configuration

```typescript
import { getUnitConfig } from '$lib/jscad/units';

const config = getUnitConfig();
console.log(config.defaultUnit); // 'mm'
console.log(config.gridSpacing); // 10
```

## Using Units in Shapes

### Method 1: Specify Unit Parameter

```typescript
import { rectangle, circle } from '$lib/jscad/shapes';

// Rectangle in millimeters
const rect1 = rectangle({
	width: 50,
	height: 30,
	x: 0,
	y: 0,
	unit: 'mm'
});

// Circle in inches
const circle1 = circle({
	radius: 0.5,
	x: 1,
	y: 0.5,
	unit: 'in'
});
```

### Method 2: Inline Unit Strings

You can also specify units directly in the value string:

```typescript
const rect2 = rectangle({
	width: '2cm', // 2 centimeters
	height: '1cm', // 1 centimeter
	x: 0,
	y: 0
});

const circle2 = circle({
	radius: '0.5in', // 0.5 inches
	x: '25mm', // 25 millimeters
	y: 0
});
```

### Method 3: JSON Format with Mixed Units

```typescript
import { tools } from '$lib/jscad/tools';

const mixedShape = tools.json({
	operation: 'union',
	ops: [
		{
			shape: 'rectangle',
			params: { width: '50', height: '30', x: '0', y: '0' },
			unit: 'mm'
		},
		{
			shape: 'circle',
			params: { radius: '0.5', x: '1', y: '0.5' },
			unit: 'in' // This circle is in inches!
		},
		{
			shape: 'rectangle',
			params: { width: '2cm', height: '1cm', x: '-15', y: '-10' },
			unit: 'mm' // Base unit is mm, but values can have inline units
		}
	]
});
```

## Supported Units

| Unit        | Symbol | Conversion to MM |
| ----------- | ------ | ---------------- |
| Millimeters | mm     | 1.0              |
| Centimeters | cm     | 10.0             |
| Meters      | m      | 1000.0           |
| Inches      | in     | 25.4             |
| Feet        | ft     | 304.8            |

## Unit Conversion

### Manual Conversion

```typescript
import { convertToMM, convertFromMM, convertBetweenUnits } from '$lib/jscad/units';

// Convert to millimeters
const mm = convertToMM(2, 'in'); // 50.8mm

// Convert from millimeters
const inches = convertFromMM(50.8, 'in'); // 2in

// Convert between units
const cm = convertBetweenUnits(2, 'in', 'cm'); // 5.08cm
```

### Parse Values with Units

```typescript
import { parseValueWithUnit } from '$lib/jscad/units';

const result = parseValueWithUnit('2.5in');
console.log(result.value); // 2.5
console.log(result.unit); // 'in'
console.log(result.valueInMM); // 63.5
```

## Grid System

The grid automatically adjusts to your configured units:

- **Grid spacing**: Set in the unit configuration panel
- **Grid labels**: Display in your chosen unit
- **Zoom independent**: Grid adapts as you zoom in/out

## Example: Mixed Unit Design

Here's a practical example combining different units:

```typescript
export const pcbEnclosure = () =>
	tools.json({
		operation: 'subtract',
		ops: [
			// Base plate in millimeters
			{
				shape: 'rectangle',
				params: { width: '100', height: '80', x: '0', y: '0' },
				id: 'base',
				unit: 'mm'
			},
			// Mounting holes in inches (standard US hardware)
			{
				shape: 'circle',
				params: { radius: '0.125', x: '0.5', y: '0.5' },
				id: 'hole1',
				unit: 'in'
			},
			{
				shape: 'circle',
				params: { radius: '0.125', x: '3.5', y: '0.5' },
				id: 'hole2',
				unit: 'in'
			},
			// Cutout in centimeters
			{
				shape: 'rectangle',
				params: { width: '3cm', height: '2cm', x: '0', y: '0' },
				id: 'cutout',
				unit: 'mm'
			}
		]
	});
```

## Best Practices

1. **Choose appropriate units**: Use mm for precision parts, inches for US standard hardware
2. **Be consistent within features**: Keep related dimensions in the same unit
3. **Document your units**: Add comments when mixing units
4. **Test conversions**: Verify critical dimensions after unit changes
5. **Use the grid**: The grid helps visualize scale in your chosen unit

## UI Features

### Unit Configuration Panel

Access via the "⚙️ Units" button in the Parts page:

- **Default Unit**: Sets the base unit for the system
- **Grid Spacing**: Controls grid line spacing in the default unit
- **Refresh Geometry**: Reloads the current part with updated settings

### Part Selection

Click on any part in the sidebar to view it. The "Mixed Units Demo" showcases the unit system capabilities.

## Internal Implementation

All geometry is stored internally in millimeters for consistency. The unit system:

1. Parses input values with their units
2. Converts everything to millimeters
3. Passes millimeter values to JSCAD
4. Displays in your chosen unit in the UI

This ensures accurate boolean operations and transformations regardless of input units.
