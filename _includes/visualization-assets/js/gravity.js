/*
* Gravity Visualization JS
*/

/* Global Constants */
const DefensiveTeam = 'SAS';
const AnimationDuration = 40;
const NBAResolution = 10; // 1 pixel equals 10 feet

const COLORS = {
  teamStyles: {
    ball: '#F5551B',
    SAS: '#000',
    POR: '#E03A3E'
  }
};

// Basket location
const Basket = {
  pixels: {
    x: 250,
    y: 418
  },
  court: [0, 0, 25, 41.8]
};

/* Intialize visualiztion */

window.onload = function () {
  DATA.rasterData = [];

  let C0 = COURT('#visualization-0', 'basic', 0).init();
  TIME('#play-controls-0', DATA.gameData.length, C0).init();

  let C1 = COURT('#visualization-1', 'offensive', 1).init();
  TIME('#play-controls-1', DATA.gameData.length, C1).init();

  let C2 = COURT('#visualization-2', 'both', 2).init();
  TIME('#play-controls-2', DATA.gameData.length, C2).init();
};

/* Functions */

let COURT = function (element, gravityLevel, id) {
  if (!element) return;
  let courtElement = d3.select(element);

  let C = {};

  let svg;
  let gravityCanvas;
  let Lines = [];

  // Sizing
  let courtW = 500;
  let courtH = 472;
  let margin = (courtElement.node().offsetWidth - courtW) / 2;
  let svgW = courtW + margin * 2;
  let svgH = courtH;

  let resolution = 10;
  let contourColorScale;
  let contourThresholds;
  let contours;
  let contourContext;
  let contourPathGenerator;

  gravityLevel = gravityLevel || 'basic';

  /* Public Functions */

  // Initial Function
  C.init = function () {
    svg = courtElement
      .append('svg')
      .attr('width', svgW)
      .attr('height', svgH);
    gravityCanvas = courtElement
      .append('canvas')
      .classed('gravity-canvas', true)
      .attr('width', courtW)
      .attr('height', courtH)
      .style('left', margin + 'px')
      .style('top', '0px');

    prepContours();
    prepData();
    initElements();

    return C;
  };

  // Advance to frame
  C.goto = function (frame) {
    update(DATA.gameData[frame], frame);
  };

  /* Private Functions */

  function prepContours() {
    // Contours
    let domain = gravityLevel === 'basic' ? [-1, 1] : [-3, 3];
    contourColorScale = d3.scaleSequential(d3.interpolateRdBu).domain(domain);
    contourThresholds = _.range(domain[0], domain[1], 0.2).map(n => +n.toFixed(2));
    contours = d3.contours().size([courtW / resolution, courtH / resolution]).thresholds(contourThresholds);

    // Paths
    contourContext = gravityCanvas.node().getContext('2d');
    contourPathGenerator = d3.geoPath(null, contourContext);
  }

  function prepData() {
    let ball = [{ lastname: 'ball', playerid: -1, team: 'ball' }];

    DATA.players.home.map((p) => {
      p.team = DATA.teams.home.abbreviation;
      p.name = p.firstname + ' ' + p.lastname;
      p.abbr = p.firstname.slice(0, 1) + p.lastname.slice(0, 1);
      p.defending = (p.team === DefensiveTeam);
    });

    DATA.players.visitor.map((p) => {
      p.team = DATA.teams.visitor.abbreviation;
      p.name = p.firstname + ' ' + p.lastname;
      p.abbr = p.firstname.slice(0, 1) + p.lastname.slice(0, 1);
      p.defending = (p.team === DefensiveTeam);
    });

    DATA.allPlayers = ball.concat(DATA.players.home, DATA.players.visitor);

    let radius = 10; // feet
    let cellsWidth = courtW / resolution;
    let cellsHeight = courtH / resolution;
    contourContext.scale(NBAResolution, NBAResolution);

    // IDW to generate gravity raster
    let consoleCount = 0;
    DATA.rasterData[id] = DATA.gameData.map(play => {
      let cells = [];
      for (let y = 0; y < cellsHeight; y++) {
        for (let x = 0; x < cellsWidth; x++) {
          let cellPosition = [0, 0, x, y]; // two 0's are to put it into NBA position array form

          let relevantPlayers = [];
          for (let k = 1; k <= play[5].length - 1; k++) {
            if (distanceBetween(play[5][k], cellPosition) < radius) relevantPlayers.push(play[5][k]);
          }

          if (relevantPlayers.length === 0) {
            cells.push(0);
            continue;
          }

          relevantPlayers = relevantPlayers.map(player => {
            let p = _.find(DATA.allPlayers, p => p.playerid === player[1]);

            if (gravityLevel === 'basic') {
              if (p.defending) player[5] = 1;
              else player[5] = -1;
            } else if (gravityLevel === 'offensive') {
              if (p.defending) player[5] = 3;
              else {
                if (!p.stats.shootingPer) player[5] = -0.1;
                else {
                  let offDistance = distanceBetween(Basket.court, player);
                  if (offDistance < 3) player[5] = p.stats.shootingPer['d0-3'] * -1 * 2;
                  else if (offDistance < 10) player[5] = p.stats.shootingPer['d3-10'] * -1 * 2;
                  else if (offDistance < 16) player[5] = p.stats.shootingPer['d10-16'] * -1 * 2;
                  else if (offDistance < 22) player[5] = p.stats.shootingPer['d16-3P'] * -1 * 2;
                  else if (offDistance < 23.75 && Math.abs(Basket.court[2] - player[2]) < 22) player[5] = p.stats.shootingPer['d16-3P'] * -1 * 2; // factors in corner 3
                  else player[5] = p.stats.shootingPer.d3P * -1 * 3;
                }
              }
            } else if (gravityLevel === 'both') {
              if (p.defending) {
                if (!p.stats.defenseDiff) player[5] = 0.1;
                else {
                  let defDistance = distanceBetween(Basket.court, player);
                  if (defDistance < 3) player[5] = p.stats.defenseDiff['d0-5'] * 2;
                  else if (defDistance < 10) player[5] = p.stats.defenseDiff['d6-9'] * 2;
                  else if (defDistance < 16) player[5] = p.stats.defenseDiff['d10-15'] * 2;
                  else if (defDistance < 22) player[5] = p.stats.defenseDiff['d16-3P'] * 2;
                  else if (defDistance < 23.75 && Math.abs(Basket.court[2] - player[2]) < 22) player[5] = p.stats.defenseDiff['d16-3P'] * 2; // factors in corner 3
                  else player[5] = p.stats.defenseDiff.d3P * 3;
                }
              } else {
                if (!p.stats.shootingPer) player[5] = -0.1;
                else {
                  let offDistance = distanceBetween(Basket.court, player);
                  if (offDistance < 3) player[5] = p.stats.shootingPer['d0-3'] * -1 * 2;
                  else if (offDistance < 10) player[5] = p.stats.shootingPer['d3-10'] * -1 * 2;
                  else if (offDistance < 16) player[5] = p.stats.shootingPer['d10-16'] * -1 * 2;
                  else if (offDistance < 22) player[5] = p.stats.shootingPer['d16-3P'] * -1 * 2;
                  else if (offDistance < 23.75 && Math.abs(Basket.court[2] - player[2]) < 22) player[5] = p.stats.shootingPer['d16-3P'] * -1 * 2; // factors in corner 3
                  else player[5] = p.stats.shootingPer.d3P * -1 * 3;
                }
              }
            }

            return player;
          });

          relevantPlayers = addEdgePoints(relevantPlayers);

          let numerator = relevantPlayers.reduce((memo, p) => memo + (p[5] / Math.pow(distanceBetween(p, cellPosition), 2)), 0);
          let denominator = relevantPlayers.reduce((memo, p) => memo + (1 / Math.pow(distanceBetween(p, cellPosition), 2)), 0);
          cells.push(numerator / denominator);
        }
      }

      return cells;
    });
  }

  // Adds weighting points around the court so that we don't get double-peak contours
  function addEdgePoints(arr) {
    arr.push([0, 0, -2, -2, 0, 0]); // top left
    arr.push([0, 0, 25, -2, 0, 0]); // top mid
    arr.push([0, 0, 52, -2, 0, 0]); // top right
    arr.push([0, 0, 25, 50, 0, 0]); // bottom mid

    return arr;
  }

  function initElements() {
    // Court Image
    svg.append('g')
      .attr('class', 'court--image')
      .attr('transform', 'translate(' + margin + ', 0)')
      .append('svg:image')
      .attr('xlink:href', '/img/halfcourt.svg')
      .attr('width', courtW)
      .attr('height', courtH);

    // Player Elements
    let elements = svg.append('g')
      .attr('class', 'court-elements')
      .attr('transform', 'translate(' + margin + ', 0)');

    elements.append('g').attr('class', 'players');
  }

  function update(frame, frameIndex) {
    if (!frame) return;

    // format new player/ball data
    let updatedPlayers = [];
    DATA.allPlayers.forEach((p) => {
      frame[5].forEach((f) => {
        if (f[1] === p.playerid) {
          let np = _.clone(p);
          np.x = f[2] * NBAResolution; //convert into pixel value
          np.y = f[3] * NBAResolution; //convert into pixel value
          np.z = f[4] || 0; //no need for pixel value as z axis isn't displayed
          updatedPlayers.push(np);
        }
      });
    });

    updatePlayerLocations(updatedPlayers);
    contours(DATA.rasterData[id][frameIndex]).forEach(drawContours);
  }

  function updatePlayerLocations(updatedPlayers) {
    let players = courtElement.select('.players').selectAll('g')
      .data(updatedPlayers, d => d.playerid);

    // Enter selection
    let playerGroup = players.enter().append('g')
      .attr('class', d => d.team === 'ball' ? 'ball' : 'player')
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');

    playerGroup.append('circle')
      .attr('x', 0)
      .attr('y', 0)
      .attr('r', d => d.team === 'ball' ? 6 : 16)
      .style('fill', d => d.team === 'ball' ? COLORS.teamStyles.ball : 'none')
      .style('stroke-opacity', 0);

    playerGroup.append('text')
      .attr('class', 'player--text')
      .text(d => d.abbr)
      .style('fill', d => COLORS.teamStyles[d.team]);

    // Update selection
    let ball = courtElement.select('.ball').data()[0];

    players.transition()
      .duration(AnimationDuration)
      .attr('transform',  d => 'translate(' + d.x + ',' + d.y + ')');

    // Exit Selection
    players.exit().remove();

    // Bring Ball to front
    courtElement.select('.ball').bringToFront();
  }

  function drawContours(geometry) {
    contourContext.beginPath();
    contourPathGenerator(geometry);
    contourContext.fillStyle = contourColorScale(geometry.value);
    contourContext.fill();
  }

  return C;
};

