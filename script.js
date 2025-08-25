// Fonction pour générer une grille triangulaire simple et régulière
function generateTriangularGrid() {
  const points = [];
  const arcs = [];
  const gridAltitude = 0.05;

  // Paramètres de la grille
  const latDivisions = 8; // Nombre de divisions en latitude
  const lngDivisions = 16; // Nombre de divisions en longitude

  // Ajouter les pôles
  points.push({
    lat: 90,
    lng: 0,
    id: "north_pole",
    altitude: gridAltitude,
  });

  points.push({
    lat: -90,
    lng: 0,
    id: "south_pole",
    altitude: gridAltitude,
  });

  // Générer les points de la grille (excluant les pôles)
  for (let latStep = 1; latStep < latDivisions; latStep++) {
    const lat = -90 + (latStep * 180) / latDivisions;

    for (let lngStep = 0; lngStep < lngDivisions; lngStep++) {
      const lng = -180 + (lngStep * 360) / lngDivisions;

      points.push({
        lat: lat,
        lng: lng,
        id: `${latStep}_${lngStep}`,
        altitude: gridAltitude,
      });
    }
  }

  // Fonction utilitaire pour trouver un point par coordonnées
  function findPoint(lat, lng) {
    return points.find(
      (p) => Math.abs(p.lat - lat) < 0.1 && Math.abs(p.lng - lng) < 0.1
    );
  }

  // Fonction utilitaire pour ajouter un arc
  function addArc(p1, p2) {
    if (p1 && p2) {
      arcs.push({
        startLat: p1.lat,
        startLng: p1.lng,
        endLat: p2.lat,
        endLng: p2.lng,
        altitude: gridAltitude,
      });
    }
  }

  // 1. Lignes de latitude (parallèles)
  for (let latStep = 1; latStep < latDivisions; latStep++) {
    const lat = -90 + (latStep * 180) / latDivisions;

    for (let lngStep = 0; lngStep < lngDivisions; lngStep++) {
      const lng1 = -180 + (lngStep * 360) / lngDivisions;
      const lng2 = -180 + (((lngStep + 1) % lngDivisions) * 360) / lngDivisions;

      const p1 = findPoint(lat, lng1);
      const p2 = findPoint(lat, lng2);

      addArc(p1, p2);
    }
  }

  // 2. Connexions des pôles à TOUS les points de leur latitude adjacente
  const northPole = points.find((p) => p.id === "north_pole");
  const southPole = points.find((p) => p.id === "south_pole");

  // Connecter le pôle nord à TOUS les points de la première latitude
  const firstLatitude = -90 + 180 / latDivisions;
  for (let lngStep = 0; lngStep < lngDivisions; lngStep++) {
    const lng = -180 + (lngStep * 360) / lngDivisions;
    const firstPoint = findPoint(firstLatitude, lng);
    addArc(northPole, firstPoint);
  }

  // Connecter le pôle sud à TOUS les points de la dernière latitude
  const lastLatitude = -90 + ((latDivisions - 1) * 180) / latDivisions;
  for (let lngStep = 0; lngStep < lngDivisions; lngStep++) {
    const lng = -180 + (lngStep * 360) / lngDivisions;
    const lastPoint = findPoint(lastLatitude, lng);
    addArc(lastPoint, southPole);
  }

  // 3. Lignes de longitude (méridiens) dans le corps de la grille
  for (let lngStep = 0; lngStep < lngDivisions; lngStep++) {
    const lng = -180 + (lngStep * 360) / lngDivisions;

    // Connecter les points entre eux le long du méridien
    for (let latStep = 1; latStep < latDivisions - 1; latStep++) {
      const lat1 = -90 + (latStep * 180) / latDivisions;
      const lat2 = -90 + ((latStep + 1) * 180) / latDivisions;

      const p1 = findPoint(lat1, lng);
      const p2 = findPoint(lat2, lng);

      addArc(p1, p2);
    }
  }

  // 4. Lignes diagonales pour former les triangles dans le corps de la grille
  for (let latStep = 1; latStep < latDivisions - 1; latStep++) {
    const lat1 = -90 + (latStep * 180) / latDivisions;
    const lat2 = -90 + ((latStep + 1) * 180) / latDivisions;

    for (let lngStep = 0; lngStep < lngDivisions; lngStep++) {
      const lng1 = -180 + (lngStep * 360) / lngDivisions;
      const lng2 = -180 + (((lngStep + 1) % lngDivisions) * 360) / lngDivisions;

      // Diagonales pour créer les triangles
      const p1 = findPoint(lat1, lng1);
      const p2 = findPoint(lat2, lng2);
      const p3 = findPoint(lat1, lng2);
      const p4 = findPoint(lat2, lng1);

      addArc(p1, p2); // Diagonale 1
      addArc(p3, p4); // Diagonale 2
    }
  }

  return { points, arcs };
}

// Générer les données de la grille
const gridData = generateTriangularGrid();

const world = Globe()(document.getElementById("globeViz"))
  .globeImageUrl("./img/earth-topology.png")
  .backgroundImageUrl("./img/night-sky.png")
  .width(window.innerWidth)
  .height(window.innerHeight)
  // Ajouter les points de la grille
  .pointsData(gridData.points)
  .pointColor(() => "#00ffff")
  .pointRadius(0.1)
  .pointAltitude((d) => d.altitude)
  .pointResolution(6)
  // Ajouter les arcs de la grille
  .arcsData(gridData.arcs)
  .arcColor(() => "#00ffff")
  .arcAltitude((d) => d.altitude)
  .arcStroke(0.05);

world;
