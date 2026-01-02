# OpenJSCAD 3D Viewer with Svelte

An interactive 3D modeling viewer built with SvelteKit, OpenJSCAD, and Three.js. This project allows you to visualize and interact with parametric 3D models in real-time.

## Features

- **Interactive 3D Viewer**: Powered by Three.js with orbit controls
- **OpenJSCAD Integration**: Create parametric 3D models using JavaScript
- **Pre-built Models**: Includes examples like cubes, spheres, gears, houses, and more
- **Modern UI**: Clean, responsive interface with dark theme
- **Real-time Rendering**: Instant model updates with smooth animations

## Getting Started

### Install Dependencies

```sh
npm install
```

### Development

Start the development server:

```sh
npm run dev

# or open in browser automatically
npm run dev -- --open
```

### Building

Create a production build:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## Project Structure

- `src/lib/components/JscadViewer.svelte` - Three.js 3D viewer component
- `src/lib/jscad/models.ts` - OpenJSCAD model definitions
- `src/routes/+page.svelte` - Main application page

## Controls

- **Left Mouse Button**: Rotate the camera
- **Right Mouse Button**: Pan the view
- **Mouse Wheel**: Zoom in/out

## Technologies

- **SvelteKit** - Web framework
- **OpenJSCAD** (@jscad/modeling) - Parametric 3D modeling
- **Three.js** - 3D rendering engine
- **TypeScript** - Type safety
