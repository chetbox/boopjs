#!/bin/bash

containingdir=$($(cd $(dirname "$0")); pwd)
docker build --rm -t "chetbot-$(git symbolic-ref --short HEAD)" "$containingdir"

