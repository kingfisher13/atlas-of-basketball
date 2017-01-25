/*
* Basic Music Visualization
*/

let svg;
let svgW = 0;
let sheetH = 80;
let barHPoss = 30;
let barHOffball = 20;
const PERIOD = 0.04; // time per frame in seconds
const MAXSPEED = 30; // 15 is arbitrary max speed
let maxPlayLength = 0;

let players = {};

let COLORS = {
  ball: '#F5551B',
  SAS: '#061922',
  POR: '#E03A3E'
};

window.onload = function () {
  svgW = d3.select('.visualization').node().getBoundingClientRect().width;
  prepPlayerNames();
  initElements();
  calcDeltas();
  drawLines();
};

function prepPlayerNames() {
  players['-1'] = {
    name: 'Ball',
    color: COLORS.ball
  };

  for (side in DATA) {
    DATA[side].players.forEach(function (p) {
      players[p.playerid] = {
        name: p.firstname + ' ' + p.lastname,
        color: COLORS[DATA[side].abbreviation]
      };
    });
  }
}

function initElements() {
  svg = d3.select('#visualization0')
    .append('svg')
    .attr('class', 'svg')
    .attr('width', svgW);
}

function calcDeltas() {
  console.log(DATA);
  for (side in DATA) {
    DATA[side].made3sByPlayer = [];
    DATA[side].made3s.forEach(function (play, index) {
      let pid = play[play.length - 1][6].off.player_id;
      let deltas = calcDelta(play, pid);
      deltas[deltas.length - 1] = MAXSPEED * PERIOD * 100; // end of play

      if (deltas[pid].length > maxPlayLength) maxPlayLength = deltas[pid].length;

      DATA[side].made3sByPlayer.push({
        player: pid,
        deltas: deltas[pid],
        ballPoss: deltas.ballPoss
      });
    });
  }

  for (side in DATA) {
    DATA[side].missed3sByPlayer = [];
    DATA[side].missed3s.forEach(function (play, index) {
      let pid = play[play.length - 1][6].off.player_id;
      let deltas = calcDelta(play, pid);
      deltas[deltas.length - 1] = MAXSPEED * PERIOD * 100; // end of play

      if (deltas[pid].length > maxPlayLength) maxPlayLength = deltas[pid].length;

      DATA[side].missed3sByPlayer.push({
        player: pid,
        deltas: deltas[pid],
        ballPoss: deltas.ballPoss
      });
    });
  }
}

function calcDelta(play, pid) {
  let deltas = {
    ballPoss: []
  };
  deltas[pid] = [];

  let playerIndex = _.findIndex(play[0][5], function (player) {
    return player[1] === pid;
  });

  play.forEach(function (moment, i) {
    if (i === 0) return; // we're looking for deltas, so we can't start with the first value
    if (moment[5].length !== 11 || play[i - 1][5].length !== 11) return; // make sure we have all the data for each delta
    if (!moment[5][playerIndex]) return;

    deltas[pid].push(distanceBetween(moment[5][playerIndex], play[i - 1][5][playerIndex]));
    deltas.ballPoss.push(distanceBetween(moment[5][playerIndex], moment[5][0]) < 5 ? true : false);
  });

  return deltas;
}

function drawLines() {
  // Calc total height of svg based on amount of players in viz
  let uniqPlays = _.chain(DATA)
    .map(function (d) {
      return _.pick(d, 'made3sByPlayer', 'missed3sByPlayer');
    })
    .map(function (d) {
      return _.values(d);
    })
    .flatten()
    .map(function (d) {
      return d.player;
    })
    .value();

  svg.attr('height', (sheetH * uniqPlays.length) + 40);

  let barW = Math.floor(svgW / maxPlayLength) || 1;
  let index = 0;

  for (teamid in DATA) {
    DATA[teamid].made3sByPlayer.forEach(function (play) {
      drawLine(play, 'Made 3 by ');
    });

    DATA[teamid].missed3sByPlayer.forEach(function (play) {
      drawLine(play, 'Missed 3 by ');
    });
  };

  function drawLine(play, text) {
    let g = svg.append('g')
      .attr('transform', 'translate(0, ' + ((index * sheetH) + 20) + ')');

    g.append('text')
      .attr('class', 'player-name')
      .attr('y', -5)
      .text(text + players[play.player].name);

    g.selectAll('.delta')
      .data(play.deltas)
      .enter().append('rect')
      .attr('x', function (d, i) { return i * barW; })
      .attr('y', function (d, i) {
        if (play.ballPoss[i]) return 5;
        else return barHPoss - barHOffball + 5;
      })
      .attr('width', barW)
      .attr('height', function (d, i) {
        if (play.ballPoss[i]) return barHPoss;
        else return barHOffball;
      })
      .style('fill', function (d) {
        let per = (d / PERIOD) / MAXSPEED;

        if (per === 100) per = 1; // special case to symbolize end of play
        else if (per > 1) per = 0;

        let color = d3.rgb(players[play.player].color);
        color.opacity = per;
        return color;
      })
      .on('mouseover', function (d, index) {
        d3.select('.probe--seconds').text(Math.round(index * 0.04));
        d3.select('.probe')
          .style('display', 'block')
          .style('left', (d3.event.clientX + 15) + 'px')
          .style('top', (d3.event.clientY - 40) + 'px');
      })
      .on('mouseout', function () {
        d3.select('.probe').style('display', 'none');
      });

    index++;
  }
}

// Can input in NBA spatial array or a d3 x,y object
function distanceBetween(a, b) {
  if (Array.isArray(a)) {
    return Math.sqrt((a[2] - b[2]) * (a[2] - b[2]) + (a[3] - b[3]) * (a[3] - b[3]));
  } else {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  }
}
