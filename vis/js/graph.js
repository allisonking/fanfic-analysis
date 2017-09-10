function Graph(options) {

var svg = d3.select(options.container),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var colorMap = {
  'Gryffindor' : 'red',
  'Slytherin' : 'green',
  'Hufflepuff' : '#ffd700',
  'Ravenclaw' : 'blue',
  'other' : 'grey'
}

var linkScale = d3.scaleLog()
                  .range([1, 6])

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().distance(20).strength(0.5))
    .force("charge", d3.forceManyBody().strength(-25))
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.json("data/d3/character_nodes.json", function(error, graph) {
  if (error) throw error;

  var nodes = graph.nodes,
      num_characters = nodes.length;
      intermediates = graph.intermediates,
      nodeById = d3.map(nodes, function(d) { return d.id; }),
      nodeByIndex = d3.map(intermediates, function(d) { return d.index;})
      links = graph.links,
      bilinks = [],

  links.forEach(function(link, index) {
    var s = link.source = nodeById.get(link.source),
        t = link.target = nodeById.get(link.target),
        v = +link.value,
        // intermediate will now be read in as opposed to empty
        i = nodeByIndex.get(index + num_characters);
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

  simulation
      .nodes(nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(links);

  function ticked() {
    link.attr("d", positionLink);
    node.attr("transform", positionNode);

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
