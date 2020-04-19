---
---
const width = 954

d3.csv('{{ '/assets/data/dendrogram.csv' | prepend: site.baseurl }}', convert).then(data => {
  console.log(data);
  let clusterJson = filterData(data);
  console.log(clusterJson);
  data = clusterJson;
  let tree = data => {
    const root = d3.hierarchy(data).sort((a, b) => d3.descending(a.height, b.height) || d3.ascending(a.data.name, b.data.name));
    root.dx = 10;
    root.dy = width / (root.height + 1);
    return d3.cluster().nodeSize([root.dx, root.dy])(root);
  }

  const root = tree(data);
  const svg = d3.select("body").select("svg#dendrogram");

  svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
  .selectAll("path")
    .data(root.links())
    .join("path")
      .attr("d", d => `
        M${d.target.y},${d.target.x}
        C${d.source.y + root.dy / 2},${d.target.x}
         ${d.source.y + root.dy / 2},${d.source.x}
         ${d.source.y},${d.source.x}
      `);

  svg.append("g")
    .selectAll("circle")
    .data(root.descendants())
    .join("circle")
      .attr("cx", d => d.y)
      .attr("cy", d => d.x)
      .attr("fill", d => d.children ? "#555" : "#999")
      .attr("r", 2.5);

  svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
    .selectAll("text")
    .data(root.descendants())
    .join("text")
      .attr("x", d => d.y)
      .attr("y", d => d.x)
      .attr("dy", "0.31em")
      .attr("dx", d => d.children ? -6 : 6)
      .text(d => d.data.name)
    .filter(d => d.children)
      .attr("text-anchor", "end")
    .clone(true).lower()
      .attr("stroke", "white");

  // svg.attr("viewBox", autoBox);
});

function convert(d) {
  d['value'] = +d['value'];
  d['month'] = +d['month'];
  d['year'] = +d['year'];
  return d;
}

function filterData(data) {
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

  let clusterJson = []
  // for v in cluster.values():
  //     second = list()
  //     for v2 in v['children'].values():
  //         v2['children'] = list(v2['children'].values())
  //         second.append(v2)
  //     v['children'] = second
  //     cluster_json.append(v)
  for (v of cluster.values()) {
    let second = [];
    for (v2 of v['children'].values()) {
      v2['children'] = [...v2['children'].values()]
      second.push(v2);
    }
    v['children'] = second;
    clusterJson.push(v);
  }
  // cluster_json = {
  //     'name': 'Fire Department',
  //     'children': cluster_json
  // }
  clusterJson = {
    'name': 'Fire Department',
    'children': clusterJson
  }
  return clusterJson;
  // json.dumps(cluster_json, sort_keys=True)
  // # cluster_json
}

function autoBox() {
  document.body.appendChild(this);
  const {x, y, width, height} = this.getBBox();
  document.body.removeChild(this);
  return [x, y, width, height];
}
