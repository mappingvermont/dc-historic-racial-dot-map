import json
import random
import argparse

import fiona
from shapely.geometry import Point, shape, mapping


def main():

    parser = argparse.ArgumentParser(description='Randomly distribute population given NHGIS districts and pop counts')
    parser.add_argument('--tract-geojson', '-i', help='path to tract shapefile', required=True)
    parser.add_argument('--field-lookup', '-f', help='JSON file to lookup column ID to race id number', required=True)
    parser.add_argument('--output-geojson', '-o', help='path to output point file', required=True)
    args = parser.parse_args()


    with open(args.field_lookup) as input_json:
        field_lkp = json.load(input_json)

    print field_lkp
    output_points = []

    with fiona.open(args.tract_geojson) as src:
        for feat in src:
            geom = shape(feat['geometry'])

            print feat['properties']

            for cat in field_lkp.keys():
                cat_population = feat['properties'][cat]
                cat_list = gen_rand_points(geom, cat_population, cat, field_lkp)

                output_points.extend(cat_list)

    point_list_to_geojson(output_points, args.output_geojson)


def point_list_to_geojson(point_list, out_file):

    fc = {"type": "FeatureCollection", "features": point_list}

    with open(out_file, 'w') as thefile:
        json.dump(fc, thefile)


def get_random_point_in_polygon(poly):
     # https://gis.stackexchange.com/a/73230/30899

     (minx, miny, maxx, maxy) = poly.bounds
     while True:
         p = Point(random.uniform(minx, maxx), random.uniform(miny, maxy))
         if poly.contains(p):
             return p


def gen_rand_points(poly, num_points, field_id, field_lkp):

    point_list = []

    census_name = field_lkp[field_id]['censusName']
    ras_val = field_lkp[field_id]['rasVal']

    feature_template = {"type": "Feature", "properties": {
                          "censusName": census_name, "rasVal": ras_val }}

    for i in range(0, int(num_points)):
        pt_geom = get_random_point_in_polygon(poly)

        feat = feature_template.copy()
        feat['geometry'] = mapping(pt_geom)

        point_list.append(feat)

    return point_list


    


if __name__ == '__main__':
    main()

    
