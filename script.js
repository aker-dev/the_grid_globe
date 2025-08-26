/*
  THE~GRID MANIFESTATION~STATION
  Copyright (c) 2024
  Licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
  See LICENSE file for details
*/

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

const GRID_CONFIG = {
  altitude: 0.05,
  latDivisions: 12,
  lngDivisions: 24,
  tolerance: 0.1,
};

const VISUAL_CONFIG = {
  pointColor: "#F8ED43",
  pointRadius: 0.2,
  arcStroke: 0.1,
  arcDashLength: 0.05, // Length of dashed segments
  arcDashGap: 0.02, // Spacing between segments
  backgroundColor: "#A1A39A",
  atmosphereColor: "#F8ED43",
  atmosphereAltitude: 0.5,
};

// Configuration for user geolocation
const USER_LOCATION_CONFIG = {
  color: "#F8ED43", // Yellow
  radius: 0.8,
  altitude: 0.05,
};

// Configuration for other online users (using particle system)
const OTHER_USERS_CONFIG = {
  color: "#F8ED43", // Yellow
  size: 1, // Size for particle system
  altitude: 0.025,
  numberOfUsers: 10000,
};

// Configuration for zoom levels and breathing
const ZOOM_CONFIG = {
  initialDistance: 400, // Initial camera distance
  minDistance: 200, // Minimum zoom (closer)
  maxDistance: 1000, // Maximum zoom (further)
  breathingAmplitude: 0.5, // Breathing animation amplitude (80% variation)
  transitionDuration: 1000, // Transition duration between zoom levels (ms)
  // Breathing timing in seconds
  breathingTiming: {
    inspire: 4, // Inspiration in seconds
    pause: 2, // Pause/retention in seconds
    expire: 6, // Expiration in seconds
  },
  pauseMicroAmplitude: 0.005, // Mini amplitude for pause animation (2% variation)
};

// =============================================================================
// CORE CLASSES
// =============================================================================

class PopulatedUsersGenerator {
  constructor(config = OTHER_USERS_CONFIG) {
    this.config = config;
    this.populatedAreas = null;
  }

  async loadPopulatedAreas() {
    try {
      const response = await fetch("./data/populated_areas.geojson");
      const data = await response.json();
      this.populatedAreas = data.features;
      console.log(`🌍 ${this.populatedAreas.length} populated areas loaded`);
    } catch (error) {
      console.error("Error loading populated areas:", error);
      // Fallback to random generation
      this.populatedAreas = null;
    }
  }

  async generate() {
    // Load populated areas if not already done
    if (!this.populatedAreas) {
      await this.loadPopulatedAreas();
    }

    const users = [];

    // If data couldn't be loaded, use random method
    if (!this.populatedAreas) {
      return this.generateRandomUsers();
    }

    // Generate users in populated areas according to their weight
    for (let i = 0; i < this.config.numberOfUsers; i++) {
      const coordinates = this.generateCoordinatesInPopulatedArea();

      users.push({
        lat: coordinates.lat,
        lng: coordinates.lng,
        altitude: this.config.altitude,
        id: `populated_user_${i}`,
      });
    }

    console.log(
      `👥 ${users.length} simulated users generated in populated areas`
    );
    return users;
  }

  generateCoordinatesInPopulatedArea() {
    // Select an area according to its population weight
    const area = this.selectWeightedArea();

    // Generate a random point in this area, avoiding borders
    return this.generatePointInPolygonCenter(area.geometry.coordinates[0]);
  }

  selectWeightedArea() {
    // Create array with repetition according to weight
    const weightedAreas = [];
    this.populatedAreas.forEach((area) => {
      const weight = Math.round(area.properties.weight * 100);
      for (let i = 0; i < weight; i++) {
        weightedAreas.push(area);
      }
    });

    // Weighted random selection
    return weightedAreas[Math.floor(Math.random() * weightedAreas.length)];
  }

