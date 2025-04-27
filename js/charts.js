function renderAuditRatioPieChart(up, down) {
    const container = document.getElementById('auditRatio-graph');
    if (!container) {
        console.error('Element with ID auditRatio-graph not found');
        return;
    }

    // Determine the appropriate unit based on the largest value
    const maxValue = Math.max(up, down);
    
    let unit, divisor;
    if (maxValue >= 1_000_000_000) {
        unit = 'GB';
        divisor = 1_000_000_000;
    } else if (maxValue >= 1_000_000) {
        unit = 'MB';
        divisor = 1_000_000;
    } else if (maxValue >= 1_000) {
        unit = 'KB';
        divisor = 1_000;
    } else {
        unit = 'Bytes';
        divisor = 1;
    }

    // Convert values to appropriate unit
    const upFormatted = (up / divisor).toFixed(1);
    const downFormatted = (down / divisor).toFixed(1);

    // Setup SVG dimensions
    const width = container.clientWidth || 300;
    const height = 250;
    const radius = Math.min(width, height) / 2.5;
    
    // Clear any existing chart
    container.innerHTML = '';
    
    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    container.appendChild(svg);
    
    // Create group element for the chart
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${width/2}, ${height/2})`);
    svg.appendChild(g);
    
    // Define color scheme
    const colors = ["#4CAF50", "#2196F3"];
    
    // Create data for the pie chart
    const data = [
        { label: `Given (${upFormatted} ${unit})`, value: up },
        { label: `Received (${downFormatted} ${unit})`, value: down }
    ];
    
    // Calculate the total
    const total = data.reduce((sum, d) => sum + d.value, 0);
    
    // Function to calculate arc path
    function arcPath(startAngle, endAngle) {
        const start = polarToCartesian(radius, startAngle);
        const end = polarToCartesian(radius, endAngle);
        const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
        
        return [
            "M", 0, 0,
            "L", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y,
            "Z"
        ].join(" ");
    }
    
    // Helper function to convert polar coordinates to Cartesian
    function polarToCartesian(radius, angle) {
        return {
            x: radius * Math.cos(angle - Math.PI/2),
            y: radius * Math.sin(angle - Math.PI/2)
        };
    }
    
    // Draw pie slices
    let currentAngle = 0;
    data.forEach((d, i) => {
        const angle = (d.value / total) * (2 * Math.PI);
        const endAngle = currentAngle + angle;
        
        // Create slice
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", arcPath(currentAngle, endAngle));
        path.setAttribute("fill", colors[i]);
        path.setAttribute("stroke", "#fff");
        path.setAttribute("stroke-width", "1");
        
        // Add hover effect
        path.addEventListener("mouseover", () => {
            path.setAttribute("opacity", "0.8");
        });
        path.addEventListener("mouseout", () => {
            path.setAttribute("opacity", "1");
        });
        
        g.appendChild(path);
        
        // Add label
        const midAngle = currentAngle + angle / 2;
        const labelRadius = radius * 0.7;
        const labelPos = polarToCartesian(labelRadius, midAngle);
        
        if (d.value > 0) {
            const percent = ((d.value / total) * 100).toFixed(1);
            
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", labelPos.x);
            label.setAttribute("y", labelPos.y);
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("dominant-baseline", "middle");
            label.setAttribute("fill", "#fff");
            label.setAttribute("font-weight", "bold");
            label.textContent = `${percent}%`;
            g.appendChild(label);
        }
        
        currentAngle = endAngle;
    });
    
    // Create legend
    const legendG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    legendG.setAttribute("transform", `translate(${width/2}, ${height - 30})`);
    svg.appendChild(legendG);
    
    data.forEach((d, i) => {
        const legendItem = document.createElementNS("http://www.w3.org/2000/svg", "g");
        legendItem.setAttribute("transform", `translate(${(i - data.length/2) * 150 + 75}, 0)`);
        
        // Legend color box
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", "15");
        rect.setAttribute("height", "15");
        rect.setAttribute("fill", colors[i]);
        rect.setAttribute("x", "-70");
        legendItem.appendChild(rect);
        
        // Legend text
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "-50");
        text.setAttribute("y", "12");
        text.textContent = d.label;
        legendItem.appendChild(text);
        
        legendG.appendChild(legendItem);
    });
}

export { renderAuditRatioPieChart };