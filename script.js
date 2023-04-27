const width = 1200,
  height = 1000,
  padding = 11,
  clusterPadding = 20,
  minRadius = 25;
const div = d3
  .select('#vis')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0);
const color = d3.scale.ordinal().range(['#4ECDC4', '#FF6B6B', '#C7F464']);

Array.prototype.contains = function (v) {
  return this.some((e) => e === v);
};

d3.text(
  'https://gist.githubusercontent.com/kvyb/4a185581222968f0d8f3ec18284c0715/raw/b01a8aec8c510357b277835d42648ed38b793998/outcomperc.csv',
  (error, text) => {
    if (error) throw error;
    const data = d3.csv
      .parse('text,size,group,perc\n' + text)
      .map((d) => ({ ...d, size: +d.size }));
    const cs = data.reduce(
      (arr, d) => (!arr.contains(d.group) && arr.push(d.group), arr),
      []
    );
    const m = cs.length,
      clusters = new Array(m);
    const nodes = data.map((_, i) => create_nodes(data, i));

    const force = d3.layout
      .force()
      .nodes(nodes)
      .size([width, height])
      .gravity(0.03)
      .charge(0)
      .on('tick', tick)
      .start();
    const svg = d3
      .select('#vis')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const node = svg
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('g')
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut);
    node
      .append('circle')
      .on('mouseover', handleCircleMouseOver)
      .on('mouseout', handleCircleMouseOut)
      .style('fill', (d) => color(d.cluster))
      .style('stroke', (d) => color(d.cluster))
      .attr('r', (d) => d.radius);
    node
      .append('text')
      .attr('dy', '.3em')
      .style('text-anchor', 'middle')
      .style('background-color', (d) => color(d.cluster))
      .text((d) => d.text);

    function create_nodes(data, node_counter) {
      const i = cs.indexOf(data[node_counter].group),
        d = {
          ...data[node_counter],
          cluster: i,
          clusternumber: data[node_counter].group,
          radius: data[node_counter].perc * 6 + minRadius,
          x: Math.cos((i / m) * 2 * Math.PI) * 200 + width / 2 + Math.random(),
          y: Math.sin((i / m) * 2 * Math.PI) * 200 + height / 2 + Math.random(),
        };
      if (!clusters[i] || d.radius > clusters[i].radius) clusters[i] = d;
      return d;
    }

    function tick(e) {
      node
        .each(cluster(6 * e.alpha * e.alpha))
        .each(collide(0.09))
        .attr('transform', (d) => `translate(${d.x},${d.y})`);
    }

    function cluster(alpha) {
      return (d) => {
        const cluster = clusters[d.cluster];
        if (cluster === d) return;
        let x = d.x - cluster.x,
          y = d.y - cluster.y,
          l = Math.sqrt(x * x + y * y),
          r = d.radius + cluster.radius;
        if (l != r) {
          l = ((l - r) / l) * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          cluster.x += x;
          cluster.y += y;
        }
      };
    }

    function collide(alpha) {
      const quadtree = d3.geom.quadtree(nodes);
      return (d) => {
        const r = d.radius + minRadius + Math.min(padding, clusterPadding),
          nx1 = d.x - r,
          nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r;
        quadtree.visit((quad, x1, y1, x2, y2) => {
          if (quad.point && quad.point !== d) {
            let x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r =
                d.radius +
                quad.point.radius +
                (d.cluster === quad.point.cluster ? padding : clusterPadding);
            if (l < r) {
              l = ((l - r) / l) * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    }

    function handleMouseOver(d) {
      // div.transition().duration(200).style("opacity", .9);
      // div.html(<div><div class="container text-center"><img class='candidate' src="https://raw.githubusercontent.com/kvyb/DataVis/master/HTicons/${d.clusternumber}.png"></div><p class="tooltiptext">I said "${d.text}" ${d.wordcount} times,<br> which amounts to ${(Math.round(d.perc * 100) / 100)}%<br> of all words I used<br> in my speeches in 2016</p></div>)
      // .style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 28) + "px");
    }

    function handleMouseOut() {
      div.transition().duration(500).style('opacity', 0);
    }

    function handleCircleMouseOver() {
      d3.select(this)
        .attr('r', (d) => d.radius + 5)
        .style('stroke-width', 5)
        .style('stroke', (d) => d3.rgb(color(d.cluster)).darker(0.7));
    }

    function handleCircleMouseOut() {
      d3.select(this)
        .attr('r', (d) => d.radius)
        .style('stroke-width', 0);
    }
  }
);