  generatePointInPolygonCenter(coordinates) {
    // Find the geographic center of the polygon
    const lats = coordinates.map((coord) => coord[1]);
    const lngs = coordinates.map((coord) => coord[0]);

    const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
    const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;

    // Calculate area size to determine maximum radius
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRadius = Math.min(latRange, lngRange) * 0.4; // 40% of area size

    // Generate point with radial distribution from center
    const { lat, lng } = this.generateRadialPoint(
      centerLat,
      centerLng,
      maxRadius
    );

    return { lat, lng };
  }

  // Gaussian distribution to concentrate points towards area centers
  gaussianRandom(min, max, concentration = 0.3) {
    const center = (min + max) / 2;
    const range = max - min;

    // Box-Muller transform for gaussian distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Apply concentration and limits
    const value = center + gaussian * range * concentration;
    return Math.max(min, Math.min(max, value));
  }

  // New method for radial distribution from a center
  generateRadialPoint(centerLat, centerLng, maxRadius) {
    // Mix of radial distribution and random noise for more natural look
    const useRadial = Math.random() < 0.7; // 70% radial, 30% random

    if (useRadial) {
      // Radial distribution with angle variation
      const baseAngle = Math.random() * 2 * Math.PI;
      const angleVariation = (Math.random() - 0.5) * Math.PI * 0.3; // ±27° variation
      const angle = baseAngle + angleVariation;

      // Radius with more variation and less strict concentration
      const radiusRandom1 = Math.random();
      const radiusRandom2 = Math.random();
      // Average of two random values for smoother distribution
      const normalizedRadius = (radiusRandom1 + radiusRandom2) / 2;
      const radiusVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20% variation
      const radius = normalizedRadius * maxRadius * radiusVariation;

      // Convert to coordinates with additional noise
      const deltaLat =
        radius * Math.cos(angle) + (Math.random() - 0.5) * maxRadius * 0.1;
      const deltaLng =
        radius * Math.sin(angle) + (Math.random() - 0.5) * maxRadius * 0.1;

      // Adjustment for spherical projection
      const correctedDeltaLng =
        deltaLng / Math.cos((centerLat * Math.PI) / 180);

      return {
        lat: centerLat + deltaLat,
        lng: centerLng + correctedDeltaLng,
      };
    } else {
      // Completely random distribution in a square around center
      const randomLat = centerLat + (Math.random() - 0.5) * maxRadius * 2;
      const randomLng = centerLng + (Math.random() - 0.5) * maxRadius * 2;

      return {
        lat: randomLat,
        lng: randomLng,
      };
    }
  }

  // New method for gaussian distribution around a central point
  gaussianRandomAroundPoint(center, diffusionRadius) {
    // Box-Muller transform for gaussian distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Apply very concentrated diffusion around center to avoid borders
    const offset = gaussian * diffusionRadius * 0.5; // High concentration (0.5 instead of 0.3)
    return center + offset;
  }

  // Fallback method if geographic data fails to load
  generateRandomUsers() {
    const users = [];
    for (let i = 0; i < this.config.numberOfUsers; i++) {
      const lat = Math.asin(2 * Math.random() - 1) * (180 / Math.PI);
      const lng = (Math.random() - 0.5) * 360;

      users.push({
        lat,
        lng,
        altitude: this.config.altitude,
        id: `random_user_${i}`,
      });
    }
    console.log(
      `👥 ${users.length} simulated users generated randomly (fallback)`
    );
    return users;
  }
}

class TriangularGridGenerator {
  constructor(config = GRID_CONFIG) {
    this.config = config;
    this.points = [];
    this.arcs = [];
  }

  generate() {
    this.createPoles();
    this.createGridPoints();
    this.createLatitudeLines();
    this.createMeridians();
    this.createDiagonals();

    return {
      points: this.points,
      arcs: this.arcs,
    };
  }

