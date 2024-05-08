class stereoPanArrow {
    constructor(parentElement, position, scale) {
        this.parentElement = parentElement;
        this.position = position;
        this.scale = scale;
        this.angle = 0; // Default angle pointing down
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.svg = d3.select("#" + vis.parentElement).select("svg");

        // Calculate the scaled dimensions of the arrow
        let arrowWidth = 60 * vis.scale; // Width of the arrow at its base
        let arrowHeight = 105 * vis.scale; // Total height of the arrow

        // Scale and position the arrow group
        vis.arrowGroup = vis.svg.append('g')
            .attr('transform', `translate(${vis.position.x}, ${vis.position.y})`);

        // Define the arrow coordinates such that the centroid is around (0,0)
        let initialPoints = [
            `0,${-arrowHeight / 6}`,  // Tip of the arrow, vertically centered
            `${arrowWidth / 2},${5 * arrowHeight / 6}`,  // Right base
            `0,${arrowHeight / 2}`,  // Middle waist, vertically lower than the tip
            `${-arrowWidth / 2},${5 * arrowHeight / 6}`,  // Left base
            `0,${-arrowHeight / 6}`  // Back to tip, creates closed shape
        ].join(" ");

        vis.arrowGroup.append('polygon')
            .attr('points', initialPoints)
            .attr('fill', '#FF0000')
            .attr('stroke', '#000000')
            .attr('stroke-width', 1.5)
            .attr('transform', `rotate(${this.angle}, 0, 0)`); // Rotate around the center (0,0)
    }

    updateVis(intervals) {
        let vis = this;
        let avgAngle = (intervals[0].stereoPanningAvg + intervals[1].stereoPanningAvg) / 2;
        avgAngle = Math.max(-90, Math.min(90, avgAngle));
        vis.angle = avgAngle;

        // Update the angle of the arrow
        vis.arrowGroup.select('polygon')
            .transition()
            .duration(350)
            .attr('transform', `rotate(${vis.angle}, 0, 0)`); // Ensure rotation is about the centroid
    }

    resetArrow() {
        let vis = this;
        vis.angle = 0; // Reset angle to default
    
        // Apply the reset angle as a rotation to the arrow
        vis.arrowGroup.select('polygon')
            .transition() // Smooth transition for the rotation
            .duration(500) // Transition over 100 milliseconds
            .attr('transform', `rotate(${vis.angle}, 0, 0)`); // Rotate around the center
    }
}
