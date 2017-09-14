function CharacterFrequency(options) {
  var useGender = options.gender;
  // set dimensions for the svg
  var margin = {top: 70, right: 150, bottom: 200, left: 100},
           w = 1200 - margin.left - margin.right,
           h = 600 - margin.top - margin.bottom;

  // colors
  var color = {
    'base': d3.rgb('rgb(185, 11, 11)'),
    'other' : '#ffd700',
  }

  var genderMap = {
    'M' : color.base,
    'F' : color.other,
    'N' : 'grey'
  };

  // create the svg
  var svg = d3.select(options.container).append("svg")
              .attr('height', h + margin.top + margin.bottom)
              .attr('width', w + margin.left + margin.right)

  // set the ranges for the scales
  var xScale = d3.scaleBand().rangeRound([0, w]).padding(0.1),
      yScale = d3.scaleLinear().range([h, 0]);

  var focus = svg.append('g')
                 .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // listen for radio button change
  d3.selectAll("input[name="+ options.input +"]").on("change", frequencyTypeChanged)

  /**
   * Handles when the user chooses 'canon' or 'fan fiction'. Called by radio button change.
   * Switches out the data and calls update
   */
  function frequencyTypeChanged() {
    if (this.value == 'ff') {
      all_data.forEach(function(character, i) {
        character.percentage = character.fanfiction_percentage;
        character.last_rank = i;
      });
    }
    else {
      all_data.forEach(function(character, i) {
        character.percentage = character.canon_percentage;
        character.last_rank = i;
      });
    }
    all_data.sort(function(a, b) {
      return b.percentage - a.percentage;
    });
    cur_display = all_data.slice(0,num_characters);

    update();
  }

  /**
   * Resets the domains to cur_display
   */
  function updateDomains() {
    xScale.domain(cur_display.map(function(d) { return d.name; }));
    yScale.domain([0, d3.max(cur_display, function(d) { return d.percentage})]);
  }

  /**
   * Resets the axes (normally called after domains have been updated)
   */
  function updateAxes() {
    focus.select('.axis--y').call(d3.axisLeft(yScale).ticks(10,'%'))

    focus.select('.axis--x').transition()
                            .duration(2000)
                            .call(d3.axisBottom(xScale))

    focus.selectAll('.axis--x')
         .selectAll('text')
         .style('text-anchor', 'end')
         .attr('dx', '-.8em')
         .attr('dy', '.15em')
         .attr('transform', 'rotate(-65)');
  }

  function update() {
    // get a copy of the old x scale so we can calculate how much a character moved later
    oldXScale = xScale.copy();

    updateDomains();

    // bind the new data
    var bar = focus.selectAll('.bar')
                   .data(cur_display, function(d) { return d.name})
                   .on('mouseover', handleBarMouseOver)
                   .on('mouseout', handleBarMouseOut);

    // update- calculate if character increased or decreased in frequency and display color
    bar.transition()
       .duration(2000)
       .attr('y', function(d) { return yScale(d.percentage);})
       .attr('height', function(d) { return h - yScale(d.percentage);})
       .attr('x', function(d) { return xScale(d.name); })
       .attr('fill', function(d) {
         if (!useGender) {
           var difference = oldXScale(d.name) - xScale(d.name);
           var scale = difference / w * 6;
           var new_color;
           if (scale < 0) {
             new_color = color.base.darker(Math.abs(scale));
           } else if (scale > 0){
             new_color = color.base.brighter(Math.abs(scale));
           }
           else {
             return color.base;
           }
           return new_color;
         } else return genderMap[d.gender];
       });

    // enter- all new characters have a certain color
    var barEnter = bar.enter()
                      .append('rect')
                      .on('mouseover', handleBarMouseOver)
                      .on('mouseout', handleBarMouseOut)
                      .attr('class','bar')
                      .attr('width', xScale.bandwidth())
                      .attr('x', function(d) { return xScale(d.name); })
                      .transition()
                      .duration(2000)
                      .attr('y', function(d) { return yScale(d.percentage); })
                      .attr('height', function(d) { return h - yScale(d.percentage); })
                      .attr('fill', function(d) {
                        if (!useGender) return color.other;
                        else return genderMap[d.gender];
                      });

    // goodbye characters not in the new top num_characters!
    bar.exit().transition()
              .attr('fill-opacity', 0)
              .remove();

    updateAxes();
  }

  // add groups for the axes
  focus.append('g')
       .attr('class', 'axis axis--x')
       .attr('transform', 'translate(0,' + h +')')

  focus.append('g')
       .attr('class', 'axis axis--y')

  // this variable could be changed to show a different number of characters
  var num_characters = 50;

  var legend_values = [
    {color : genderMap['M'], value : 'male'},
    {color : genderMap['F'], value : 'female'},
    {color : genderMap['N'], value : 'other'},
  ]

  if (!useGender) {
    legend_values = [
      {color : color.base.darker(1), value : 'lower ranking' },
      {color : color.base.brighter(2), value : 'higher ranking' },
      {color : color.other, value : 'not in previous top ' + num_characters },
    ]
  }

  var legend = focus.append('g')
                    .attr('transform', 'translate(' + (w-200) + ',0)');

  var key = legend.selectAll('g')
                    .data(legend_values)
                    .enter().append('g')
                    .attr('transform', function(d, i) {
                      return 'translate(0,' +(i*15)+ ')'
                    });

  key.append('rect')
        .attr('width', '10px')
        .attr('height', '10px')
        .attr('fill', function(d) { return d.color; });

  key.append('text')
     .attr('x', '15px')
     .attr('y', '10px')
     .text(function(d) { return d.value; });


  var cur_display;
  var all_data;


  // read in the data
  d3.csv("data/d3/char_frequencies_canon_ff.csv", function(d) {
    // coerce from string to numbers
    d.canon_percentage = +d.canon_percentage;
    d.fanfiction_percentage = +d.fanfiction_percentage;
    return d;
  }, function(error, data) {
    if (error) throw error;

    // store for access from other functions
    all_data = data;

    // start with canon- store in new variable 'percentage'
    data.forEach(function(character, i) {
      character.percentage = character.canon_percentage;
    });

    // get the top num_characters in frequency
    cur_display = data.slice(0,num_characters);

    updateDomains();

    // to start- all bars will just be the base color
    focus.selectAll('.bar')
         .data(cur_display, function(d) { return d.name; })
         .enter()
         .append('rect')
         .attr('class','bar')
         .attr('fill', function(d, i) {
           if (!useGender) return color.base;
           else return genderMap[d.gender];
         })
         .attr('width', xScale.bandwidth())
         .attr('x', function(d) { return xScale(d.name); })
         .attr('y', function(d) { return yScale(d.percentage); })
         .attr('height', function(d) { return h - yScale(d.percentage); })
         .on('mouseover', handleBarMouseOver)
         .on('mouseout', handleBarMouseOut);

    // initialize the axes
    focus.select('.axis--y').call(d3.axisLeft(yScale).ticks(10,'%'))
                            .append('text')
                            .attr('transform', 'rotate(-90)')
                            .attr('y', 6)
                            .attr('dy', '0.71em')
                            .attr('text-anchor', 'end')
                            .text('Frequency')

    focus.select('.axis--x').call(d3.axisBottom(xScale))
                            .selectAll('text') // formatting for x axis labels to be slanted
                            .style('text-anchor', 'end')
                            .attr('dx', '-.8em')
                            .attr('dy', '.15em')
                            .attr('transform', 'rotate(-65)');

  });

  // now for some titles/labels
  /*focus.append('text')
       .attr('text-anchor', 'middle')
       .attr('transform', 'translate(' + -margin.left/2 +',' + (h/2) +')rotate(-90)')
       .text('Percentage*');*/
  focus.append('text')
       .attr('text-anchor', 'middle')
       .attr('transform', 'translate(' + (w/2) + ',' + (h + margin.bottom * 3/4) +')')
       .text('Character');
  focus.append('text')
       .attr('text-anchor', 'middle')
       .attr('transform', 'translate(' + (w/2) + ',' + -margin.top/2 + ')')
       .text('Harry Potter Character Frequency');

  // listen for menu color changes
  //d3.selectAll("input[name='houses']").on("change", updateColor)

  /**
   * Switch case statement to figure out which color to set the points to
   * Then colors each of the bars those colors with some added transition
   */
   function updateColor() {
     var oldBase = color.base;
     var oldOther = color.other;
     switch(this.value) {
       case 'Gryffindor':
       color.base = d3.rgb('rgb(185, 11, 11)');
       color.other = '#ffd700';
       break;
       case 'Hufflepuff':
       color.base = d3.rgb('rgb(200, 175, 41)');
       color.other = 'black';
       break;
       case 'Slytherin':
       color.base = d3.rgb('rgb(34, 152, 35)');
       color.other = '#c0c0c0';
       break;
       case 'Ravenclaw':
       color.base = d3.rgb('rgb(28, 43, 179)');
       color.other = '#cd7f32'; //bronze
       break;
       default:
       color.base = 'red';
       color.other = '#ffd700';
     }

     focus.selectAll('.bar')
          .transition()
          .delay(function(d, i) {
            return i * 20;
          })
          .attr('fill', color.base);

 }

 /**
  * Handles user hovering over a bar
  */
 function handleBarMouseOver(d, i) {
     var group = focus.append('g')
                  .attr('id', 'id-name');

     var text = group.append('text')
                     .attr('x', xScale(d.name))
                     .attr('y', yScale(d.percentage)-10)
                     .attr('text-anchor', 'middle')
                     .text(function() {
                       if (typeof d.last_rank != 'undefined') {
                         var old_rank = +d.last_rank + 1;
                         if (old_rank > 200) {
                           old_rank = ">200";
                         }
                         var new_rank = i + 1
                         var t = d.name + ": rank " + old_rank + " to " + new_rank;
                         return t;
                       }
                       else {
                         return d.name
                       }
                     });

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
 };

 /**
  * Removes the hover text after user stops hovering
  */
 function handleBarMouseOut(d, i) {
     d3.select('#id-name').remove();
 };

}
