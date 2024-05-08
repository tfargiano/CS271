/*
 * Timeline - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the area chart
 * @param _data						-- the MIDI dataset as a JSON
*/

class Timeline {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.inputData = data;
        this.updatedData = [];
        this.displayData = [];
        this.initVis();
        this.initArrow();
    }

    /*
     * Initialize visualization (static content; e.g. SVG area, axes, brush component)
     */

    initVis() {
        let vis = this;

        vis.margin = {top: 50, right: 10, bottom: 40, left: 40};

        // gets widths based on parent element
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 400 - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");
        
        vis.colorScale = d3.scaleLinear().domain([-1, -0.5, 0, 0.5, 1]).range(["#ffffff", "#9999ff", "#0000ff", "#0000cc","#000000"]);

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

        // Append area gradient so it is similarly behind the brush overlaay
        vis.gradientDefs = vis.svg.append("defs")
            .append("linearGradient")
            .attr("id", "velocityGradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        // Append the area path that uses the gradient
        vis.gradient = vis.svg.append("path")
            .attr("classs", "gradient");

        // Add X-axis Label
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.width / 2)  // Position at the middle of the x-axis
            .attr("y", vis.height + vis.margin.bottom - 10)  // Adjust position to just below the x-axis
            .text("Time (s)");  // Replace with your actual axis description

        // Add Y-axis Label
        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")  // Rotate label for vertical orientation
            .attr("y", -vis.margin.left + 15)  // Position to the left of the y-axis
            .attr("x", -vis.height / 2)  // Position at the middle of the y-axis, adjusted for height
            .text("Number of Parts Playing");  // Replace with your actual axis description

        let brushGroup = vis.svg.append("g")
            .attr("class", "brush")
        
        let brush = d3.brushX()
            .extent([[0,0], [vis.width, vis.height]])
            .on("start brush end", (event) => {
                const { selection } = event;
                if (selection) {
                    // Convert pixel coordinates to data indices or keys
                    const [s0, s1] = selection.map(d => Math.floor(d / vis.width * vis.updatedData.length));

                    // Check if indices are within bounds
                    if (s0 < 0 || s0 >= vis.updatedData.length || s1 < 0 || s1 >= vis.updatedData.length) {
                        console.error("Selection out of bounds:", s0, s1);
                        return;
                    }

                     // Retrieve all intervals between the indices s0 and s1
                    let selectedIntervals = vis.updatedData.slice(s0, s1 + 1);
                    if (!selectedIntervals.length) {
                        console.error("No data in the selected range:", s0, s1);
                        return;
                    }

                    // send intervals to arrow to update
                    arrowBrushed(selectedIntervals);

                    // Check if data at indices is defined
                    if (!vis.updatedData[s0] || !vis.updatedData[s1]) {
                        console.error("Undefined intervals at indices:", s0, s1);
                        return;
                    }

                    let ticks = [vis.updatedData[s0].startTick, vis.updatedData[s1].endTick];
                    console.log(ticks);

                    let zoomedRegion;
                    zoomedRegion = new ZoomedRegion("focusRegion", this.inputData, ticks, badItems)
                }
            })
            .on("end", function(event) {
                if (!event.selection) {
                    vis.arrow.resetArrow(); // Reset arrow if there's no active selection
                }
            });

        brushGroup.call(brush);

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    // updates color scale for gradient based on velcoity averages of intervals in the piece
    updateColorScaleDomain(data) {
        const velocities = data.map(d => d.velocityAvg);
        const minVelocity = d3.min(velocities);
        const maxVelocity = d3.max(velocities);

        // Create an array of five evenly spaced values across the velocity range
        let domainValues = Array.from({length: 5}, (v, i) => minVelocity + i * (maxVelocity - minVelocity) / 4);

        return domainValues;
    }

    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        vis.updatedData = processMusicData(vis.inputData);
        console.log(vis.updatedData);

        // Update the color scale domain with interpolated values
        let domainValues = vis.updateColorScaleDomain(vis.updatedData);
        vis.colorScale.domain(domainValues);

        let numStops = vis.updatedData.length;
        vis.gradientDefs.selectAll("stop")
            .data(vis.updatedData)
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

        vis.x.domain(d3.extent(vis.updatedData, d => d.startTime));
        // makes y-axis max slightly bigger than the max
	    // let yMax = Math.ceil(12 * 1.1 / 10) * 10;
        vis.y.domain([0, 14]);

        // Compute axis mark values for every 100 seconds 
        let startTime = d3.min(vis.updatedData, d => d.startTime);
        let endTime = d3.max(vis.updatedData, d => d.startTime);
        let axisMarkValues = d3.range(startTime, endTime, 100); 

        vis.area = d3.area()
            .curve(d3.curveStepAfter)
            .x(d => vis.x(d.startTime))
            .y0(vis.height)
            .y1(function (d) {
                return(vis.y(Object.values(d.instruments).reduce((a, b) => a + b, 0)));   
            });

        vis.timePath.datum(vis.updatedData)
            .attr("d", vis.area)
            .attr("fill", "#C3B1E1")
            .attr("stroke", "#884EA0")
            .attr("stroke-width", 1);

        // Draw the area
        vis.gradient.datum(vis.updatedData) // Bind data
            .attr("d", vis.area)
            .attr("fill", "url(#velocityGradient)") // Use the gradient for fill
            .attr("stroke", "#884EA0")
            .attr("stroke-width", 1);

        // Configure x-axis with custom ticks
        vis.xAxis = d3.axisBottom(vis.x)
            .tickValues(axisMarkValues)
            .tickFormat(d => `${d}s`);  // Convert milliseconds to seconds for display

        // Update x-axis with new configuration
        vis.svg.select(".x-axis").call(vis.xAxis);

        // Update axes
        vis.svg.select(".y-axis").call(vis.yAxis);
        vis.svg.select(".x-axis").call(vis.xAxis);

        // add legend
        vis.legendGroup = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${(vis.width / 2)}, 0)`);

        // Create legend
        vis.legend = new Legend(vis.colorScale, {
            title: "Average Velocity",
            ticks: 0,
            tickFormat: ".2f",
            tickSize: 10,
            width: 200,
            height: 50,
            labelFormat: ".2f"
        });

        // call the legend
        vis.legendGroup = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${0}, -40)`);

        // Append the legend SVG node to the group
        vis.legendGroup.node().appendChild(vis.legend);
    }

    initArrow() {
        let vis = this;
        // Set the position to the upper right corner, taking into account the margin and desired offset
        let position = { x: vis.width - 10, y: 20 }; // Adjusted for upper right
        let scale = 0.66; // Adjust scale according to the available space
        vis.arrow = new stereoPanArrow(vis.parentElement, position, scale);
    }

}