  createPoles() {
    this.points.push(
      {
        lat: 90,
        lng: 0,
        id: "north_pole",
        altitude: this.config.altitude,
      },
      {
        lat: -90,
        lng: 0,
        id: "south_pole",
        altitude: this.config.altitude,
      }
    );
  }

  createGridPoints() {
    for (let latStep = 1; latStep < this.config.latDivisions; latStep++) {
      const lat = -90 + (latStep * 180) / this.config.latDivisions;

      for (let lngStep = 0; lngStep < this.config.lngDivisions; lngStep++) {
        const lng = -180 + (lngStep * 360) / this.config.lngDivisions;

        this.points.push({
          lat,
          lng,
          id: `${latStep}_${lngStep}`,
          altitude: this.config.altitude,
        });
      }
    }
  }

  createLatitudeLines() {
    for (let latStep = 1; latStep < this.config.latDivisions; latStep++) {
      const lat = -90 + (latStep * 180) / this.config.latDivisions;

      for (let lngStep = 0; lngStep < this.config.lngDivisions; lngStep++) {
        const lng1 = -180 + (lngStep * 360) / this.config.lngDivisions;
        const lng2 =
          -180 +
          (((lngStep + 1) % this.config.lngDivisions) * 360) /
            this.config.lngDivisions;

        const p1 = this.findPoint(lat, lng1);
        const p2 = this.findPoint(lat, lng2);
        this.addArc(p1, p2);
      }
    }
  }

  createMeridians() {
    for (let lngStep = 0; lngStep < this.config.lngDivisions; lngStep++) {
      const lng = -180 + (lngStep * 360) / this.config.lngDivisions;

      this.connectPoleToMeridian("north", lng);
      this.connectMeridianPoints(lng);
      this.connectPoleToMeridian("south", lng);
    }
  }

  connectPoleToMeridian(pole, lng) {
    const polePoint = this.points.find((p) => p.id === `${pole}_pole`);

    if (pole === "north") {
      const firstPoint = this.findPoint(
        -90 + ((this.config.latDivisions - 1) * 180) / this.config.latDivisions,
        lng
      );
      this.addArc(polePoint, firstPoint);
    } else {
      const lastPoint = this.findPoint(
        -90 + (1 * 180) / this.config.latDivisions,
        lng
      );
      this.addArc(lastPoint, polePoint);
    }
  }

  connectMeridianPoints(lng) {
    for (let latStep = 1; latStep < this.config.latDivisions - 1; latStep++) {
      const lat1 = -90 + (latStep * 180) / this.config.latDivisions;
      const lat2 = -90 + ((latStep + 1) * 180) / this.config.latDivisions;

      const p1 = this.findPoint(lat1, lng);
      const p2 = this.findPoint(lat2, lng);
      this.addArc(p1, p2);
    }
  }

  createDiagonals() {
    for (let latStep = 1; latStep < this.config.latDivisions - 1; latStep++) {
      const lat1 = -90 + (latStep * 180) / this.config.latDivisions;
      const lat2 = -90 + ((latStep + 1) * 180) / this.config.latDivisions;

      for (let lngStep = 0; lngStep < this.config.lngDivisions; lngStep++) {
        const lng1 = -180 + (lngStep * 360) / this.config.lngDivisions;
        const lng2 =
          -180 +
          (((lngStep + 1) % this.config.lngDivisions) * 360) /
            this.config.lngDivisions;

        const p1 = this.findPoint(lat1, lng1);
        const p2 = this.findPoint(lat2, lng2);
        const p3 = this.findPoint(lat1, lng2);
        const p4 = this.findPoint(lat2, lng1);

        this.addArc(p1, p2);
        this.addArc(p3, p4);
      }
    }
  }

  findPoint(lat, lng) {
    return this.points.find(
      (p) =>
        Math.abs(p.lat - lat) < this.config.tolerance &&
        Math.abs(p.lng - lng) < this.config.tolerance
    );
  }

