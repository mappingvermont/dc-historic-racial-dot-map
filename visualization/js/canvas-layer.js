
  function Canvas(options) {
	this.tiles = {};
	this.urlTemplate = options.urlTemplate || '';
  }
  Canvas.prototype.getTile = function(coord, zoom, canvas, year) {

	var tileId = this._getTileId(coord.x, coord.y, zoom);
        var objKeys = Object.keys(this.tiles);
        for (var i = 0; i < objKeys.length; i++) {
          if (this.tiles[objKeys[i]].z !== zoom) {
	    delete this.tiles[objKeys[i]];
	    }
	  }
	if (this.tiles[tileId]) {
	  this._drawCanvasImage(this.tiles[tileId], year);
	  return this.tiles[tileId].canvas;
	}

	var url = this._getUrl.apply(this, [coord.x, coord.y, zoom]);
	this._getImage(url, function(image) {
	  var canvasData = {
		  canvas: canvas,
		  image: image,
		  x: coord.x,
		  y: coord.y,
		  z: zoom
	  };
	  
	  this._cacheTile(canvasData);
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
	  [0, 0, 0, 0], // nodata - transparent
	  [251, 54, 64, 255], // white
	  [56,153,201,255], // black
	  [167,153,183,255], // other or multiple races
	  [137,255,167,255], // asian/pacific islander
	  [255,240,124,255] // hispanic
  ]
  Canvas.prototype.pad = function(num) {
	  	var s = '00' + num;
			return s.substr(s.length - 3);
  };
  Canvas.prototype.decodeData = function(rgba, year) {

	switch(year) {
          case 1940: 
            digit = parseInt(this.pad(rgba[0].toString())[0])
            break

          case 1950: 
	    digit = parseInt(this.pad(rgba[1].toString())[0])
	    lastGreen = parseInt(this.pad(rgba[2].toString())[2])

	    if (digit == 0) {
	      if ([2, 3].includes(lastGreen)) {
		 digit = 3 }}
	    break

	  case 1960:
	    digit = parseInt(this.pad(rgba[2].toString())[0])
	    lastGreen = parseInt(this.pad(rgba[2].toString())[2])

	    if (digit == 0) {
	      if ([1, 2].includes(lastGreen)) {
		 digit = 3 }}
	    break

          case 1970: 
            digit = parseInt(this.pad(rgba[0].toString())[1])
            break
	    
          case 1980: 
            digit = parseInt(this.pad(rgba[0].toString())[2])
            break
	    
          case 1990: 
            digit = parseInt(this.pad(rgba[1].toString())[1])
            break
	      
          case 2000: 
            digit = parseInt(this.pad(rgba[1].toString())[2])
            break
	    
          case 2010: 
            digit = parseInt(this.pad(rgba[2].toString())[1])
            break

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
	  image  = canvasData.image

	ctx.clearRect(0, 0, 256, 256); // this will allow us to sum up the dots when the timeline is running
	ctx.drawImage(image, 0, 0);
	var I = ctx.getImageData(0, 0, canvas.width, canvas.height);
	this.filterTileImgdata(I.data, year);
	ctx.putImageData(I, 0, 0);
  };
  Canvas.prototype._getUrl = function(x, y, z) {
	return this.urlTemplate.replace('%z', z).replace('%x', x).replace('%y', y);
  };

  Canvas.prototype._getTileId = function(x, y, z) {
	  	  return x + '_' + y + '_' + z;
		    };

  Canvas.prototype._cacheTile = function(canvasData) {
    var tileId = this._getTileId(canvasData.x, canvasData.y, canvasData.z);
    canvasData.canvas.setAttribute('id', tileId);
    this.tiles[tileId] = canvasData;
  };
