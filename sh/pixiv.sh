#!/bin/bash

pixdir="/var/www/pixiv/"

id="$( basename $@ )"

[ ! -e ${pixdir}${id} ] && wget -q --header 'Referer: http://pixiv.net' -P ${pixdir} "$@"

echo -n "http://na.randna.me/pixiv/${id}"
