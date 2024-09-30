import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const ZoomableSunburstExploded = () => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 932;
    const radius = width / 6;

    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius(d => d.y0 * radius)
      .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

    const root = d3.partition()
      .size([2 * Math.PI, 1])
      (d3.hierarchy(data)
        .sum(d => d.size)
        .sort((a, b) => b.size - a.size));

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, width])
      .style("font", "10px sans-serif");

    svg.selectAll("path")
      .data(root.descendants().slice(1))
      .enter().append("path")
      .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
      .attr("d", arc)
      .append("title")
      .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

    function format(d) {
      return d3.format(",d")(d);
    }

    function color(name) {
      const scale = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));
      return scale(name);
    }
  }, []);

  return (
    <svg ref={svgRef} width="932" height="932"></svg>
  );
};

export default ZoomableSunburstExploded;
