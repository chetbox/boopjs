#!/bin/bash

containingdir=$($(cd $(dirname "$0")); pwd)
docker build -rm -t chetbot "$containingdir"
