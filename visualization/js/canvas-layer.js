
  function Canvas(options) {
	this.tiles = {};
	this.urlTemplate = options.urlTemplate || '';
  }
  Canvas.prototype.getTile = function(coord, zoom, canvas, year) {

	  //console.log('getting tile with min: ' + minDate + ', max: ' + maxDate + ', conf: ' + confArray)

	var url = this._getUrl.apply(this, this._getTileCoords(coord.x, coord.y, zoom));
	this._getImage(url, function(image) {
	  var canvasData = {
		  canvas: canvas,
		  image: image,
		  x: coord.x,
		  y: coord.y,
		  z: zoom
	  };

	  this._drawCanvasImage(canvasData, year);
	}.bind(this));
	return canvas;
  };
  Canvas.prototype._getImage = function(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.onload = function() {
	  var url = URL.createObjectURL(this.response);
	  var image = new Image();
	  image.onload = function() {
		image.crossOrigin = '';
		callback(image);
		URL.revokeObjectURL(url);
	  };
	  image.src = url;
	};
	xhr.open('GET', url, true);
	xhr.responseType = 'blob';
	xhr.send();
  };
  Canvas.prototype._dcColorPalette = [
	  [0, 0, 0, 0],
	  [115,178,255,255],
	  [159,212,0,255],
	  [245,190,12,255]
  ]
  Canvas.prototype._getTileId = function(x, y, z) {
	  return x + '_' + y + '_' + z;
  };
  Canvas.prototype._getZoomSteps = function(z) {
	return z - this.dataMaxZoom;
  };
  Canvas.prototype.pad = function(num) {
	  	var s = '00' + num;
			return s.substr(s.length - 3);
  };
  Canvas.prototype.decodeData = function(rgba, year) {

	var digit = 0

	switch(year) {
          case 1940: 
            digit = parseInt(this.pad(rgba[0].toString())[0])
            break

          case 1950: 
            digit = parseInt(this.pad(rgba[0].toString())[1])
            break;
	}

	return this._dcColorPalette[digit]
  };
  Canvas.prototype.filterTileImgdata = function(data, year) {

	for (var i = 0; i < data.length; i += 4) {
	  pixelInfo = this.decodeData(data.slice(i, i + 4), year)
	  
          data[i] = pixelInfo[0],
          data[i + 1] = pixelInfo[1],
          data[i + 2] = pixelInfo[2],
          data[i + 3] = pixelInfo[3]

	}
	return data;
  };
  Canvas.prototype._drawCanvasImage = function(canvasData, year) {
	"use asm";
	var canvas = canvasData.canvas,
	  ctx    = canvas.getContext('2d'),
	  image  = canvasData.image,
	  zsteps = this._getZoomSteps(canvasData.z) | 0; // force 32bit int type

	ctx.clearRect(0, 0, 256, 256);                    // this will allow us to sum up the dots when the timeline is running
	ctx.drawImage(image, 0, 0);
	var I = ctx.getImageData(0, 0, canvas.width, canvas.height);
	this.filterTileImgdata(I.data, year);
	ctx.putImageData(I, 0, 0);
  };
  Canvas.prototype._getUrl = function(x, y, z) {
	return this.urlTemplate.replace('%z', z).replace('%x', x).replace('%y', y);
  };
  Canvas.prototype._getTileCoords = function(x, y, z) {
	if (z > this.dataMaxZoom) {
	  x = Math.floor(x / (Math.pow(2, z - this.dataMaxZoom)));
	  y = Math.floor(y / (Math.pow(2, z - this.dataMaxZoom)));
	  z = this.dataMaxZoom;
	} else {
	  y = (y > Math.pow(2, z) ? y % Math.pow(2, z) : y);
	  if (x >= Math.pow(2, z)) {
		x = x % Math.pow(2, z);
	  } else if (x < 0) {
		x = Math.pow(2, z) - Math.abs(x);
	  }
	}
	return [x, y, z];
  };
