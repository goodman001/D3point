"use strict";

/* Boilerplate jQuery */
$(function() {
  $.get("res/data.csv")
   .done(function (csvData) {
     var data = d3.csvParse(csvData);
     visualize(data);
   })
  .fail(function(e) {
     alert("Failed to load CSV file!");
  });
});

/* Visualize the data in the visualize function */
var visualize = function(data) {
  var svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleBand()
    .rangeRound([0, width])
    .paddingInner(0.9)
    .align(0.8);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);

var z = d3.scaleOrdinal()
    .range(["#98abc5", "black", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

	d3.csv("res/data.csv", function(d, i, columns) {
      var t = 0;
	  for (i = 1; i < columns.length; ++i) 
		  t += d[columns[i]] = +d[columns[i]];
	  d.total = t;
	  
	  return d;
	}, function(error, data) {
	  if (error) throw error;
	  console.log(data);
	  var keys = data.columns.slice(1);
	  console.log(keys);
	  data.sort(function(a, b) { return b.total - a.total; });
	  //console.log(data);
	  x.domain(data.map(function(d) { return d.State; }));
	  y.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
	  z.domain(keys);

	  g.append("g")
		.selectAll("g")
		.data(d3.stack().keys(keys)(data))
		.enter().append("g")
		  .attr("fill", function(d) { if(d.key!="female"){return z(d.key);}else{return "white"} })
		.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("rect")
		  .attr("x", function(d) { return x(d.data.State); })
		  .attr("y", function(d) { return y(d[1]); })
		  .attr("height", function(d) { console.log(y(d[0]));console.log(y(d[1]));return y(d[0]) - y(d[1]); })
		  .attr("width", x.bandwidth());
    
	   g.append("g")
		.selectAll("g")
		.data(d3.stack().keys(keys)(data))
		.enter().append("g")
		  .attr("fill", function(d) { if(d.key!="female"){return z(d.key);}else{return "white"} })
		.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("circle")
		  .attr("r", 2)
		  .attr("cx", function(d) { return x(d.data.State)+1; })
		  .attr("cy", function(d) { return y(d[1]); })
      .attr("fill", function(d) { if(d[1] != 0){return "blue";}else{return "white"} });
    
	  g.append("g")
		.selectAll("g")
		.data(d3.stack().keys(keys)(data))
		.enter().append("g")
		  .attr("fill", function(d) { if(d.key!="female"){return z(d.key);}else{return "white"} })
		.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("circle")
		  .attr("r", 2)
		  .attr("cx", function(d) { return x(d.data.State)+1; })
		  .attr("cy", function(d) { return y(d[0]); })
	  	  .attr("fill", function(d) { if(d[0] != 0){return "orange";}else{return "white"} });
    
    g.append("g")
		.selectAll("g")
		.data(d3.stack().keys(keys)(data))
		.enter().append("g")
		  .attr("fill", function(d) { if(d.key!="female"){return z(d.key);}else{return "white"} })
		.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("circle")
		  .attr("r", function(d) { if(d[1] != 0 && d[0] != 0){return y(d[0]+d[1])/10;}else{return 0} })
		  .attr("cx", function(d) { return x(d.data.State)+1; })
		  .attr("cy", function(d) { return y(d[1])-20; })
      .attr("fill", function(d) { if(d[1] != 0 && d[0] != 0){return "Green";}else{return "white"} });
    
	  g.append("g")
		.selectAll("g")
		.data(d3.stack().keys(keys)(data))
		.enter().append("g")
		  .attr("fill", function(d) { if(d.key!="female"){return z(d.key);}else{return "white"} })
		.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("text")
		  .attr("x", function(d) { return x(d.data.State)-40; })
		  .attr("y", function(d) { return y(d[0])+3; })
	      .attr("fill", function(d) {if(d[0] != 0){return "orange";}else{return "white"}} )
	      .attr("dy", "0.02em")
	      .style("font-size", "10px")
		  .attr("text-anchor", "left")
		  .text(function(d) { if(d[0] != 0){return d[0]; }else{return "";}});
    
    g.append("g")
		.selectAll("g")
		.data(d3.stack().keys(keys)(data))
		.enter().append("g")
		  .attr("fill", function(d) { if(d.key!="female"){return z(d.key);}else{return "white"} })
		.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("text")
		  .attr("x", function(d) { return x(d.data.State)-40; })
		  .attr("y", function(d) { return y(d[1])+3; })
	      .attr("fill", function(d) { if(d[1] != 0){return "blue";}else{return "white"}})
	      .attr("dy", "0.02em")
	      .style("font-size", "10px")
		  .attr("text-anchor", "left")
		  .text(function(d) { if(d[1] != 0){return d[1]; }else{return "";}});
    
	  g.append("g")
		  .attr("class", "axis")
		  .attr("transform", "translate(0," + height + ")")
		  .call(d3.axisBottom(x));

	  g.append("g")
		  .attr("class", "axis")
		  .call(d3.axisLeft(y).ticks(null, "s"))
		.append("text")
		  .attr("x", 2)
		  .attr("y", y(y.ticks().pop()) + 0.5)
		  .attr("dy", "0.32em")
		  .attr("fill", "#000")
		  .attr("font-weight", "bold")
		  .attr("text-anchor", "start")
		  .text("Population");

	  var legend = g.append("g")
		  .attr("font-family", "sans-serif")
		  .attr("font-size", 10)
		  .attr("text-anchor", "end")
		.selectAll("g")
		.data(keys.slice().reverse())
		.enter().append("g")
		  .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

	  legend.append("rect")
		  .attr("x", width - 19)
		  .attr("width", 19)
		  .attr("height", 19)
		  .attr("fill", z);

	  legend.append("text")
		  .attr("x", width - 24)
		  .attr("y", 9.5)
		  .attr("dy", "0.32em")
		  .text(function(d) { return d; });
	});

};
