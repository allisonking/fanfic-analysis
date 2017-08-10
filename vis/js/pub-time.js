

// set dimensions for the svg
var margin = {top: 50, right: 100, bottom: 100, left: 200};
var w = 1200 - margin.left - margin.right;
var h = 600 - margin.top - margin.bottom;

// functions to parse/format the date

var dateToString = d3.timeFormat("%Y-%m-%d");
var dateToLabel = d3.timeFormat("%m/%d/%y")

// colors
var baseColor = 'red';
var otherColor = '#ffd700'; // gold

// create the svg
var svg = d3.select("body").append("svg")
            .attr('height', h + margin.top + margin.bottom)
            .attr('width', w + margin.left + margin.right)

svg.append('defs').append('clipPath')
                  .attr('id', 'clip')
                  .append('rect')
                  .attr('width', w)
                  .attr('height', h);

// set the ranges for the scales
var xScale = d3.scaleTime().range([0, w]);
var yScale = d3.scaleLinear().range([h, 0]);
var init_xScale;
var init_yScale;
var zoom = d3.zoom().on("zoom", zoomed);

svg.append('rect')
   .attr('class', 'zoom')
   .attr('width', w)
   .attr('height', h)
   .attr('transform', 'translate(' + margin.left + ',' + margin.top +')')
   .call(zoom);

var focus = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

var csv_data;
d3.select('#menu').on('change', characterChanged);
d3.select('#xLocked').on('change', xLockeded);
d3.select('#yLocked').on('change', yLockeded);
var xLocked = false;
var yLocked = false;
function xLockeded(){
  if (d3.select('#xLocked').property('checked')) {
    xLocked = true;
  } else { xLocked = false;}
}
function yLockeded() {
  if (d3.select('#yLocked').property('checked')) {
    yLocked = true;
  } else { yLocked = false;}
}

function characterChanged() {
  if (menu.property('value') == 'All') {
    cur_display = allData;
  } else {
    cur_display = characters[menu.property('value')];
  }
  //xScale.domain(d3.extent(cur_display, function(d) {return d.date;}));
  //yScale.domain([0, d3.max(cur_display, function(d) {return d.count; })])
  update();
}

//function setScale() {

//}

function zoomed() {
  var t = d3.event.transform;
  if (!xLocked) {
    var new_xScale = t.rescaleX(init_xScale);
    xScale.domain(new_xScale.domain())
    focus.select('.axis--x').call(xAxis.scale(new_xScale))
                            .selectAll('text') // formatting for x axis labels to be slanted
                            .style('text-anchor', 'end')
                            .attr('dx', '-.8em')
                            .attr('dy', '.15em')
                            .attr('transform', 'rotate(-65)');
  }
  if (!yLocked) {
    var new_yScale = t.rescaleY(init_yScale);
    yScale.domain(new_yScale.domain());
    focus.select('.axis--y').call(yAxis.scale(new_yScale));
  }

  update();
}

/*var menu = d3.select("#menu select")
             .on("change", change);

function filterAdded() {
  var nested = d3.nest()
                 .key(function(d) {return d.language})
                 .key(function(d) { return timeFormat(d.published * 1000); })
                 .rollup(function(v) { return v.length; })
                 .entries(csv_data);

}*/



function update() {

  var circle = focus.selectAll('circle')
                    .data(cur_display)

  circle.exit().remove();
  circle.enter().append('circle')
              .merge(circle)
                //.transition()
                .attr('cy', function(d) { return yScale(d.count); })
                .attr('cx', function(d) { return xScale(d.date); });

  var scars = focus.selectAll('.scar-group')

  scars.enter()
       .append('g')
       .merge(scars)
       .attr('transform', function(d) {
         var x = xScale(d.date);
         var y = h/6;
         return 'translate(' + x + ',' + y + ')';
       })
}

