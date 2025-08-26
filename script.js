// Configuration constants
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
  arcDashLength: 0.05, // Longueur des segments pointillés
  arcDashGap: 0.02, // Espacement entre les segments
  backgroundColor: "#A1A39A",
  atmosphereColor: "#F8ED43",
  atmosphereAltitude: 0.5,
};

// Configuration pour la géolocalisation de l'utilisateur
const USER_LOCATION_CONFIG = {
  color: "#F8ED43", // Rouge
  radius: 0.8,
  altitude: 0.05,
};

// Configuration pour les autres utilisateurs en ligne (utilisant le système de particules)
const OTHER_USERS_CONFIG = {
  color: "#F8ED43", // Bleu
  size: 1, // Taille pour le système de particules
  altitude: 0.025,
  numberOfUsers: 10000,
};

// Configuration pour les niveaux de zoom et respiration
const ZOOM_CONFIG = {
  initialDistance: 400, // Distance initiale de la caméra
  minDistance: 200, // Zoom minimum (plus proche)
  maxDistance: 1000, // Zoom maximum (plus loin)
  breathingAmplitude: 0.5, // Amplitude de l'animation de respiration (80% de variation)
  transitionDuration: 1000, // Durée de transition entre les niveaux de zoom (ms)
  // Temps de respiration en secondes
  breathingTiming: {
    inspire: 3, // Inspiration en secondes
    pause: 2, // Pause/rétention en secondes
    expire: 3, // Expiration en secondes
  },
  pauseMicroAmplitude: 0.005, // Mini amplitude pour l'animation pendant la pause (2% de variation)
};

