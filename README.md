Twitter Archive Display (based on Grailbird)
============================================

When you get your archive from Twitter, it only shows your tweets.

This uses the "logging mode" from TTYtter and generates the files needed to look at your whole timeline in that format.

To run: 

    ttytter -exts=main.pl -ssh -daemon -dmpause=0
    
    [ in a screen ]
    while true; do ./generate_js.sh && sleep 900; done
