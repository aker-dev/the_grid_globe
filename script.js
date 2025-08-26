// Configuration constants
const GRID_CONFIG = {
  altitude: 0.1,
  latDivisions: 8,
  lngDivisions: 12,
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

// Configuration des particules
const PARTICLES_CONFIG = {
  color: "#e11d48",
  size: 1,
  altitude: 0.1,
  numberOfParticles: 50000, // Réduit pour les tests avec vérification précise
  enabled: true,
};

// Variable globale pour stocker les données GeoJSON
let LAND_POLYGONS = null;

// Fonction pour charger les données GeoJSON
async function loadLandPolygons() {
  try {
    const response = await fetch("./data/ne_110m_land.geojson");
    const geoData = await response.json();
    LAND_POLYGONS = geoData.features;
    console.log(
      `🌍 ${LAND_POLYGONS.length} polygones terrestres chargés depuis ne_110m_land.geojson`
    );
    return LAND_POLYGONS;
  } catch (error) {
    console.error("❌ Erreur lors du chargement des données GeoJSON:", error);
    return null;
  }
}

// Algorithme de ray-casting pour vérifier si un point est dans un polygone
function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

// Fonction pour vérifier si un point (lat, lng) est sur terre
function isPointOnLand(lat, lng) {
  if (!LAND_POLYGONS) {
    console.warn(
      "⚠️ Données GeoJSON non chargées, utilisation des zones approximatives"
    );
    return false;
  }

  const point = [lng, lat]; // GeoJSON utilise [longitude, latitude]

  // Vérifier chaque feature (polygone de terre)
  for (const feature of LAND_POLYGONS) {
    const geometry = feature.geometry;

    if (geometry.type === "Polygon") {
      // Polygon simple
      const coordinates = geometry.coordinates[0]; // Premier ring (extérieur)
      if (pointInPolygon(point, coordinates)) {
        return true;
      }
    } else if (geometry.type === "MultiPolygon") {
      // MultiPolygon (plusieurs polygones)
      for (const polygonCoords of geometry.coordinates) {
        const coordinates = polygonCoords[0]; // Premier ring de chaque polygone
        if (pointInPolygon(point, coordinates)) {
          return true;
        }
      }
    }
  }

  return false;
}

// Générateur de particules aléatoires sur les terres émergées
class RandomParticlesGenerator {
  constructor(config = PARTICLES_CONFIG) {
    this.config = config;
  }

  async generate() {
    // S'assurer que les données GeoJSON sont chargées
    if (!LAND_POLYGONS) {
      await loadLandPolygons();
    }

    if (!LAND_POLYGONS) {
      console.error(
        "❌ Impossible de charger les données GeoJSON, génération abandonnée"
      );
      return [];
    }

    const particles = [];
    const maxAttempts = this.config.numberOfParticles * 10; // Limite pour éviter une boucle infinie
    let attempts = 0;

    console.log(
      `🎯 Génération de ${this.config.numberOfParticles} particules sur les terres émergées...`
    );

    while (
      particles.length < this.config.numberOfParticles &&
      attempts < maxAttempts
    ) {
      // Générer des coordonnées aléatoires sur toute la planète
      const lat = this.randomBetween(-90, 90);
      const lng = this.randomBetween(-180, 180);

      // Vérifier si le point est sur terre en utilisant les données GeoJSON précises
      if (isPointOnLand(lat, lng)) {
        particles.push({
          lat,
          lng,
          id: `land_particle_${particles.length}`,
          altitude: this.config.altitude,
        });
      }

      attempts++;
    }

    console.log(
      `✅ ${particles.length} particules générées sur les terres émergées (${attempts} tentatives)`
    );

    if (particles.length < this.config.numberOfParticles) {
      console.warn(
        `⚠️ Seulement ${particles.length}/${this.config.numberOfParticles} particules générées`
      );
    }

    return particles;
  }

  randomBetween(min, max) {
    return min + Math.random() * (max - min);
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
function createGlobe(gridData, particlesData) {
  return (
    Globe()(document.getElementById("globeViz"))
      .globeImageUrl("./img/earth-light.jpg")
      .backgroundColor(VISUAL_CONFIG.backgroundColor)
      .atmosphereColor(VISUAL_CONFIG.atmosphereColor)
      .atmosphereAltitude(VISUAL_CONFIG.atmosphereAltitude)
      .width(window.innerWidth)
      .height(window.innerHeight)

      // Points de la grille (utilise la couche Points Layer)
      .pointsData(gridData.points)
      .pointColor(() => VISUAL_CONFIG.pointColor)
      .pointRadius(VISUAL_CONFIG.pointRadius)
      .pointAltitude(0)
      .pointResolution(12)

      // Arcs de la grille
      .arcsData(gridData.arcs)
      .arcColor(() => VISUAL_CONFIG.pointColor)
      .arcAltitude((d) => d.altitude)
      .arcStroke(VISUAL_CONFIG.arcStroke)
      .arcDashLength(VISUAL_CONFIG.arcDashLength)
      .arcDashGap(VISUAL_CONFIG.arcDashGap)

      // Particules (utilise la couche Particles Layer pour les performances)
      .particlesData([particlesData]) // Enveloppe dans un array car particlesData attend un array de sets
      .particlesList((d) => d) // Retourne directement les particules
      .particleLat("lat")
      .particleLng("lng")
      .particleAltitude("altitude")
      .particlesSize(PARTICLES_CONFIG.size)
      .particlesSizeAttenuation(true)
      .particlesColor(() => PARTICLES_CONFIG.color)
  );
}

// Fonction principale asynchrone
async function initializeGlobe() {
  try {
    // Charger les données GeoJSON
    console.log("🌍 Chargement des données géographiques...");
    await loadLandPolygons();

    // Générer la grille
    console.log("📐 Génération de la grille triangulaire...");
    const gridGenerator = new TriangularGridGenerator();
    const gridData = gridGenerator.generate();

    // Générer les particules (maintenant asynchrone)
    console.log("🎯 Génération des particules sur les terres émergées...");
    const particlesGenerator = new RandomParticlesGenerator();
    const particles = await particlesGenerator.generate();

    // Créer le globe avec grille et particules
    console.log("🌐 Création du globe...");
    const world = createGlobe(gridData, particles);

    console.log("✅ Globe initialisé avec succès !");
    return world;
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation du globe:", error);
  }
}

// Lancer l'initialisation
initializeGlobe();
