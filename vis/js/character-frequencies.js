

// set dimensions for the svg
var margin = {top: 50, right: 150, bottom: 200, left: 200};
var w = 1200 - margin.left - margin.right;
var h = 700 - margin.top - margin.bottom;

// colors
var baseColor = 'red';
var otherColor = '#ffd700'; // gold

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
  oldData = all_data.slice(0,50);
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
  cur_display = all_data.slice(0,50);
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
  //var oldXScale = xScale.copy();
  updateDomains();
  oldBars = focus.selectAll('.bar')
              //.data(cur_display);

  newBars = focus.selectAll('.bar')
                 .data(cur_display)


  // update
  var barUpdate = oldBars
                      .transition()
                      .duration(2000)
                      //.attr('transform', function(d) { return 'translate('+(xScale(d.name)) +','+yScale(d.percentage)+')'; })


                      .attr('transform', function(d ,i) {
                        var oldPos = d3.select(this).attr('x');
                        console.log(d.name);
                        //console.log(xScale(d.name));
                        if (typeof xScale(oldData[i].name) != 'undefined') {
                          var returnThis = 'translate(' + (xScale(oldData[i].name)-oldPos) + ',0)';
                          //var returnThis = 'translate(' + (-xScale(d.name) + oldPos)+',0)';
                          //var returnThis = 'translate(-16,0)';
                          console.log(returnThis);
                          return returnThis;
                        }
                        else { return '';}
                      })
                      //.attr('x', function(d, i) { return xScale(oldData[i].name); })
                      .attr('y', function(d, i) { return yScale(oldData[i].percentage); })
                      .attr('height', function(d, i) { return h - yScale(oldData[i].percentage); })
                      .style('fill-opacity', function(d, i) {
                        if (typeof xScale(oldData[i].name) == 'undefined') {
                          return 0;
                        } else {
                          return 1;
                        }
                      });
  // enter
  var enterBars = newBars.enter()
                      .append('rect')
                      .attr('class','bar')
                      .attr('fill', baseColor)
                      .attr('width', xScale.bandwidth())
                      .attr('x', function(d) { return xScale(d.name); })
                      .attr('y', function(d) { return yScale(d.percentage); })
                      .attr('height', function(d) { return h - yScale(d.percentage); })
                      .on('mouseover', handleBarMouseOver)
                      .on('mouseout', handleBarMouseOut);


  /*newBars.merge(enterBars)
      .transition()
      .attr('x', function(d) { return xScale(d.name); })
      .attr('y', function(d) { return yScale(d.percentage); })
      .attr('height', function(d) { return h - yScale(d.percentage); })*/

  // exit
/*  bars.exit().transition()
             //.attr('transform', function(d) { return 'translate('+h+',0)';})
             .duration(2000)
             .attr('fill-opacity', 0)
             .remove();*/

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
  cur_display = data.slice(0,50);

  updateDomains();

  focus.selectAll('.bar')
       .data(cur_display)
       .enter()
       .append('rect')
       .attr('class','bar')
       .attr('fill', baseColor)
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
       baseColor = 'green';
       otherColor = '#c0c0c0';
       break;
     case 'Ravenclaw':
       baseColor = 'blue';
       otherColor = '#cd7f32'; //bronze
       break;
     default:
       baseColor = 'red';
       otherColor = '#ffd700';
   }

   focus.selectAll('.bar')
        .transition()
          .delay(function(d, i) {
            return i * 20;
          })
          .attr('fill', baseColor);

 }

 function handleBarMouseOver(d, i) {
   d3.select(this)
     .attr('fill', otherColor)
 };

 function handleBarMouseOut(d, i) {
   d3.select(this)
     .attr('fill', baseColor)
 };
