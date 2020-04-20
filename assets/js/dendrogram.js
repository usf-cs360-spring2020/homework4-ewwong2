---
---
const svg = d3.select("body").select("svg#dendrogram");

const width = 960;
const height = 600;
const radius = width / 2;

const tree = d3.cluster().size([2 * Math.PI, radius - 100]);

const color = d3.scaleSequential(d3.interpolateYlOrRd);

const tip = d3.select("body")
  .append("pre")
  .attr("id", "tooltip")
  .style("opacity", "0")
  .style("background-color", "rgba(255, 255, 255, 0.7)")
  .style("padding", "0px 5px")
  .style("border-radius", "8px");

var gData;

d3.csv('{{ '/assets/data/dendrogram.csv' | prepend: site.baseurl }}', convert).then(data => {
  console.log(data);
  gData = data;
  draw();
  svg.attr("viewBox", autoBox);
  svg.select("g#links").attr("transform", "translate(0,100)");
  svg.select("g#circles").attr("transform", "translate(0,100)");
  svg.select("g#labels").attr("transform", "translate(0,100)");
});

window.onload = function () {
  document.getElementById("filter").addEventListener("input", function (e) {
    draw(this.value)
  });
}

function draw(time) {
  let data = gData;
  let [clusterJson, min, max] = time? filterData(data, time): filterData(data);
  color.domain([min, max]);
  console.log(clusterJson);
  data = clusterJson;

  let root = tree(d3.hierarchy(data)
      .sort((a, b) => d3.ascending(a.data.name, b.data.name)));

  d3.select("g#links").html(null);
  drawLinks(root);
  d3.select("g#circles").html(null);
  let circles = drawCircles(root);
  circleInteractivity(circles);
  d3.select("g#labels").html(null);
  drawLabels(root);
  d3.select("g#legend").html(null);
  drawLegend(min, max);
}

function drawLinks(root) {
  svg.select("g#links")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
  .selectAll("path")
    .data(root.links())
    .join("path")
      .attr("d", d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y))
      .attr("id", d => `${garbageId(d.target)}_link`);
}

function circleInteractivity(circles) {
  circles.on("mouseover", function(d) {
    let curr = d;
    while (curr.parent) {
      let baseId = garbageId(curr);
      let me = d3.select(`circle#${baseId}`);
      me.raise();
      me.transition().attr("stroke", "#f24141")
        .style("stroke-width", "2px");
      d3.select(`path#${baseId}_link`).transition()
        .attr("stroke", "#f24141")
        .style("stroke-width", "2px");
      curr = curr.parent;
    }
    let me = d3.select(`circle#${garbageId(curr)}`);
    me.raise();
    me.transition().attr("stroke", "#f24141")
      .style("stroke-width", "2px");

    let shadow = d3.select(d.parent? `text#shadow_${d.parent.data.name}_${d.data.name}`.replace(/\s/g,''): "text#shadow_root");
    let text = d3.select(d.parent? `text#${d.parent.data.name}_${d.data.name}`.replace(/\s/g,''): "text#root");
    shadow.raise();
    text.raise();
    text.attr("font-weight", "bold");
    shadow.attr("font-weight", "bold");

    // get height of tooltip
    let bbox = tip.node().getBoundingClientRect();

    // https://stackoverflow.com/questions/4666367/how-do-i-position-a-div-relative-to-the-mouse-pointer-using-jquery
    tip.style("left", (d3.event.pageX) + "px")
    tip.style("top",  (d3.event.pageY - bbox.height) + "px");
    tip.text(d.children? `${d.data.name}`:`${d.data.name}\n#: ${d3.format("~s")(d.data.value)}`);
    tip.transition().style("opacity", "1");
  }).on("mouseout", function(d) {
    let curr = d;
    while (curr.parent) {
      let baseId = garbageId(curr);
      let me = d3.select(`circle#${baseId}`);
      me.raise();
      me.transition()
        .attr("stroke", curr.children? "black": d3.lab(color(curr.data.value)).darker())
        .style("stroke-width", "1px");
      d3.select(`path#${baseId}_link`).transition()
        .attr("stroke", "black")
        .style("stroke-width", "1px");
      curr = curr.parent;
    }
    let me = d3.select(`circle#${garbageId(curr)}`);
    me.raise();
    me.transition()
      .attr("stroke", "black")
      .style("stroke-width", "1px");

    let shadow = d3.select(d.parent? `text#shadow_${d.parent.data.name}_${d.data.name}`.replace(/\s/g,''): "text#shadow_root");
    let text = d3.select(d.parent? `text#${d.parent.data.name}_${d.data.name}`.replace(/\s/g,''): "text#root");
    text.attr("font-weight", "normal");
    shadow.attr("font-weight", "normal");
    tip.transition().style("opacity", "0");
  });
}

// This should prob be a loop... but whatever
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

function drawCircles(root) {
  let circles = svg.select("g#circles")
    .selectAll("circle")
    .data(root.descendants())
    .join("circle")
      .attr("transform", d => `
        rotate(${d.x * 180 / Math.PI - 90})
        translate(${d.y},0)
      `)
      .attr("fill", d => d.children? "#999": color(d.data.value))
      .attr("stroke", d => d.children? "black": d3.lab(color(d.data.value)).darker())
      .attr("r", 5)
      .attr("id", d => garbageId(d));
  return circles;
}

function drawLabels(root) {
  svg.select("g#labels")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .attr("transform", d => `
      rotate(${d.x * 180 / Math.PI - 90})
      translate(${d.y},0)
      rotate(${d.x >= Math.PI ? 180 : 0})
    `)
    .attr("id", d => d.parent? `${d.parent.data.name}_${d.data.name}`.replace(/\s/g,''): "root")
    .attr("dy", "0.31em")
    .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
    .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
    .text(d => d.data.name)
  .clone(true).lower()
    .attr("stroke", "white")
    .attr("id", d => d.parent? `shadow_${d.parent.data.name}_${d.data.name}`.replace(/\s/g,''): "shadow_root");
}

function drawLegend(min, max) {
  let width = radius + 70;
  let config = {
    "margin": {
      "left": 50,
      "right": 50,
      "top": -100,
      "bot": 50
    },
    "height": height - 300,
    "width": 15
  }
  // Sequential Legend created from following Tom MacWright's example
  // here: https://observablehq.com/@tmcw/d3-scalesequential-continuous-color-legend-example
  svg.select("g#legend").append("text")
    .attr("x", width - config.margin.right - 10)
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

  let defs = svg.select("g#legend").append("defs");
  let linearGradient = defs.append("linearGradient")
      .attr("id", "linear-gradient")
      .attr("gradientTransform", "rotate(90)");

  linearGradient.selectAll("stop")
    .data(color.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: color(max - t) })))
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  svg.select("g#legend").append('g')
    .attr("id", "legend-color")
    .attr("transform", `translate(${width - config.margin.right - config.width}, ${config.margin.top})`)
    .append("rect")
    .attr('transform', `translate(0, ${config.margin.top})`)
	.attr("height", config.height - config.margin.top)
	.attr("width", config.width)
	.style("fill", "url(#linear-gradient)");

  svg.select("g#legend").append('g')
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

  let mapping = {
    'B01': 'D02',
    'B04': 'D02',
    'B05': 'D02',
    'B07': 'D02',
    'B08': 'D02',
    'B02': 'D03',
    'B03': 'D03',
    'B06': 'D03',
    'B09': 'D03',
    'B10': 'D03'
  };

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

function autoBox() {
  const {x, y, width, height} = this.getBBox();
  return [x, y, width, height + 200];
}
