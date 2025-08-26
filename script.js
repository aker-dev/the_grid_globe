// Configuration constants
const GRID_CONFIG = {
  altitude: 0.04,
  latDivisions: 8,
  lngDivisions: 16,
  tolerance: 0.1,
};

const VISUAL_CONFIG = {
  pointColor: "#404040",
  pointRadius: 0.4,
  arcStroke: 0.1,
  arcDashLength: 0.05, // Longueur des segments pointillés
  arcDashGap: 0.02, // Espacement entre les segments
  backgroundColor: "#f5f5f4",
  atmosphereColor: "#d4d4d4",
  atmosphereAltitude: 0.5,
};

const colorInterpolator = (t) => `rgba(255,100,50,${Math.sqrt(1 - t)})`;

// Configuration des anneaux pulsants
const RINGS_CONFIG = {
  color: "#e11d48",
  maxRadius: 3,
  propagationSpeed: 0.5, // degrés par seconde
  repeatPeriod: 500, // ms entre chaque anneau
  altitude: 0.01,
  numberOfRings: 100,
  enabled: true,
};

// Zones géographiques des continents pour distribuer les points
const CONTINENT_BOUNDS = {
  northAmerica: { latMin: 25, latMax: 70, lngMin: -170, lngMax: -50 },
  southAmerica: { latMin: -55, latMax: 15, lngMin: -85, lngMax: -35 },
  europe: { latMin: 35, latMax: 70, lngMin: -10, lngMax: 50 },
  africa: { latMin: -35, latMax: 35, lngMin: -20, lngMax: 55 },
  asia: { latMin: 10, latMax: 70, lngMin: 60, lngMax: 150 },
  oceania: { latMin: -50, latMax: -10, lngMin: 110, lngMax: 180 },
};

// Générateur de points aléatoires sur les continents
class RandomPointsGenerator {
  constructor(config = RINGS_CONFIG) {
    this.config = config;
  }

  generate() {
    const points = [];
    const pointsPerContinent = Math.floor(
      this.config.numberOfRings / Object.keys(CONTINENT_BOUNDS).length
    );

    // Distribuer les points sur chaque continent
    Object.entries(CONTINENT_BOUNDS).forEach(([continent, bounds], index) => {
      const isLastContinent =
        index === Object.keys(CONTINENT_BOUNDS).length - 1;
      const numPoints = isLastContinent
        ? this.config.numberOfRings - points.length
        : pointsPerContinent;

      for (let i = 0; i < numPoints; i++) {
        const lat = this.randomBetween(bounds.latMin, bounds.latMax);
        const lng = this.randomBetween(bounds.lngMin, bounds.lngMax);

        points.push({
          lat,
          lng,
          continent,
          id: `${continent}_${i}`,
        });
      }
    });

    console.log(
      `🎯 ${points.length} points aléatoires générés sur ${
        Object.keys(CONTINENT_BOUNDS).length
      } continents`
    );
    return points;
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
function createGlobe(gridData, ringsData) {
  return (
    Globe()(document.getElementById("globeViz"))
      .globeImageUrl("./img/earth-light.jpg")
      .backgroundColor(VISUAL_CONFIG.backgroundColor)
      .atmosphereColor(VISUAL_CONFIG.atmosphereColor)
      .atmosphereAltitude(VISUAL_CONFIG.atmosphereAltitude)
      .width(window.innerWidth)
      .height(window.innerHeight)
      .pointsData(gridData.points)
      .pointColor(() => VISUAL_CONFIG.pointColor)
      .pointRadius(VISUAL_CONFIG.pointRadius)
      .pointAltitude(0)
      .pointResolution(24)
      .arcsData(gridData.arcs)
      .arcColor(() => VISUAL_CONFIG.pointColor)
      .arcAltitude((d) => d.altitude)
      .arcStroke(VISUAL_CONFIG.arcStroke)
      .arcDashLength(VISUAL_CONFIG.arcDashLength)
      .arcDashGap(VISUAL_CONFIG.arcDashGap)
      // Configuration native des anneaux pulsants
      .ringsData(ringsData)
      .ringLat("lat")
      .ringLng("lng")
      .ringColor(() => colorInterpolator)
      .ringMaxRadius(RINGS_CONFIG.maxRadius)
      .ringPropagationSpeed(RINGS_CONFIG.propagationSpeed)
      .ringRepeatPeriod(RINGS_CONFIG.repeatPeriod)
      .ringAltitude(RINGS_CONFIG.altitude)
  );
}

// Main execution
const gridGenerator = new TriangularGridGenerator();
const gridData = gridGenerator.generate();

// Générer les points pulsants
const pointsGenerator = new RandomPointsGenerator();
const randomPoints = pointsGenerator.generate();

// Créer le globe avec grille et anneaux
const world = createGlobe(gridData, randomPoints);
