function debounce(func, wait = 250) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Common utility functions to reduce redundancy
function createSvgElement(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function setupSvg(container, width, height, preserveRatio = true) {
    // Clear any existing chart
    container.innerHTML = '';
    
    // Create SVG element with proper viewBox for better responsiveness
    const svg = createSvgElement("svg");
    svg.setAttribute("width", "100%"); 
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    if (preserveRatio) {
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }
    svg.setAttribute("class", "chart-svg");
    container.appendChild(svg);
    
    return svg;
}

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
    const width = container.clientWidth || 350;
    const height = 300;
    const radius = Math.min(width, height) / 2.8;
    
    const svg = setupSvg(container, width, height);
    
    // Create group element for the chart
    const g = createSvgElement("g");
    g.setAttribute("transform", `translate(${width/2}, ${height/2 - 15})`);
    svg.appendChild(g);
    
    // Define color scheme
    const colors = ["#3b82f6", "#10b981"]; // Primary blue, Secondary green
    
    // Create data for the pie chart with shorter mobile labels
    const data = [
        { 
            label: `Given (${upFormatted} ${unit})`, 
            shortLabel: `Given: ${upFormatted}`, 
            value: up 
        },
        { 
            label: `Received (${downFormatted} ${unit})`, 
            shortLabel: `Received: ${downFormatted}`, 
            value: down 
        }
    ];
    
    // Calculate the total
    const total = data.reduce((sum, d) => sum + d.value, 0);
    
    // Helper function to convert polar coordinates to Cartesian
    function polarToCartesian(radius, angle) {
        return {
            x: radius * Math.cos(angle - Math.PI/2),
            y: radius * Math.sin(angle - Math.PI/2)
        };
    }
    
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
    
    // Draw pie slices
    let currentAngle = 0;
    data.forEach((d, i) => {
        const angle = (d.value / total) * (2 * Math.PI);
        const endAngle = currentAngle + angle;
        
        // Create slice
        const path = createSvgElement("path");
        path.setAttribute("d", arcPath(currentAngle, endAngle));
        path.setAttribute("fill", colors[i]);
        path.setAttribute("stroke", "#fff");
        path.setAttribute("stroke-width", "1");
        
        // Add hover effect
        path.addEventListener("mouseover", () => path.setAttribute("opacity", "0.8"));
        path.addEventListener("mouseout", () => path.setAttribute("opacity", "1"));
        
        g.appendChild(path);
        
        // Add label
        if (d.value > 0) {
            const midAngle = currentAngle + angle / 2;
            const labelRadius = radius * 0.7;
            const labelPos = polarToCartesian(labelRadius, midAngle);
            const percent = ((d.value / total) * 100).toFixed(1);
            
            const label = createSvgElement("text");
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
    
    // Create legend with responsive positioning
    const legendG = createSvgElement("g");
    const isMobile = window.innerWidth < 480;
    const legendY = isMobile ? height - 60 : height - 30;
    legendG.setAttribute("transform", `translate(${width/2}, ${legendY})`);
    svg.appendChild(legendG);

    const legendSpacing = isMobile ? 40 : 150;

    data.forEach((d, i) => {
        const legendItem = createSvgElement("g");
        const xOffset = isMobile ? 0 : (i - data.length/2) * legendSpacing + 75;
        const yOffset = isMobile ? i * 25 : 0;
        legendItem.setAttribute("transform", `translate(${xOffset}, ${yOffset})`);
        
        // Legend color box
        const rect = createSvgElement("rect");
        rect.setAttribute("width", "15");
        rect.setAttribute("height", "15");
        rect.setAttribute("fill", colors[i]);
        rect.setAttribute("x", isMobile ? "-40" : "-70");
        legendItem.appendChild(rect);
        
        // Legend text
        const text = createSvgElement("text");
        text.setAttribute("x", isMobile ? "-20" : "-50");
        text.setAttribute("y", "12");
        text.setAttribute("font-size", isMobile ? "12px" : "14px");
        text.textContent = isMobile ? d.shortLabel : d.label;
        legendItem.appendChild(text);
        
        legendG.appendChild(legendItem);
    });

    // Handle resize
    const debouncedResize = debounce(() => {
        if (container.clientWidth !== width) {
            renderAuditRatioPieChart(up, down);
        }
    }, 250);
    
    window.addEventListener('resize', debouncedResize);
}

function renderSkillsBarChart(skillsData, skillHistoryData) {
    const container = document.getElementById('skills-graph');
    if (!container) return;
    
    const margin = { top: 20, right: 30, bottom: 40, left: 150 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = Math.max(300, skillsData.length * 35) - margin.top - margin.bottom;
    
    // Clear previous content
    container.innerHTML = '';
    
    // Create SVG element with viewBox for better responsiveness
    const svg = createSvgElement('svg');
    svg.setAttribute('width', width + margin.left + margin.right);
    svg.setAttribute('height', height + margin.top + margin.bottom);
    svg.setAttribute('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('class', 'chart-svg');
    container.appendChild(svg);
    
    const g = createSvgElement('g');
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
        const barGroup = createSvgElement('g');
        g.appendChild(barGroup);
        
        const barHeight = height / sortedSkills.length - 10;
        const barY = yScale(i) + 5;
        const centerY = barY + (barHeight / 2);
        
        // Bar background
        const bgBar = createSvgElement('rect');
        bgBar.setAttribute('x', 0);
        bgBar.setAttribute('y', barY);
        bgBar.setAttribute('width', width);
        bgBar.setAttribute('height', barHeight);
        bgBar.setAttribute('fill', '#f0f0f0');
        bgBar.setAttribute('rx', '3');
        barGroup.appendChild(bgBar);
        
        // Main bar
        const bar = createSvgElement('rect');
        bar.setAttribute('x', 0);
        bar.setAttribute('y', barY);
        bar.setAttribute('width', xScale(skill.value));
        bar.setAttribute('height', barHeight);
        bar.setAttribute('fill', getBarColor(i));
        bar.setAttribute('rx', '3');
        bar.setAttribute('data-skill-id', skill.id);
        bar.setAttribute('class', 'skill-bar');
        barGroup.appendChild(bar);
        
        // Skill name
        const text = createSvgElement('text');
        text.setAttribute('x', -10);
        text.setAttribute('y', centerY);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('alignment-baseline', 'middle');
        text.setAttribute('fill', '#333');
        text.setAttribute('font-size', '14px');
        text.textContent = skill.name;
        barGroup.appendChild(text);
        
        // Value label
        const valueText = createSvgElement('text');
        valueText.setAttribute('x', xScale(skill.value) + 5);
        valueText.setAttribute('y', centerY);
        valueText.setAttribute('alignment-baseline', 'middle');
        valueText.setAttribute('fill', '#333');
        valueText.setAttribute('font-size', '14px');
        valueText.textContent = skill.value;
        barGroup.appendChild(valueText);
        
        // Make the entire bar group clickable
        barGroup.style.cursor = 'pointer';
        barGroup.setAttribute('data-skill-id', skill.id);
        barGroup.setAttribute('data-skill-name', skill.name);
        barGroup.addEventListener('click', () => handleSkillClick(skill, skillHistoryData));
    });
    
    // Add responsive behavior
    const debouncedResize = debounce(() => {
        if (container.clientWidth !== width + margin.left + margin.right) {
            renderSkillsBarChart(skillsData, skillHistoryData);
        }
    }, 250);
    
    window.addEventListener('resize', debouncedResize);
}

function renderSkillHistoryChart(skillId, historyData) {
    if (!historyData || !historyData[skillId]) {
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
    const svg = createSvgElement('svg');
    svg.setAttribute('width', width + margin.left + margin.right);
    svg.setAttribute('height', height + margin.top + margin.bottom);
    container.appendChild(svg);
    
    const g = createSvgElement('g');
    g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
    svg.appendChild(g);
    
    const data = historyData[skillId].data;
    
    // Parse dates and sort by date
    const parsedData = data.map(d => ({
        date: new Date(d.date),
        value: d.value
    })).sort((a, b) => {
        // First sort by date, then by value if dates are the same
        const dateComparison = a.date - b.date;
        return dateComparison !== 0 ? dateComparison : a.value - b.value;
    });
    
    // Check for edge cases
    const singleDataPoint = parsedData.length === 1;
    const sameDay = parsedData.length > 1 && 
                    parsedData.every(d => 
                        d.date.getFullYear() === parsedData[0].date.getFullYear() &&
                        d.date.getMonth() === parsedData[0].date.getMonth() &&
                        d.date.getDate() === parsedData[0].date.getDate());
    
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
        
        // Add padding to the date range (5% on each side)
        const dateRange = maxDate - minDate;
        minDate = new Date(minDate.getTime() - dateRange * 0.05);
        maxDate = new Date(maxDate.getTime() + dateRange * 0.05);
    }
    
    // Get max value with padding
    const maxValue = Math.max(...parsedData.map(d => d.value)) * 1.1;
    
    // Create scales
    const xScale = date => (date - minDate) / (maxDate - minDate) * width;
    const yScale = value => height - (value / maxValue) * height;
    
    // Create axes
    // X-axis
    const xAxis = createSvgElement('g');
    xAxis.setAttribute('class', 'x-axis');
    xAxis.setAttribute('transform', `translate(0,${height})`);
    g.appendChild(xAxis);
    
    // X-axis line
    const xAxisLine = createSvgElement('line');
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
        tickDates = Array.from({length: 6}, (_, i) => 
            new Date(minDate.getTime() + tickInterval * i)
        );
    }
    
    // Draw ticks
    tickDates.forEach(date => {
        const tickX = xScale(date);
        
        // Tick line
        const tick = createSvgElement('line');
        tick.setAttribute('x1', tickX);
        tick.setAttribute('y1', 0);
        tick.setAttribute('x2', tickX);
        tick.setAttribute('y2', 5);
        tick.setAttribute('stroke', '#000');
        xAxis.appendChild(tick);
        
        // Tick label
        const label = createSvgElement('text');
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
    const xLabel = createSvgElement('text');
    xLabel.setAttribute('x', width / 2);
    xLabel.setAttribute('y', 50);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('font-size', '14px');
    xLabel.textContent = 'Date';
    xAxis.appendChild(xLabel);
    
    // Y-axis
    const yAxis = createSvgElement('g');
    yAxis.setAttribute('class', 'y-axis');
    g.appendChild(yAxis);
    
    // Y-axis line
    const yAxisLine = createSvgElement('line');
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
        const tick = createSvgElement('line');
        tick.setAttribute('x1', -5);
        tick.setAttribute('y1', tickY);
        tick.setAttribute('x2', 0);
        tick.setAttribute('y2', tickY);
        tick.setAttribute('stroke', '#000');
        yAxis.appendChild(tick);
        
        // Tick label
        const label = createSvgElement('text');
        label.setAttribute('x', -10);
        label.setAttribute('y', tickY);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('dominant-baseline', 'middle');
        label.setAttribute('font-size', '12px');
        label.textContent = Math.round(value);
        yAxis.appendChild(label);
        
        // Horizontal grid line
        if (i > 0) {
            const gridLine = createSvgElement('line');
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
    const yLabel = createSvgElement('text');
    yLabel.setAttribute('transform', `translate(-40,${height/2}) rotate(-90)`);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('font-size', '14px');
    yLabel.textContent = 'Skill Level';
    yAxis.appendChild(yLabel);
    
    // Create path for the line
    const linePath = createSvgElement('path');
    
    // Generate line path
    let pathData = '';
    
    if (singleDataPoint) {
        // For single data point, draw a horizontal line across the chart
        const y = yScale(parsedData[0].value);
        pathData = `M 0 ${y} L ${width} ${y}`;
    } else if (sameDay) {
        // For multiple data points on the same day, create a step function
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
            
            pathData += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        });
    }
    
    linePath.setAttribute('d', pathData);
    linePath.setAttribute('fill', 'none');
    linePath.setAttribute('stroke', '#4CAF50');
    linePath.setAttribute('stroke-width', '3');
    g.appendChild(linePath);
    
    // Function to create tooltip elements
    function createTooltip(x, y, content) {
        const tooltip = createSvgElement('g');
        tooltip.setAttribute('class', 'tooltip');
        tooltip.style.opacity = '0';
        
        const tooltipRect = createSvgElement('rect');
        tooltipRect.setAttribute('x', x - 50);
        tooltipRect.setAttribute('y', y - 40);
        tooltipRect.setAttribute('width', '100');
        tooltipRect.setAttribute('height', '30');
        tooltipRect.setAttribute('fill', '#333');
        tooltipRect.setAttribute('rx', '5');
        tooltipRect.setAttribute('ry', '5');
        tooltip.appendChild(tooltipRect);
        
        const tooltipText = createSvgElement('text');
        tooltipText.setAttribute('x', x);
        tooltipText.setAttribute('y', y - 20);
        tooltipText.setAttribute('text-anchor', 'middle');
        tooltipText.setAttribute('fill', '#fff');
        tooltipText.setAttribute('font-size', '12px');
        tooltipText.textContent = content;
        tooltip.appendChild(tooltipText);
        
        return tooltip;
    }
    
    // Add data points with tooltips based on chart type
    if (singleDataPoint) {
        // For single data point, add central visible point
        const x = xScale(parsedData[0].date);
        const y = yScale(parsedData[0].value);
        
        // Point circle
        const circle = createSvgElement('circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '5');
        circle.setAttribute('fill', '#4CAF50');
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');
        g.appendChild(circle);
        
        // Add note about constant value
        const noteText = createSvgElement('text');
        noteText.setAttribute('x', width / 2);
        noteText.setAttribute('y', height / 2 - 20);
        noteText.setAttribute('text-anchor', 'middle');
        noteText.setAttribute('fill', '#666');
        noteText.setAttribute('font-size', '14px');
        noteText.setAttribute('font-style', 'italic');
        noteText.textContent = 'Constant skill level since acquisition';
        g.appendChild(noteText);
    } else if (sameDay) {
        // For same day points, add a note and tooltips
        const centerX = width / 2;
        
        // Add note about same-day progression
        const noteText = createSvgElement('text');
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
            
            const circle = createSvgElement('circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '5');
            circle.setAttribute('fill', '#4CAF50');
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            g.appendChild(circle);
            
            const tooltip = createTooltip(x, y, `Milestone ${i+1}: ${d.value}`);
            g.appendChild(tooltip);
            
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
            
            const circle = createSvgElement('circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '5');
            circle.setAttribute('fill', '#4CAF50');
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            g.appendChild(circle);
            
            const tooltip = createTooltip(x, y, `Value: ${d.value}`);
            g.appendChild(tooltip);
            
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
    const debouncedResize = debounce(() => {
        if (container.clientWidth !== width + margin.left + margin.right) {
            renderSkillHistoryChart(skillId, historyData);
        }
    }, 250);
    
    window.addEventListener('resize', debouncedResize);
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
    
    // Render the detail chart or show message
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
    
    // Function to format XP values
    function formatXp(xp) {
        if (xp >= 1000000) {
            // Show 3 significant digits for values ≥ 1MB
            const value = xp / 1000000;
            return value < 10 ? `${value.toFixed(2)}MB` : 
                   value < 100 ? `${value.toFixed(1)}MB` : 
                   `${Math.round(value)}MB`;
        } else if (xp >= 1000) {
            // Show 3 significant digits for values ≥ 1KB
            const value = xp / 1000;
            return value < 10 ? `${value.toFixed(2)}KB` : 
                   value < 100 ? `${value.toFixed(1)}KB` : 
                   `${Math.round(value)}KB`;
        } else {
            // For small values, show the exact number
            return xp.toString();
        }
    }
    
    // Create tab elements
    categories.forEach(category => {
        const tab = document.createElement('div');
        tab.className = 'xp-tab';
        
        const isMobile = window.innerWidth < 480;
        tab.textContent = isMobile ? 
            tabLabels[category] : 
            `${tabLabels[category]} (${formatXp(data.totals[category])})`;
        
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
        const svg = createSvgElement('svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        chartContainer.appendChild(svg);
        
        // Create chart group
        const g = createSvgElement('g');
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
            const gridLine = createSvgElement('line');
            gridLine.setAttribute('x1', 0);
            gridLine.setAttribute('y1', yPos);
            gridLine.setAttribute('x2', chartWidth);
            gridLine.setAttribute('y2', yPos);
            gridLine.setAttribute('stroke', '#e0e0e0');
            gridLine.setAttribute('stroke-dasharray', '3,3');
            g.appendChild(gridLine);
            
            // Y-axis labels
            const yValue = sortedData[sortedData.length - 1].cumulative * (1 - i / yTickCount) * 1.1;
            const label = createSvgElement('text');
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
        const xAxis = createSvgElement('g');
        xAxis.setAttribute('transform', `translate(0,${chartHeight})`);
        g.appendChild(xAxis);
        
        // X-axis line
        const xAxisLine = createSvgElement('line');
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
            const tick = createSvgElement('line');
            tick.setAttribute('x1', xPos);
            tick.setAttribute('y1', 0);
            tick.setAttribute('x2', xPos);
            tick.setAttribute('y2', 5);
            tick.setAttribute('stroke', '#666');
            xAxis.appendChild(tick);
            
            // Date label
            const date = new Date(extendedDateMin.getTime() + (extendedDateMax - extendedDateMin) * (i / xTickCount));
            const label = createSvgElement('text');
            label.setAttribute('x', xPos);
            label.setAttribute('y', 20);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '12px');
            label.setAttribute('fill', '#666');
            label.textContent = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            xAxis.appendChild(label);
        }
        
        // Y-axis line
        const yAxisLine = createSvgElement('line');
        yAxisLine.setAttribute('x1', 0);
        yAxisLine.setAttribute('y1', 0);
        yAxisLine.setAttribute('x2', 0);
        yAxisLine.setAttribute('y2', chartHeight);
        yAxisLine.setAttribute('stroke', '#666');
        g.appendChild(yAxisLine);
        
        // Y-axis label
        const yAxisLabel = createSvgElement('text');
        yAxisLabel.setAttribute('transform', `translate(-40,${chartHeight/2}) rotate(-90)`);
        yAxisLabel.setAttribute('text-anchor', 'middle');
        yAxisLabel.setAttribute('font-size', '14px');
        yAxisLabel.setAttribute('fill', '#333');
        yAxisLabel.textContent = 'XP';
        g.appendChild(yAxisLabel);
        
        // X-axis label
        const xAxisLabel = createSvgElement('text');
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
            
            pathData += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        });
        
        // Create area under the line
        let areaPathData = pathData;
        areaPathData += ` L ${xScale(new Date(sortedData[sortedData.length - 1].timestamp))} ${chartHeight}`;
        areaPathData += ` L ${xScale(new Date(sortedData[0].timestamp))} ${chartHeight}`;
        areaPathData += ' Z';
        
        const areaPath = createSvgElement('path');
        areaPath.setAttribute('d', areaPathData);
        areaPath.setAttribute('fill', 'rgba(76, 175, 80, 0.1)');
        areaPath.setAttribute('stroke', 'none');
        g.appendChild(areaPath);
        
        // Create path element
        const path = createSvgElement('path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#4CAF50');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-linejoin', 'round');
        g.appendChild(path);
        
        // Add data points with tooltips
        sortedData.forEach((dataPoint) => {
            const x = xScale(new Date(dataPoint.timestamp));
            const y = yScale(dataPoint.cumulative);
            
            // Create circle for data point
            const circle = createSvgElement('circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#4CAF50');
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            g.appendChild(circle);
            
            // Create tooltip group
            const tooltip = createSvgElement('g');
            tooltip.setAttribute('opacity', '0');
            tooltip.style.pointerEvents = 'none';
            g.appendChild(tooltip);
            
            // Tooltip background
            const tooltipBg = createSvgElement('rect');
            tooltipBg.setAttribute('x', x - 75);
            tooltipBg.setAttribute('y', y - 65);
            tooltipBg.setAttribute('width', '150');
            tooltipBg.setAttribute('height', '50');
            tooltipBg.setAttribute('rx', '5');
            tooltipBg.setAttribute('ry', '5');
            tooltipBg.setAttribute('fill', 'rgba(0, 0, 0, 0.7)');
            tooltip.appendChild(tooltipBg);
            
            // Tooltip text - date
            const dateText = createSvgElement('text');
            dateText.setAttribute('x', x);
            dateText.setAttribute('y', y - 45);
            dateText.setAttribute('text-anchor', 'middle');
            dateText.setAttribute('fill', '#fff');
            dateText.setAttribute('font-size', '12px');
            dateText.textContent = dataPoint.date;
            tooltip.appendChild(dateText);
            
            // Tooltip text - XP info
            const xpText = createSvgElement('text');
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
    
    // Draw initial chart
    drawChart(data[activeTab], container.clientWidth, 300);
    
    // Handle window resize
    const debouncedResize = debounce(() => {
        // Update chart if container width changed
        if (container.clientWidth > 0) {
            // Redraw chart
            drawChart(data[activeTab], container.clientWidth, 300);
            
            // Update tab labels based on new screen size
            const isMobile = window.innerWidth < 480;
            document.querySelectorAll('.xp-tab').forEach(tab => {
                const category = tab.dataset.category;
                
                tab.textContent = isMobile ? 
                    tabLabels[category] : 
                    `${tabLabels[category]} (${formatXp(data.totals[category])})`;
            });
        }
    }, 250);
    
    window.addEventListener('resize', debouncedResize);
}

function renderProgressTable(progressData) {
    // Check if progressData exists and has the expected structure
    if (!progressData || !progressData.module || !progressData.piscineGo || !progressData.piscineJs) {
        console.error('Progress data is missing or has incorrect format', progressData);
        return;
    }
    
    // Create container for the tabs and tables
    const container = document.getElementById('progress-graph');
    if (!container) return;
    
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
    
    // Function to merge entries for the same project
    function mergeEntriesByProject(entries) {
        if (!entries || entries.length === 0) return [];
        
        // Group entries by project path
        const projectGroups = {};
        
        entries.forEach(entry => {
            if (!projectGroups[entry.path]) {
                projectGroups[entry.path] = [];
            }
            projectGroups[entry.path].push(entry);
        });
        
        // Process each group to merge if needed
        const mergedEntries = [];
        
        Object.keys(projectGroups).forEach(path => {
            const projectEntries = projectGroups[path];
            
            // Sort by date (newest first)
            projectEntries.sort((a, b) => b.date - a.date);
            
            // Get the latest entry (which will be our base)
            const latestEntry = projectEntries[0];
            
            // Check if this project has multiple entries and at least one is successful
            const hasSuccessful = projectEntries.some(entry => entry.isCompleted);
            
            if (projectEntries.length > 1) {
                // If there's a successful entry, use it as the base
                const successfulEntry = hasSuccessful ? 
                    projectEntries.find(entry => entry.isCompleted) : 
                    latestEntry;
                
                // Count attempts
                successfulEntry.attempts = projectEntries.length;
                
                // Add additional info to the tooltip
                const attemptDates = projectEntries
                    .map(e => `${e.formattedDate}: ${e.grade !== null ? e.grade.toFixed(2) : 'No Grade'}`)
                    .join('\n');
                
                successfulEntry.attemptDates = attemptDates;
                
                mergedEntries.push(successfulEntry);
            } else {
                // Just a single entry, add it as is
                mergedEntries.push(latestEntry);
            }
        });
        
        // Sort final result by date (newest first)
        return mergedEntries.sort((a, b) => b.date - a.date);
    }
    
    // Function to generate a table for a specific category
    function generateTable(entries, containerId) {
        const tableContainer = document.getElementById(containerId);
        
        if (!entries || entries.length === 0) {
            tableContainer.innerHTML = '<p class="no-data">No data available for this category.</p>';
            return;
        }
        
        // Add a wrapper div for scrolling
        tableContainer.innerHTML = '<div class="table-scroll-wrapper"></div>';
        const scrollWrapper = tableContainer.querySelector('.table-scroll-wrapper');
        
        // Process entries to merge duplicates
        const mergedEntries = mergeEntriesByProject(entries);
        
        // Create table HTML
        let tableHTML = `
            <table class="progress-data-table">
                <thead>
                    <tr>
                        <th>Project</th>
                        <th>Date</th>
                        <th>Grade</th>
                        <th>Status</th>
                        <th>Attempts</th>
                        <th>Captain</th>
                        <th>Auditors</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add rows for each entry
        mergedEntries.forEach(entry => {
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
            
            // Show attempts count
            const attempts = entry.attempts || 1;
            const attemptsDisplay = attempts > 1 ? 
                `<span class="attempts-count" title="${entry.attemptDates || 'Multiple submissions'}">${attempts}</span>` : 
                '1';
            
            tableHTML += `
                <tr class="${entry.isCompleted ? 'completed' : 'incomplete'}">
                    <td>${projectName}</td>
                    <td>${entry.formattedDate}</td>
                    <td>${formattedGrade}</td>
                    <td>${status}</td>
                    <td>${attemptsDisplay}</td>
                    <td>${captain}</td>
                    <td>${auditors}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        scrollWrapper.innerHTML = tableHTML;
    }
    
    // Generate tables for each category
    generateTable(progressData.module, 'module-table');
    generateTable(progressData.piscineGo, 'piscineGo-table');
    generateTable(progressData.piscineJs, 'piscineJs-table');
    
    // Initially hide non-active tables
    document.querySelectorAll('.progress-table:not(.active)').forEach(table => {
        table.style.display = 'none';
    });
    
    // Add tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tables = document.querySelectorAll('.progress-table');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and tables
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tables.forEach(table => {
                table.classList.remove('active');
                table.style.display = 'none';
            });
            
            // Add active class to current button and corresponding table
            button.classList.add('active');
            const tabCategory = button.getAttribute('data-tab');
            const activeTable = document.getElementById(`${tabCategory}-table`);
            activeTable.classList.add('active');
            activeTable.style.display = 'block';
        });
    });
    
    // Add styles for the tables
    const style = document.createElement('style');
    style.textContent = `
        .table-scroll-wrapper {
            max-height: 400px;
            overflow-y: auto;
            position: relative;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e7eb;
        }
        
        .progress-data-table thead th {
            position: sticky;
            top: 0;
            background-color: #f8f9fa;
            z-index: 10;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .attempts-count {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 22px;
            height: 22px;
            background-color: #f0f0f0;
            color: #444;
            border-radius: 11px;
            font-size: 0.85rem;
            font-weight: bold;
            padding: 0 6px;
            cursor: help;
        }
        
        tr.completed .attempts-count {
            background-color: rgba(16, 185, 129, 0.15);
            color: #10b981;
        }
        
        /* Make sure the tables take full width but stay inside their container */
        .progress-table {
            width: 100%;
            padding-bottom: 8px;
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
            .table-scroll-wrapper {
                max-height: 350px;
                overflow-x: auto;
            }
            
            .progress-data-table {
                min-width: 650px; /* Ensure it's scrollable on mobile */
            }
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