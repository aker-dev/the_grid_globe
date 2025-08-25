// Fonction pour générer une grille triangulaire simple et régulière
function generateTriangularGrid() {
  const points = [];
  const arcs = [];
  const gridAltitude = 0.01;

  // Paramètres de la grille
  const latDivisions = 12; // Nombre de divisions en latitude
  const lngDivisions = 24; // Nombre de divisions en longitude

  // Ajouter les pôles
  const northPole = {
    lat: 90,
    lng: 0,
    id: "north_pole",
    altitude: gridAltitude,
  };
  const southPole = {
    lat: -90,
    lng: 0,
    id: "south_pole",
    altitude: gridAltitude,
  };

  points.push(northPole);
  points.push(southPole);

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

  // 1. CONNEXIONS DES PÔLES AUX MÉRIDIENS SEULEMENT

  // Pas de connexions ici - elles seront faites dans la section méridiens

  // 2. Lignes de latitude (parallèles)
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

  // 3. Lignes de longitude (méridiens) AVEC connexions aux pôles
  for (let lngStep = 0; lngStep < lngDivisions; lngStep++) {
    const lng = -180 + (lngStep * 360) / lngDivisions;

    // Connecter le pôle nord au premier point du méridien (latitude la plus haute)
    const firstPoint = findPoint(
      -90 + ((latDivisions - 1) * 180) / latDivisions,
      lng
    );
    if (firstPoint) {
      addArc(northPole, firstPoint);
    }

    // Connecter les points entre eux le long du méridien
    for (let latStep = 1; latStep < latDivisions - 1; latStep++) {
      const lat1 = -90 + (latStep * 180) / latDivisions;
      const lat2 = -90 + ((latStep + 1) * 180) / latDivisions;

      const p1 = findPoint(lat1, lng);
      const p2 = findPoint(lat2, lng);

      addArc(p1, p2);
    }

    // Connecter le dernier point du méridien au pôle sud (latitude la plus basse)
    const lastPoint = findPoint(-90 + (1 * 180) / latDivisions, lng);
    if (lastPoint) {
      addArc(lastPoint, southPole);
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
  .globeImageUrl("./img/earth-water.png")
  // .backgroundImageUrl("./img/night-sky.png")
  .backgroundColor("rgba(234, 233, 215, 1)") //
  .atmosphereColor("#fff") // Couleur du halo atmosphérique
  .atmosphereAltitude(0.5) // Épaisseur du halo (optionnel)
  .width(window.innerWidth)
  .height(window.innerHeight)
  // Ajouter les points de la grille
  .pointsData(gridData.points)
  .pointColor(() => "rgba(234, 233, 215, 1)")
  .pointRadius(0.4)
  .pointAltitude(0)
  .pointResolution(24)
  // Ajouter les arcs de la grille
  .arcsData(gridData.arcs)
  .arcColor(() => "rgba(234, 233, 215, 1)")
  .arcAltitude((d) => d.altitude)
  .arcStroke(0.15);

world;
