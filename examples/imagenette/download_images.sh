#!/bin/bash

dest=../../data
name=imagenette

cd $dest
curl https://s3.amazonaws.com/fast-ai-imageclas/imagenette2-160.tgz -o imagenette.tgz
tar zxvf imagenette.tgz
mv imagenette2-160 $name
rm -fr imagenette.tgz
