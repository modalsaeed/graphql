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
function renderSkillsBarChart(skillsData, skillHistoryData) {
    const container = document.getElementById('skills-graph');
    const margin = { top: 20, right: 30, bottom: 40, left: 150 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = Math.max(300, skillsData.length * 35) - margin.top - margin.bottom;
    
    // Clear previous content
    container.innerHTML = '';
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width + margin.left + margin.right);
    svg.setAttribute('height', height + margin.top + margin.bottom);
    container.appendChild(svg);
    
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
    svg.appendChild(g);
    
    // Sort skills by value in descending order
    const sortedSkills = [...skillsData].sort((a, b) => b.value - a.value);
    
    // Find max value for scaling
    const maxValue = Math.max(...sortedSkills.map(skill => skill.value));
    
    // Create scales
    const xScale = value => (value / maxValue) * width;
    const yScale = index => index * (height / sortedSkills.length);
    
    // Create color scale
    const getBarColor = index => {
        const hue = (index * 220 / sortedSkills.length) % 360;
        return `hsl(${hue}, 70%, 60%)`;
    };
    
    // Add bars
    sortedSkills.forEach((skill, i) => {
        const barGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.appendChild(barGroup);
        
        // Bar background (lighter version of the bar color)
        const bgBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgBar.setAttribute('x', 0);
        bgBar.setAttribute('y', yScale(i) + 5);
        bgBar.setAttribute('width', width);
        bgBar.setAttribute('height', height / sortedSkills.length - 10);
        bgBar.setAttribute('fill', '#f0f0f0');
        bgBar.setAttribute('rx', 3);
        barGroup.appendChild(bgBar);
        
        // Main bar
        const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bar.setAttribute('x', 0);
        bar.setAttribute('y', yScale(i) + 5);
        bar.setAttribute('width', xScale(skill.value));
        bar.setAttribute('height', height / sortedSkills.length - 10);
        bar.setAttribute('fill', getBarColor(i));
        bar.setAttribute('rx', 3);
        bar.setAttribute('data-skill-id', skill.id);
        bar.setAttribute('class', 'skill-bar');
        barGroup.appendChild(bar);
        
        // Skill name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', -10);
        text.setAttribute('y', yScale(i) + (height / sortedSkills.length / 2) + 5);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('alignment-baseline', 'middle');
        text.setAttribute('fill', '#333');
        text.setAttribute('font-size', '14px');
        text.textContent = skill.name;
        barGroup.appendChild(text);
        
        // Value label
        const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueText.setAttribute('x', xScale(skill.value) + 5);
        valueText.setAttribute('y', yScale(i) + (height / sortedSkills.length / 2) + 5);
        valueText.setAttribute('alignment-baseline', 'middle');
        valueText.setAttribute('fill', '#333');
        valueText.setAttribute('font-size', '14px');
        valueText.textContent = skill.value;
        barGroup.appendChild(valueText);
        
        // Make the entire bar group clickable
        barGroup.style.cursor = 'pointer';
        barGroup.setAttribute('data-skill-id', skill.id);
        barGroup.setAttribute('data-skill-name', skill.name);
        barGroup.addEventListener('click', function() {
            handleSkillClick(skill, skillHistoryData);
        });
    });
    
    // Add responsive behavior
    window.addEventListener('resize', () => {
        if (container.clientWidth !== width + margin.left + margin.right) {
            renderSkillsBarChart(skillsData, skillHistoryData);
        }
    });
}

