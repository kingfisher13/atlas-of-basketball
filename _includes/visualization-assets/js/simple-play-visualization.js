/*
* Simple Play Visualization
*/

/* Global Vars */
var defensiveTeam = 'SAS';
var GLOBALS = {
  animationDuration: 40
};

var COLORS = {
  teamStyles: {
    ball: '#F5551B',
    SAS: '#000',
    POR: '#E03A3E'
  }
};

/* Intialize visualiztion */

window.onload = function () {
  TIME.init(DATA.gameData.length);
  COURT.init();
  TIME.play();
};

/* Functions */

var COURT = (function () {
  var C = {};

  var svg;
  var Lines = [];

  // Sizing
  var margin = 110;
  var courtW = 500;
  var courtH = 472;
  var svgW = courtW + margin * 2;
  var svgH = courtH + margin;

  // Basket location in pixels
  var basket = {
    x: 250,
    y: 418
  };

  var contourInterval = 0.1;

  /* Public Functions */

  // Initial Function
  C.init = function () {
    svg = d3.select('#visualization0')
      .append('svg')
      .attr('width', svgW)
      .attr('height', svgH);
    prepData();
    initElements();
  };

  // Advance to frame
  C.goto = function (frame) {
    update(DATA.gameData[frame], frame);
  };

  /* Private Functions */

  function prepData() {
    var ball = [{ lastname: 'ball', playerid: -1, team: 'ball' }];

    DATA.players.home.map(function (p) {
      p.team = DATA.teams.home.abbreviation;
      p.name = p.firstname + ' ' + p.lastname;
      p.abbr = p.firstname.slice(0, 1) + p.lastname.slice(0, 1);
      p.defending = (p.team === defensiveTeam);
    });

    DATA.players.visitor.map(function (p) {
      p.team = DATA.teams.visitor.abbreviation;
      p.name = p.firstname + ' ' + p.lastname;
      p.abbr = p.firstname.slice(0, 1) + p.lastname.slice(0, 1);
      p.defending = (p.team === defensiveTeam);
    });

    DATA.allPlayers = ball.concat(DATA.players.home, DATA.players.visitor);

    DATA.gameData.forEach(function (m, i) {
      var b = m[5][0];
      if (Lines.length === 0 || b[5] !== Lines[Lines.length - 1].type) {
        Lines.push({
          id: i,
          frameRange: [i, i],
          nodes: [[b[2] * 10, b[3] * 10]],
          type: b[5]
        });
      } else {
        var L = Lines[Lines.length - 1];
        L.frameRange[1] = i;
        L.nodes.push([b[2] * 10, b[3] * 10]);
      }
    });
  }

  function initElements() {
    // Court Image
    svg.append('g')
      .attr('class', 'court--image')
      .attr('transform', 'translate(' + margin + ', ' + (margin / 2) + ')')
      .append('svg:image')
      .attr('xlink:href', '/img/halfcourt.svg')
      .attr('width', courtW)
      .attr('height', courtH);

    // Annotations
    svg.append('g')
      .attr('class', 'annotations')
      .attr('transform', 'translate(' + margin + ', ' + (margin / 2) + ')');

    // Line and Player Elements
    var elements = svg.append('g')
      .attr('class', 'court-elements')
      .attr('transform', 'translate(' + margin + ', ' + (margin / 2) + ')');

    var lines = elements.append('g').attr('class', 'lines');

    lines.append('g')
      .append('path')
      .attr('class', 'active-line');

    // active line gradient
    lines.append('radialGradient')
        .attr('id', 'active-line--gradient')
        .attr('cx', '100%')
        .attr('cy', '100%')
        .attr('r', '100%')
      .selectAll('stop')
        .data([
          { offset: '0%', color: '#333', opacity: 1 },
          { offset: '70%', color: '#333', opacity: 1 },
          { offset: '100%', color: '#333', opacity: 0.2 }
        ])
      .enter().append('stop')
        .attr('offset', function (d) { return d.offset; })
        .attr('stop-color', function (d) { return d.color; })
        .attr('stop-opacity', function (d) { return d.opacity; });

    elements.append('g').attr('class', 'players');
  }

  function update(frame, frameIndex) {
    if (!frame) return;

    // format new player/ball data
    var updatedPlayers = [];
    DATA.allPlayers.forEach(function (p) {
      frame[5].forEach(function (f) {
        if (f[1] === p.playerid) {
          var np = _.clone(p);
          np.x = f[2] * 10; //convert into pixel value
          np.y = f[3] * 10; //convert into pixel value
          np.z = f[4] || 0; //no need for pixel value as z axis isn't displayed
          updatedPlayers.push(np);
        }
      });
    });

    // format lines
    var updatedLines = [];
    Lines.forEach(function (L) {
      if (L.frameRange[1] <= frameIndex) updatedLines.push(L);
      else if (L.frameRange[0] <= frameIndex) {
        var partialLine = _.clone(L);
        var lastNode = frameIndex - L.frameRange[0];
        partialLine.nodes = partialLine.nodes.slice(0, lastNode + 1);
        updatedLines.push(partialLine);
      };
    });

    // format annotation
    var annotation = {};
    if (frame[6]) {
      annotation.id = frameIndex;
      annotation.x = frame[6][0] * 10;
      annotation.y = frame[6][1] * 10;
      annotation.text = frame[6][2];
    }

    updateLines(updatedLines, frameIndex);
    updatePlayerLocations(updatedPlayers);
    updateAnnotations(annotation);
  }

  function updateLines(updatedLines, frameIndex) {
    var lines = d3.select('.lines').selectAll('g.old-line-group')
      .data(updatedLines, function (d) { return d.id; });

    var linePrototype = d3.line()
      .curve(d3.curveBasis)
      .x(function (d) { return d[0]; })
      .y(function (d) { return d[1]; });

    // Enter selection
    lines.enter()
      .append('g').attr('class', 'old-line-group')
      .append('path')
      .attr('class', function (d) { return 'old-line line-type--' + d.type; })
      .attr('d', function (d) { return linePrototype(d.nodes); });

    // Update Selection
    d3.selectAll('.old-line-group').select('.old-line').attr('d', function (d) { return linePrototype(d.nodes); });

    // Exit Selection
    lines.exit().remove();

    // Active line data update
    if (updatedLines.length) {
      var currentFrameIndex = frameIndex - updatedLines[updatedLines.length - 1].frameRange[0];
      var activeData = updatedLines[updatedLines.length - 1].nodes.slice(currentFrameIndex - 15 > 0 ? currentFrameIndex - 15 : 0, currentFrameIndex);
      d3.select('.active-line').style('opacity', 1).attr('d', function (d) { return linePrototype(activeData); });
    } else {
      d3.select('.active-line').style('opacity', 0);
    }
  }

  function updatePlayerLocations(updatedPlayers) {
    var players = d3.select('.players').selectAll('g')
      .data(updatedPlayers, function (d) { return d.playerid; });

    // Enter selection
    var playerGroup = players.enter().append('g')
      .attr('class', function (d) {
        return d.team === 'ball' ? 'ball' : 'player';
      })
      .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });

    playerGroup.append('circle')
      .attr('x', 0)
      .attr('y', 0)
      .attr('r', function (d) { return d.team === 'ball' ? 6 : 16; })
      .style('fill', function (d) {
        return d.team === 'ball' ? COLORS.teamStyles.ball : '#fff';
      });

    playerGroup.append('text')
      .attr('class', 'player--text')
      .text(function (d) { return d.abbr; })
      .style('fill', function (d) {
        return COLORS.teamStyles[d.team];
      });

    // Update selection
    var ball = d3.select('.ball').data()[0];

    players.transition()
      .duration(GLOBALS.animationDuration)
      .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; })
      .select('circle')
        .style('stroke-opacity', function (d) {
          return d.team === 'ball' || (distanceBetween(ball, d) < 20 && d.team !== defensiveTeam) ? 1 : 0;
        })
        .style('fill-opacity', function (d) {
          return d.team === 'ball' || (distanceBetween(ball, d) < 20 && d.team !== defensiveTeam) ? 1 : 0;
        });

    players.select('text')
      .style('fill-opacity', function (d) {
        return distanceBetween(ball, d) < 50 ? 1 : 0.5;
      });

    // Exit Selection
    players.exit().remove();

    // Bring Ball to front
    d3.select('.ball').bringToFront();
  }

  function updateAnnotations(anno) {
    if (Object.keys(anno).length === 0) return;

    var buffer = 15;

    var annos = d3.select('.annotations').selectAll('text, line')
      .data([anno], function (d) { return d.id; });

    annos.enter().append('text')
      .attr('x', function (d) { return d.x <= courtW / 2 ? -buffer : courtW + buffer; })
      .attr('y', function (d) { return d.y; })
      .text(function (d) { return d.text; })
      .attr('class', 'annotation--text')
      .style('text-anchor', function (d) { return d.x <= courtW / 2 ? 'end' : 'start'; })
      .style('opacity', 0)
      .call(wrap, margin - 10);

    annos.enter().selectAll('text')
      .transition().duration(500)
      .style('opacity', 1);

    annos.enter().append('line')
      .attr('x1', function (d) { return d.x <= courtW / 2 ? d.x - buffer : d.x + buffer; })
      .attr('x2', function (d) { return d.x <= courtW / 2 ? -5 : courtW + 5; })
      .attr('y1', function (d) { return d.y - 5; })
      .attr('y2', function (d) { return d.y - 5; })
      .attr('class', 'annotation--line')
      .style('stroke-opacity', 0)
      .transition().duration(500)
      .style('stroke-opacity', 1);

    annos.exit().interrupt().transition().duration(1000).style('opacity', 0.5).style('stroke-opacity', 0.5);
  }

  return C;
})();

