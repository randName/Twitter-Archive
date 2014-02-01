#!/bin/bash

page="$( wget -qO - "$@" )"
out=$( grep '"twitter:image"' <<<"$page" | sed 's|.*="\(http[^"]*\).*|\1|' )
#if [ -z "$out" ]; then
#	out=$( grep '"og:image"' <<<"$page" | sed 's|.*="\(http[^"]*\).*|\1|' )
#fi
echo -n $out
