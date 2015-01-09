#!/usr/bin/python

import re, sys, os
import urllib2
from bs4 import BeautifulSoup

def ogimage(doc):
	ogs = doc.html.head.find_all(property='og:image')
	return [ og[u'content'] for og in ogs if og.has_attr(u'content') ]

if len(sys.argv) < 2 :
	sys.stderr.write('No URL?\n')
	exit(1)

class RedirectHandler(urllib2.HTTPRedirectHandler):
	max_repeats = 3
	max_redirections = 4

opener = urllib2.build_opener(RedirectHandler())

url = sys.argv[1]
html = urllib2.urlopen(url)
doc = BeautifulSoup(html)

output = ' '.join(ogimage(doc))

twt = {}
ogs = doc.html.head.find_all(attrs={'name':re.compile(r'^twitter')})
for og in ogs:
	if og.has_attr(u'content'):
		twt[og[u'name'][8:]]=og[u'content']

if 'card' in twt:
	if twt['card'] == 'photo':
		output = twt['image']
	elif twt['card'] == 'gallery':
		output = ' '.join([ v for k,v in twt.iteritems() if k.startswith('image') ])
	# elif twt['card'] == 'player':
	#	output = twt['player:stream']
	# else:
		# twt['image'] twt['site'] twt['title'] twt['description'] 

if 'site' in twt:
	if twt['site'] == 'tumblr':
		images = ogimage(doc)
		if not 'assets.tumblr.com' in images[0]:
			output = ' '.join(images)
if 'pixiv' in url:
	fn = os.path.basename(output)
	if not os.path.exists('/var/www/pixiv/'+fn):
		req = urllib2.Request(output)
		req.add_header('Referer', 'http://pixiv.net/')
		image = urllib2.urlopen(req)
		with open('/var/www/pixiv/'+fn,'wb') as imgf:
			imgf.write(image.read())
	output = 'http://na.randna.me/pixiv/'+fn

if output:
	sys.stdout.write(output)
