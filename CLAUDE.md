# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
"THE~GRID MANIFESTATION~STATION" is an interactive 3D globe visualization using the globe.gl library. It displays a triangular grid overlay on Earth with real-time user positioning and simulated user activity visualization.

## Technical Stack
- **Library**: Globe.GL (WebGL/ThreeJS based) via CDN
- **Frontend**: Vanilla JavaScript, HTML5, Tailwind CSS 4
- **Assets**: Multiple earth textures and night sky background
- **Data**: GeoJSON files for populated areas and land boundaries

## Project Structure
```
the_grid_globe/
├── index.html                    # Main HTML with overlay UI
├── script.js                    # Globe logic and data generators  
├── data/
│   ├── populated_areas.geojson  # Weighted population data
│   └── ne_110m_land.geojson     # Natural Earth land boundaries
├── img/                         # Earth textures and backgrounds
└── GLOBE_GL_DOCUMENTATION.md    # Complete API reference
```

## Core Architecture

### Key Classes
- **`TriangularGridGenerator`**: Creates geodesic grid points and arcs for the globe overlay
- **`PopulatedUsersGenerator`**: Generates realistic user distributions using GeoJSON population data with weighted algorithms
- **`UserLocationManager`**: Handles browser geolocation and user positioning

### Data Flow
1. Globe initializes with triangular grid overlay
2. Populated areas data loads from GeoJSON
3. User location is requested and displayed as primary point
4. 10,000 simulated users generated using population weighting and radial distribution algorithms
5. Grid uses points layer, simulated users use optimized particles system

### Configuration Objects
- `GRID_CONFIG`: Grid density and positioning (12 lat × 24 lng divisions)
- `VISUAL_CONFIG`: Colors, sizing, and visual parameters (#F8ED43 theme)
- `USER_LOCATION_CONFIG`: User position styling
- `OTHER_USERS_CONFIG`: Particle system configuration for simulated users

## Current Implementation
The application displays:
- Triangular geodesic grid overlay with dashed arcs
- User's real geolocation as prominent point
- 10,000 simulated users distributed by population density
- Live countdown timer to 23:01 daily
- Responsive overlay UI with "THE~GRID" branding

## Globe.GL Usage Patterns
- **Grid**: `.pointsData()` and `.arcsData()` for structured overlay
- **User Location**: Individual point with special styling
- **Mass Users**: `.particlesData()` for performance with large datasets
- **Textures**: Multiple earth images available in `/img/`
- **Performance**: Particle system handles 10K+ points efficiently

## Development Commands
- **Local Server**: `python -m http.server 8001` (required for CORS/local files)
- **No Build Process**: Direct file editing, refresh browser
- **Testing**: Open in modern browser with WebGL support

## Key Features
- Real-time geolocation integration
- Population-weighted user simulation with radial distribution
- Optimized particle rendering for large datasets
- Responsive design with Tailwind CSS
- Daily countdown functionality
- Multiple earth texture options

## Data Sources
- Population data uses weighted GeoJSON polygons
- Fallback to random distribution if data fails to load
- User positioning via browser Geolocation API
- Grid generation uses spherical geometry calculations

## Performance Considerations
- Particles system used for 10K+ simulated users
- Point resolution set to 12 for optimal performance
- Geolocation cached for 5 minutes
- Efficient weighted selection algorithms for user distribution