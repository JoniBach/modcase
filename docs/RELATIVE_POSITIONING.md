# Relative Positioning System

## Overview

The JSCAD shape system now supports relative positioning between shapes. Instead of using only absolute coordinates, shapes can be positioned relative to other shapes using their IDs.

## Features

- **Backward Compatible**: Shapes without `relativeTo` continue to work with absolute positioning
- **Chained Positioning**: Support for multi-level chains (A → B → C → D)
- **Circular Dependency Detection**: Automatically detects and reports circular references
- **Missing Reference Detection**: Clear error messages for non-existent shape references
- **Unit Support**: Works seamlessly with the existing unit system (mm, cm, m, in, ft)

## Basic Usage

### Simple Relative Positioning

Position a circle relative to a rectangle:

```typescript
{
  operation: 'union',
  ops: [
    {
      shape: 'rectangle',
      params: { width: '40', height: '30', x: '0', y: '0' },
      id: 'base',
      unit: 'mm'
    },
    {
      shape: 'circle',
      params: { radius: '5', x: '10', y: '5' },  // offset from 'base'
      id: 'circle1',
      unit: 'mm',
      relativeTo: 'base'  // positioned relative to 'base'
    }
  ]
}
```

In this example:

- The rectangle `base` is at absolute position (0, 0)
- The circle `circle1` is positioned at (10, 5) **relative to** the base rectangle
- Final absolute position of circle1: (0 + 10, 0 + 5) = (10, 5)

### Chained Relative Positioning

Create a chain of shapes where each is positioned relative to the previous:

```typescript
{
  operation: 'union',
  ops: [
    {
      shape: 'rectangle',
      params: { width: '20', height: '20', x: '-30', y: '-30' },
      id: 'rectA',
      unit: 'mm'
    },
    {
      shape: 'circle',
      params: { radius: '8', x: '25', y: '0' },
      id: 'circleB',
      unit: 'mm',
      relativeTo: 'rectA'  // relative to rectA
    },
    {
      shape: 'rectangle',
      params: { width: '15', height: '15', x: '20', y: '0' },
      id: 'rectC',
      unit: 'mm',
      relativeTo: 'circleB'  // relative to circleB, which is relative to rectA
    }
  ]
}
```

Position resolution:

1. `rectA` at absolute (-30, -30)
2. `circleB` at rectA + (25, 0) = (-30 + 25, -30 + 0) = (-5, -30)
3. `rectC` at circleB + (20, 0) = (-5 + 20, -30 + 0) = (15, -30)

### Mixed Positioning

Combine absolute and relative positioning in the same design:

```typescript
{
  operation: 'union',
  ops: [
    {
      shape: 'rectangle',
      params: { width: '50', height: '40', x: '0', y: '0' },
      id: 'plate',
      unit: 'mm'
    },
    {
      shape: 'circle',
      params: { radius: '4', x: '10', y: '10' },
      id: 'hole1',
      unit: 'mm',
      relativeTo: 'plate'  // relative positioning
    },
    {
      shape: 'rectangle',
      params: { width: '10', height: '10', x: '-40', y: '0' },
      id: 'absolute-feature',
      unit: 'mm'
      // no relativeTo - uses absolute positioning
    }
  ]
}
```

## API Reference

### Shape Node Schema

```typescript
{
  shape: 'rectangle' | 'circle',
  params: {
    // shape-specific params (width, height, radius, etc.)
    x?: number | string,  // position or offset
    y?: number | string,  // position or offset
    unit?: Unit
  },
  id?: string,           // required for shapes that will be referenced
  unit?: Unit,
  relativeTo?: string    // ID of the shape to position relative to
}
```

### Position Resolution

The system resolves positions in three passes:

1. **Collection Pass**: Build a map of all shapes by ID
2. **Resolution Pass**: Resolve all relative positions to absolute coordinates
3. **Rendering Pass**: Create geometry with resolved absolute positions

### Error Handling

#### Circular Dependency

```typescript
// This will throw CircularDependencyError
{
  ops: [
    { id: 'A', relativeTo: 'B', ... },
    { id: 'B', relativeTo: 'A', ... }  // A → B → A (circular!)
  ]
}
```

Error message: `Circular dependency detected in relative positioning: A → B → A`

#### Missing Reference

```typescript
// This will throw MissingReferenceError
{
  ops: [
    { id: 'shape1', relativeTo: 'nonexistent', ... }
  ]
}
```

Error message: `Shape "shape1" references non-existent shape "nonexistent"`

## Implementation Details

### Core Functions

**`resolvePosition(shape, shapesMap, resolvedCache, visitedChain)`**

- Recursively resolves a shape's absolute position
- Handles chained relative positioning
- Detects circular dependencies
- Caches results to avoid redundant calculations

**`buildShapesMap(nodes)`**

- Collects all shapes with IDs into a map
- Recursively traverses operation trees

**`resolveAllPositions(nodes)`**

- Resolves positions for all shapes in a tree
- Returns a map of shape IDs to absolute positions

### Integration Points

The relative positioning system integrates with:

- **Unit System**: All position values respect unit specifications
- **Anchor System**: Works alongside anchor-based positioning
- **Operation Trees**: Supports shapes nested in union/subtract/intersect operations

## Demo Parts

Three demo parts are included to showcase the feature:

1. **Relative Positioning Demo**: Simple relative positioning with chaining
2. **Relative Chain Demo**: Four-level chain demonstrating deep nesting
3. **Mixed Positioning Demo**: Combination of relative and absolute positioning

Access these demos in the Parts viewer at `/parts`.

## Best Practices

1. **Always provide IDs** for shapes that will be referenced by others
2. **Keep chains shallow** when possible for better readability
3. **Use meaningful IDs** to make the positioning logic clear
4. **Combine with anchors** for precise control over attachment points
5. **Test edge cases** like circular dependencies during development

## Backward Compatibility

All existing parts continue to work without modification. The `relativeTo` field is optional, and shapes without it use absolute positioning as before.
