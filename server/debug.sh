#!/bin/bash

containingdir=$($(cd $(dirname "$0")); pwd)
docker run -ti -e NODE_ENV=debug -v "$containingdir:/opt/chetbot-server" -v "$containingdir/config:/opt/chetbot-server/config" -p 80:8000 chetbot
