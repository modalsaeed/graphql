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
function renderSkillsBarChart(skillsData) {
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
            handleSkillClick(skill);
        });
    });
    
    // Add responsive behavior
    window.addEventListener('resize', () => {
        if (container.clientWidth !== width + margin.left + margin.right) {
            renderSkillsBarChart(skillsData);
        }
    });
}

function handleSkillClick(skill) {
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
    detailContainer.innerHTML = `<h3>Skill Details: ${skill.name}</h3>
                                <p>Value: ${skill.value}</p>
                                <p>ID: ${skill.id}</p>
                                <p>Detailed chart will be implemented here</p>`;
    
    // Scroll to the detail section
    detailContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

window.renderAuditRatioPieChart = renderAuditRatioPieChart;
window.renderSkillsBarChart = renderSkillsBarChart;