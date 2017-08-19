

// set dimensions for the svg
var margin = {top: 50, right: 150, bottom: 200, left: 200};
var w = 1200 - margin.left - margin.right;
var h = 700 - margin.top - margin.bottom;

// colors
color = {
  'base': d3.rgb('rgb(185, 11, 11)'),
  'other' : '#ffd700',
}

// create the svg
var svg = d3.select("body").append("svg")
            .attr('height', h + margin.top + margin.bottom)
            .attr('width', w + margin.left + margin.right)

// set the ranges for the scales
var xScale = d3.scaleBand().rangeRound([0, w]).padding(0.1);
var yScale = d3.scaleLinear().range([h, 0]);

var focus = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


d3.selectAll("input[name='frequency']").on("change", frequencyTypeChanged)

var oldData;
function frequencyTypeChanged() {
  oldData = all_data.slice(0,num_characters);
  if (this.value == 'ff') {
    all_data.forEach(function(character) {
      character.percentage = character.fanfiction_percentage;
    });
  }
  else {
    all_data.forEach(function(character) {
      character.percentage = character.canon_percentage;
    });
  }
  all_data.sort(function(a, b) {
    return b.percentage - a.percentage;
  });
  cur_display = all_data.slice(0,num_characters);
  //updateDomains();
  update();
}

function updateDomains() {
  // set the domains
  xScale.domain(cur_display.map(function(d) { return d.name; }));
  yScale.domain([0, d3.max(cur_display, function(d) { return d.percentage})]);
}

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
var bars;
function update() {
  oldXScale = xScale.copy();
  updateDomains();

  var bar = focus.selectAll('.bar')
                 .data(cur_display, function(d) { return d.name});

  bar.transition()
     .duration(2000)
     .attr('y', function(d) { return yScale(d.percentage);})
     .attr('height', function(d) { return h - yScale(d.percentage);})
     .attr('x', function(d) { return xScale(d.name); })
     /*.attr('fill', function(d) {
       var difference = oldXScale(d.name) - xScale(d.name);
       if (difference > 0) {
         return color.increase;
       }
       else if (difference < 0) {
         return color.decrease
       }
       else {
         return color.base;
       }
     });*/
     .attr('fill', function(d) {
       var difference = oldXScale(d.name) - xScale(d.name);
       var scale = difference / w * 6;
       var color_test;
       //console.log(scale);
       if (scale < 0) {
         color_test = color.base.darker(Math.abs(scale));
       } else if (scale > 0){
         color_test = color.base.brighter(Math.abs(scale));
       }
       else {
         return color.base;
       }
       return color_test;
     })


  var barEnter = bar.enter()
                    .append('rect')
                    .on('mouseover', handleBarMouseOver)
                    .on('mouseout', handleBarMouseOut)
                    .attr('class','bar')
                    //.attr('fill', baseColor)
                    .attr('width', xScale.bandwidth())
                    .attr('x', function(d) { return xScale(d.name); })
                    .transition()
                    .duration(2000)
                    .attr('y', function(d) { return yScale(d.percentage); })
                    .attr('height', function(d) { return h - yScale(d.percentage); })
                    .attr('fill',color.other);

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

var cur_display;
var all_data;
var num_characters = 50;
// read in the data
d3.csv("data/d3/char_frequencies_canon_ff.csv", function(d) {
  d.canon_percentage = +d.canon_percentage;
  d.fanfiction_percentage = +d.fanfiction_percentage;
  return d;
}, function(error, data) {
  if (error) throw error;
  all_data = data;
  data.forEach(function(character) {
    character.percentage = character.canon_percentage;
  });
  cur_display = data.slice(0,num_characters);

  updateDomains();

  focus.selectAll('.bar')
       .data(cur_display, function(d) { return d.name; })
       .enter()
       .append('rect')
       .attr('class','bar')
       .attr('fill', function(d, i) {
         /*if (i*20 > 255) {
           var new_i = i - 12;
           console.log(i);
           var color = 'rgb(' + (255 - new_i*20) + ',0,0)';
         }
         else {
           var color = 'rgb('+ (255) + ',' + (255-i*20) +',0)';
         }
         console.log(color);
         return color;*/
         //return baseColor;
         return color.base
       })
       .attr('width', xScale.bandwidth())
       .attr('x', function(d) { return xScale(d.name); })
       .attr('y', function(d) { return yScale(d.percentage); })
       .attr('height', function(d) { return h - yScale(d.percentage); })
       .on('mouseover', handleBarMouseOver)
       .on('mouseout', handleBarMouseOut);

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

//  update();

});

// now for some titles/labels
focus.append('text')
   .attr('text-anchor', 'middle')
   .attr('transform', 'translate(' + -margin.left/2 +',' + (h/2) +')rotate(-90)')
   .text('Percentage of Mentions Across 7 Books');
focus.append('text')
   .attr('text-anchor', 'middle')
   .attr('transform', 'translate(' + (w/2) + ',' + (h + margin.bottom * 3/4) +')')
   .text('Character');
focus.append('text')
   .attr('text-anchor', 'middle')
   .attr('transform', 'translate(' + (w/2) + ',' + -margin.top/2 + ')')
   .text('Harry Potter Character Frequency');

d3.selectAll("input[name='houses']").on("change", updateColor)

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

 function handleBarMouseOver(d, i) {
  /* d3.select(this)
     .attr('fill', otherColor)*/
     var group = focus.append('g')
                  .attr('id', 'id-name');

     var text = group.append('text')
                     .attr('x', xScale(d.name))
                     .attr('y', yScale(d.percentage)-10)
                     .attr('text-anchor', 'middle')
                     .text(d.name);

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

 function handleBarMouseOut(d, i) {
   /*d3.select(this)
     .attr('fill', baseColor)*/
     d3.select('#id-name').remove();
 };
