#!/bin/bash
dn="data/"

for fn in $( ls ${dn}tweets/*.json | tail -n2 ); do
	filedate="$( basename $fn .json )"
	outf="${dn}tweets/${filedate}.js"
	dmyh=( ${filedate//_/ } )
	twt_count="$( cat $fn | wc -l )"

	dline=$( grep ${outf} ${dn}index.js )
	if [ -n "$dline" ]; then
	    sed -i 's|\(.*'${outf}'[^:]*: \)[0-9]*\(.*\)|\1'${twt_count}'\2|' ${dn}index.js
	else
		dline='{ "file_name": "'${outf}'", "tweet_count": '${twt_count}
		dline=${dline}',"year":'${dmyh[0]}',"month":'${dmyh[1]#0}',"day":'${dmyh[2]#0}
		dline=${dline}',"hour":'${dmyh[3]#0}', "var_name": "tweets_'${filedate}'" },'
		sed -i '2i'"${dline}" ${dn}index.js
	fi

	echo -n "Grailbird.data.tweets_${filedate} = [" > $outf
	sed 's/\n//g' $fn >> $outf
	echo "]" >> $outf
done
echo -n "."
