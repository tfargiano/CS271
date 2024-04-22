/*
 * Timeline - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the area chart
 * @param _data						-- the MIDI dataset as a JSON
*/


class Timeline {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = [];

        console.log(this.data);
        this.initVis();
    }

    /*
     * Initialize visualization (static content; e.g. SVG area, axes, brush component)
     */

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 10, bottom: 20, left: 40};

        // gets widths based on parent element
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 300 - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");
        
        vis.colorScale = d3.scaleLinear().domain([0,1]).range(["#0000ff", "#ffff00"]);

        // Scales and axes
        vis.x = d3.scaleTime()
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .ticks(6);

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");  

        // Append a path for the area function, so that it is later behind the brush overlay
        vis.timePath = vis.svg.append("path")
            .attr("class", "area");

        // Append area gradient  so it is similarly behind the brush overlaay
        vis.gradient = vis.svg.append("defs")
            .append("linearGradient")
            .attr("id", "velocityGradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        let brushGroup = vis.svg.append("g")
            .attr("class", "brush")
        
        let brush = d3.brushX()
                .extent([[0,0], [vis.width, vis.height]])
                .on("start brush end", (event) => {
                    const { selection } = event;
                    if (selection) {
                        const [s0, s1] = selection;
                        const fromDate = vis.x.invert(s0);
                        const toDate = vis.x.invert(s1);
                        brushed(fromDate, toDate);

                        // pass the selection (i.e. filtered data) to zoomedRegion class ??
                        // annika code
                        let zoomedRegion;
                        zoomedRegion = new ZoomedRegion("zoomedRegion", selection)
                    }
                });
        brushGroup.call(brush);

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }


    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        vis.displayData = processMusicData(vis.data);
        console.log(vis.displayData);

        const numStops = vis.displayData.length;
        vis.gradient.selectAll("stop")
            .data(vis.displayData)
            .enter()
            .append("stop")
            .attr("offset", (d, i) => `${(i / (numStops - 1)) * 100}%`)
            .attr("stop-color", d => vis.colorScale(d.velocityAvg)); 

        // Update the visualization
        vis.updateVis();
    }


    /*
     * The drawing function
     */

    updateVis() {
        let vis = this;
        // make the selection get the start tick and end tick

        vis.x.domain(d3.extent(vis.displayData, d => d.startTime));
        // makes y-axis max slightly bigger than the max
	    let yMax = Math.ceil(12 * 1.1 / 10) * 10;
        vis.y.domain([0, yMax]);

        vis.area = d3.area()
            .curve(d3.curveStepAfter)
            .x(d => vis.x(d.startTime))
            .y0(vis.height)
            .y1(function (d) {
                return(vis.y(Object.values(d.instruments).reduce((a, b) => a + b, 0)));   
            });

        vis.timePath.datum(vis.displayData)
            .attr("d", vis.area)
            .attr("fill", "#C3B1E1")
            .attr("stroke", "#884EA0")
            .attr("stroke-width", 1);

        // fill attribute we can change based on velocity data
        // idea 1: color bar that is continuous
        // idea 2: color bar that is discrete, and perhaps contains only x amount of levels scaled by max(velocity)
        // .attr("fill", function(d) { return (d.val > c ? "orange" : "yellow"); });

        // Draw the area
        vis.svg.append("path")
            .datum(vis.displayData) // Bind data
            .attr("d", vis.area)
            .attr("fill", "url(#velocityGradient)") // Use the gradient for fill
            .attr("stroke", "#884EA0")
            .attr("stroke-width", 1);

        // Update axes
        vis.svg.select(".y-axis").call(vis.yAxis);
        vis.svg.select(".x-axis").call(vis.xAxis);
    }
}