// Classe pour générer des utilisateurs simulés dans les zones peuplées
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
      console.log(`🌍 ${this.populatedAreas.length} zones peuplées chargées`);
    } catch (error) {
      console.error("Erreur lors du chargement des zones peuplées:", error);
      // Fallback vers la génération aléatoire
      this.populatedAreas = null;
    }
  }

  async generate() {
    // Charger les zones peuplées si pas encore fait
    if (!this.populatedAreas) {
      await this.loadPopulatedAreas();
    }

    const users = [];

    // Si on n'a pas pu charger les données, utiliser la méthode aléatoire
    if (!this.populatedAreas) {
      return this.generateRandomUsers();
    }

    // Générer des utilisateurs dans les zones peuplées selon leur poids
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
      `👥 ${users.length} utilisateurs simulés générés dans les zones peuplées`
    );
    return users;
  }

  generateCoordinatesInPopulatedArea() {
    // Sélectionner une zone selon son poids de population
    const area = this.selectWeightedArea();

    // Générer un point aléatoire dans cette zone, évitant les bordures
    return this.generatePointInPolygonCenter(area.geometry.coordinates[0]);
  }

  selectWeightedArea() {
    // Créer un tableau avec répétition selon le poids
    const weightedAreas = [];
    this.populatedAreas.forEach((area) => {
      const weight = Math.round(area.properties.weight * 100);
      for (let i = 0; i < weight; i++) {
        weightedAreas.push(area);
      }
    });

    // Sélection aléatoire pondérée
    return weightedAreas[Math.floor(Math.random() * weightedAreas.length)];
  }

  generatePointInPolygonCenter(coordinates) {
    // Trouver le centre géographique du polygone
    const lats = coordinates.map((coord) => coord[1]);
    const lngs = coordinates.map((coord) => coord[0]);

    const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
    const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;

    // Calculer la taille de la zone pour déterminer le rayon maximum
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRadius = Math.min(latRange, lngRange) * 0.4; // 40% de la taille de la zone

    // Générer un point avec distribution radiale depuis le centre
    const { lat, lng } = this.generateRadialPoint(
      centerLat,
      centerLng,
      maxRadius
    );

    return { lat, lng };
  }

  // Distribution gaussienne pour concentrer les points vers le centre des zones
  gaussianRandom(min, max, concentration = 0.3) {
    const center = (min + max) / 2;
    const range = max - min;

    // Box-Muller transform pour distribution gaussienne
    const u1 = Math.random();
    const u2 = Math.random();
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Appliquer la concentration et les limites
    const value = center + gaussian * range * concentration;
    return Math.max(min, Math.min(max, value));
  }

  // Nouvelle méthode pour distribution radiale depuis un centre
  generateRadialPoint(centerLat, centerLng, maxRadius) {
    // Mélange de distribution radiale et de bruit aléatoire pour plus de naturel
    const useRadial = Math.random() < 0.7; // 70% radial, 30% aléatoire

    if (useRadial) {
      // Distribution radiale avec variation d'angle
      const baseAngle = Math.random() * 2 * Math.PI;
      const angleVariation = (Math.random() - 0.5) * Math.PI * 0.3; // ±27° de variation
      const angle = baseAngle + angleVariation;

      // Rayon avec plus de variation et moins de concentration stricte
      const radiusRandom1 = Math.random();
      const radiusRandom2 = Math.random();
      // Moyenne de deux valeurs aléatoires pour une distribution plus douce
      const normalizedRadius = (radiusRandom1 + radiusRandom2) / 2;
      const radiusVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20% de variation
      const radius = normalizedRadius * maxRadius * radiusVariation;

      // Conversion en coordonnées avec du bruit additionnel
      const deltaLat =
        radius * Math.cos(angle) + (Math.random() - 0.5) * maxRadius * 0.1;
      const deltaLng =
        radius * Math.sin(angle) + (Math.random() - 0.5) * maxRadius * 0.1;

      // Ajustement pour la projection sphérique
      const correctedDeltaLng =
        deltaLng / Math.cos((centerLat * Math.PI) / 180);

      return {
        lat: centerLat + deltaLat,
        lng: centerLng + correctedDeltaLng,
      };
    } else {
      // Distribution complètement aléatoire dans un carré autour du centre
      const randomLat = centerLat + (Math.random() - 0.5) * maxRadius * 2;
      const randomLng = centerLng + (Math.random() - 0.5) * maxRadius * 2;

      return {
        lat: randomLat,
        lng: randomLng,
      };
    }
  }

  // Nouvelle méthode pour distribution gaussienne autour d'un point central
  gaussianRandomAroundPoint(center, diffusionRadius) {
    // Box-Muller transform pour distribution gaussienne
    const u1 = Math.random();
    const u2 = Math.random();
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Appliquer une diffusion très concentrée autour du centre pour éviter les bordures
    const offset = gaussian * diffusionRadius * 0.5; // Concentration élevée (0.5 au lieu de 0.3)
    return center + offset;
  }

  // Méthode de fallback si les données géographiques ne se chargent pas
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
      `👥 ${users.length} utilisateurs simulés générés aléatoirement (fallback)`
    );
    return users;
  }
}

// Grid generator class
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

// Variables globales pour la gestion de l'animation
let globeInstance = null;
let isBreathingMode = false;
let breathingAnimationId = null;
let zoomTransitionId = null;

// Fonction d'easing pour l'animation de respiration
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Fonction pour animer une transition de zoom fluide
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

    // Utiliser easing pour une transition fluide
    const easedProgress = easeInOutQuad(progress);
    const currentDistance =
      fromDistance + (toDistance - fromDistance) * easedProgress;

    // Appliquer la nouvelle distance
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

