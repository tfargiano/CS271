/*
 * AreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the area chart
 * @param _data						-- the dataset 'household characteristics'
*/


class Timeline {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = [];

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

        // notes for wrangling the data:
            // MIDI ticks to milliseconds formula = 60000 / (BPM * PPQ)

        // algorithm
            // what we want: for each part playing, the height of the area chart will increase

        // (1) Group data by instrument (could be easier if already grouped in JSON)
        // (2) Group data by timecode 
        // (3) 

        // for each track if time is the same but note is not the same
        // count each note as one instrument 

        // and we were saying there's a world where we can do it by interval? Why did we want to sort again?



        // Update the visualization
        vis.updateVis();
    }



    /*
     * The drawing function
     */

    updateVis() {
        let vis = this;


    }
}