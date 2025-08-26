// Configuration constants
const GRID_CONFIG = {
  altitude: 0,
  latDivisions: 12,
  lngDivisions: 24,
  tolerance: 0.1,
};

const VISUAL_CONFIG = {
  pointColor: "#404040",
  pointRadius: 0.2,
  arcStroke: 0.1,
  arcDashLength: 0.05, // Longueur des segments pointillés
  arcDashGap: 0.02, // Espacement entre les segments
  backgroundColor: "#f5f5f4",
  atmosphereColor: "#d4d4d4",
  atmosphereAltitude: 0.5,
};

// Configuration pour la géolocalisation de l'utilisateur
const USER_LOCATION_CONFIG = {
  color: "#ef4444", // Rouge
  radius: 0.8,
  altitude: 0,
};

// Configuration des particules
const PARTICLES_CONFIG = {
  color: "#e11d48",
  size: 1,
  altitude: 0.1,
  numberOfParticles: 10000, // Peut aller jusqu'à 10 000 000
  enabled: true,
};

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
function createGlobe(gridData, userLocationData = []) {
  return (
    Globe()(document.getElementById("globeViz"))
      .globeImageUrl("./img/earth-light.jpg")
      .backgroundColor(VISUAL_CONFIG.backgroundColor)
      .atmosphereColor(VISUAL_CONFIG.atmosphereColor)
      .atmosphereAltitude(VISUAL_CONFIG.atmosphereAltitude)
      .width(window.innerWidth)
      .height(window.innerHeight)

      // Points de la grille (utilise la couche Points Layer)
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

    // Particules (utilise la couche Particles Layer pour les performances)
    // .particlesData([particlesData]) // Enveloppe dans un array car particlesData attend un array de sets
    // .particlesList((d) => d) // Retourne directement les particules
    // .particleLat("lat")
    // .particleLng("lng")
    // .particleAltitude("altitude")
    // .particlesSize(PARTICLES_CONFIG.size)
    // .particlesSizeAttenuation(true)
    // .particlesColor(() => PARTICLES_CONFIG.color)
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
        // Combiner les points de la grille avec la position de l'utilisateur
        const allPoints = [...gridData.points, ...userLocationData];

        // Mettre à jour le globe avec tous les points
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
const gridGenerator = new TriangularGridGenerator();
const gridData = gridGenerator.generate();

// Générer les particules
// const particlesGenerator = new RandomParticlesGenerator();
// const particles = particlesGenerator.generate();

// Créer le globe avec grille
const world = createGlobe(gridData);

// Initialiser la géolocalisation de l'utilisateur
const locationManager = new UserLocationManager();
locationManager.initializeLocation(world, gridData);
