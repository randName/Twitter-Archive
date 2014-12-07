{
	my @userk = qw(id id_str name screen_name profile_image_url_https);
	my @tweetk = qw(text created_at in_reply_to_screen_name source);
	foreach( qw(id in_reply_to_status_id in_reply_to_user_id) ){push(@tweetk,($_,$_.'_str'));}

	sub get_tweet_json {
		my $ref = shift; my $u_media = shift;

		my %twt; @twt{@tweetk} = @{$ref}{@tweetk};
		foreach(@{$ref->{'entities'}->{'media'}}){
			$twt{'text'} =~ s/\Q$_->{'media_url'}/$_->{'url'}/;
			$twt{'text'} =~ s/\Q$_->{'media_url_https'}/$_->{'url'}/;
		}
		foreach(@{$ref->{'entities'}->{'urls'}}){
			$twt{'text'} =~ s/\Q$_->{'expanded_url'}/$_->{'url'}/;
		}

		my %usr; @usr{@userk} = @{$ref->{'user'}}{@userk}; my $uj = encode_json( \%usr );
		foreach( qw(protected verified) ){
			my $r = '"'.$_.'":'.$ref->{'user'}->{$_}; $uj =~ s/}$/,$r}/;
		}

		if ( exists $ref->{'extended_entities'} ){
			@{$ref->{'entities'}->{'media'}} = @{$ref->{'extended_entities'}->{'media'}};
		}

		my $ej = entity_handler( $ref->{'entities'}, $u_media );
		my $tj = encode_json( \%twt ); $tj =~ s/}$/,"entities":$ej,"user":$uj}/;

		$tj =~ s/\\\\\//\//g; $tj =~ s/\\\\(\w)/\\\1/g;

		if( $ref->{'retweeted_status'}->{'id'} ){
			my $rt = get_tweet_json( $ref->{'retweeted_status'}, $u_media );
			$tj =~ s/}$/,"retweeted_status":$rt}/;
		}

		return $tj;
	}

	my @etk = qw( urls hashtags user_mentions );
	my @mdk = qw( display_url expanded_url url indices );

	sub entity_handler {
		my $ref = shift; my $u_media = shift;

		if ( ! $u_media ){ return encode_json( $ref ); }

		my $mj = encode_json( $ref->{'media'} );

		foreach(@{$ref->{'urls'}}){
			my $murl = '';

			if ( $_->{'expanded_url'} =~ /\.(gif|png|jpg|jpeg)$/i ){
				$murl = $_->{'expanded_url'};
			} else {
				my $eurl = &descape( $_->{'expanded_url'} );
				$murl = `./ogp.pl "$eurl"`;
			}

			if ( $murl ne '' ){
				my %nm; @nm{@mdk} = @{$_}{@mdk}; my $tm = encode_json( \%nm );
				$tm =~ s/}$/,"media_url":"$murl","type":"photo"}/;
				$mj =~ s/\]$/$tm,\]/; $_->{'url'} = '';
			}
		}

		@{$ref->{'urls'}} = grep { $_->{'url'} } @{$ref->{'urls'}};

		my %etnm; @etnm{@etk} = @{$ref}{@etk};
		my $ej = encode_json( \%etnm ); $ej =~ s/}$/,"media":$mj}/;

		$ej =~ s/}{/},{/;

		return $ej;
	}

	sub wtf {
		my $tj = shift; my $filetime = strftime("%Y_%m_%d_%H",localtime(time));
		open(T,">>",'data/tweets/'.$filetime.'.json') || die("can't open: $!\n");
		binmode(T,":utf8"); print T $tj.",\n"; close(T);
	}
}
1;