// Animation de respiration cohérence cardiaque (4-2-6 secondes)
function startBreathingAnimation() {
  if (!globeInstance || breathingAnimationId) return;

  const controls = globeInstance.controls();
  // Utiliser maxDistance comme base pour l'animation de respiration
  const baseDistance = ZOOM_CONFIG.maxDistance;
  const breathAmplitude = baseDistance * ZOOM_CONFIG.breathingAmplitude;

  let startTime = performance.now();

  // Calculer les durées en millisecondes depuis la configuration
  const inspireDuration = ZOOM_CONFIG.breathingTiming.inspire * 1000;
  const pauseDuration = ZOOM_CONFIG.breathingTiming.pause * 1000;
  const expireDuration = ZOOM_CONFIG.breathingTiming.expire * 1000;
  const cycleDuration = inspireDuration + pauseDuration + expireDuration;

  console.log(
    `🫁 Cycle de respiration: ${ZOOM_CONFIG.breathingTiming.inspire}s-${
      ZOOM_CONFIG.breathingTiming.pause
    }s-${ZOOM_CONFIG.breathingTiming.expire}s (amplitude: ${
      ZOOM_CONFIG.breathingAmplitude * 100
    }%)`
  );

  function animateBreathing(currentTime) {
    if (!isBreathingMode) return;

    const elapsed = (currentTime - startTime) % cycleDuration;
    let progress = 0;

    if (elapsed <= inspireDuration) {
      // Phase d'inspiration - se rapprocher
      progress = easeInOutQuad(elapsed / inspireDuration);
    } else if (elapsed <= inspireDuration + pauseDuration) {
      // Phase de rétention avec mini animation
      const pauseElapsed = elapsed - inspireDuration;
      const pauseProgress = pauseElapsed / pauseDuration;

      // Mini oscillation pendant la pause (cycle rapide de 0.5 seconde)
      const microCycle = (pauseElapsed % 500) / 500; // Cycle de 0.5s
      const microVariation =
        Math.sin(microCycle * Math.PI * 2) * ZOOM_CONFIG.pauseMicroAmplitude;

      progress = 1 + microVariation;
    } else {
      // Phase d'expiration - s'éloigner
      const expireElapsed = elapsed - inspireDuration - pauseDuration;
      progress = 1 - easeInOutQuad(expireElapsed / expireDuration);
    }

    // Ajuster la distance de la caméra (inspiration = se rapprocher du globe)
    const currentDistance = baseDistance - breathAmplitude * progress;
    const direction = controls.object.position.clone().normalize();
    controls.object.position.copy(direction.multiplyScalar(currentDistance));
    controls.update();

    breathingAnimationId = requestAnimationFrame(animateBreathing);
  }

  breathingAnimationId = requestAnimationFrame(animateBreathing);
}

// Arrêter l'animation de respiration
function stopBreathingAnimation() {
  if (breathingAnimationId) {
    cancelAnimationFrame(breathingAnimationId);
    breathingAnimationId = null;
  }

  // Retourner à la distance normale
  if (globeInstance) {
    const controls = globeInstance.controls();
    const baseDistance = ZOOM_CONFIG.initialDistance;
    const direction = controls.object.position.clone().normalize();
    controls.object.position.copy(direction.multiplyScalar(baseDistance));
    controls.update();
  }
}

