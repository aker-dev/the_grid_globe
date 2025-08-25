const world = Globe()(document.getElementById("globeViz"))
  .globeImageUrl("./img/earth-topology.png")
  .backgroundImageUrl("./img/night-sky.png")
  .width(window.innerWidth)
  .height(window.innerHeight);

const sampleData = [
  {
    lat: 40.7128,
    lng: -74.006,
    name: "New York",
    population: 8419000,
  },
  {
    lat: 51.5074,
    lng: -0.1278,
    name: "London",
    population: 8982000,
  },
  {
    lat: 35.6762,
    lng: 139.6503,
    name: "Tokyo",
    population: 37400000,
  },
  {
    lat: 48.8566,
    lng: 2.3522,
    name: "Paris",
    population: 2161000,
  },
  {
    lat: -33.8688,
    lng: 151.2093,
    name: "Sydney",
    population: 5312000,
  },
];

world
  .pointsData(sampleData)
  .pointAltitude("population")
  .pointRadius(0.5)
  .pointColor(() => "#ff6b6b")
  .pointLabel(
    (d) => `<b>${d.name}</b><br>Population: ${d.population.toLocaleString()}`
  );