/*
* Handles time and time UI
*/

let TIME = function (el, totalFrames, C) {
  if (!el) return;

  let T = {};

  /* Internal vars */
  let timeElement = d3.select(el);
  let momentInterval;
  let currentFrame = 0;

  totalFrames = totalFrames || 0;

  /* Public Functions */
  T.init = function () {
    timeElement.append('button').attr('class', 'play control--btn');
    timeElement.append('button').attr('class', 'pause control--btn');
    timeElement.append('button').attr('class', 'reset control--btn');
    let timeline = timeElement.append('div').attr('class', 'timeline');
    timeline.append('div').attr('class', 'timeline--puck');
    timeElement.append('p').attr('class', 'clock');

    /* UI Events */
    timeElement.select('.play').on('click', T.play);
    timeElement.select('.pause').on('click', T.pause);
    timeElement.select('.reset').on('click', T.reset);
    timeElement.select('.timeline--puck').on('mousedown', () => {
      T.pause();
      T.scrub();
    });
  };

  T.play = function () {
    timeElement.classed('playing', true);

    if (currentFrame === totalFrames) currentFrame = 0;
    runAnimation(currentFrame, totalFrames);
  };

  T.pause = function () {
    timeElement.classed('playing', false);
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
        C.goto(currentFrame);
        updateTimeline(currentFrame / totalFrames);
        timeElement.select('.clock').text(DATA.gameData[currentFrame][3]);

        currentFrame++;
        animationFrame();
      }, AnimationDuration);
    }
  }

  function updateTimeline(per) {
    timeElement.select('.timeline--puck').style('left', Math.round(per * 100) - timeElement.select('.timeline--puck').node().getBoundingClientRect().width / 2 + 'px');
  }

  function enableScrubbing() {
    d3.select('body').on('mouseup mouseleave touchend', () => disableScrubbing());

    d3.select('body').on('mousemove touchmove', function () {
      d3.event.stopPropagation();
      let pxValue = d3.event.pageX - timeElement.select('.timeline').node().getBoundingClientRect().left;
      pxValue = Math.min(Math.max(pxValue, 0), timeElement.select('.timeline').node().getBoundingClientRect().width);

      timeElement.select('.timeline--puck').style('left', pxValue + 'px');

      currentFrame = Math.round(pxValue / timeElement.select('.timeline').node().getBoundingClientRect().width * totalFrames);
      C.goto(currentFrame);
    });
  }

  function disableScrubbing() {
    d3.select('body').on('mousemove mouseup mouseleave touchmove touchend', null);
  }

  return T;
};

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

/*
* Color Functions
*/

function rgb(array) {
  return 'rgb(' + array.map(r => Math.round(r)).join(',') + ')';
}

function rgba(array, opacity) {
  return 'rgba(' + array.map(r => Math.round(r)).join(',') + ',' + opacity + ')';
}
