var sel=document.getElementById("sel");
var index = sel.selectedIndex; // 
//alert(sel.options[0].value);
starts(sel.options[0].value);　
sel.onchange=function(){
	//alert(sel.options[sel.selectedIndex].value);
	starts(sel.options[sel.selectedIndex].value);　
}
　
//myselect.options[index].text;
function starts(filename){
	var token = "nxnYm1q36VZeWqNOBCnMzsKHz";
	// the geojson files are large, so loading them locally
	var urls = {
		basemap: "supervisor.geojson",
		streets: "https://data.sfgov.org/resource/7hfy-8sz8.geojson",
		arrests: "https://data.sfgov.org/resource/cuks-n6tp.json",
		ratefile:filename+".tsv"
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
    	//.domain([1, 10])
		.domain([2,4,6,8,10,12,14,16,18])
    	.rangeRound([10, 90]);
	var color = d3.scaleThreshold()
    	//.domain(d3.range(2, 10))
		.domain([2,4,6,8,10,12,14,16,18])
    	.range(d3.schemeCategory20);
	var div = d3.select("body").append("div")   
		.attr("class", "labeltip")               
		.style("opacity", 0); 
	/**/
	var g = {
		basemap: svg.append("g").attr("id", "basemap"),
		arrests: svg.append("g").attr("id", "arrests"),
		labeltip: svg.append("g").attr("id", "labeltip"),
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
    	.attr("transform", "translate(100,650)");
	gc.selectAll("rect")
	.data(color.range().map(function(d) {
		d = color.invertExtent(d);
		if (d[0] == null) d[0] = x.domain()[0];
		if (d[1] == null) d[1] = x.domain()[1];
		return d;
	}))
	.enter().append("rect")
    .attr("height", 10)
    .attr("x", function(d) { console.log(x(d[0]));return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

	gc.append("text")
		.attr("class", "caption")
		.attr("x", x.range()[0])
		.attr("y", -6)
		.attr("fill", "#000")
		.attr("text-anchor", "start")
		.attr("font-weight", "bold")
		.text("status rate");

	gc.call(d3.axisBottom(x)
		.tickSize(13)
		.tickFormat(function(x, i) { return i ? x : "%"; })
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
		.attr("fill", function(d) {return color(d.rate = unemployment.get(d.properties.supervisor)); })
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
			d3.select(this).transition().duration(300).style("opacity",0.8);
			div.transition().duration(300)
			.style("opacity", 1)
			div.text(d.properties.supname + " : " + d.rate)
			.style("left", (coords[0]) + "px")
			.style("top", (coords[1]) + "px");
		})
		.on("mouseout", function(d) {
			d3.select(this)
			.transition().duration(300)
			.style("opacity", 1);
			div.transition().duration(300)
			.style("opacity", 0);
		});
	}
	function translate(x, y){
		return "translate(" + String(x) + "," + String(y) + ")";
	}
}