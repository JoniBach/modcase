# Parametric Modeler - Quick Start Guide

## Getting Started

Navigate to `/modeler` to access the parametric 3D modeler.

## Your First Part - Creating a Simple Box

### Step 1: Start a New Sketch

1. Click the **"New Sketch"** button in the top toolbar
2. The three origin planes will be highlighted
3. Click on the **XY Plane** (horizontal grid)

### Step 2: Draw a Rectangle

1. The camera will rotate to look down at the XY plane
2. You're now in **Sketch Mode** (2D drawing)
3. The **Line** tool is already active (or press `L`)
4. Click to place points in a rectangle pattern:
   - Click at (100, 100)
   - Click at (200, 100) - horizontal line appears
   - Click at (200, 200) - vertical line appears
   - Click at (100, 200) - another line appears
   - Click back at (100, 100) - closes the rectangle
5. The rectangle will **highlight in green** - this means it's a closed profile!

### Step 3: Apply Constraints (Optional)

- Notice the small icons (─ │) appearing near your lines
- These are **constraint suggestions**
- Click on `─` to make a line horizontal
- Click on `│` to make a line vertical
- The geometry will adjust automatically!

### Step 4: Exit Sketch

1. Click the **"Exit Sketch"** button in the toolbar
2. You'll return to the 3D view
3. Your sketch is now saved in the Feature Tree (left panel)

### Step 5: Extrude to 3D

1. Click the **"Extrude"** button in the top toolbar
2. Enter a distance: `50` (mm)
3. Press Enter or click OK
4. **Your 3D box appears!** 🎉

## Keyboard Shortcuts

- `L` - Line tool
- `D` - Dimension tool (coming soon)
- `Escape` - Cancel current operation
- `E` - Extrude (when profiles exist)

## Tips & Tricks

### Point Snapping

- When drawing, move your cursor near existing points
- They'll turn **green** when you're close enough to snap
- Click to merge points together (creates coincident constraint)

### Line Chaining

- After drawing one line, the tool stays active
- Your next click starts from the end of the previous line
- Press `Escape` to stop chaining

### Constraint Icons

- `─` Horizontal constraint
- `│` Vertical constraint
- `∥` Parallel to another line
- `⊥` Perpendicular to another line

### Closed Profiles

- A profile is "closed" when lines form a complete loop
- Closed profiles turn **green**
- Only closed profiles can be extruded
- You can have multiple profiles (with holes!)

## Advanced: Creating a Shape with a Hole

1. Draw outer rectangle (as above)
2. Draw inner rectangle inside the first one
3. Both will highlight green
4. Extrude - the inner profile becomes a hole!

## Feature Tree (Left Panel)

### Origin

- Shows the three origin planes (XY, XZ, YZ)
- Click to start a new sketch on that plane

### Sketches

- Lists all your sketches
- Shows line count for each
- Click to edit (coming soon)

### Features

- Lists all extrusions
- Shows distance for each
- Click to edit parameters (coming soon)

## Troubleshooting

### "No closed profiles found"

- Make sure your lines form a complete loop
- The last point must connect back to the first point
- Look for the green highlight to confirm

### Lines won't snap

- Move closer to the target point (within 10 pixels)
- Look for the green dot indicator

### Constraint not applying

- Some constraints require specific geometry
- Try drawing more precisely first
- Constraints work best on nearly-aligned lines

## What's Next?

Try these exercises:

1. Create an L-shaped bracket
2. Draw a hexagon (6-sided shape)
3. Create a part with multiple extrusions
4. Experiment with different planes (XZ, YZ)

## Current Limitations (V1)

- No undo/redo in sketch mode yet
- Cannot edit existing sketches
- No arc/circle tools yet
- Single extrude operation only
- No dimension editing

These features are coming in future updates!

## Need Help?

Check the full documentation: `docs/PARAMETRIC_MODELER.md`