// lightning bolt polygon
var scar = [{"x":-6, "y":0},
            {"x":8,"y":0},
            {"x":-6,"y":11},
            {"x":2,"y":1},
            {"x":-6, "y":1},
            {"x":3,"y":-7}, ];
// transform it for easy access later
var newScar = scar.map(function(d) {
  return [d.x, d.y];
});

var xAxis = d3.axisBottom(xScale)
              .ticks(15),
    yAxis = d3.axisLeft(yScale);

// read in the timeline data and store as a dictionary for easy access
var timeline_data;
d3.csv("data/timeline.csv", function(data) {
  data.forEach(function(d) {
    d.date = parseTime(d.date);
  })
  timeline_data = data;
});



var cur_display;
var languages;
var allData;
// read in the data
d3.csv("data/grouped_dates.csv", function(data) {

  /*var dates = d3.nest()
                .key(function(d) { return dateToString(d.published * 1000); })
                .rollup(function(v) { return v.length; })
                .entries(csv_data);

  dates = dates.map(function(d, i) {
    return {date: parseTime(d.key), count: d.value }
  })*/
  data.forEach(function(d) {
    d.date = parseTime(d.date);
    d.count = +d.count;
  })
  cur_display = data;
  allData = data;
  /*menu.selectAll('option')
      .data(languages)
    .enter().append('option')
      .text(function(d) { return d; })
  menu.property('value', 'English');*/

  // set the domain for the scale
  xScale.domain(d3.extent(data, function(d) {return d.date;}));
  yScale.domain([0, d3.max(data, function(d) {return d.count; })])
  init_xScale = xScale.copy();
  init_yScale = yScale.copy();

  // and now to draw the circles for the scatterplot
  var points = focus.append('g')
                    .attr('class', 'point');
  var circles = points.selectAll('circle')
     .data(data)
     .enter()
     .append('circle')
     .attr('cx', function(d) { return xScale(d.date) })
     .attr('cy', function(d) { return yScale(d.count) })
     .attr('r', 2)
     .attr('fill', baseColor)
     .on('mouseover', handleCircleMouseOver)
     .on('mouseout', handleCircleMouseOut);

  // draw the timeline events as scars
  var scars = points.selectAll('polygon')
       .data(timeline_data)
       .enter()
       .append('g')
       .attr('class', 'scar-group')
       // draw the scar and transform to where the point should be
       .attr('transform', function(d) {
         var x = xScale(d.date);
         var y = h/6;
         return 'translate(' + x +',' + y +')';
       })
       .append('polygon')
       .attr('points', function(d) {
         return [newScar].join(" ");
       })
       .attr('stroke', otherColor)
       .attr('fill', otherColor)
       .attr('stroke-width', 2)
       .on('mouseover', handleScarMouseOver)
       .on('mouseout', handleScarMouseOut);

    var gX = focus.append('g')
                .attr('class', 'axis axis--x')
                .attr('transform', 'translate(0,' + h + ')')
                .call(xAxis)
                .selectAll('text') // formatting for x axis labels to be slanted
                  .style('text-anchor', 'end')
                  .attr('dx', '-.8em')
                  .attr('dy', '.15em')
                  .attr('transform', 'rotate(-65)');

    // add the y
    var gY = focus.append('g')
                .attr('class', 'axis axis--y')
                .call(yAxis);



    d3.selectAll("input[name='houses']").on("change", function(){
      var oldBase = baseColor;
      var oldOther = otherColor;
      switch(this.value) {
        case 'Gryffindor':
          baseColor = 'red';
          otherColor = '#ffd700';
          break;
        case 'Hufflepuff':
          baseColor = 'yellow';
          otherColor = 'black';
          break;
        case 'Slytherin':
          baseColor = '#c0c0c0';
          otherColor = 'green';
          break;
        case 'Ravenclaw':
          baseColor = 'blue';
          otherColor = '#cd7f32'; //bronze
          break;
        default:
          baseColor = 'red';
          otherColor = '#ffd700';
      }
      circles.transition()
             .delay(function(d, i) {
               return i * .25;
             })
             .duration(100)
             .attr('fill', baseColor);

      scars.transition()
           .delay(function(d, i) {
             return i * 40;
           })
           .attr('stroke', otherColor)
           .attr('fill', otherColor);
    });
});