function renderSkillHistoryChart(skillId, historyData) {
    if (!historyData[skillId]) {
        console.error(`No history data found for skill ID: ${skillId}`);
        return;
    }
    
    const container = document.getElementById('skill-detail-graph');
    const margin = { top: 30, right: 30, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Clear previous content
    container.innerHTML = '';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = `Skill Progress: ${historyData[skillId].name}`;
    title.style.textAlign = 'center';
    container.appendChild(title);
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width + margin.left + margin.right);
    svg.setAttribute('height', height + margin.top + margin.bottom);
    container.appendChild(svg);
    
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
    svg.appendChild(g);
    
    const data = historyData[skillId].data;
    
    // Parse dates and sort by date
    const parsedData = data.map(d => {
        return {
            date: new Date(d.date),
            value: d.value
        };
    }).sort((a, b) => {
        // First sort by date
        const dateComparison = a.date - b.date;
        if (dateComparison !== 0) return dateComparison;
        // If dates are the same, sort by value (ascending)
        return a.value - b.value;
    });
    
    // Check if all data points occur on the same day
    const sameDay = parsedData.length > 1 && 
                    parsedData.every(d => 
                        d.date.getFullYear() === parsedData[0].date.getFullYear() &&
                        d.date.getMonth() === parsedData[0].date.getMonth() &&
                        d.date.getDate() === parsedData[0].date.getDate());
    
    // Handle case with only one data point
    const singleDataPoint = parsedData.length === 1;
    
    // Get min and max dates
    let minDate, maxDate;
    
    if (singleDataPoint || sameDay) {
        // For single data point or same day points, create a range of 2 months before and after
        minDate = new Date(parsedData[0].date);
        minDate.setMonth(minDate.getMonth() - 2);
        
        maxDate = new Date(parsedData[0].date);
        maxDate.setMonth(maxDate.getMonth() + 2);
    } else {
        minDate = parsedData[0].date;
        maxDate = parsedData[parsedData.length - 1].date;
        
        // Add some padding to the date range (5% on each side)
        const dateRange = maxDate - minDate;
        minDate = new Date(minDate.getTime() - dateRange * 0.05);
        maxDate = new Date(maxDate.getTime() + dateRange * 0.05);
    }
    
    // Get max value with a little padding
    const maxValue = Math.max(...parsedData.map(d => d.value)) * 1.1;
    
    // Create scales
    const xScale = (date) => {
        return (date - minDate) / (maxDate - minDate) * width;
    };
    
    const yScale = (value) => {
        return height - (value / maxValue) * height;
    };
    
    // Create axes
    // X-axis
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    xAxis.setAttribute('class', 'x-axis');
    xAxis.setAttribute('transform', `translate(0,${height})`);
    g.appendChild(xAxis);
    
    // X-axis line
    const xAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxisLine.setAttribute('x1', 0);
    xAxisLine.setAttribute('y1', 0);
    xAxisLine.setAttribute('x2', width);
    xAxisLine.setAttribute('y2', 0);
    xAxisLine.setAttribute('stroke', '#000');
    xAxis.appendChild(xAxisLine);
    
    // X-axis ticks
    let tickDates;
    
    if (singleDataPoint || sameDay) {
        // For single data point or same day points, create evenly spaced ticks
        tickDates = [
            minDate, 
            new Date((minDate.getTime() + parsedData[0].date.getTime()) / 2),
            parsedData[0].date, 
            new Date((parsedData[0].date.getTime() + maxDate.getTime()) / 2),
            maxDate
        ];
    } else {
        // For multiple data points on different days
        const dateRange = maxDate - minDate;
        const tickInterval = dateRange / 5;
        tickDates = [];
        
        for (let i = 0; i <= 5; i++) {
            tickDates.push(new Date(minDate.getTime() + tickInterval * i));
        }
    }
    
    // Process to draw ticks
    tickDates.forEach(date => {
        const tickX = xScale(date);
        
        // Tick line
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', tickX);
        tick.setAttribute('y1', 0);
        tick.setAttribute('x2', tickX);
        tick.setAttribute('y2', 5);
        tick.setAttribute('stroke', '#000');
        xAxis.appendChild(tick);
        
        // Tick label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', tickX);
        label.setAttribute('y', 20);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '12px');
        
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        label.textContent = formattedDate;
        xAxis.appendChild(label);
    });
    
    // X-axis label
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', width / 2);
    xLabel.setAttribute('y', 50);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('font-size', '14px');
    xLabel.textContent = 'Date';
    xAxis.appendChild(xLabel);
    
    // Y-axis
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    yAxis.setAttribute('class', 'y-axis');
    g.appendChild(yAxis);
    
    // Y-axis line
    const yAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxisLine.setAttribute('x1', 0);
    yAxisLine.setAttribute('y1', 0);
    yAxisLine.setAttribute('x2', 0);
    yAxisLine.setAttribute('y2', height);
    yAxisLine.setAttribute('stroke', '#000');
    yAxis.appendChild(yAxisLine);
    
    // Y-axis ticks
    const yTickCount = 5;
    const yTickInterval = maxValue / (yTickCount - 1);
    
    for (let i = 0; i < yTickCount; i++) {
        const value = i * yTickInterval;
        const tickY = yScale(value);
        
        // Tick line
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', -5);
        tick.setAttribute('y1', tickY);
        tick.setAttribute('x2', 0);
        tick.setAttribute('y2', tickY);
        tick.setAttribute('stroke', '#000');
        yAxis.appendChild(tick);
        
        // Tick label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', -10);
        label.setAttribute('y', tickY);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('dominant-baseline', 'middle');
        label.setAttribute('font-size', '12px');
        label.textContent = Math.round(value);
        yAxis.appendChild(label);
        
        // Horizontal grid line
        if (i > 0) {
            const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            gridLine.setAttribute('x1', 0);
            gridLine.setAttribute('y1', tickY);
            gridLine.setAttribute('x2', width);
            gridLine.setAttribute('y2', tickY);
            gridLine.setAttribute('stroke', '#e0e0e0');
            gridLine.setAttribute('stroke-dasharray', '3,3');
            g.insertBefore(gridLine, g.firstChild); // Insert grid lines at the back
        }
    }
    
    // Y-axis label
    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('transform', `translate(-40,${height/2}) rotate(-90)`);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('font-size', '14px');
    yLabel.textContent = 'Skill Level';
    yAxis.appendChild(yLabel);
    
    // Create path for the line
    const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Generate line path
    let pathData = '';
    
    if (singleDataPoint) {
        // For single data point, draw a horizontal line across the chart
        const y = yScale(parsedData[0].value);
        pathData = `M 0 ${y} L ${width} ${y}`;
    } else if (sameDay) {
        // For multiple data points on the same day, create a step function 
        // that rises at the middle of the chart
        const centerX = width / 2;
        let currentY = height; // Start at bottom
        
        pathData = `M 0 ${currentY}`; // Start at bottom left
        
        // Add steps for each value point
        parsedData.forEach((d, i) => {
            const y = yScale(d.value);
            // Position each step evenly across the center
            const x = centerX - 10 + (i * 20 / parsedData.length);
            pathData += ` L ${x} ${currentY} L ${x} ${y}`;
            currentY = y;
        });
        
        // Complete the path to the right edge
        pathData += ` L ${width} ${currentY}`;
    } else {
        // For multiple data points on different dates, connect the dots
        parsedData.forEach((d, i) => {
            const x = xScale(d.date);
            const y = yScale(d.value);
            
            if (i === 0) {
                pathData += `M ${x} ${y}`;
            } else {
                pathData += ` L ${x} ${y}`;
            }
        });
    }
    
    linePath.setAttribute('d', pathData);
    linePath.setAttribute('fill', 'none');
    linePath.setAttribute('stroke', '#4CAF50');
    linePath.setAttribute('stroke-width', '3');
    g.appendChild(linePath);
    
    // Add data points
    if (singleDataPoint) {
        // For single data point, add central visible point
        const x = xScale(parsedData[0].date);
        const y = yScale(parsedData[0].value);
        
        // Point circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '5');
        circle.setAttribute('fill', '#4CAF50');
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');
        g.appendChild(circle);
        
        // Add note about constant value
        const noteText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        noteText.setAttribute('x', width / 2);
        noteText.setAttribute('y', height / 2 - 20);
        noteText.setAttribute('text-anchor', 'middle');
        noteText.setAttribute('fill', '#666');
        noteText.setAttribute('font-size', '14px');
        noteText.setAttribute('font-style', 'italic');
        noteText.textContent = 'Constant skill level since acquisition';
        g.appendChild(noteText);
    } else if (sameDay) {
        // For same day points, position them in a vertical line
        const centerX = width / 2;
        
        // Add note about same-day progression
        const noteText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        noteText.setAttribute('x', width / 2);
        noteText.setAttribute('y', 20);
        noteText.setAttribute('text-anchor', 'middle');
        noteText.setAttribute('fill', '#666');
        noteText.setAttribute('font-size', '14px');
        noteText.setAttribute('font-style', 'italic');
        noteText.textContent = `Multiple level ups on ${parsedData[0].date.toLocaleDateString()}`;
        g.appendChild(noteText);
        
        // Add data points with tooltips
        parsedData.forEach((d, i) => {
            // Position each point evenly across the center
            const x = centerX - 10 + (i * 20 / parsedData.length);
            const y = yScale(d.value);
            
            // Point circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '5');
            circle.setAttribute('fill', '#4CAF50');
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            g.appendChild(circle);
            
            // Tooltip hover effects and value display
            const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            tooltip.setAttribute('class', 'tooltip');
            tooltip.style.opacity = '0';
            g.appendChild(tooltip);
            
            const tooltipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            tooltipRect.setAttribute('x', x - 50);
            tooltipRect.setAttribute('y', y - 40);
            tooltipRect.setAttribute('width', '100');
            tooltipRect.setAttribute('height', '30');
            tooltipRect.setAttribute('fill', '#333');
            tooltipRect.setAttribute('rx', '5');
            tooltipRect.setAttribute('ry', '5');
            tooltip.appendChild(tooltipRect);
            
            const tooltipText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            tooltipText.setAttribute('x', x);
            tooltipText.setAttribute('y', y - 20);
            tooltipText.setAttribute('text-anchor', 'middle');
            tooltipText.setAttribute('fill', '#fff');
            tooltipText.setAttribute('font-size', '12px');
            tooltipText.textContent = `Milestone ${i+1}: ${d.value}`;
            tooltip.appendChild(tooltipText);
            
            circle.addEventListener('mouseover', () => {
                tooltip.style.opacity = '1';
                circle.setAttribute('r', '7');
            });
            
            circle.addEventListener('mouseout', () => {
                tooltip.style.opacity = '0';
                circle.setAttribute('r', '5');
            });
        });
    } else {
        // For multiple data points on different days
        parsedData.forEach((d, i) => {
            const x = xScale(d.date);
            const y = yScale(d.value);
            
            // Point circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '5');
            circle.setAttribute('fill', '#4CAF50');
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            g.appendChild(circle);
            
            // Tooltip hover effects and value display
            const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            tooltip.setAttribute('class', 'tooltip');
            tooltip.style.opacity = '0';
            g.appendChild(tooltip);
            
            const tooltipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            tooltipRect.setAttribute('x', x - 50);
            tooltipRect.setAttribute('y', y - 40);
            tooltipRect.setAttribute('width', '100');
            tooltipRect.setAttribute('height', '30');
            tooltipRect.setAttribute('fill', '#333');
            tooltipRect.setAttribute('rx', '5');
            tooltipRect.setAttribute('ry', '5');
            tooltip.appendChild(tooltipRect);
            
            const tooltipText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            tooltipText.setAttribute('x', x);
            tooltipText.setAttribute('y', y - 20);
            tooltipText.setAttribute('text-anchor', 'middle');
            tooltipText.setAttribute('fill', '#fff');
            tooltipText.setAttribute('font-size', '12px');
            tooltipText.textContent = `Value: ${d.value}`;
            tooltip.appendChild(tooltipText);
            
            circle.addEventListener('mouseover', () => {
                tooltip.style.opacity = '1';
                circle.setAttribute('r', '7');
            });
            
            circle.addEventListener('mouseout', () => {
                tooltip.style.opacity = '0';
                circle.setAttribute('r', '5');
            });
        });
    }
    
    // Add responsive behavior
    window.addEventListener('resize', () => {
        if (container.clientWidth !== width + margin.left + margin.right) {
            renderSkillHistoryChart(skillId, historyData);
        }
    });
}

