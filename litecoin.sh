#!/usr/bin/env bash

if [ "$#" -gt 2 ]; then
  echo "Do not provide more than 2 arguments"
else
  litecoin-cli $1 $2
fi
