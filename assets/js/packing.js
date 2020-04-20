---
---
const diameter = 500;
const width = 500 - 28 - 30;
const height = 500 - 28 - 30;
const pad = 14;
const r = 5;

const color = d3.scaleSequential(d3.interpolateYlOrRd);

const depthColor = d3.scaleSequential([4, 0], d3.interpolateViridis);

// let focus;
// let rootFocus;
// let view;
// let node;

const tip = d3.select("body")
  .append("pre")
  .attr("id", "tooltip")
  .style("opacity", "0")
  .style("background-color", "rgba(255, 255, 255, 0.7)")
  .style("padding", "0px 5px")
  .style("border-radius", "8px");

d3.csv('{{ '/assets/data/dendrogram.csv' | prepend: site.baseurl }}', convert).then(data => {
  console.log(data);
  gData = data;
  draw();
  d3.select("g#packing")
    .attr("viewBox", [0, 0, width, height])
    .style("font", "10px sans-serif")
    .attr("text-anchor", "middle");
    // .on("click", () => zoom(rootFocus));

  // zoomTo([rootFocus.x, rootFocus.y, rootFocus.r * 2]);
});

// function zoomTo(v) {
//   // const k = width / v[2];
//   const k = 1;
//
//   view = v;
//
//   node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
//   node.attr("r", d => d.r * k);
// }

// function zoom(d) {
//   const focus0 = focus;
//
//   focus = d;
//
//   const transition = d3.select("svg#packing").transition()
//       .duration(d3.event.altKey ? 7500 : 750)
//       .tween("zoom", d => {
//         const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
//         return t => zoomTo(i(t));
//       });
//
//   // label
//   //   .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
//   //   .transition(transition)
//   //     .style("fill-opacity", d => d.parent === focus ? 1 : 0)
//   //     .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
//   //     .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
// }

function drawNodes(g, nodes) {
  console.log(nodes);
  let circles = g.selectAll('circle')
    .data(nodes, node => node.data.name)
    .enter()
    .append('circle')
      .attr('r', d => d.r ? d.r : r)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('id', d => garbageId(d))
      .attr('class', 'node')
      .attr('stroke', d => d.children? d3.lab(depthColor(d.height)).darker(): d3.lab(color(d.data.value)).darker())
      .style('fill', d => d.children? depthColor(d.height): color(d.data.value));
      // .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));
  // node = circles;
  setupEvents(g, circles);
}

function setupEvents(g, selection) {
  selection.on('mouseover.highlight', function(d) {
    let curr = d;
    while (curr.parent) {
      let baseId = garbageId(curr);
      let me = d3.select(`circle#${baseId}`);
      me.transition()
        .attr("stroke", d.children? d3.lab(depthColor(d.height)).brighter(): d3.lab(color(d.data.value)).brighter())
        .style("stroke-width", "1.5px");
      curr = curr.parent;
    }
    d3.select(`circle#${garbageId(curr)}`).transition()
      .attr("stroke", d.children? d3.lab(depthColor(d.height)).brighter(): d3.lab(color(d.data.value)).brighter())
      .style("stroke-width", "1.5px");
  });

  selection.on('mouseout.highlight', function(d) {
    let curr = d;
    while (curr.parent) {
      let baseId = garbageId(curr);
      let me = d3.select(`circle#${baseId}`);
      me.transition()
        .attr("stroke", d.children? d3.lab(depthColor(d.height)).darker(): d3.lab(color(d.data.value)).darker())
        .style("stroke-width", "1px");
      curr = curr.parent;
    }
    d3.select(`circle#${garbageId(curr)}`).transition()
      .attr("stroke", d.children? d3.lab(depthColor(d.height)).darker(): d3.lab(color(d.data.value)).darker())
      .style("stroke-width", "1px");
    // d3.select(this).transition()
    //   .attr("stroke", d.children? d3.lab(depthColor(d.height)).darker(): d3.lab(color(d.data.value)).darker())
    //   .style("stroke-width", "1px");
  });

  selection.on("mouseover.tooltip", function(d) {
    tip.text(`${d.data.name}\n#: ${d3.format("~s")(d.value)}\nlevel: ${d.depth}`);
    tip.transition().style("opacity", "1");
  }).on("mousemove.tooltip", d => {
    // get height of tooltip
    let bbox = tip.node().getBoundingClientRect();

    // https://stackoverflow.com/questions/4666367/how-do-i-position-a-div-relative-to-the-mouse-pointer-using-jquery
    tip.style("left", (d3.event.pageX) + "px")
    tip.style("top",  (d3.event.pageY - bbox.height) + "px");
  }).on("mouseout.tooltip", function(d) {
    tip.transition().style("opacity", "0");
  });
}

function showTooltip(g, node) {
  let d = node.datum;
  // get height of tooltip
  let bbox = tip.node().getBoundingClientRect();

  // https://stackoverflow.com/questions/4666367/how-do-i-position-a-div-relative-to-the-mouse-pointer-using-jquery
  tip.style("left", (d3.event.pageX) + "px")
  tip.style("top",  (d3.event.pageY - bbox.height) + "px");
  tip.text(`${d.name}\n#: ${d3.format("~s")(d.value)}`);
  tip.transition().style("opacity", "1");
}

