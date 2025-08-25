# Globe.GL Documentation

## Overview

Globe.GL is a web component for 3D globe data visualization using ThreeJS/WebGL. It allows visualization of various data layers on a spherical projection of Earth.

## Installation

```javascript
// ES6 Module
import Globe from 'globe.gl';

// Or via CDN
<script src="//unpkg.com/globe.gl"></script>
```

## Basic Usage

```javascript
const myGlobe = Globe()(myDOMElement)
  .globeImageUrl('./img/earth-texture.jpg')
  .pointsData(myData);
```

## Core API Methods

### Globe Configuration

#### `.globeImageUrl(url)`
- **Description**: Sets the texture image for the globe
- **Parameter**: `url` (string) - URL or path to the image
- **Example**: `.globeImageUrl('./img/earth-topology.png')`

#### `.backgroundImageUrl(url)`
- **Description**: Sets the background image (stars/space)
- **Parameter**: `url` (string) - URL or path to the background image
- **Example**: `.backgroundImageUrl('./img/night-sky.png')`

#### `.width(width)`
- **Description**: Sets the canvas width
- **Parameter**: `width` (number) - Width in pixels
- **Default**: Container width
- **Example**: `.width(800)`

#### `.height(height)`
- **Description**: Sets the canvas height
- **Parameter**: `height` (number) - Height in pixels
- **Default**: Container height
- **Example**: `.height(600)`

#### `.enablePointerInteraction(enable)`
- **Description**: Enable/disable mouse interaction
- **Parameter**: `enable` (boolean) - True to enable interaction
- **Default**: `true`
- **Example**: `.enablePointerInteraction(true)`

### Points Layer

#### `.pointsData(data)`
- **Description**: Sets the data for points to display on globe
- **Parameter**: `data` (array) - Array of data objects
- **Required fields**: `lat` (latitude), `lng` (longitude)
- **Example**: 
```javascript
.pointsData([
  { lat: 40.7128, lng: -74.0060, name: 'New York' },
  { lat: 51.5074, lng: -0.1278, name: 'London' }
])
```

#### `.pointLat(accessor)`
- **Description**: Accessor function for point latitude
- **Parameter**: `accessor` (string|function) - Field name or function
- **Default**: `'lat'`
- **Example**: `.pointLat('latitude')` or `.pointLat(d => d.coords.lat)`

#### `.pointLng(accessor)`
- **Description**: Accessor function for point longitude
- **Parameter**: `accessor` (string|function) - Field name or function
- **Default**: `'lng'`
- **Example**: `.pointLng('longitude')` or `.pointLng(d => d.coords.lng)`

#### `.pointColor(accessor)`
- **Description**: Sets the color of points
- **Parameter**: `accessor` (string|function) - Color value or function
- **Default**: `() => '#ffffaa'`
- **Example**: `.pointColor(() => '#ff6b6b')` or `.pointColor(d => d.color)`

#### `.pointAltitude(accessor)`
- **Description**: Sets the altitude/height of points above globe surface
- **Parameter**: `accessor` (string|function|number) - Altitude value or function
- **Default**: `0.1`
- **Example**: `.pointAltitude('population')` or `.pointAltitude(d => d.value * 0.01)`

#### `.pointRadius(accessor)`
- **Description**: Sets the radius of points
- **Parameter**: `accessor` (string|function|number) - Radius value or function
- **Default**: `0.25`
- **Example**: `.pointRadius(0.5)` or `.pointRadius(d => Math.sqrt(d.population) * 0.01)`

#### `.pointResolution(resolution)`
- **Description**: Sets the geometric resolution of points
- **Parameter**: `resolution` (number) - Number of segments
- **Default**: `12`
- **Example**: `.pointResolution(8)`

#### `.pointLabel(accessor)`
- **Description**: Sets the tooltip/label content for points
- **Parameter**: `accessor` (string|function) - HTML string or function
- **Example**: `.pointLabel(d => \`<b>\${d.name}</b><br>Population: \${d.population}\`)`

#### `.onPointClick(callback)`
- **Description**: Callback function for point click events
- **Parameter**: `callback` (function) - Function called when point is clicked
- **Example**: `.onPointClick(point => console.log('Clicked:', point))`

#### `.onPointHover(callback)`
- **Description**: Callback function for point hover events
- **Parameter**: `callback` (function) - Function called when hovering over point
- **Example**: `.onPointHover(point => console.log('Hovered:', point))`

### Arcs Layer

#### `.arcsData(data)`
- **Description**: Sets the data for arcs between points
- **Parameter**: `data` (array) - Array of arc data objects
- **Required fields**: `startLat`, `startLng`, `endLat`, `endLng`

#### `.arcStartLat(accessor)`, `.arcStartLng(accessor)`
- **Description**: Accessors for arc start coordinates
- **Default**: `'startLat'`, `'startLng'`

#### `.arcEndLat(accessor)`, `.arcEndLng(accessor)`
- **Description**: Accessors for arc end coordinates
- **Default**: `'endLat'`, `'endLng'`

#### `.arcColor(accessor)`
- **Description**: Sets the color of arcs
- **Default**: `() => '#ffffaa'`

#### `.arcAltitude(accessor)`
- **Description**: Sets the maximum altitude of arc curve
- **Default**: `null` (auto-derived from distance)

#### `.arcStroke(accessor)`
- **Description**: Sets the stroke width of arcs
- **Default**: `null` (constant width)

### Polygons Layer

#### `.polygonsData(data)`
- **Description**: Sets the data for polygon regions
- **Parameter**: `data` (array) - Array of polygon data (GeoJSON format)