  addArc(p1, p2) {
    if (p1 && p2) {
      this.arcs.push({
        startLat: p1.lat,
        startLng: p1.lng,
        endLat: p2.lat,
        endLng: p2.lng,
        altitude: this.config.altitude,
      });
    }
  }
}

class UserLocationManager {
  constructor() {
    this.userLocation = null;
    this.isLocationSupported = "geolocation" in navigator;
  }

  async getUserLocation() {
    if (!this.isLocationSupported) {
      console.warn("🌍 Geolocation not supported by this browser");
      return null;
    }

    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            id: "user_location",
            isUserLocation: true, // Flag to identify user position
          };

          this.userLocation = location;
          console.log(
            `🎯 User position found: ${location.lat.toFixed(
              4
            )}, ${location.lng.toFixed(4)} (accuracy: ${location.accuracy}m)`
          );
          resolve([location]);
        },
        (error) => {
          let errorMessage = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Geolocation permission denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Position information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Geolocation timeout exceeded";
              break;
            default:
              errorMessage = "Unknown geolocation error";
              break;
          }
          console.warn(`🌍 ${errorMessage}`);
          reject(error);
        },
        options
      );
    });
  }

  async initializeLocation(globe, gridData) {
    try {
      const userLocationData = await this.getUserLocation();

      if (userLocationData && userLocationData.length > 0) {
        // Combine only grid + current user (other users are particles)
        const allPoints = [...gridData.points, ...userLocationData];

        // Update globe with points (grid + user)
        globe.pointsData(allPoints);

        // Center view on user position
        globe.pointOfView(
          {
            lat: userLocationData[0].lat,
            lng: userLocationData[0].lng,
            altitude: ZOOM_CONFIG.initialDistance / 100, // Convert distance to altitude for pointOfView
          },
          2000
        );

        return userLocationData;
      }
    } catch (error) {
      console.error("Error initializing geolocation:", error);
    }

    return [];
  }
}

// =============================================================================
// ANIMATION & INTERACTION SYSTEM
// =============================================================================
let globeInstance = null;
let isBreathingMode = false;
let breathingAnimationId = null;
let zoomTransitionId = null;
let originalCountdownContent = null;

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function animateZoomTransition(fromDistance, toDistance, duration, onComplete) {
  if (!globeInstance) return;

  if (zoomTransitionId) {
    cancelAnimationFrame(zoomTransitionId);
  }

  const controls = globeInstance.controls();
  const startTime = performance.now();

  function animateZoom(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Use easing for smooth transition
    const easedProgress = easeInOutQuad(progress);
    const currentDistance =
      fromDistance + (toDistance - fromDistance) * easedProgress;

    // Apply new distance
    const direction = controls.object.position.clone().normalize();
    controls.object.position.copy(direction.multiplyScalar(currentDistance));
    controls.update();

    if (progress < 1) {
      zoomTransitionId = requestAnimationFrame(animateZoom);
    } else {
      zoomTransitionId = null;
      if (onComplete) onComplete();
    }
  }

  zoomTransitionId = requestAnimationFrame(animateZoom);
}

