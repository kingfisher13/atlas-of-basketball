---
layout: post
title:  "Game Music"
date:   2017-01-20 15:58:46 -0600
tags: music, open3
externals:
- d3
- underscore
js:
- game-music.js
css:
- game-music.css
json:
- 0021500156.threes.json
---

So here is the sheet music for player movement throughout the game. See the previous [two]({% post_url 2017-01-05-simple-play-visualization %}) [posts]({% post_url 2017-01-13-basic-music %}) for information about the game and sheet visualization respectively.

Couple of things to note about this visualization.
- The darker the bar, the faster the player is moving - same as before.
- Each sheet of music is a single play, and only describes the person who took the shot.
- The plays are in game order by team.
- The taller sections are when the player had possession of the ball (defined as within 5ft of the ball).
- Hover over a sheet to see the elapsed time at that point.
- The data is messy. There are single frame data artifacts (set to white). There are plays that go well beyond 24 seconds. But I don't think these detract too much from the story this visualization tells.

<div class="visualization" id="visualization0"></div>
<div class="probe">
  <p>Seconds elapsed: <span class="probe--seconds"></span></p>
</div>

So what can we deduce from this?

There doesn't seem to be a stark pattern here. The Spurs don't seem to have anybody like [Damian Lillard](http://www.basketball-reference.com/players/l/lillada01.html), who shoots after dribbling and moving a bunch. San Antonio seems to end up with more catch and shoot threes - a potential illustration of their motion offense compared to Portland's more drive and kick offense; though a more in depth analysis across the season would be in order before we could say that this visualization illustrates this for certain.

This is a potentially interesting way of looking at plays. By reducing the dimensions, we were able to tease out some information about the movement of the players that wouldn't have been readily noticeable by watching either video or an animation.
