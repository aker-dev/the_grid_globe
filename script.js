// Fonction pour générer une grille triangulaire géodésique complète
function generateTriangularGrid() {
  const points = [];
  const arcs = [];

  // Paramètres de la grille
  const divisions = 20; // Augmenté pour une grille plus dense
  const gridAltitude = 0.05; // Altitude de la grille au-dessus du globe

  // Ajouter les pôles nord et sud
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

  // Générer les cercles de latitude (excluant les pôles)
  for (let latStep = 1; latStep < divisions; latStep++) {
    const lat = -90 + (latStep * 180) / divisions;
    const numLongPoints = Math.max(
      6,
      Math.round(Math.sin((latStep * Math.PI) / divisions) * divisions * 2)
    );

    for (let i = 0; i < numLongPoints; i++) {
      const lng = (i / numLongPoints) * 360 - 180;
      points.push({
        lat: lat,
        lng: lng,
        id: `${lat}_${lng}`,
        altitude: gridAltitude,
      });
    }
  }

  // Fonction pour trouver les points les plus proches
  function findNearestPoints(point, allPoints, maxDistance = 25) {
    return allPoints.filter((otherPoint) => {
      if (point.id === otherPoint.id) return false;

      const latDiff = point.lat - otherPoint.lat;
      const lngDiff = point.lng - otherPoint.lng;

      // Gérer le wraparound de longitude
      const adjustedLngDiff = Math.min(
        Math.abs(lngDiff),
        360 - Math.abs(lngDiff)
      );

      const distance = Math.sqrt(
        latDiff * latDiff + adjustedLngDiff * adjustedLngDiff
      );
      return distance <= maxDistance;
    });
  }

  // Générer les connexions pour former la grille
  points.forEach((point) => {
    const nearbyPoints = findNearestPoints(point, points, 20);

    // Connecter aux points les plus proches pour former une grille triangulaire
    nearbyPoints.forEach((nearPoint) => {
      // Éviter les doublons en utilisant un tri consistant
      if (point.id < nearPoint.id) {
        arcs.push({
          startLat: point.lat,
          startLng: point.lng,
          endLat: nearPoint.lat,
          endLng: nearPoint.lng,
          altitude: gridAltitude,
        });
      }
    });
  });

  // Ajouter des connexions méridiennes (lignes nord-sud)
  for (let lng = -180; lng < 180; lng += 360 / divisions) {
    const meridianPoints = points
      .filter(
        (p) =>
          Math.abs(p.lng - lng) < 5 || Math.abs(Math.abs(p.lng - lng) - 360) < 5
      )
      .sort((a, b) => b.lat - a.lat);

    for (let i = 0; i < meridianPoints.length - 1; i++) {
      arcs.push({
        startLat: meridianPoints[i].lat,
        startLng: meridianPoints[i].lng,
        endLat: meridianPoints[i + 1].lat,
        endLng: meridianPoints[i + 1].lng,
        altitude: gridAltitude,
      });
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
  .arcStroke(0.05)
  .arcDashLength(0.1)
  .arcDashGap(0.05)
  .arcDashAnimateTime(2000);

world;