function handleSkillClick(skill, skillHistoryData) {
    console.log(`Skill clicked: ${skill.name} (${skill.id})`);
    
    // Show the detail container that was previously hidden
    const detailContainer = document.getElementById('skill-detail-graph');
    detailContainer.style.display = 'block';
    
    // Highlight the selected skill bar
    document.querySelectorAll('.skill-bar').forEach(bar => {
        if (bar.getAttribute('data-skill-id') === skill.id) {
            bar.setAttribute('stroke', '#000');
            bar.setAttribute('stroke-width', '2');
        } else {
            bar.setAttribute('stroke', 'none');
            bar.setAttribute('stroke-width', '0');
        }
    });
    
    // Later you will implement the detail chart here
    if (skillHistoryData && skillHistoryData[skill.id]) {
        renderSkillHistoryChart(skill.id, skillHistoryData);
    } else {
        detailContainer.innerHTML = `
            <h3>Skill Details: ${skill.name}</h3>
            <p>Current value: ${skill.value}</p>
            <p>No historical data available for this skill.</p>
        `;
    }
    // Scroll to the detail section
    detailContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderXpLineChart(data) {
    const container = document.getElementById('xp-graph');
    if (!container) {
        console.error('Element with ID xp-graph not found');
        return;
    }
    
    // Clear previous content
    container.innerHTML = '';
    
    // Create tabs container
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'xp-tabs';
    tabsContainer.style.cssText = 'display: flex; justify-content: center; margin-bottom: 15px;';
    container.appendChild(tabsContainer);
    
    // Create tabs for each category
    const categories = ['piscineGo', 'piscineJs', 'module'];
    const tabLabels = {
        'piscineGo': 'Piscine Go',
        'piscineJs': 'Piscine JS',
        'module': 'Module'
    };
    
    let activeTab = categories[0]; // Default active tab
    
    categories.forEach(category => {
        const tab = document.createElement('div');
        tab.className = 'xp-tab';
        tab.textContent = `${tabLabels[category]} (${formatXp(data.totals[category])})`;
        tab.dataset.category = category;
        tab.style.cssText = 'padding: 8px 15px; margin: 0 5px; cursor: pointer; border-radius: 5px; transition: all 0.2s ease;';
        
        if (category === activeTab) {
            tab.style.backgroundColor = '#4CAF50';
            tab.style.color = 'white';
        } else {
            tab.style.backgroundColor = '#f0f0f0';
            tab.style.color = '#333';
        }
        
        tab.addEventListener('click', () => {
            // Update active tab
            activeTab = category;
            
            // Update tab styles
            document.querySelectorAll('.xp-tab').forEach(t => {
                if (t.dataset.category === activeTab) {
                    t.style.backgroundColor = '#4CAF50';
                    t.style.color = 'white';
                } else {
                    t.style.backgroundColor = '#f0f0f0';
                    t.style.color = '#333';
                }
            });
            
            // Redraw chart with selected data
            drawChart(data[category], container.clientWidth, 300);
        });
        
        tabsContainer.appendChild(tab);
    });
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'xp-chart-container';
    chartContainer.style.position = 'relative';
    container.appendChild(chartContainer);
    
    // Draw initial chart
    drawChart(data[activeTab], container.clientWidth, 300);
    
    // Function to format XP values
    function formatXp(xp) {
        if (xp >= 1000000) {
            return `${(xp / 1000000).toFixed(1)}M`;
        } else if (xp >= 1000) {
            return `${(xp / 1000).toFixed(1)}K`;
        } else {
            return xp.toString();
        }
    }
    
    // Function to draw the chart
    function drawChart(dataPoints, width, height) {
        // Clear previous chart
        chartContainer.innerHTML = '';
        
        if (!dataPoints || dataPoints.length === 0) {
            chartContainer.innerHTML = '<p style="text-align: center; padding: 40px;">No data available for this category.</p>';
            return;
        }
        
        // Sort data points by timestamp
        const sortedData = [...dataPoints].sort((a, b) => a.timestamp - b.timestamp);
        
        // Setup SVG dimensions
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        chartContainer.appendChild(svg);
        
        // Create chart group
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
        svg.appendChild(g);
        
        // Compute date range
        const dateMin = new Date(sortedData[0].timestamp);
        const dateMax = new Date(sortedData[sortedData.length - 1].timestamp);
        
        // Add some padding to the date range (5% on each side)
        const dateRange = dateMax - dateMin;
        const extendedDateMin = new Date(dateMin.getTime() - dateRange * 0.05);
        const extendedDateMax = new Date(dateMax.getTime() + dateRange * 0.05);
        
        // Create scales
        const xScale = (date) => {
            return ((date - extendedDateMin) / (extendedDateMax - extendedDateMin)) * chartWidth;
        };
        
        const yScale = (xp) => {
            return chartHeight - (xp / sortedData[sortedData.length - 1].cumulative * 1.1) * chartHeight;
        };
        
        // Add grid lines
        // Horizontal grid lines
        const yTickCount = 5;
        for (let i = 0; i <= yTickCount; i++) {
            const yPos = chartHeight * (i / yTickCount);
            const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            gridLine.setAttribute('x1', 0);
            gridLine.setAttribute('y1', yPos);
            gridLine.setAttribute('x2', chartWidth);
            gridLine.setAttribute('y2', yPos);
            gridLine.setAttribute('stroke', '#e0e0e0');
            gridLine.setAttribute('stroke-dasharray', '3,3');
            g.appendChild(gridLine);
            
            // Y-axis labels
            const yValue = sortedData[sortedData.length - 1].cumulative * (1 - i / yTickCount) * 1.1;
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', -10);
            label.setAttribute('y', yPos);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('alignment-baseline', 'middle');
            label.setAttribute('font-size', '12px');
            label.setAttribute('fill', '#666');
            label.textContent = formatXp(Math.round(yValue));
            g.appendChild(label);
        }
        
        // X-axis (Date)
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        xAxis.setAttribute('transform', `translate(0,${chartHeight})`);
        g.appendChild(xAxis);
        
        // X-axis line
        const xAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxisLine.setAttribute('x1', 0);
        xAxisLine.setAttribute('y1', 0);
        xAxisLine.setAttribute('x2', chartWidth);
        xAxisLine.setAttribute('y2', 0);
        xAxisLine.setAttribute('stroke', '#666');
        xAxis.appendChild(xAxisLine);
        
        // X-axis ticks and labels
        const xTickCount = Math.min(sortedData.length, 6);
        for (let i = 0; i <= xTickCount; i++) {
            const xPos = chartWidth * (i / xTickCount);
            
            // Tick
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', xPos);
            tick.setAttribute('y1', 0);
            tick.setAttribute('x2', xPos);
            tick.setAttribute('y2', 5);
            tick.setAttribute('stroke', '#666');
            xAxis.appendChild(tick);
            
            // Date label
            const date = new Date(extendedDateMin.getTime() + (extendedDateMax - extendedDateMin) * (i / xTickCount));
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', xPos);
            label.setAttribute('y', 20);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '12px');
            label.setAttribute('fill', '#666');
            label.textContent = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            xAxis.appendChild(label);
        }
        
        // Y-axis line
        const yAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxisLine.setAttribute('x1', 0);
        yAxisLine.setAttribute('y1', 0);
        yAxisLine.setAttribute('x2', 0);
        yAxisLine.setAttribute('y2', chartHeight);
        yAxisLine.setAttribute('stroke', '#666');
        g.appendChild(yAxisLine);
        
        // Y-axis label
        const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yAxisLabel.setAttribute('transform', `translate(-40,${chartHeight/2}) rotate(-90)`);
        yAxisLabel.setAttribute('text-anchor', 'middle');
        yAxisLabel.setAttribute('font-size', '14px');
        yAxisLabel.setAttribute('fill', '#333');
        yAxisLabel.textContent = 'XP';
        g.appendChild(yAxisLabel);
        
        // X-axis label
        const xAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xAxisLabel.setAttribute('x', chartWidth / 2);
        xAxisLabel.setAttribute('y', chartHeight + 40);
        xAxisLabel.setAttribute('text-anchor', 'middle');
        xAxisLabel.setAttribute('font-size', '14px');
        xAxisLabel.setAttribute('fill', '#333');
        xAxisLabel.textContent = 'Date';
        g.appendChild(xAxisLabel);
        
        // Draw line
        let pathData = '';
        
        sortedData.forEach((dataPoint, i) => {
            const x = xScale(new Date(dataPoint.timestamp));
            const y = yScale(dataPoint.cumulative);
            
            if (i === 0) {
                pathData = `M ${x} ${y}`;
            } else {
                pathData += ` L ${x} ${y}`;
            }
        });
        
        // Create path element
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#4CAF50');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-linejoin', 'round');
        g.appendChild(path);
        
        // Create area under the line
        let areaPathData = pathData;
        areaPathData += ` L ${xScale(new Date(sortedData[sortedData.length - 1].timestamp))} ${chartHeight}`;
        areaPathData += ` L ${xScale(new Date(sortedData[0].timestamp))} ${chartHeight}`;
        areaPathData += ' Z';
        
        const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        areaPath.setAttribute('d', areaPathData);
        areaPath.setAttribute('fill', 'rgba(76, 175, 80, 0.1)');
        areaPath.setAttribute('stroke', 'none');
        g.insertBefore(areaPath, path); // Insert area behind the line
        
        // Add data points with tooltips
        sortedData.forEach((dataPoint) => {
            const x = xScale(new Date(dataPoint.timestamp));
            const y = yScale(dataPoint.cumulative);
            
            // Create circle for data point
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#4CAF50');
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            g.appendChild(circle);
            
            // Create tooltip group
            const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            tooltip.setAttribute('opacity', '0');
            tooltip.style.pointerEvents = 'none';
            g.appendChild(tooltip);
            
            // Tooltip background
            const tooltipBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            tooltipBg.setAttribute('x', x - 75);
            tooltipBg.setAttribute('y', y - 65);
            tooltipBg.setAttribute('width', '150');
            tooltipBg.setAttribute('height', '50');
            tooltipBg.setAttribute('rx', '5');
            tooltipBg.setAttribute('ry', '5');
            tooltipBg.setAttribute('fill', 'rgba(0, 0, 0, 0.7)');
            tooltip.appendChild(tooltipBg);
            
            // Tooltip text - date
            const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            dateText.setAttribute('x', x);
            dateText.setAttribute('y', y - 45);
            dateText.setAttribute('text-anchor', 'middle');
            dateText.setAttribute('fill', '#fff');
            dateText.setAttribute('font-size', '12px');
            dateText.textContent = dataPoint.date;
            tooltip.appendChild(dateText);
            
            // Tooltip text - XP info
            const xpText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            xpText.setAttribute('x', x);
            xpText.setAttribute('y', y - 25);
            xpText.setAttribute('text-anchor', 'middle');
            xpText.setAttribute('fill', '#fff');
            xpText.setAttribute('font-size', '12px');
            xpText.textContent = `+${formatXp(dataPoint.amount)} XP (Total: ${formatXp(dataPoint.cumulative)})`;
            tooltip.appendChild(xpText);
            
            // Mouse events for tooltip
            circle.addEventListener('mouseover', () => {
                tooltip.setAttribute('opacity', '1');
                circle.setAttribute('r', '6');
            });
            
            circle.addEventListener('mouseout', () => {
                tooltip.setAttribute('opacity', '0');
                circle.setAttribute('r', '4');
            });
        });
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (container.clientWidth > 0) {
            drawChart(data[activeTab], container.clientWidth, 300);
        }
    });
}

