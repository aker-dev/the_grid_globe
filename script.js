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
  atmosphereAltitude: 0.25,
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

// Configuration des particules
// const PARTICLES_CONFIG = {
//   color: "#e11d48",
//   size: 0.5,
//   altitude: 0.1,
//   numberOfParticles: 1000000, // Peut aller jusqu'à 10 000 000
//   enabled: true,
// };

// Zones géographiques des continents pour distribuer les points
// const CONTINENT_BOUNDS = {
//   northAmerica: { latMin: 25, latMax: 70, lngMin: -170, lngMax: -50 },
//   southAmerica: { latMin: -55, latMax: 15, lngMin: -85, lngMax: -35 },
//   europe: { latMin: 35, latMax: 70, lngMin: -10, lngMax: 50 },
//   africa: { latMin: -35, latMax: 35, lngMin: -20, lngMax: 55 },
//   asia: { latMin: 10, latMax: 70, lngMin: 60, lngMax: 150 },
//   oceania: { latMin: -50, latMax: -10, lngMin: 110, lngMax: 180 },
// };

// Générateur de particules aléatoires sur les continents
// class RandomParticlesGenerator {
//   constructor(config = PARTICLES_CONFIG) {
//     this.config = config;
//   }

//   generate() {
//     const particles = [];
//     const particlesPerContinent = Math.floor(
//       this.config.numberOfParticles / Object.keys(CONTINENT_BOUNDS).length
//     );

//     // Distribuer les particules sur chaque continent
//     Object.entries(CONTINENT_BOUNDS).forEach(([continent, bounds], index) => {
//       const isLastContinent =
//         index === Object.keys(CONTINENT_BOUNDS).length - 1;
//       const numParticles = isLastContinent
//         ? this.config.numberOfParticles - particles.length
//         : particlesPerContinent;

//       for (let i = 0; i < numParticles; i++) {
//         const lat = this.randomBetween(bounds.latMin, bounds.latMax);
//         const lng = this.randomBetween(bounds.lngMin, bounds.lngMax);

//         particles.push({
//           lat,
//           lng,
//           continent,
//           id: `${continent}_${i}`,
//           altitude: this.config.altitude,
//         });
//       }
//     });

//     console.log(
//       `🎯 ${particles.length} particules aléatoires générées sur ${
//         Object.keys(CONTINENT_BOUNDS).length
//       } continents`
//     );
//     return particles;
//   }

//   randomBetween(min, max) {
//     return min + Math.random() * (max - min);
//   }
// }

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

// Globe setup function
function createGlobe(gridData, userLocationData = [], otherUsersData = []) {
  return (
    Globe()(document.getElementById("globeViz"))
      .globeImageUrl("./img/earth-bi.jpg")
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
        d.isUserLocation
          ? USER_LOCATION_CONFIG.radius
          : VISUAL_CONFIG.pointRadius
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
      .particlesColor(() => OTHER_USERS_CONFIG.color)
  );
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
            altitude: 2.5,
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
}

// Lancer l'initialisation
initializeGlobe();
