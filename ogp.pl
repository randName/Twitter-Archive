#!/usr/bin/perl
use utf8; use warnings; use RDF::RDFa::Parser;
# use Data::Dumper;

my $svcs = qr/(twitpic|yfrog|twitgoo|instagram|lockerz|twicolle|tumblr|tmblr\.co|
img\.ly|via\.me|vine\.co|path\.com|snape\.ee|pixiv|imgur|twipple|photozou)/x;

my $shorturl = qr/(bit\.ly|moe\.vg|mrbrwn\.co|ow\.ly|goo\.gl|is\.gd)/x;

my $url = $ARGV[0]; my $src;
if( $url =~ $svcs ){ $src = $1; } else { exit; }

my $rdfopts = RDF::RDFa::Parser::Config->tagsoup;

if ( $src eq 'pixiv' ){
	my $pimg = RDF::RDFa::Parser->new_from_url($url,$rdfopts)->opengraph('image');
	print `./sh/pixiv.sh $pimg`;
} elsif ( ( $src eq 'tumblr' ) or ( $src eq 'tmblr.co' ) ){
	if ( $url !~ m{(tumblr\.com)/?$} ){
		print join(" ",
		grep { $_ !~ m{assets.tumblr.com} } RDF::RDFa::Parser->new_from_url($url,$rdfopts)->opengraph('image')
		);
	}
} elsif ( ( $src eq 'imgur' ) or ( $src eq 'twitpic' ) ){
	print `./sh/ogp.sh $url`;
} else {
	print join(" ",RDF::RDFa::Parser->new_from_url($url,$rdfopts)->opengraph('image'));
}

