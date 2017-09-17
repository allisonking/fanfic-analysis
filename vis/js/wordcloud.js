function WordCloud(options) {
  var margin = {top: 70, right: 150, bottom: 200, left: 100},
           w = 1200 - margin.left - margin.right,
           h = 600 - margin.top - margin.bottom;

  // create the svg
  var svg = d3.select(options.container).append("svg")
              .attr('height', h + margin.top + margin.bottom)
              .attr('width', w + margin.left + margin.right)

  // set the ranges for the scales
  var xScale = d3.scaleLinear().range([10, 100]);

  var focus = svg.append('g')
                 .attr("transform", "translate(" + [w/2+margin.left, h/2+margin.top] + ")")

  var colorMap = ['red', '#a38b07'];

  var data;
  d3.json(options.data, function(error, d) {
    if (error) throw error;
    data = d;
    var word_entries = d3.entries(data['count']);
    xScale.domain(d3.extent(word_entries, function(d) {return d.value;}));

    d3.layout.cloud().size([w, h])
             .timeInterval(20)
             .words(word_entries)
             .fontSize(function(d) { return xScale(+d.value); })
             .text(function(d) { return d.key; })
             .font("Impact")
             .on("end", draw)
             .start();

    d3.layout.cloud().stop();

  });

  function draw(words) {
    focus.selectAll("text")
         .data(words)
         .enter().append("text")
         .style("font-size", function(d) { return xScale(d.value) + "px"; })
         .style("font-family", "Impact")
         .style("fill", function(d, i) { return colorMap[~~(Math.random() *2)]; })
         .attr("text-anchor", "middle")
         .attr("transform", function(d) {
           return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
         })
         .text(function(d) { return d.key; })
         .on('mouseover', handleMouseOver)
         .on('mouseout', handleMouseOut);
  }

  function handleMouseOver(d) {
    var group = focus.append('g')
                     .attr('id', 'story-titles');

    group.selectAll('text')
         .data(data['sample_title'][d.key])
         .enter().append('text')
         .attr('x', d.x)
         .attr('y', function(title, i) {
           var base = d.y - d.height/2;
           return (base - i*14);
         })
         .attr('text-anchor', 'middle')
         .text(function(title) { return title; });

    var bbox = group.node().getBBox();
    var bboxPadding = 5;

    // place the background
    var rect = group.insert('rect', ':first-child')
                  .attr('x', bbox.x)
                  .attr('y', bbox.y)
                  .attr('width', bbox.width + bboxPadding)
                  .attr('height', bbox.height + bboxPadding)
                  .attr('rx', 10)
                  .attr('ry', 10)
                  .attr('class', 'label-background-strong');
  }

  function handleMouseOut(d) {
    d3.select('#story-titles').remove();
  }
}