function startBreathingAnimation() {
  if (!globeInstance || breathingAnimationId) return;

  // Replace manifestation header text during breathing
  const manifestationHeader = document.getElementById("manifestation-header");
  if (manifestationHeader) {
    manifestationHeader.textContent = "HERE~NOW";
  }

  const controls = globeInstance.controls();
  // Use maxDistance as base for breathing animation
  const baseDistance = ZOOM_CONFIG.maxDistance;
  const breathAmplitude = baseDistance * ZOOM_CONFIG.breathingAmplitude;

  let startTime = performance.now();

  // Calculate durations in milliseconds from configuration
  const inspireDuration = ZOOM_CONFIG.breathingTiming.inspire * 1000;
  const pauseDuration = ZOOM_CONFIG.breathingTiming.pause * 1000;
  const expireDuration = ZOOM_CONFIG.breathingTiming.expire * 1000;
  const cycleDuration = inspireDuration + pauseDuration + expireDuration;

  console.log(
    `🫁 Breathing cycle: ${ZOOM_CONFIG.breathingTiming.inspire}s-${
      ZOOM_CONFIG.breathingTiming.pause
    }s-${ZOOM_CONFIG.breathingTiming.expire}s (amplitude: ${
      ZOOM_CONFIG.breathingAmplitude * 100
    }%)`
  );

  function animateBreathing(currentTime) {
    if (!isBreathingMode) return;

    const elapsed = (currentTime - startTime) % cycleDuration;
    let progress = 0;

    // Determine current phase and update display
    let currentPhase = "";

    if (elapsed <= inspireDuration) {
      // Inspiration phase - get closer
      progress = easeInOutQuad(elapsed / inspireDuration);
      currentPhase = "INHALE";
    } else if (elapsed <= inspireDuration + pauseDuration) {
      // Retention phase with mini animation
      const pauseElapsed = elapsed - inspireDuration;
      const pauseProgress = pauseElapsed / pauseDuration;

      // Mini oscillation during pause (fast 0.5 second cycle)
      const microCycle = (pauseElapsed % 500) / 500; // 0.5s cycle
      const microVariation =
        Math.sin(microCycle * Math.PI * 2) * ZOOM_CONFIG.pauseMicroAmplitude;

      progress = 1 + microVariation;
      currentPhase = "PAUSE";
    } else {
      // Expiration phase - move away
      const expireElapsed = elapsed - inspireDuration - pauseDuration;
      progress = 1 - easeInOutQuad(expireElapsed / expireDuration);
      currentPhase = "EXHALE";
    }

    // Update breathing phase display
    updateBreathingDisplay(currentPhase);

    // Adjust camera distance (inspiration = get closer to globe)
    const currentDistance = baseDistance - breathAmplitude * progress;
    const direction = controls.object.position.clone().normalize();
    controls.object.position.copy(direction.multiplyScalar(currentDistance));
    controls.update();

    breathingAnimationId = requestAnimationFrame(animateBreathing);
  }

  breathingAnimationId = requestAnimationFrame(animateBreathing);
}

function updateBreathingDisplay(phase) {
  const timeDisplay = document.getElementById("time-display");
  if (timeDisplay) {
    // Save original content the first time
    if (originalCountdownContent === null) {
      originalCountdownContent = timeDisplay.textContent;
    }
    timeDisplay.textContent = phase;
  }
}

function restoreCountdownDisplay() {
  const timeDisplay = document.getElementById("time-display");
  if (timeDisplay && originalCountdownContent !== null) {
    // Don't restore original content as countdown continues
    // Let countdown script naturally resume control
    originalCountdownContent = null;
  }
}

function stopBreathingAnimation() {
  if (breathingAnimationId) {
    cancelAnimationFrame(breathingAnimationId);
    breathingAnimationId = null;
  }

  // Restore manifestation header text when breathing stops
  const manifestationHeader = document.getElementById("manifestation-header");
  if (manifestationHeader) {
    manifestationHeader.textContent = "NEXT~MANIFESTATION~IN";
  }

  // Restore countdown display
  restoreCountdownDisplay();

  // Return to normal distance
  if (globeInstance) {
    const controls = globeInstance.controls();
    const baseDistance = ZOOM_CONFIG.initialDistance;
    const direction = controls.object.position.clone().normalize();
    controls.object.position.copy(direction.multiplyScalar(baseDistance));
    controls.update();
  }
}

function toggleGlobeMode() {
  if (!globeInstance) return;

  const controls = globeInstance.controls();
  const currentDistance = controls.object.position.length();

  if (isBreathingMode) {
    // Return to rotation mode with transition
    isBreathingMode = false;
    stopBreathingAnimation();

    // Smooth transition to initial distance
    animateZoomTransition(
      currentDistance,
      ZOOM_CONFIG.initialDistance,
      ZOOM_CONFIG.transitionDuration,
      () => {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
      }
    );
  } else {
    // Breathing mode with transition to maxDistance
    isBreathingMode = true;
    controls.autoRotate = false;

    // Smooth transition to maximum distance then start breathing
    animateZoomTransition(
      currentDistance,
      ZOOM_CONFIG.maxDistance,
      ZOOM_CONFIG.transitionDuration,
      () => {
        startBreathingAnimation();
      }
    );
  }
}

