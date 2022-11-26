/*eslint-disable*/

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoib2tpa2lvbGFubGVzaSIsImEiOiJjbGFiNzY3ZzUwYnlhM29uMDZ4aWgxbm16In0.mlAkpZrGvpY74vI9gBwkGw';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/okikiolanlesi/clabco04k000914o38j2snru9',
    //   center map to a location
    //   center: [-118.113491, 34.111745],
    //    // zoom makes the map zoomed in
    //   zoom: 10,
    //scrollZoom makes the map zoom in and out when the user scrolls
    scrollZoom: false,
    //   //makes the map look like a picture and not a map if interactive is set to false
    //   interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 150, left: 100, right: 100 },
  });
};
