/*
* Small Multiples Visualization JS
*/

let svgWidth = 300;
let svgHeight = 150;
let xresolution = 3;
let yresolution = 3;

let players = {};
let SMALLMULTIPLES = [];

let COLORS = {
  ball: '#F5551B',
  SAS: '#061922',
  POR: '#E03A3E'
};

window.onload = function () {
  svgW = d3.select('.visualization').node().getBoundingClientRect().width;
  prepPlayerNames();
  prepData();
  drawElements();
  uiElements();

  // Click first sort button
  var event = document.createEvent('HTMLEvents');
  event.initEvent('click', true, false);
  document.querySelector('.sort-button[data-sort="time"]').dispatchEvent(event);
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

function prepData() {
  for (side in DATA) {
    DATA[side].data.forEach(function (play) {
      let pid = play[play.length - 1][6].off.player_id;

      SMALLMULTIPLES.push({
        data: play,
        made: play[play.length - 1][6].eventmsgtype === 1,
        player: pid,
        team: DATA[side].abbreviation
      });
    });
  }
}

function drawElements() {
  let id = -1;
  let line = (arrayVal) => d3.line()
    .x(d => {
      if (d[5][arrayVal]) return d[5][arrayVal][2] * xresolution;
      else return 0;
    })
    .y(d => {
      if (d[5][arrayVal]) return d[5][arrayVal][3] * yresolution;
      else return 0;
    })
    .curve(d3.curveBasis);

  let chart = d3.select('#visualization0').selectAll('.chart').data(SMALLMULTIPLES);

  let svg = chart.enter().append('div')
      .attr('class', 'chart')
      .attr('id', () => {
        id++;
        return 'chart' + id;
      })
      .attr('data-player', d => players[d.player].name)
    .append('svg')
      .style('width', svgWidth + 'px')
      .style('height', (svgHeight + 30) + 'px');

  svg.append('g')
    .attr('class', 'court-image')
    .append('svg:image')
      .attr('xlink:href', 'http://kingfisher13.github.io/atlas-of-basketball/img/fullcourt-threes.svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight);

  let ball = svg.append('g').attr('class', 'ball-movement');
  ball.append('path')
      .attr('class', 'ball-movement--line')
      .attr('d', d => line(0)(d.data));

  ball.append('circle')
      .attr('class', 'ball-start--circle')
      .attr('cx', d => d.data[0][5][0][2] * xresolution)
      .attr('cy', d => d.data[0][5][0][3] * yresolution)
      .attr('r', 4);

  let player = svg.append('g').attr('class', 'player-movement');
  player.append('path')
    .attr('class', 'player-movement--line')
    .attr('d', d => {
      let arrayVal = _.findIndex(d.data[0][5], function (p) {
        return p[1] === d.player;
      });

      return line(arrayVal)(d.data);
    })
    .style('stroke', d => COLORS[d.team]);

  let caption = svg.append('g').attr('class', 'caption');
  caption.append('text')
    .attr('class', 'caption--text caption--timestamp')
    .attr('x', 5)
    .attr('y', 174)
    .text(d => {
      let text = '(Q' + d.data[1][0] + ' - ';
      let totalSeconds = d.data[1][2];
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = Math.round(totalSeconds - (minutes * 60));
      return text + minutes + ':' + seconds + ')';
    });

  caption.append('text')
    .attr('class', 'caption--text')
    .attr('x', 95)
    .attr('y', 175)
    .text(d => players[d.player].name);

  caption.append('text')
    .attr('class', d => d.made ? 'caption--made' : 'caption--missed')
    .attr('x', svgWidth - 20)
    .attr('y', 175)
    .style('text-anchor', 'end')
    .text(d => d.made ? 'Made' : 'Missed');
}

function uiElements() {
  document.querySelector('.select-menu').style.display = 'none';

  d3.selectAll('.sort-button').each(function () {
    d3.select(this).on('click', () => {
      d3.selectAll('.sort-button').classed('selected', false);

      // reset filter menus
      document.querySelector('.select-menu').style.display = 'none';
      d3.selectAll('.menu--select-button').classed('selected', false);

      d3.select(this).classed('selected', true);
      sort(this.getAttribute('data-sort'));
    });
  });

  d3.selectAll('.filter-button').each(function () {
    d3.select(this).on('click', () => {
      // position menu
      let menu = document.querySelector('.select-menu');
      menu.style.display = 'flex';
      menu.style.left = d3.select(this).offsetLeft + 'px';
    });
  });

  _.each(players, function (player) {
    if (player.name === 'Ball') return;
    let playerButton = document.createElement('button');
    playerButton.classList.add('menu--select-button');
    playerButton.appendChild(document.createTextNode(player.name));

    playerButton.addEventListener('click', function () {
      document.querySelector('.select-menu').style.display = 'none';

      let player = d3.select(this).text();

      addPlayerToFilterList(player);
      filter(player);
    });

    document.querySelector('.select-menu').appendChild(playerButton);
  });

  function sort(type) {
    // Get array of chart ids
    let chartArray = [];
    d3.selectAll('.chart').each(function (d, i) {
      chartArray.push(d3.select(this).node().getAttribute('id'));
    });

    if (type === 'time') {
      chartArray.sort(function (a, b) {
        return d3.select('#' + a).datum().data[0][1] - d3.select('#' + b).datum().data[0][1];
      });
    } else if (type === 'team') {
      chartArray.sort(function (a, b) {
        let playerA = toLowerNoSpaces(players[d3.select('#' + a).datum().player].name);
        let playerB = toLowerNoSpaces(players[d3.select('#' + b).datum().player].name);
        if (playerA < playerB) return -1;
        else if (playerA > playerB) return 1;
        else return 0;
      });
    }

    // Set order
    chartArray.forEach(function (chartId, i) {
      document.getElementById(chartId).style.order = i;
    });
  }

  function filter() {
    // Get array of chart ids
    let chartArray = [];
    d3.selectAll('.chart').each(function (d, i) {
      d3.select(this).style('display', 'block');
      chartArray.push(d3.select(this).node().getAttribute('id'));
    });

    let playerNames = [];
    d3.selectAll('.filter-player-button').each(function () {
      playerNames.push(d3.select(this).attr('data-filter'));
    });

    chartArray.forEach(function (chartID) {
      let chart = document.getElementById(chartID);
      if (playerNames.indexOf(chart.getAttribute('data-player')) >= 0 || playerNames.length === 0) chart.style.display = 'block';
      else chart.style.display = 'none';
    });
  }

  function addPlayerToFilterList(player) {
    d3.select('.controls.filters')
      .insert('button', '.filter-button')
      .attr('class', 'viz-button filter-player-button')
      .attr('data-filter', player)
      .text(player + ' x')
      .on('click', function () {
        d3.select(this).remove();
        filter();
      });
  }
}

function toLowerNoSpaces(str) {
  return str.replace(/\s+/g, '').toLowerCase();
};