/*
* Handles time and time UI
*/

var TIME = (function () {
  var T = {};
  /* Internal vars */
  var momentInterval;
  var currentFrame = 0;

  var totalFrames = 0;

  /* Public Functions */
  T.init = function (frameLength) {
    totalFrames = frameLength;
    d3.select('.play-controls').append('button').attr('class', 'play control--btn');
    d3.select('.play-controls').append('button').attr('class', 'pause control--btn');
    d3.select('.play-controls').append('button').attr('class', 'reset control--btn');
    var timeline = d3.select('.play-controls').append('div').attr('class', 'timeline');
    timeline.append('div').attr('class', 'timeline--puck');
    d3.select('.play-controls').append('p').attr('class', 'clock');

    /* UI Events */
    d3.select('.play').on('click', T.play);
    d3.select('.pause').on('click', T.pause);
    d3.select('.reset').on('click', T.reset);
    d3.select('.timeline--puck').on('mousedown', function () {
      T.pause();
      T.scrub();
    });
  };

  T.play = function () {
    d3.select('.play-controls').classed('playing', true);

    if (currentFrame === totalFrames) currentFrame = 0;
    runAnimation(currentFrame, totalFrames);
  };

  T.pause = function () {
    d3.select('.play-controls').classed('playing', false);
    clearTimeout(momentInterval);
  };

  T.reset = function () {
    currentFrame = 0;
    T.play();
  };

  T.scrub = function () {
    enableScrubbing();
  };

  /* Private Functions */

  function runAnimation(start, end) {
    clearTimeout(momentInterval);

    animationFrame();

    function animationFrame() {
      if (currentFrame === end) return;

      momentInterval = setTimeout(function () {
        COURT.goto(currentFrame);
        updateTimeline(currentFrame / totalFrames);
        d3.select('.clock').text(DATA.gameData[currentFrame][3]);

        currentFrame++;
        animationFrame();
      }, GLOBALS.animationDuration);
    }
  }

  function updateTimeline(per) {
    d3.select('.timeline--puck').style('left', Math.round(per * 100) - d3.select('.timeline--puck').node().getBoundingClientRect().width / 2 + 'px');
  }

  function enableScrubbing() {
    d3.select('body').on('mouseup mouseleave touchend', function () {
      disableScrubbing();
    });

    d3.select('body').on('mousemove touchmove', function () {
      d3.event.stopPropagation();
      var pxValue = d3.event.pageX - d3.select('.timeline').node().getBoundingClientRect().left;
      pxValue = Math.min(Math.max(pxValue, 0), d3.select('.timeline').node().getBoundingClientRect().width);

      d3.select('.timeline--puck').style('left', pxValue + 'px');

      currentFrame = Math.round(pxValue / d3.select('.timeline').node().getBoundingClientRect().width * totalFrames);
      COURT.goto(currentFrame);
    });
  }

  function disableScrubbing() {
    d3.select('body').on('mousemove mouseup mouseleave touchmove touchend', null);
  }

  return T;
})();

/*
* Spatial Functions
*/

// Can input in NBA spatial array or a d3 x,y object
function distanceBetween(a, b) {
  if (Array.isArray(a)) {
    return Math.sqrt((a[2] - b[2]) * (a[2] - b[2]) + (a[3] - b[3]) * (a[3] - b[3]));
  } else {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  }
}

/*
* DOM/SVG Functions
*/

// http://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3
d3.selection.prototype.bringToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};

// Modified from https://bl.ocks.org/mbostock/7555321
function wrap(text, width) {
  text.each(function () {
    var text = d3.select(this);
    var words = text.text().split(/\s+/).reverse();
    var word;
    var line = [];
    var lineNumber = 0;
    var lineHeight = 1.1; // ems
    var x = text.attr('x');
    var y = text.attr('y');
    var dy = parseFloat(text.attr('dy')) || 0;
    var tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em');
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + 'em').text(word);
      }
    }
  });
}

/*
* Color Functions
*/

function rgb(array) {
  return 'rgb(' + array.map(function (r) { return Math.round(r); }).join(',') + ')';
}

function rgba(array, opacity) {
  return 'rgba(' + array.map(function (r) { return Math.round(r); }).join(',') + ',' + opacity + ')';
}
