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
        attribution: '<a href="https://www.nhgis.org/">NHGIS</a>'
    });

    // set bounding box for map + create it
    var southWest = L.latLng(-90, -179),
        northEast = L.latLng(90, 179),
        worldBounds = L.latLngBounds(southWest, northEast);

    var map = L.map('map', {
        noWrap: true,
        minZoom: 3,
        maxZoom: 17,
        maxBounds: worldBounds,
    }).setView([38.8961, -76.9759], 12);

    // start of TimeDimension manual instantiation
    var timeDimension = new L.TimeDimension({
             period: "P10Y",
	     currentTime: -946771200000, // 1940 in unix time
             timeInterval: "1940-01-01/2010-01-01",
                 });

    // helper to share the timeDimension object between all layers
    map.timeDimension = timeDimension; 
    
    var player = new L.TimeDimension.Player({
              loop: false,
              startOver:true
            }, timeDimension);
    
    // only show year on the time slider (obviously)
    L.Control.TimeDimensionCustom = L.Control.TimeDimension.extend({
       _getDisplayDateFormat: function(date){
          return date.getFullYear() + 1;
	  }    
    });

    var timeDimensionControlOptions = {
         player: player,
         timeDimension: timeDimension,
         speedSlider: false
       };
    
    var timeDimensionControl = new L.Control.TimeDimensionCustom(timeDimensionControlOptions);
    map.addControl(timeDimensionControl);

    // listen for changes to the time slider; redraw map
    map.timeDimension.on('timeload', function(data) {
      year = new Date(data.time).getFullYear() + 1;
      redraw(glad)
    })

    // initialize the Leaflet hash plugin to add zoom/lat/lon hash to our url
    var hash = new L.Hash(map);

    // add the CARTO dark basemap
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

        // pass these and the confidence to the custom getTile method so we can filter GLAD
        CanvasLayer.getTile(tilePoint, zoom, canvas, year);
    };

    glad.addTo(map);

}
