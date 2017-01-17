/*
* Basic Music Visualization
*/

let deltas = {};
let players = {};
let svg;
let svgW = 0;
let barH = 55;
const period = 0.04; // time per frame in seconds

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

  DATA.players.home.forEach(function (p) {
    players[p.playerid] = {
      name: p.firstname + ' ' + p.lastname,
      color: COLORS.SAS
    };
  });

  DATA.players.visitor.forEach(function (p) {
    players[p.playerid] = {
      name: p.firstname + ' ' + p.lastname,
      color: COLORS.POR
    };
  });
}

function initElements() {
  svg = d3.select('#visualization0')
    .append('svg')
    .attr('class', 'svg')
    .attr('width', svgW)
    .attr('height', (barH * 11) + 40);
}

function calcDeltas() {
  DATA.gameData.forEach(function (moment, i) {
    if (i === 0) return; // we're looking for deltas, so we can't start with the first value

    moment[5].forEach(function (player, j) {
      if (!deltas[player[1]]) deltas[player[1]] = [];
      deltas[player[1]].push(distanceBetween(player, DATA.gameData[i - 1][5][j]));
    });
  });
}

function drawLines() {
  let barW = Math.floor(svgW / deltas['-1'].length);

  let index = 0;
  _.each(deltas, function (delta, pid) {
    let g = svg.append('g')
      .attr('transform', 'translate(0, ' + ((index * barH) + 20) + ')');

    if (pid === '-1') g.attr('class', 'g-ball');

    g.append('text')
      .attr('class', 'player-name')
      .attr('y', -5)
      .text(players[pid].name);

    g.selectAll('.delta')
      .data(delta)
      .enter().append('rect')
      .attr('x', function (d, i) { return i * barW; })
      .attr('y', 0)
      .attr('width', barW)
      .attr('height', barH - 25)
      .style('fill', function (d) {
        let per = (d / period) / 12; // 12 is arbitrary max speed
        let color = d3.rgb(players[pid].color);
        color.opacity = per;
        return color;
      });

    index++;
  });
}

// Can input in NBA spatial array or a d3 x,y object
function distanceBetween(a, b) {
  if (Array.isArray(a)) {
    return Math.sqrt((a[2] - b[2]) * (a[2] - b[2]) + (a[3] - b[3]) * (a[3] - b[3]));
  } else {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  }
}
