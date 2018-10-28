# data processing

### Source

This population counts by tract / block, in addition to the GIS boundaries themselves come 
from the [National Historical GIS](https://www.nhgis.org/). 

Finding / downloading / processing census data is never easy, here's my current process:
1. Go to https://data2.nhgis.org/main
2. Apply a year filter (e.g. 1980)
3. Apply a geographic filter (if 1980 and before census tract, otherwise block)
4. Apply a dataset filter- we only want decennial census data; exclude all ACS
5. Ctrl+f for Race; if 1980 or after, look for a table called Spanish Origin and Race (or similar)
6. Download the source table and accompanying boundary shapefile

### Preprocessing
1. Unzip and save to the appropriate data/years/{year} folder.
2. Convert shapefile to geojson and project to WGS84 using ogr2ogr (optionally filter by state as well)
3. Use the included NHGIS codebook to create a `lkp.json` file that crosswalks the NHGIS categories to our categories

### Plot random points and write to raster
Using 1940 as an example:
1. Join the CSV to the boundary geojson:

`python join_csv_to_shp.py --tract-geojson years/1940/source/US_tract_1940.geojson --population-csv years/1940/source/nhgis0020_ds76_1940_tract.csv --output-geojson years/1940/polygons/joined.geojson`

2. Place the approriate number of random points (categorized by race) in each polygon

`python generate_points.py --tract-geojson years/1940/polygons/joined.geojson --field-lookup years/1940/source/lkp.json --output-geojson years/1940/points/random.geojson`

3. Write various raster levels

`python write_rasters.py --point-geojson years/1940/points/random.geojson --zoom-level 14 --output-dir years/1940/rasters/`

4. Once all years are done for this zoom level, write the combined zoom level raster

` python combine_rasters.py --year-directory years/ --zoom-level 15 --output-tif final/z15.tif `

### Tiles

See the `/tiles` directory for info about running tilestache locally to view the final TIFs in the web application.

