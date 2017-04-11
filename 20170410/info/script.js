var token = "nxnYm1q36VZeWqNOBCnMzsKHz";

// the geojson files are large, so loading them locally
var urls = {
  basemap: "supervisor.geojson",
  streets: "https://data.sfgov.org/resource/7hfy-8sz8.geojson",
  arrests: "https://data.sfgov.org/resource/cuks-n6tp.json",
  ratefile:"test.tsv"
};

// calculate date range
var start = d3.timeDay.offset(new Date(), -21);
var end = d3.timeDay.ceil(d3.timeDay.offset(start, 6));
var format = d3.timeFormat("%Y-%m-%d");
console.log(format(start), format(end));

// add parameters to arrests url
urls.arrests += "?$$app_token=" + token;
urls.arrests += "&$where=starts_with(resolution, 'ARREST')";
urls.arrests += " AND date between '" + format(start) + "'";
urls.arrests += " and '" + format(end) + "'";

var svg = d3.select("body").select("svg");
/**/
var unemployment = d3.map();
var x = d3.scaleLinear()
    .domain([1, 10])
    .rangeRound([600, 860]);
var color = d3.scaleThreshold()
    .domain(d3.range(2, 10))
    .range(d3.schemeBlues[9]);
var div = d3.select("body").append("div")   
  .attr("class", "tooltip")               
  .style("opacity", 0); 
/**/
var g = {
  basemap: svg.append("g").attr("id", "basemap").attr("transform", "translate(" + 0 + ", " + (50) + ")"),
  arrests: svg.append("g").attr("id", "arrests"),
  tooltip: svg.append("g").attr("id", "tooltip"),
  details: svg.append("g").attr("id", "details")
};

// https://github.com/d3/d3-geo#conic-projections
var projection = d3.geoConicEqualArea();
var path = d3.geoPath().projection(projection);

// http://mynasadata.larc.nasa.gov/latitudelongitude-finder/
// center on san francisco [longitude, latitude]
// choose parallels on either side of center
projection.parallels([37.692514, 37.840699]);

// rotate to view we usually see of sf
projection.rotate([122, 0]);

// we want both basemap and streets to load before arrests
// https://github.com/d3/d3-queue
var q = d3.queue()
  .defer(d3.json, urls.basemap)
  .defer(d3.tsv, urls.ratefile, function(d) { unemployment.set(d.supervisor, +d.rate); })
  .await(ready);
/* top tip */
var gc = svg.append("g")
    .attr("transform", "translate(-450,700)");

gc.selectAll("rect")
  .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 10)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

gc.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Unemployment rate");

gc.call(d3.axisBottom(x)
    .tickSize(13)
    .tickFormat(function(x, i) { return i ? x : x + "%"; })
    .tickValues(color.domain()))
	.select(".domain")
	.remove();
/**/
function ready(error, basemap) {
	if (error) throw error;
  console.log("basemap", basemap);

  // make sure basemap fits in projection
  projection.fitSize([960, 600], basemap);
  console.log();
  // draw basemap
  var land = g.basemap.selectAll("path.land")
    .data(basemap.features)
    .enter()
    .append("path")
	.attr("fill", function(d) {console.log(color(d.rate = unemployment.get(d.properties.supervisor))); return color(d.rate = unemployment.get(d.properties.supervisor)); })
    .attr("d", path)
    .attr("class", "land");
	land.on("mouseover", function(d) {
		d3.select(this).transition().duration(300).style("opacity", 1);
		div.transition().duration(300)
		.style("opacity", 1)
		div.text(d.properties.supname + " : " + d.properties.supname)
		.style("left", (d3.event.pageX) + "px")
		.style("top", (d3.event.pageY -30) + "px");
      
    })
    .on("mousemove", function(d) {
		var coords = d3.mouse(g.basemap.node());
		d3.select(this).transition().duration(300).style("opacity", 1);
		div.transition().duration(300)
		.style("opacity", 1)
		div.text(d.properties.supname + " : " + d.properties.supname)
		.style("left", (coords[0]) + "px")
		.style("top", (coords[1]) + "px");
    })
    .on("mouseout", function(d) {
		d3.select(this)
		.transition().duration(300)
		.style("opacity", 0.8);
		div.transition().duration(300)
		.style("opacity", 0);
    });
}
function drawMap(error, basemap, streets) {
  if (error) throw error;
  console.log("basemap", basemap);
  console.log("streets", streets);

  // make sure basemap fits in projection
  projection.fitSize([960, 600], basemap);

  // draw basemap
  var land = g.basemap.selectAll("path.land")
    .data(basemap.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "land");

  g.basemap.selectAll("path.street")
    .data(streets.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "street");

  // used to show neighborhood outlines on top of streets
  g.basemap.selectAll("path.neighborhood")
    .data(basemap.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "neighborhood")
    .each(function(d) {
      // save selection in data for interactivity
      d.properties.outline = this;
    });

  // setup tooltip (shows neighborhood name)
  var tip = g.tooltip.append("text").attr("id", "tooltip");
  tip.attr("text-anchor", "end");
  tip.attr("dx", -5);
  tip.attr("dy", -5);
  tip.style("visibility", "hidden");

  // add interactivity
  land.on("mouseover", function(d) {
      tip.text(d.properties.name);
      tip.style("visibility", "visible");

      d3.select(d.properties.outline).raise();
      d3.select(d.properties.outline).classed("active", true);
    })
    .on("mousemove", function(d) {
      var coords = d3.mouse(g.basemap.node());
      tip.attr("x", coords[0]);
      tip.attr("y", coords[1]);
    })
    .on("mouseout", function(d) {
      tip.style("visibility", "hidden");
      d3.select(d.properties.outline).classed("active", false);
    });

  d3.json(urls.arrests, drawArrests);
}

function drawArrests(error, arrests) {
  if (error) throw error;
  console.log("arrests", arrests);

  var symbols = g.arrests.selectAll("circle")
    .data(arrests)
    .enter()
    .append("circle")
    .attr("cx", function(d) { return projection([+d.x, +d.y])[0]; })
    .attr("cy", function(d) { return projection([+d.x, +d.y])[1]; })
    .attr("r", 5)
    .attr("class", "symbol");

  // add details widget
  // https://bl.ocks.org/mbostock/1424037
  var details = g.details.append("foreignObject")
    .attr("id", "details")
    .attr("width", 960)
    .attr("height", 600)
    .attr("x", 0)
    .attr("y", 0);

  var body = details.append("xhtml:body")
    .style("text-align", "left")
    .style("background", "none")
    .html("<p>N/A</p>");

  details.style("visibility", "hidden");

  symbols.on("mouseover", function(d) {
    d3.select(this).raise();
    d3.select(this).classed("active", true);

    body.html("<table border=0 cellspacing=0 cellpadding=2>" + "\n" +
      "<tr><th>Incident:</th><td>" + d.incidntnum + "</td></tr>" + "\n" +
      "<tr><th>Date:</th><td>" + new Date(d.date).toDateString() + "</td></tr>" + "\n" +
      "<tr><th>Time:</th><td>" + d.time + "</td></tr>" + "\n" +
      "<tr><th>Category:</th><td>" + d.category + "</td></tr>" + "\n" +
      "<tr><th>Description:</th><td>" + d.descript + "</td></tr>" + "\n" +
      "</table>");

    details.style("visibility", "visible");
  });

  symbols.on("mouseout", function(d) {
    d3.select(this).classed("active", false);
    details.style("visibility", "hidden");
  });
}

function translate(x, y) {
  return "translate(" + String(x) + "," + String(y) + ")";
}