// now for some titles/labels
focus.append('text')
   .attr('text-anchor', 'middle')
   .attr('transform', 'translate(' + -margin.left/2 +',' + (h/2) +')rotate(-90)')
   .text('Number of Fan Fictions Published');
focus.append('text')
   .attr('text-anchor', 'middle')
   .attr('transform', 'translate(' + (w/2) + ',' + (h + margin.bottom * 3/4) +')')
   .text('Date');
focus.append('text')
   .attr('text-anchor', 'middle')
   .attr('transform', 'translate(' + (w/2) + ',' + -margin.top/2 + ')')
   .text('Harry Potter Fan Fiction Publications Over Time');

 // function to handle when someone mouses over an event
 function handleScarMouseOver(d, i) {
   d3.select(this)
     .attr('transform', 'scale(1.5)');

   var group = focus.append('g')
                 .attr('id', 'id-'+dateToString(d.date));

   var text = group.append('text')
                   .attr("x", xScale(d.date)- 20 )
                   .attr('y', h/6+30)
                   .attr('text-anchor', 'middle')
                   .attr('class', 'timeline-label')
                   .text(dateToLabel(d.date) + ": "
                     + d.event);

    group.append('line')
         .attr('x1', xScale(d.date))
         .attr('x2', xScale(d.date))
         .attr('y1', h)
         .attr('y2', 0)
         .style('stroke-width', 1)
         .style('stroke', 'black');

     // get the bbox so we can place a background
     var bbox = text.node().getBBox();
     var bboxPadding = 5;

     // place the background
     var rect = group.insert('rect', ':first-child')
                   .attr('x', bbox.x - bboxPadding/2)
                   .attr('y', bbox.y - bboxPadding/2)
                   .attr('width', bbox.width + bboxPadding)
                   .attr('height', bbox.height + bboxPadding)
                   .attr('rx', 10)
                   .attr('ry', 10)
                   .attr('class', 'label-background');
 }

 // function to handle when someone mouses out of an event
 function handleScarMouseOut(d, i) {
   d3.select(this)
     .attr('transform', '');

   d3.select('#id-'+dateToString(d.date)).remove();
 }

 // function to handle when user hovers over a point
 // changes color + size of circle and displays the date/number published
 function handleCircleMouseOver(d, i) {
   d3.select(this)
     .attr('fill', otherColor)
     .attr('r', 10);

   // assign the text labeling a group and ID so we can delete it later
   group = focus.append('g')
              .attr('id', 'id-'+dateToString(d.date));

   var text = group.append('text')
                 .attr("x", xScale(d.date) - 20 )
                 .attr("y", yScale(d.count) - 5)
                 .attr('text-anchor', 'middle')
                 .text(dateToLabel(d.date) + ": " + d.count);

   // get the bbox so we can place a background
   var bbox = text.node().getBBox();
   var bboxPadding = 5;

   // place the background
   var rect = group.insert('rect', ':first-child')
                 .attr('x', bbox.x - bboxPadding/2)
                 .attr('y', bbox.y - bboxPadding/2)
                 .attr('width', bbox.width + bboxPadding)
                 .attr('height', bbox.height + bboxPadding)
                 .attr('rx', 10)
                 .attr('ry', 10)
                 .attr('class', 'label-background');
 }

 // function to handle when user leaves a point
 // reverts back to original size + color; deletes text label group
 function handleCircleMouseOut(d, i) {
   d3.select(this)
     .attr('fill', baseColor)
     .attr('r', 2);
   d3.select('#id-'+dateToString(d.date)).remove();
 }