// Basculer entre rotation et respiration
function toggleGlobeMode() {
  if (!globeInstance) return;

  const controls = globeInstance.controls();
  const currentDistance = controls.object.position.length();

  if (isBreathingMode) {
    // Retour au mode rotation avec transition
    isBreathingMode = false;
    stopBreathingAnimation();

    // Transition fluide vers la distance initiale
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
    // Mode respiration avec transition vers maxDistance
    isBreathingMode = true;
    controls.autoRotate = false;

    // Transition fluide vers la distance maximale puis démarrer la respiration
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

// Globe setup function
function createGlobe(gridData, userLocationData = [], otherUsersData = []) {
  const globe = Globe()(document.getElementById("globeViz"))
    .globeImageUrl("./img/earth-bi.jpg")
    .backgroundImageUrl("./img/night-sky.png")
    .backgroundColor(VISUAL_CONFIG.backgroundColor)
    .atmosphereColor(VISUAL_CONFIG.atmosphereColor)
    .atmosphereAltitude(VISUAL_CONFIG.atmosphereAltitude)
    .width(window.innerWidth)
    .height(window.innerHeight)

    // Points de la grille + utilisateur principal uniquement (Points Layer)
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

    // Arcs de la grille
    .arcsData(gridData.arcs)
    .arcColor(() => VISUAL_CONFIG.pointColor)
    .arcAltitude((d) => d.altitude)
    .arcStroke(VISUAL_CONFIG.arcStroke)
    .arcDashLength(VISUAL_CONFIG.arcDashLength)
    .arcDashGap(VISUAL_CONFIG.arcDashGap)

    // Autres utilisateurs (utilise le système de particules optimisé)
    .particlesData([otherUsersData]) // Enveloppe dans un array car particlesData attend un array de sets
    .particlesList((d) => d) // Retourne directement les particules
    .particleLat("lat")
    .particleLng("lng")
    .particleAltitude("altitude")
    .particlesSize(OTHER_USERS_CONFIG.size)
    .particlesSizeAttenuation(true)
    .particlesColor(() => OTHER_USERS_CONFIG.color);

  // Configuration de l'inclinaison et rotation via les controls
  const controls = globe.controls();

  // Incliner le globe de 23.5 degrés en ajustant la position de la caméra
  controls.object.position.set(0, 0, ZOOM_CONFIG.initialDistance);
  controls.object.up.set(
    Math.sin((23.5 * Math.PI) / 180),
    Math.cos((23.5 * Math.PI) / 180),
    0
  );

  // Configurer les limites de zoom
  controls.minDistance = ZOOM_CONFIG.minDistance;
  controls.maxDistance = ZOOM_CONFIG.maxDistance;

  controls.update();

  // Activer la rotation automatique par défaut
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Stocker l'instance globale
  globeInstance = globe;

  return globe;
}

// Classe pour gérer la géolocalisation de l'utilisateur
class UserLocationManager {
  constructor() {
    this.userLocation = null;
    this.isLocationSupported = "geolocation" in navigator;
  }

  async getUserLocation() {
    if (!this.isLocationSupported) {
      console.warn("🌍 Géolocalisation non supportée par ce navigateur");
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
            isUserLocation: true, // Flag pour identifier la position de l'utilisateur
          };

          this.userLocation = location;
          console.log(
            `🎯 Position de l'utilisateur trouvée: ${location.lat.toFixed(
              4
            )}, ${location.lng.toFixed(4)} (précision: ${location.accuracy}m)`
          );
          resolve([location]);
        },
        (error) => {
          let errorMessage = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Permission de géolocalisation refusée par l'utilisateur";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Informations de position non disponibles";
              break;
            case error.TIMEOUT:
              errorMessage = "Délai d'attente de géolocalisation dépassé";
              break;
            default:
              errorMessage = "Erreur de géolocalisation inconnue";
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
        // Combiner seulement grille + utilisateur actuel (les autres utilisateurs sont des particules)
        const allPoints = [...gridData.points, ...userLocationData];

        // Mettre à jour le globe avec les points (grille + utilisateur)
        globe.pointsData(allPoints);

        // Centrer la vue sur la position de l'utilisateur
        globe.pointOfView(
          {
            lat: userLocationData[0].lat,
            lng: userLocationData[0].lng,
            altitude: ZOOM_CONFIG.initialDistance / 100, // Convertir la distance en altitude pour pointOfView
          },
          2000
        );

        return userLocationData;
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'initialisation de la géolocalisation:",
        error
      );
    }

    return [];
  }
}

// Main execution
async function initializeGlobe() {
  const gridGenerator = new TriangularGridGenerator();
  const gridData = gridGenerator.generate();

  // Générer les utilisateurs simulés dans les zones peuplées
  const usersGenerator = new PopulatedUsersGenerator();
  const otherUsers = await usersGenerator.generate();

  // Créer le globe avec grille (points) et autres utilisateurs (particules)
  const world = createGlobe(gridData, [], otherUsers);

  // Initialiser la géolocalisation de l'utilisateur
  const locationManager = new UserLocationManager();
  locationManager.initializeLocation(world, gridData);

  // Ajouter l'événement de clic sur le coeur
  const heartButton = document.getElementById("heart-button");
  if (heartButton) {
    heartButton.addEventListener("click", toggleGlobeMode);
  }
}

// Lancer l'initialisation
initializeGlobe();
