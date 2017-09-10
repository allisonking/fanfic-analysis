function Graph(options) {

  d3.select('#printbutton').on('click', printInfo);

  function printInfo(){
    var output = {};
    var nodeInfo = [];
    var interInfo = [];
    var linkInfo = [];

    d3.selectAll('.node')
    .filter(function(d){
      d.fx = d.x;
      d.fy = d.y;
      d.vx = 0;
      d.vy = 0;
      nodeInfo.push(d);
    });
    d3.selectAll('.intermediate')
    .filter(function(d){
      d.fx = d.x;
      d.fy = d.y;
      d.vx = 0;
      d.vy = 0;
      interInfo.push(d);
    });

    output['nodes'] = nodeInfo;
    output['intermediates'] = interInfo;
    output['links'] = data_links;

    console.log(output);
  }

  var svg = d3.select(options.container),
      width = +svg.attr("width"),
      height = +svg.attr("height");

  var colorMap = {
    'Gryffindor' : 'red',
    'Slytherin' : 'green',
    'Hufflepuff' : 'yellow',
    'Ravenclaw' : 'blue',
    'other' : 'grey'
  }

  var linkScale = d3.scaleLog()
                    .range([1, 6])

  var simulation = d3.forceSimulation()
                     .force("link", d3.forceLink().distance(20).strength(0.5))
                     .force("charge", d3.forceManyBody().strength(-80))
                     .force("center", d3.forceCenter(width / 2, height / 2));

  // global variable to save off the links easily
  var data_links;

  d3.json("data/d3/potter.json", function(error, graph) {
    if (error) throw error;

    // make a deep copy of the links
    data_links = JSON.parse(JSON.stringify(graph.links));

    var nodes = graph.nodes,
        nodeById = d3.map(nodes, function(d) { return d.id; }),
        links = graph.links,
        bilinks = [];

    links.forEach(function(link) {
      var s = link.source = nodeById.get(link.source),
          t = link.target = nodeById.get(link.target),
          v = +link.value,
          i = {}; // intermediate node

      nodes.push(i);
      links.push({source: s, target: i}, {source: i, target: t});
      bilinks.push([s, i, t, v]);
    });

    linkScale.domain([d3.min(bilinks, function(d) { return d[3]; }),
                      d3.max(bilinks, function(d) { return d[3]; })]);

    var link = svg.selectAll(".link")
                  .data(bilinks)
                  .enter().append("path")
                  .attr("class", "link")
                  .attr('stroke-width', function(d) {
                    return linkScale(d[3]);
                  })
                  .style('stroke', 'grey')
                  .on('mouseover', handleLinkMouseOver)
                  .on('mouseout', handleLinkMouseOut);

    link.append('svg:title')
        .text(function(d){ return d[3]; });

    var node = svg.selectAll('.node')
                  .data(nodes.filter(function(d) { return d.id; }))
                  .enter().append('g')
                  .attr('class', 'node')
                  .on('mouseover', handleNodeMouseOver)
                  .on('mouseout', handleNodeMouseOut)
                  .call(d3.drag()
                      .on("start", dragstarted)
                      .on("drag", dragged));
                      // comment out ending the drag so that nodes don't return to natural position
                      //.on("end", dragended));

    node.append('circle')
        .attr('r', 20)
        .style("stroke", function(d) { return colorMap[d.house]; })
        .style('stroke-width', 2)
        .attr('fill', 'white');

    node.append('text')
        .attr('class', 'node-label')
        .attr('fill', 'black')
        .attr('y', function(d) { return '.35em'})
        .attr('text-anchor', 'middle')
        .text(function(d) { return getInitials(d.id)});

    // these are the invisible nodes that make the bezier curve
    var intermediates = svg.selectAll('.intermediate')
                           .data(nodes.filter(function(d) {
                             return typeof d.id == 'undefined';
                           }))
                           .enter().append('circle')
                           .attr('class', 'intermediate')
                           .attr('r', 2)
                           .attr('fill', 'purple')
                           .call(d3.drag()
                               .on('start', dragstarted)
                               .on('drag', dragged));

    simulation
        .nodes(nodes)
        .on("tick", ticked);

    simulation.force("link")
              .links(links);

    function ticked() {
      link.attr("d", positionLink);
      node.attr("transform", positionNode);
      intermediates.attr('transform', positionNode);
    }
  });

  function getInitials(name) {
    if(name == 'OC') return name;
    var initials = "";
    var split = name.split(" ");
    split.forEach(function(partial_name) {
      initials = initials + partial_name[0];
    })
    return initials;
  }

  function positionLink(d) {
    return "M" + d[0].x + "," + d[0].y
        + "S" + d[1].x + "," + d[1].y
        + " " + d[2].x + "," + d[2].y;
  }

  function positionNode(d) {
    return "translate(" + d.x + "," + d.y + ")";
  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x, d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x, d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null, d.fy = null;
  }

  function handleNodeMouseOver(d) {
    d3.select(this)
      .select('text')
      .text(d.id);

    d3.selectAll('.link')
      .filter(function(link) {
        return link[0].id == d.id || link[2].id == d.id;
      })
      .style('stroke', 'rgb(50, 118, 231)');
  }

  function handleNodeMouseOut(d) {
    d3.select(this)
      .select('text')
      .text(getInitials(d.id));

    d3.selectAll('.link')
      .style('stroke', 'grey');

  }

  function handleLinkMouseOver(d) {
    d3.select(this)
      .style('stroke', 'rgb(50, 118, 231)')

    d3.selectAll('.node')
      .filter(function(node) {
        return node.id == d[0].id || node.id == d[2].id;
      })
      .selectAll('circle')
      .style('stroke-width', 5);
  }

function handleLinkMouseOut(d) {
  d3.select(this)
    .style('stroke', 'grey');

  d3.selectAll('.node')
    .selectAll('circle')
    .style('stroke-width', 2);
  }
}
