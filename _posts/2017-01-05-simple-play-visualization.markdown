---
layout: post
title:  "Simple Play Visualization"
date:   2017-01-05 15:58:46 -0600
tags: play, spatial, open3
externals:
- d3
- d3-queue
- underscore
js:
- simple-play-visualization.js
css:
- simple-play-visualization.css
json:
- 0021500156.halfcourt.json
---

A super simple visualization of a play between the San Antonio Spurs and the Portland Trailblazers. The play took place on November 16th, 2015. It resulted in a semi-open 3pt shot for [Maurice Harkless](http://www.basketball-reference.com/players/h/harklma01.html).

<div class="visualization" id="visualization0"></div>
<div class="play-controls"></div>

I want to start to explore visualizations that can help us understand when and why open 3pt shots occur. In this particular play, the visualization helps to show most of each step of the process. First [Patty Mills](http://www.basketball-reference.com/players/m/millspa02.html) is caught on the pick and struggles to catch back up to [CJ McCollum](http://www.basketball-reference.com/players/m/mccolcj01.html). [Boris Diaw](http://www.basketball-reference.com/players/d/diawbo01.html) has to help contain CJ but can't stop him. Boris' man, [Noah Vonleh](http://www.basketball-reference.com/players/v/vonleno01.html) pops which forces [Rasual Butler](http://www.basketball-reference.com/players/b/butlera01.html) to cover 2 men, Noah and Butler's original man, [Maurice Harkless](http://www.basketball-reference.com/players/h/harklma01.html). CJ passes the ball to Harkless who makes the open 3.

What is harder to see on the visualization though is the small details that allowed that sequence to happen. [Watch the video of the same play](http://on.nba.com/2gukf6g). I can see two small things that happened that led to this sequence. Patty Mills leans left right as the Vonleh pick is coming up on his right. This leaves him slightly off-balance and he is unable to catch back up to CJ afterwards. This is a fairly small liability for the defense on the whole. But then Rasual Butler gets caught hesitating between guarding Vonleh and Harkless. Instead of staying between the two, he chooses Vonleh to guard before the pass is thrown, and CJ hits Harkless for the open 3.

Patty Mills' leaning left is visible is the visualization but Butler's hesitating isn't. This shows us the limitations of any basketball visualization, they can't capture everything and some of the things they will leave out are going to be mighty important.
