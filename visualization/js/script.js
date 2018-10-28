function init() {

    // initial settings on page load
    var year = 1940

    // create canvas layer place holder
    var CanvasLayer = new Canvas({
        maxZoom: 18,
	urlTemplate: 'http://localhost:8080/race-map-final/%z/%x/%y.png'
    });

    var glad = L.tileLayer.canvas({
        noWrap: true,
        attribution: 'NHGIS'
    });

    // create a UI slider for the end user to toggle the pixel range to display
    var slider = document.getElementById('slider');
    noUiSlider.create(slider, {
        start: 1940,

        //weekly timesteps
        step: 10,
        range: {
            min: 1940,
            max: 2010
        }

    });

    // When the slider value changes, update the input and span
    slider.noUiSlider.on('set', function(value, handle) {

        yearVal = parseInt(value[0])

        // update the slider display
        document.getElementById('year').innerHTML = 'Year: ' + yearVal.toString();

        // redraw the tiles without resetting
        redraw(glad)
    });

    // set bounding box for map + create it
    var southWest = L.latLng(-90, -179),
        northEast = L.latLng(90, 179),
        worldBounds = L.latLngBounds(southWest, northEast);

    var map = L.map('map', {
        noWrap: true,
        minZoom: 3,
        maxZoom: 18,
        maxBounds: worldBounds
    }).setView([38.8961, -76.9759], 12);

    // initialize the Leaflet hash plugin to add zoom/lat/lon hash to our url
    var hash = new L.Hash(map);

    // add the stamen basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', 
	       { attribution: `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; 
		              <a href="https://carto.com/attributions">CARTO</a>`,
                 subdomains: 'abcd',
         	 maxZoom: 18
	       }).addTo(map); 

    // global function to redraw the tiles
    // called when the time slider or confidence value changes
    window.redraw = function() {

        for (t in glad._tiles) {
            glad._redrawTile(glad._tiles[t]);
        }
    }

    // define the draw tile function for the canvas layer
    // this plugs in to Leaflet's canvas layer, and (presumably)
    // overrides the default drawTile method
    glad.drawTile = function(canvas, tilePoint, zoom) {

        // grab the year
	var yearVal = parseInt(slider.noUiSlider.get())

        // pass these and the confidence to the custom getTile method so we can filter GLAD
        CanvasLayer.getTile(tilePoint, zoom, canvas, yearVal);
    };

    glad.addTo(map);

}