// =============================================================================
// GLOBE SETUP & RENDERING
// =============================================================================

function createGlobe(gridData, userLocationData = [], otherUsersData = []) {
  const globe = Globe()(document.getElementById("globeViz"))
    .globeImageUrl("./img/earth-bi.jpg")
    .backgroundImageUrl("./img/night-sky.png")
    .backgroundColor(VISUAL_CONFIG.backgroundColor)
    .atmosphereColor(VISUAL_CONFIG.atmosphereColor)
    .atmosphereAltitude(VISUAL_CONFIG.atmosphereAltitude)
    .width(window.innerWidth)
    .height(window.innerHeight)

    // Grid points + main user only (Points Layer)
    .pointsData([...gridData.points, ...userLocationData])
    .pointColor((d) =>
      d.isUserLocation ? USER_LOCATION_CONFIG.color : VISUAL_CONFIG.pointColor
    )
    .pointRadius((d) =>
      d.isUserLocation ? USER_LOCATION_CONFIG.radius : VISUAL_CONFIG.pointRadius
    )
    .pointAltitude((d) =>
      d.isUserLocation ? USER_LOCATION_CONFIG.altitude : 0
    )
    .pointResolution(12)

    // Grid arcs
    .arcsData(gridData.arcs)
    .arcColor(() => VISUAL_CONFIG.pointColor)
    .arcAltitude((d) => d.altitude)
    .arcStroke(VISUAL_CONFIG.arcStroke)
    .arcDashLength(VISUAL_CONFIG.arcDashLength)
    .arcDashGap(VISUAL_CONFIG.arcDashGap)

    // Other users (uses optimized particle system)
    .particlesData([otherUsersData]) // Wrap in array as particlesData expects array of sets
    .particlesList((d) => d) // Return particles directly
    .particleLat("lat")
    .particleLng("lng")
    .particleAltitude("altitude")
    .particlesSize(OTHER_USERS_CONFIG.size)
    .particlesSizeAttenuation(true)
    .particlesColor(() => OTHER_USERS_CONFIG.color);

  // Configure tilt and rotation via controls
  const controls = globe.controls();

  // Tilt globe 23.5 degrees by adjusting camera position
  controls.object.position.set(0, 0, ZOOM_CONFIG.initialDistance);
  controls.object.up.set(
    Math.sin((23.5 * Math.PI) / 180),
    Math.cos((23.5 * Math.PI) / 180),
    0
  );

  // Configure zoom limits
  controls.minDistance = ZOOM_CONFIG.minDistance;
  controls.maxDistance = ZOOM_CONFIG.maxDistance;

  controls.update();

  // Enable automatic rotation by default
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Store global instance
  globeInstance = globe;

  return globe;
}

// =============================================================================
// APPLICATION INITIALIZATION
// =============================================================================

async function initializeGlobe() {
  const gridGenerator = new TriangularGridGenerator();
  const gridData = gridGenerator.generate();

  // Generate simulated users in populated areas
  const usersGenerator = new PopulatedUsersGenerator();
  const otherUsers = await usersGenerator.generate();

  // Create globe with grid (points) and other users (particles)
  const world = createGlobe(gridData, [], otherUsers);

  // Initialize user geolocation
  const locationManager = new UserLocationManager();
  locationManager.initializeLocation(world, gridData);

  // Add click event on heart button
  const heartButton = document.getElementById("heart-button");
  if (heartButton) {
    heartButton.addEventListener("click", toggleGlobeMode);
  }
}

initializeGlobe();
