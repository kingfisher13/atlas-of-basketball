---
layout: post
title:  "Basic Music"
date:   2017-01-13 15:58:46 -0600
tags: music, open3
externals:
- d3
- underscore
js:
- basic-music.js
css:
- basic-music.css
json:
- 0021500156.halfcourt.json
---

Basketball is often compared to music, especially Jazz. There are set plays, but the game is played by improvising off of those plays. Taking what the defense gives you. Imposing your vision on the proceedings. So let's try to visualize a play as a music score.

Movement is incredibly important in Basketball. Obviously. So the first step in our musical score is figuring out how to represent movement. I originally tried to draw a wavy line for movement and a straight line for when a player was motionless. The problem is that the SportVU data is very precise and determining when a player is standing still becomes a guessing game. *Are they moving if a movement of 0.3 feet is registered? How about 0.4? Do jab steps count? Aren't NBA players basically always moving anyways?*

So I tried something else. Keep the bar look of sheet music, but change up the background color based on movement - using the team's primary color as the gradient to spice things up a tad.

The following visualizations are drawn from the same play as [the previous post]({% post_url 2017-01-05-simple-play-visualization %}) if you want to see the actual play. The darker the color, the faster the player (or ball) is moving.

<div class="visualization" id="visualization0"></div>

So what does this tell us exactly? Well, not much in the context of a single play. You can see [Patty Mills](http://www.basketball-reference.com/players/m/millspa02.html) and [Boris Diaw](http://www.basketball-reference.com/players/d/diawbo01.html) reacting to [CJ McCollum's](http://www.basketball-reference.com/players/m/mccolcj01.html) drive, while the rest of the players stand still. You can see [Rasual Butler's](http://www.basketball-reference.com/players/b/butlera01.html) movement right before the shot. But none of this gives an answer to why the open 3. However, stats rarely tell you anything in isolation. Let's try this for the entire game and see what we get. *Next time on Open 3 Visualizations...*
