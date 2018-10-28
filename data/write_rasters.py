import os
import argparse
import subprocess

import rasterio as rio


def main():

    parser = argparse.ArgumentParser(description='Convert points to WGS84')
    parser.add_argument('--point-geojson', '-p', help='input point dataset', required=True)
    parser.add_argument('--zoom-level', '-z', help='raster zoom level', required=True)

    parser.add_argument('--output-dir', '-o', help='output directory for rasters', required=True)
    args = parser.parse_args()

    # calculate degrees per til  based on https://wiki.openstreetmap.org/wiki/Zoom_levels
    # and then divide by tile width of 256 pixels 
    degree_size = str((360. / (2**int(args.zoom_level))) / 256)
    output_wgs84 = os.path.join(args.output_dir, 'z{}.tif'.format(args.zoom_level))

    target_extent = ['-77.12677001953125', '38.800654269933005', '-76.91116333007812', '38.99997583555929']
    cmd = ['gdal_rasterize', args.point_geojson, output_wgs84, '-a', 'rasVal', '-a_nodata', '255', '-tap',
           '-tr', degree_size, degree_size, '-co', 'COMPRESS=LZW', '-ot', 'Byte', '-te'] + target_extent
    print cmd
    subprocess.check_call(cmd)


if __name__ == '__main__':
    main()
