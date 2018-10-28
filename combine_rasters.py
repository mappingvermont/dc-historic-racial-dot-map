import os
import argparse

import numpy as np
import rasterio as rio


def main():

    parser = argparse.ArgumentParser(description='Combine rasters for all years into an encoded TIF')
    parser.add_argument('--year-directory', '-y', help='root directory for year dirs', required=True)
    parser.add_argument('--zoom-level', '-z', help='zoom level to combine', required=True)
    parser.add_argument('--output-tif', '-o', help='path to output point file', required=True)
    args = parser.parse_args()

    year_list = [int(x) for x in os.listdir(args.year_directory) if x.isdigit()]
    ras_dict = {}
    
    # load all our data into a year: np array dict
    for year in year_list:
        ras_dict[year], profile = read_raster(args.year_directory, year, args.zoom_level)

    # build red band first - pretty straightforward
    r = ras_dict[1940] + ras_dict[1970] + ras_dict[1980]

    # annoyingly complicated, but we need to generate band9 as
    # a combination of 1950 and 1960 given the rgb space we're working in  
    ras_dict, band_9 = create_band_9(ras_dict)

    # build blue and green bands
    b = ras_dict[1950] + ras_dict[1990] + ras_dict[2000]
    g = ras_dict[1960] + ras_dict[2010] + band_9

    # build the final 3 band tif; update raster profile accordingly
    final_tif = np.concatenate([r, g, b])
    profile.update(count=3)

    # write it!
    with rio.open(args.output_tif, 'w', **profile) as dst:
        dst.write(final_tif)


def create_band_9(ras_dict):

    # build the third digit of the blue band
    # issue is that both 1950 and 1960 have 4 values: White, Black, Other and NoData
    # but we're trying to store them in the first place of the B and G bands
    # which only can accomodate 0/1/2 values
    # so we'll use band #9 to help us determine if the pixel is nodata or other
    # for those two bands. fun.

    # create an array of zeros we can add to
    base_band = np.zeros_like(ras_dict[1940])

    # 1: nodata in 1950, other in 1960; 
    base_band = np.where(((ras_dict[1950] == 255) & (ras_dict[1960] == 0)), 1, base_band)

    # 2: other in 1950, nodata in 1960; 
    base_band = np.where(((ras_dict[1950] == 0) & (ras_dict[1960] == 255)), 2, base_band)

    # 3: other in 1950 & 1960
    base_band = np.where(((ras_dict[1950] == 0) & (ras_dict[1960] == 0)), 3, base_band)

    # now that this is done, can remove all 255 values from 1950 and 1960 rasters
    ras_dict[1950][ras_dict[1950] == 255] = 0
    ras_dict[1960][ras_dict[1960] == 255] = 0

    return ras_dict, base_band


def read_raster(year_directory, year, zoom_level):
    raster_dir = os.path.join(year_directory, str(year), 'rasters') 
    input_ras = os.path.join(raster_dir, 'z{}_webmerc.tif'.format(zoom_level))

    print 'reading in {}'.format(input_ras)

    with rio.open(input_ras) as src:
        data = src.read()
        profile = src.profile

    # translate all values of 255 (nodata) to 0
    # in the case of 1950 and 1960, we do have 0 values, 
    # so will do some external post-processing
    if year not in [1950, 1960]:
        data[data == 255] = 0

    return data, profile




if __name__ == '__main__':
    main()

