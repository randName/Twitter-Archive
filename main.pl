use utf8; use warnings; # use strict;
use JSON; require 'process.pl';

$extension_mode = $EM_SCRIPT_OFF;
$store->{'master'} = 'twt.bookmark';
if(open(S,$store->{'master'})){ $last_id = scalar(<S>); close(S); }

$handle = sub {
	my $ref = shift; my $ptj = get_tweet_json( $ref, 0 );
	wtf( get_tweet_json( $ref, 1 ) );

	open(P,">>",'data/archive.json') or die ("can't open $!\n");
	binmode(P,":utf8"); print P $ptj.",\n"; close(P);
#	&defaulthandle($ref);
	return 1;
};

$conclude = sub {
	if(open(S,">".$store->{'master'})){ print S $last_id; close(S); }
	&defaultconclude;
};