function draw(time) {
  let data = gData;
  let [clusterJson, min, max] = time? filterData(data, time): filterData(data);
  color.domain([min, max]);
  data = clusterJson;

  let pack = data => d3.pack()
    .size([width - 2, height - 2])
    .padding(3)
  (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))

  data = pack(data);
  // focus = data;
  // rootFocus = data;

  let svg = d3.select("svg#packing")
      .style("width", diameter)
      .style("height", diameter);

  let plot = svg.select("g#plot")
    .attr("transform", `translate(${pad}, ${pad})`);

  drawNodes(plot.append("g"), data.descendants());
  drawLegend(min, max);
}

function garbageId(d) {
  let id = d.parent?
    d.parent.parent?
      d.parent.parent.parent?
        `${d.parent.parent.parent.data.name}_${d.parent.parent.data.name}_${d.parent.data.name}_${d.data.name}`.replace(/\s/g,'')
        :
        `${d.parent.parent.data.name}_${d.parent.data.name}_${d.data.name}`.replace(/\s/g,'')
      :
      `${d.parent.data.name}_${d.data.name}`.replace(/\s/g,'')
    :
    `${d.data.name}`.replace(/\s/g,'');
  return id;
}

function drawLegend(min, max) {
  let width = diameter + 20;
  let config = {
    "margin": {
      "left": 50,
      "right": 50,
      "top": 50,
      "bot": 50
    },
    "height": height - 200,
    "width": 8
  }
  // Sequential Legend created from following Tom MacWright's example
  // here: https://observablehq.com/@tmcw/d3-scalesequential-continuous-color-legend-example
  d3.select("svg#packing").select("g#legend").append("text")
    .attr("x", width - config.margin.right - 8)
    .attr("y", 2*config.margin.top - 5)
    .text("#");

  let legendScale = d3.scaleLinear()
    .domain(color.domain().reverse())
    .range([config.margin.top, config.height])

  let legendAxis = g => g
    .attr("class", `legend-axis`)
    .attr("transform", `translate(${width - config.margin.right}, ${config.margin.top})`)
    .attr("height", config.height)
    .call(d3.axisRight(legendScale)
      .tickFormat(d3.format("~s"))
      .ticks(config.height / 40)
      .tickSize(-config.width));

  let defs = d3.select("svg#packing").select("g#legend").append("defs");
  let linearGradient = defs.append("linearGradient")
      .attr("id", "linear-gradient")
      .attr("gradientTransform", "rotate(90)");

  linearGradient.selectAll("stop")
    .data(color.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: color(max - t) })))
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  d3.select("svg#packing").select("g#legend").append('g')
    .attr("id", "legend-color")
    .attr("transform", `translate(${width - config.margin.right - config.width}, ${config.margin.top})`)
    .append("rect")
    .attr('transform', `translate(0, ${config.margin.top})`)
	.attr("height", config.height - config.margin.top)
	.attr("width", config.width)
	.style("fill", "url(#linear-gradient)");

  d3.select("svg#packing").select("g#legend").append('g')
    .call(legendAxis);
}

function convert(d) {
  d['value'] = +d['value'];
  d['month'] = +d['month'];
  d['year'] = +d['year'];
  return d;
}

function filterData(data, time) {
  if (time) {
    let parts = time.split('-');
    data = data.filter(d => d['year'] == +parts[0] && d['month'] == +parts[1])
    console.log(time);
    console.log(data);
  }
  let cluster = new Map();

  for (row of data) {
    if (!cluster.has(row['Division'])) {
      cluster.set(row['Division'], {
        'name': row['Division'],
        'children': new Map()
      });
    }
    if (!cluster.get(row['Division'])['children'].has(row['Battalion'])) {
      cluster.get(row['Division'])['children'].set(row['Battalion'], {
        'name': row['Battalion'],
        'children': new Map()
      });
    }
    let value = 0;
    if (cluster.get(row['Division'])['children'].get(row['Battalion'])['children'].has(row['Station Area'])) {
      value = cluster.get(row['Division'])['children'].get(row['Battalion'])['children'].get(row['Station Area'])['value'];
    }
    cluster.get(row['Division'])['children'].get(row['Battalion'])['children'].set(row['Station Area'], {
      'name': row['Station Area'],
      'value': value + row['value']
    });
  }

  let min = -1, max = -1;
  let clusterJson = [];
  for (v of cluster.values()) {
    let second = [];
    for (v2 of v['children'].values()) {
      v2['children'] = [...v2['children'].values()];
      for (elem of v2['children'].values()) {
        if (min == -1 || min > elem.value) {
          min = elem.value;
        }
        if (max == -1 || max < elem.value) {
          max = elem.value;
        }
      }
      second.push(v2);
    }
    v['children'] = second;
    clusterJson.push(v);
  }
  clusterJson = {
    'name': 'Fire Department',
    'children': clusterJson
  };
  return [clusterJson, min, max];
}
