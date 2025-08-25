# Globe Visualizer Project - Claude Context

## Project Overview
This is a 3D globe data visualization project using the globe.gl library. The project creates interactive globes for displaying geospatial data with various visualization layers.

## Technical Stack
- **Library**: Globe.GL (WebGL/ThreeJS based)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Assets**: Local image textures (earth-topology.png, night-sky.png)

## Project Structure
```
the_grid_globe/
├── index.html              # Main HTML file
├── script.js              # Globe initialization and data
├── style.css              # Styling
├── img/                   # Local assets
│   ├── earth-topology.png # Earth texture
│   └── night-sky.png      # Background stars
├── GLOBE_GL_DOCUMENTATION.md # Complete API reference
└── CLAUDE.md              # This context file
```

## Current Implementation
The project currently displays:
- Interactive 3D globe with earth topology texture
- 5 sample city points (NYC, London, Tokyo, Paris, Sydney)
- Population-based point sizing and tooltips
- Starfield background

## Globe.GL Key Methods Used
- `Globe()()` - Initialize globe component
- `.globeImageUrl()` - Set earth texture
- `.backgroundImageUrl()` - Set space background
- `.pointsData()` - Add data points
- `.pointColor()`, `.pointRadius()`, `.pointLabel()` - Style points

## Development Guidelines

### Data Format
Points data should follow this structure:
```javascript
{
  lat: number,    // Latitude (-90 to 90)
  lng: number,    // Longitude (-180 to 180) 
  name: string,   // Display name
  [key]: value    // Additional properties for styling/tooltips
}
```

### Common Patterns
1. **Basic Points**: Use `.pointsData()` with color, radius, and labels
2. **Arcs/Routes**: Use `.arcsData()` for connections between points
3. **Countries**: Use `.polygonsData()` with GeoJSON data
4. **Animations**: Use `.pointOfView()` for camera transitions

### Performance Considerations
- Limit data points (< 10,000 for smooth interaction)
- Use appropriate `.pointResolution()` values
- Consider `.pauseAnimation()` when not actively viewing

### Color Schemes
Current colors used:
- Points: `#ff6b6b` (coral red)
- Background: Black (`#000`)

### Responsive Design
Globe automatically resizes with:
```javascript
.width(window.innerWidth)
.height(window.innerHeight)
```

## Available Visualization Types
Refer to `GLOBE_GL_DOCUMENTATION.md` for complete API. Key layers:
- **Points**: Cities, locations, events
- **Arcs**: Flight routes, connections, flows
- **Polygons**: Countries, regions, territories  
- **Paths**: Tracks, boundaries, routes
- **Heatmaps**: Density visualization
- **Custom Objects**: Any ThreeJS 3D objects

## Future Enhancement Ideas
- Real-time data integration (APIs)
- Multiple data layers toggle
- Time-based animations
- Custom controls UI
- Data filtering/search
- Export/sharing features
- Mobile optimization

## Commands to Run
- **Local Server**: `python -m http.server 8001` (or any static server)
- **Build**: No build process required (vanilla JS)
- **Deploy**: Static files can be deployed anywhere

## Dependencies
- Globe.GL: `https://unpkg.com/globe.gl` (CDN)
- No additional dependencies required

## Browser Support
- Modern browsers with WebGL support
- Chrome, Firefox, Safari, Edge
- Mobile browsers (with performance considerations)