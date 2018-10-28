import os
import argparse
import subprocess

import rasterio as rio


def main():

    parser = argparse.ArgumentParser(description='Convert points to WGS84 and web merc for at a specified zoom level')
    parser.add_argument('--point-geojson', '-p', help='input point dataset', required=True)
    parser.add_argument('--zoom-level', '-z', help='raster zoom level', required=True)

    parser.add_argument('--output-dir', '-o', help='output directory for rasters', required=True)
    args = parser.parse_args()

    width, height = lkp_template_dim(args.zoom_level)

    degree_size = str(360. / (2**int(args.zoom_level)))
    output_wgs84 = os.path.join(args.output_dir, 'z{}.tif'.format(args.zoom_level))

    cmd = ['gdal_rasterize', args.point_geojson, output_wgs84, '-a', 'rasVal', '-a_nodata', '255',
           '-tr', degree_size, degree_size, '-co', 'COMPRESS=LZW', '-ts', width, height, '-ot', 'Byte']
    print cmd
    subprocess.check_call(cmd)

    output_webmerc = os.path.join(args.output_dir, 'z{}_webmerc.tif'.format(args.zoom_level))
    cmd = ['gdalwarp', output_wgs84, output_webmerc, '-t_srs', 'EPSG:3857', '-co', 'COMPRESS=LZW', '-overwrite']
    print cmd
    subprocess.check_call(cmd)


def lkp_template_dim(zoom_level):

    root_dir = os.path.dirname(os.path.abspath(__file__))
    ras_template_dir = os.path.join(root_dir, 'template')

    ras_template = os.path.join(ras_template_dir, 'dc_zoom{}.tif'.format(zoom_level))
    with rio.open(ras_template) as src:
        props = src.meta

    return str(props['width']), str(props['height'])


if __name__ == '__main__':
    main()
