// Supporting functions
//
// Function to define the color of the circle markers
function circleColor(depth) {
  // Switch color based on depth
  switch (true) {
    case depth <= 10: return "#98EE00";
    case depth <= 30: return "#D4EE00";
    case depth <= 50: return "#EECC00";
    case depth <= 70: return "#EE9C00";
    case depth <= 90: return "#EA822C";
    default: return "#EA2C2C";
  }
}

// Functions to define the size of the circle markers
function circleSize(mag) {
  return Math.pow(mag, 2) * 5000;
}

// Map functions
//
// Function to create the map
function createMap(earthquake_features, tec_plates_data) {
  // STEP 1: Init the Base Layers

  // Define variables for our tile layers.
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  })

  let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Step 2: Create the Overlay layers
  let markers = L.markerClusterGroup();
  let heatArray = [];
  let circleArray = [];

  for (let i = 0; i < earthquake_features.length; i++){
    let row = earthquake_features[i];
    let location = row.geometry;

    // create marker
    if (location) {
      // extract coord
      let coords = [location.coordinates[1], location.coordinates[0]];

      // make marker
      let marker = L.marker(coords);
      let popup = `<h3>${row.properties.place}</h3>Magnitude: ${row.properties.mag}<br/>Depth: ${location.coordinates[2]} km<br/>Time: ${new Date(row.properties.time)}<br/>Details: <a href="${row.properties.url}">USGS Event Link</a>`;  
      marker.bindPopup(popup);
      markers.addLayer(marker);

      // add to heatmap
      heatArray.push(coords);

      // Create circle
      // define marker (in this case a circle)
      let circleMarker = L.circle(coords, {
        fillOpacity: 0.5,
        color: "grey",
        fillColor: circleColor(location.coordinates[2]),
        radius: circleSize(row.properties.mag)
      }).bindPopup(popup);

      circleArray.push(circleMarker);
    }
  }

  // Create the heat layer
  let heatLayer = L.heatLayer(heatArray, {
    radius: 50,
    max: 0.02,
    blur: 20
  });

  let circleLayer = L.layerGroup(circleArray);

  // Create the tectonic plates layer
  let tec_plates_layer = L.geoJSON(tec_plates_data, {
    style: {
      "color": "#C4A484", // tan color
      "weight": 3
    }
  });

  // Step 3: BUILD the Layer Controls

  // Only one base layer can be shown at a time.
  let baseLayers = {
    Street: street,
    Topography: topo
  };

  let overlayLayers = {
    Markers: markers,
    Circles: circleLayer,
    Heatmap: heatLayer,
    "Tectonic Plates": tec_plates_layer
  }

  // Step 4: INIT the Map
  let myMap = L.map("map", {
    center: [40.7, -94.5],
    zoom: 3,
    layers: [street, markers, tec_plates_layer]
  });


  // Step 5: Add the Layer Control filter + legends as needed
  L.control.layers(baseLayers, overlayLayers).addTo(myMap);

  // Step 6: Legend
  let legend = L.control({ position: "bottomright" });
  legend.onAdd = function() {
    let div = L.DomUtil.create("div", "info legend");

    let legendInfo = "<h4>Legend</h4>"
    legendInfo += "<i style='background: #98EE00'></i>-10-10 km<br/>";
    legendInfo += "<i style='background: #D4EE00'></i>10-30  km<br/>";
    legendInfo += "<i style='background: #EECC00'></i>30-50  km<br/>";
    legendInfo += "<i style='background: #EE9C00'></i>50-70  km<br/>";
    legendInfo += "<i style='background: #EA822C'></i>70-90  km<br/>";
    legendInfo += "<i style='background: #EA2C2C'></i>90+    km";

    div.innerHTML = legendInfo;
    return div;
  };

  // Adding the legend to the map
  legend.addTo(myMap);
}

// Function to initialize the map and get the data
// 
// Function to get the data and create the map
function init() {
  // Assemble the API query URL.
  let url_earthquakes = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
  let url_tectonic_plates = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

  d3.json(url_earthquakes).then(function (earthquake_data) {
    d3.json(url_tectonic_plates).then(function (tec_plates_data) {
      let earthquake_features = earthquake_data.features;

      // make map with both datasets
      createMap(earthquake_features, tec_plates_data);
    });
  });
}

init();