#### `.polygonGeoJsonGeometry(accessor)`
- **Description**: Accessor for polygon geometry
- **Default**: `'geometry'`

#### `.polygonCapColor(accessor)`
- **Description**: Sets the color of polygon surfaces
- **Default**: `() => '#ffffaa'`

#### `.polygonSideColor(accessor)`
- **Description**: Sets the color of polygon sides
- **Default**: `() => '#ffffaa'`

#### `.polygonStrokeColor(accessor)`
- **Description**: Sets the color of polygon outlines
- **Default**: `null`

### Paths Layer

#### `.pathsData(data)`
- **Description**: Sets the data for paths/lines
- **Parameter**: `data` (array) - Array of path data objects

#### `.pathPoints(accessor)`
- **Description**: Accessor for path coordinate points
- **Example**: `.pathPoints(d => d.coords)` where coords is array of [lat, lng]

#### `.pathColor(accessor)`
- **Description**: Sets the color of paths
- **Default**: `() => '#ffffaa'`

### Heatmaps Layer

#### `.heatmapsData(data)`
- **Description**: Sets the data for heatmap visualization
- **Parameter**: `data` (array) - Array of heatmap data objects

#### `.heatmapPoints(accessor)`
- **Description**: Accessor for heatmap data points
- **Example**: Points should include lat, lng, and weight properties

#### `.heatmapTopAltitude(altitude)`
- **Description**: Sets the maximum altitude of heatmap
- **Default**: `0.01`

### Custom Layers

#### `.customLayerData(data)`
- **Description**: Sets data for custom ThreeJS objects
- **Parameter**: `data` (array) - Array of custom object data

#### `.customThreeObject(accessor)`
- **Description**: Function that returns a ThreeJS object for each data point
- **Example**: `.customThreeObject(() => new THREE.Mesh(geometry, material))`

### Controls and Interactions

#### `.pointOfView(pov, transitionMs?)`
- **Description**: Sets camera position and orientation
- **Parameters**: 
  - `pov` (object) - `{lat, lng, altitude}` or `{lat, lng, altitude, roll, pitch, yaw}`
  - `transitionMs` (number) - Animation duration in milliseconds
- **Example**: `.pointOfView({lat: 0, lng: 0, altitude: 2.5}, 1000)`

#### `.pauseAnimation()`
- **Description**: Pauses any running animations
- **Example**: `globe.pauseAnimation()`

#### `.resumeAnimation()`
- **Description**: Resumes paused animations
- **Example**: `globe.resumeAnimation()`

#### `.onGlobeClick(callback)`
- **Description**: Callback for clicks on globe surface (not on objects)
- **Parameter**: `callback` (function) - Receives click coordinates
- **Example**: `.onGlobeClick(coords => console.log('Globe clicked at:', coords))`

#### `.onGlobeRightClick(callback)`
- **Description**: Callback for right-clicks on globe surface
- **Parameter**: `callback` (function) - Receives click coordinates

## Advanced Features

### Animation Controls

#### `.animateIn()`
- **Description**: Triggers entrance animation
- **Usage**: Usually called automatically on data load

### Scene Access

#### `.scene()`
- **Description**: Direct access to the ThreeJS scene
- **Returns**: ThreeJS Scene object
- **Usage**: For advanced customization and direct ThreeJS manipulation

#### `.camera()`
- **Description**: Direct access to the camera
- **Returns**: ThreeJS Camera object

#### `.renderer()`
- **Description**: Direct access to the WebGL renderer
- **Returns**: ThreeJS WebGLRenderer object

### Performance Optimization

- Use `.pointResolution()` to balance quality vs performance
- Limit data size for better performance
- Consider using `.pauseAnimation()` when not actively viewing

## Common Examples

### Basic Points Visualization
```javascript
const globe = Globe()(document.getElementById('globe'))
  .globeImageUrl('./img/earth-topology.png')
  .pointsData([
    {lat: 40.7, lng: -74, name: 'NYC', pop: 8400000},
    {lat: 51.5, lng: -0.1, name: 'London', pop: 8900000}
  ])
  .pointColor(() => '#ff6b6b')
  .pointRadius(0.5)
  .pointLabel(d => `${d.name}: ${d.pop.toLocaleString()}`);
```

### Airline Routes (Arcs)
```javascript
globe
  .arcsData(routes)
  .arcColor(() => '#69f0ae')
  .arcAltitude(0.2)
  .arcStroke(0.5);
```

### Country Polygons
```javascript
globe
  .polygonsData(countries)
  .polygonCapColor(d => d.color)
  .polygonStrokeColor(() => '#000');
```

### Custom ThreeJS Objects
```javascript
globe
  .customLayerData(customData)
  .customThreeObject(() => {
    const obj = new THREE.Mesh(
      new THREE.SphereGeometry(0.05),
      new THREE.MeshLambertMaterial({color: 'red'})
    );
    return obj;
  });
```

## Tips and Best Practices

1. **Performance**: Limit data points for smooth interaction
2. **Colors**: Use consistent color schemes for better UX  
3. **Labels**: Keep tooltips concise and informative
4. **Animation**: Use transitions for smooth camera movements
5. **Responsive**: Update width/height on window resize
6. **Data Format**: Ensure lat/lng are valid numeric values (-90 to 90 for lat, -180 to 180 for lng)

## Browser Support

- Modern browsers supporting WebGL
- Chrome, Firefox, Safari, Edge
- Mobile browsers with WebGL support

## Resources

- [Official GitHub Repository](https://github.com/vasturiano/globe.gl)
- [Live Examples](https://globe.gl/)
- [ThreeJS Documentation](https://threejs.org/docs/) for advanced customization