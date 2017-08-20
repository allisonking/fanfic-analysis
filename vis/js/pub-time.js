function PubTime(options) {
  // set dimensions for the svg
  var margin = {top: 50, right: 150, bottom: 100, left: 200},
           w = 1200 - margin.left - margin.right,
           h = 600 - margin.top - margin.bottom;

  // functions to parse/format the date. Need all of these since some dates are weeks, some days
  var parseTime = d3.timeParse("%Y-%W"),
      timeFormat = d3.timeFormat("%Y-%W"),
      parseTimeline = d3.timeParse("%Y-%m-%d"),
      dateToLabel = d3.timeFormat("%m/%d/%y")

  // colors
  var baseColor = 'red';
  var otherColor = '#ffd700'; // gold
  
  // create the svg
  var svg = d3.select(options.container).append("svg")
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

  // listen to the menu for potential changes
  var menu = d3.select('#menu select').on('change', characterChanged);

  // handle locking axes for more custom zooming
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

  /**
   * Handles when the user changes a character from the menu. Called by menu change.
   * Updates the axes as well as the scatterplot points.
   */
  function characterChanged() {
    var chosenChar = menu.property('value');
    cur_display = dates[chosenChar].values;
    yScale.domain([0, d3.max(cur_display, function(d) {return d.value; })+10])
    updateAxes(xScale, yScale);
    update();
  }

  /**
   * Given two axes, updates the axes. Also resets the initial scale for zooming purposes
   */
   function updateAxes(new_x, new_y) {
     focus.select('.axis--y').call(yAxis.scale(new_y));
     focus.select('.axis--x').call(xAxis.scale(new_x));
     init_xScale = new_x.copy();
     init_yScale = new_y.copy();
   }

   /**
    * Handles when the user zooms.
    * Updates the axes if they aren't locked and also updates the scatterplot points
    */
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
   /**
    * This function does the bulk of the drawing
    * Utilizes the d3 update pattern to redraw points
    */
   function update() {
     var pointGroup = focus.selectAll('.point')

     var circles = pointGroup.selectAll('circle')
                             .data(cur_display);

     // exit
     circles.exit().remove();
     // enter
     var enterCircles = circles.enter()
                               .append('circle')
                               .attr('r', 2)
                               .attr('fill', baseColor)
                               .on('mouseover', handleCircleMouseOver)
                               .on('mouseout', handleCircleMouseOut);

    // update
    circles.merge(enterCircles)
           .transition()
           .attr('cy', function(d) { return yScale(d.value); })
           .attr('cx', function(d) { return xScale(d.key); });

    // update the scars- these stay at the same y position but can change x from zooming
    var scars = focus.selectAll('.scar-group')
    scars.enter()
         .merge(scars)
         .attr('transform', function(d) {
           var x = xScale(d.date);
           var y = h/6;
           return 'translate(' + x + ',' + y + ')';
         });
  }

  // lightning bolt polygon. this is drawn at (0,0) and can be transformed around
  var scar = [{"x":-6, "y":0},
              {"x":8,"y":0},
              {"x":-6,"y":11},
              {"x":2,"y":1},
              {"x":-6, "y":1},
              {"x":3,"y":-7}, ];
  // transform it for easy access by the svg later
  var newScar = scar.map(function(d) {
    return [d.x, d.y];
  });

  // the axes
  var xAxis = d3.axisBottom(xScale)
                .ticks(15),
      yAxis = d3.axisLeft(yScale);

  // add a group where all the points can append to
  focus.append('g')
       .attr('class', 'point');

  // some variables so we can access them from other functions- these will hold the read in data
  var cur_display;
  var dates;

  // read in the data
  d3.csv("data/d3/char-pub-grouped.csv", function(data) {
    // this reads in the CSV and groups by first a character's name, then by dates
    // yields a nested structure of a character and a count of all the fan fictions published on a given date about them
    dates = d3.nest()
              .key(function(d) { return d.name})
              .key(function(d) { return timeFormat(parseTimeline(d.published)); })
              .rollup(function(v) { return d3.sum(v, function(d) { return d.count; }) })
              .entries(data);

    var character_list = [];
    // need to parse the read in time to a date time format
    dates.forEach(function (character, i) {
      character_list.push(character.key)
      dates[i].values.forEach(function (date) {
        date.key = parseTime(date.key);
      })
    });

    // fill in the menu object with the name of all the characters we have
    menu.selectAll('option')
        .data(character_list)
        .enter().append('option')
        .text(function(d) { return d;})
        .attr('value', function(d, i) { return i;})

    // start by displaying the first character (Harry)
    cur_display = dates[0].values;

    // set the domain for the scale
    xScale.domain(d3.extent(cur_display, function(d) {return d.key;}));
    yScale.domain([0, d3.max(cur_display, function(d) {return d.value; })+10])
    // these are necessary for zooming purposes
    init_xScale = xScale.copy();
    init_yScale = yScale.copy();

    // add the axes
    focus.append('g')
         .attr('class', 'axis axis--x')
         .attr('transform', 'translate(0,' + h + ')')
         .call(xAxis)
      .selectAll('text') // formatting for x axis labels to be slanted
         .style('text-anchor', 'end')
         .attr('dx', '-.8em')
         .attr('dy', '.15em')
         .attr('transform', 'rotate(-65)');

    focus.append('g')
         .attr('class', 'axis axis--y')
         .call(yAxis);

    // read in the timeline data and store as a dictionary for easy access
    d3.csv("data/d3/timeline.csv", function(data) {
      data.forEach(function(d) {
        d.date = parseTimeline(d.date);
      })

      // draw the timeline events as scars
      focus.selectAll('.point')
           .selectAll('polygon')
           .data(data)
           .enter()
           .append('g')
           .attr('class', 'scar-group')
           .append('polygon')
           .attr('points', function(d) {
             return [newScar].join(" ");
           })
           .attr('stroke', otherColor)
           .attr('fill', otherColor)
           .attr('stroke-width', 2)
           .on('mouseover', handleScarMouseOver)
           .on('mouseout', handleScarMouseOut);

      // call update to draw the circles for us and position the scars as needed
      update();
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

  // listen for if the user changes the color
  d3.selectAll("input[name='houses']").on("change", updateColor)

  /**
   * Switch case statement to figure out which color to set the points to
   * Then colors each of the circles those colors with some added transition
   */
  function updateColor() {
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
    var circles = focus.selectAll('circle')
                       .data(cur_display)
    circles.transition()
           .delay(function(d, i) {
             return i * .5;
           })
           .duration(100)
           .attr('fill', baseColor);

    var scars = focus.selectAll('.scar-group polygon')
    scars.transition()
         .delay(function(d, i) {
           return i * 10;
         })
         .attr('stroke', otherColor)
         .attr('fill', otherColor);
 }

 // function to handle when someone mouses over an event
 function handleScarMouseOver(d, i) {
   d3.select(this)
     .attr('transform', 'scale(1.5)');

   var group = focus.append('g')
                 .attr('id', 'id-'+timeFormat(d.date));

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

   d3.select('#id-'+timeFormat(d.date)).remove();
 }

 // function to handle when user hovers over a point
 // changes color + size of circle and displays the date/number published
 function handleCircleMouseOver(d, i) {
   d3.select(this)
     .attr('fill', otherColor)
     .attr('r', 10);

   // assign the text labeling a group and ID so we can delete it later
   group = focus.append('g')
              .attr('id', 'id-'+timeFormat(d.date));

   var text = group.append('text')
                 .attr("x", xScale(d.key) - 20 )
                 .attr("y", yScale(d.value) - 5)
                 .attr('text-anchor', 'middle')
                 .text("Week of "+dateToLabel(d.key) + ": " + d.value);

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
   d3.select('#id-'+timeFormat(d.date)).remove();
 }
}