function renderProgressTable(progressData) {
    // Check if progressData exists and has the expected structure
    if (!progressData || !progressData.module || !progressData.piscineGo || !progressData.piscineJs) {
        console.error('Progress data is missing or has incorrect format', progressData);
        return;
    }
    
    // Create container for the tabs and tables
    const container = document.getElementById('progress-graph');
    
    // Create tab navigation
    const tabsHTML = `
        <div class="progress-tabs">
            <button class="tab-button active" data-tab="module">Module</button>
            <button class="tab-button" data-tab="piscineGo">Piscine Go</button>
            <button class="tab-button" data-tab="piscineJs">Piscine JS</button>
        </div>
        
        <div class="progress-tables-container">
            <div id="module-table" class="progress-table active"></div>
            <div id="piscineGo-table" class="progress-table"></div>
            <div id="piscineJs-table" class="progress-table"></div>
        </div>
    `;
    
    container.innerHTML = tabsHTML;
    
    // Function to generate a table for a specific category
    function generateTable(entries, containerId) {
        const tableContainer = document.getElementById(containerId);
        
        if (!entries || entries.length === 0) {
            tableContainer.innerHTML = '<p class="no-data">No data available for this category.</p>';
            return;
        }
        
        // Create table HTML
        let tableHTML = `
            <table class="progress-data-table">
                <thead>
                    <tr>
                        <th>Project</th>
                        <th>Date</th>
                        <th>Grade</th>
                        <th>Status</th>
                        <th>Captain</th>
                        <th>Auditors</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add rows for each entry
        entries.forEach(entry => {
            // Extract project name from path
            const pathParts = entry.path.split('/');
            const projectName = pathParts[pathParts.length - 1];
            
            // Format grade with 2 decimal places if it exists
            const formattedGrade = entry.grade !== null ? entry.grade.toFixed(2) : '-';
            
            // Status based on isCompleted
            const status = entry.isCompleted ? 
                '<span class="status-completed">Completed</span>' : 
                '<span class="status-incomplete">In Progress</span>';
            
            // Captain and auditors
            const captain = entry.group?.captainLogin || '-';
            
            let auditors = '-';
            if (entry.group && entry.group.auditors && entry.group.auditors.length > 0) {
                // Show count and display full list on hover
                const auditorCount = entry.group.auditors.length;
                const auditorList = entry.group.auditors
                    .map(a => a.auditorLogin)
                    .join(', ');
                
                auditors = `<span class="auditor-count" title="${auditorList}">${auditorCount} auditors</span>`;
            }
            
            tableHTML += `
                <tr class="${entry.isCompleted ? 'completed' : 'incomplete'}">
                    <td>${projectName}</td>
                    <td>${entry.formattedDate}</td>
                    <td>${formattedGrade}</td>
                    <td>${status}</td>
                    <td>${captain}</td>
                    <td>${auditors}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        tableContainer.innerHTML = tableHTML;
    }
    
    // Generate tables for each category
    generateTable(progressData.module, 'module-table');
    generateTable(progressData.piscineGo, 'piscineGo-table');
    generateTable(progressData.piscineJs, 'piscineJs-table');
    
    // Add tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tables = document.querySelectorAll('.progress-table');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and tables
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tables.forEach(table => table.classList.remove('active'));
            
            // Add active class to current button and corresponding table
            button.classList.add('active');
            const tabCategory = button.getAttribute('data-tab');
            document.getElementById(`${tabCategory}-table`).classList.add('active');
        });
    });
    
    // Add some CSS for the tables
    const style = document.createElement('style');
    style.textContent = `
        .progress-tabs {
            display: flex;
            border-bottom: 1px solid #ddd;
            margin-bottom: 20px;
        }
        
        .tab-button {
            padding: 10px 20px;
            background: none;
            border: none;
            border-bottom: 3px solid transparent;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
        }
        
        .tab-button:hover {
            background-color: rgba(0,0,0,0.05);
        }
        
        .tab-button.active {
            border-bottom: 3px solid #4a90e2;
            font-weight: bold;
        }
        
        .progress-tables-container {
            position: relative;
        }
        
        .progress-table {
            display: none;
            width: 100%;
            overflow-x: auto;
        }
        
        .progress-table.active {
            display: block;
        }
        
        .progress-data-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .progress-data-table th, 
        .progress-data-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .progress-data-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        .progress-data-table tr:hover {
            background-color: rgba(0,0,0,0.02);
        }
        
        .status-completed {
            color: #28a745;
            font-weight: bold;
        }
        
        .status-incomplete {
            color: #dc3545;
        }
        
        .auditor-count {
            color: #6c757d;
            cursor: help;
            text-decoration: underline dotted;
        }
        
        tr.completed {
            background-color: rgba(40, 167, 69, 0.05);
        }
        
        tr.incomplete {
            background-color: rgba(220, 53, 69, 0.05);
        }
        
        .no-data {
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
}

// Export the function to the window object
window.renderAuditRatioPieChart = renderAuditRatioPieChart;
window.renderSkillsBarChart = renderSkillsBarChart;
window.renderSkillHistoryChart = renderSkillHistoryChart;
window.renderXpLineChart = renderXpLineChart;
window.renderProgressTable = renderProgressTable;