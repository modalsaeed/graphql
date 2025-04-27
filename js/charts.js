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


window.renderAuditRatioPieChart = renderAuditRatioPieChart;
window.renderSkillsBarChart = renderSkillsBarChart;
window.renderSkillHistoryChart = renderSkillHistoryChart;