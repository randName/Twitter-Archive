<!DOCTYPE html>
<?php $kindle = strpos($_SERVER['HTTP_USER_AGENT'], 'Kindle'); ?> 
<html lang="en">
 <head>
  <meta charset="utf-8"><meta http-equiv="imagetoolbar" content="no"><title>timeline</title>
  <link href="https://si0.twimg.com/favicons/favicon.ico" rel="shortcut icon" type="image/x-icon">
  <link href="lib/bootstrap/bootstrap.min.css" rel="stylesheet">
  <link href="lib/twt/twt.min.css" rel="stylesheet">
<?php
 if( $kindle )
 {
  echo '<link href="application.kindle.css" rel="stylesheet">';
 } else {
  echo '<link href="application.min.css" rel="stylesheet">';
 }
?>
 </head>
 <body>
<?php
 if( ! $kindle )
 {
  echo '
  <div class="navbar navbar-fixed-top">
   <div class="navbar-inner">
    <div class="container">
     <a class="icon-sprite icon-bird brand" href=""></a><ul id="primary-nav" class="nav"></ul>
    </div>
   </div>
  </div>
 ';
 }
?>
  <a name="top"></a>
  <div class="container">
   <div class="row">
    <div class="tweets-header-container">
     <div class="tweets-header">
      <h2 class="tweets-header-title truncated"></h2>
      <a class="nav-arrow nav-arrow-left" data-idx="" rel="tooltip" data-placement="top">
       <span class="hidden-elements">Previous day</span>
      </a>
      <a class="nav-arrow nav-arrow-right" data-idx="" rel="tooltip" data-placement="top">
       <span class="hidden-elements">Next day</span>
      </a>
     </div>
    </div>
    <div class="contents span7"><div class="tweets"></div></div>
<?php
 if( $kindle )
 {
  echo /*'
     <div class="tweets-footer">
      <a class="nav-arrow nav-arrow-left" data-idx="" rel="tooltip" data-placement="top">
       <span class="hidden-elements">Previous day</span>
      </a>
      <a class="nav-arrow nav-arrow-right" data-idx="" rel="tooltip" data-placement="top">
       <span class="hidden-elements">Next day</span>
      </a>
     </div>
  */'<a href="#top">TOP</a>';
 } else {
  echo '
    <div class="sidebar span4 offset7">
     <div class="sidebar-nav"><div class="content-nav"></div></div>
    </div>
  ';
 }
?>
   </div>
  </div>

  <script src="lib/jquery/jquery-1.8.3.min.js"></script>
  <script src="lib/underscore/underscore-min.js"></script>
  <script src="lib/bootstrap/bootstrap-tooltip.js"></script>  
  <script src="lib/bootstrap/bootstrap-transition.js"></script>
  <script src="lib/twt/twt.all.min.js"></script>
  <script src="lib/hogan/hogan-2.0.0.min.js"></script>
  <script src="application.min.js" charset="utf-8"></script>
  <script src="data/index.js" charset="utf-8"></script>
 </body>
</html>
