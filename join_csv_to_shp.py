import argparse
import os

import pandas as pd
import geopandas as gpd


def main():

    parser = argparse.ArgumentParser(description='Join NHGIS source CSV to tract shp')
    parser.add_argument('--tract-shp', '-s', help='path to tract shapefile', required=True)
    parser.add_argument('--population-csv', '-p', help='path to population CSV', required=True)

    parser.add_argument('--output-geojson', '-o', help='path to output polygon file', required=True)
    args = parser.parse_args()

    # read in shapefile and statistics CSV
    gdf = gpd.read_file(args.tract_shp)
    df = pd.read_csv(args.population_csv)

    # filter shp to only include DC
    gdf = gdf[gdf.NHGISST == '110']

    # project input shp to WGS84
    gdf = gdf.to_crs({'init': 'epsg:4326'})

    # filter df to only population fields
    # files formatted so all population counts after the AREANAME field
    area_name_idx = df.columns.get_loc('AREANAME')
    census_categories = df.columns[10:].tolist()

    keep_fields = ['GISJOIN'] + census_categories + ['geometry']

    # join based on GISJOIN field
    gdf = pd.merge(gdf, df, on='GISJOIN')
    gdf = gdf[keep_fields]

    if os.path.exists(args.output_geojson):
       os.remove(args.output_geojson) 

    gdf.to_file(args.output_geojson, driver='GeoJSON')


if __name__ == '__main__':
    main()

    
