const API_KEY = "211e6d7c11cf46d6958132008250308";
let myChart = null;

// Load default weather on page load
window.addEventListener('load', () => {
  document.getElementById('locationInput').value = 'Haldia, West Bengal, India';
  getWeather();
});

// Enter key support
document.getElementById('locationInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    getWeather();
  }
});

// Add input animation effects
document.getElementById('locationInput').addEventListener('focus', function() {
  this.parentElement.classList.add('focused');
});

document.getElementById('locationInput').addEventListener('blur', function() {
  this.parentElement.classList.remove('focused');
});

async function getWeather() {
  const location = document.getElementById("locationInput").value.trim();
  if (!location) {
    showError("Please enter a location");
    return;
  }

  // Improve location search by being more specific for Indian cities
  let searchQuery = location;
  if (location.toLowerCase().includes('haldia') && !location.toLowerCase().includes('bangladesh')) {
    searchQuery = 'Haldia, West Bengal, India';
  } else if (location.toLowerCase().includes('india') || location.toLowerCase().includes('west bengal')) {
    // Keep the query as is for Indian locations
  } else {
    // For other locations, try to be more specific
    searchQuery = location;
  }

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(searchQuery)}&days=7&aqi=no&alerts=no`;

  try {
    showLoading();
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      showError(data.error.message);
      return;
    }

    displayWeather(data);
  } catch (err) {
    console.error('Error:', err);
    showError("Network error. Please check your connection and try again.");
  }
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    // Show loading while getting location
    const button = document.querySelector('.precise-btn');
    const originalText = button.innerHTML;
    button.innerHTML = '📍 Getting location...';
    button.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        getWeatherByCoords(lat, lon);
        
        // Reset button
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 2000);
      },
      (error) => {
        showError("Could not get your location. Please ensure location access is enabled.");
        // Reset button
        button.innerHTML = originalText;
        button.disabled = false;
      }
    );
  } else {
    showError("Geolocation is not supported by this browser");
  }
}

async function getWeatherByCoords(lat, lon) {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=7&aqi=no&alerts=no`;
  
  try {
    showLoading();
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      showError(data.error.message);
      return;
    }
    
    // Update the input field with the found location
    document.getElementById('locationInput').value = `${data.location.name}, ${data.location.region}, ${data.location.country}`;
    
    displayWeather(data);
  } catch (err) {
    showError("Network error. Please check your connection and try again.");
  }
}

function showLoading() {
  document.getElementById("weatherInfo").innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <span>Fetching weather data...</span>
    </div>
  `;
}

function showError(message) {
  document.getElementById("weatherInfo").innerHTML = `
    <div class="error">
      <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
      <strong>Oops!</strong><br>
      ${message}
    </div>
  `;
}

function getWeatherIcon(condition, isDay = 1) {
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
    return isDay ? '☀️' : '🌙';
  }
  if (conditionLower.includes('partly cloudy')) {
    return isDay ? '⛅' : '☁️';
  }
  if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
    return '☁️';
  }
  if (conditionLower.includes('rain') && conditionLower.includes('thunder')) {
    return '⛈️';
  }
  if (conditionLower.includes('thunder')) {
    return '⛈️';
  }
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle') || conditionLower.includes('shower')) {
    return '🌧️';
  }
  if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) {
    return '🌨️';
  }
  if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
    return '🌫️';
  }
  if (conditionLower.includes('haze')) {
    return '🌫️';
  }
  
  return '☁️'; // default
}

function displayWeather(data) {
  const { location, current, forecast } = data;
  
  // Get current local time for the location
  const localTime = new Date(location.localtime);
  const dayName = localTime.toLocaleDateString('en-US', { weekday: 'long' });
  const timeString = localTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  const weatherIcon = getWeatherIcon(current.condition.text, current.is_day);

  // Get precipitation chance from current hour data
  const currentHour = localTime.getHours();
  const todaysForecast = forecast.forecastday[0];
  const currentHourData = todaysForecast.hour[currentHour];
  const precipChance = currentHourData ? (currentHourData.chance_of_rain || currentHourData.chance_of_snow || 0) : 0;

  document.getElementById("weatherInfo").innerHTML = `
    <!-- Header Section -->
    <div class="location-header">
      <div class="location-info">
        <span class="location-name">📍 ${location.name}, ${location.region}, ${location.country}</span>
        <button class="precise-btn" onclick="getCurrentLocation()">
          🎯 Use precise location
        </button>
      </div>
      <div class="menu-dots">⋮</div>
    </div>

    <!-- Main Weather Section -->
    <div class="main-weather-section">
      <div class="weather-main">
        <div class="weather-icon">${weatherIcon}</div>
        <div class="temperature-display">
          <span class="main-temp">${Math.round(current.temp_c)}</span>
          <span class="temp-unit">°C</span>
        </div>
      </div>
      
      <div class="weather-details">
        <div class="weather-title">Weather</div>
        <div class="weather-time">${dayName}, ${timeString}</div>
        <div class="weather-condition">${current.condition.text}</div>
      </div>
    </div>

    <!-- Weather Stats -->
    <div class="weather-stats">
      <div class="stat-item">
        <span>Precipitation</span>
        <span class="stat-value">${precipChance}%</span>
      </div>
      <div class="stat-item">
        <span>Humidity</span>
        <span class="stat-value">${current.humidity}%</span>
      </div>
      <div class="stat-item">
        <span>Wind Speed</span>
        <span class="stat-value">${Math.round(current.wind_kph)} km/h</span>
      </div>
      <div class="stat-item">
        <span>Feels Like</span>
        <span class="stat-value">${Math.round(current.feelslike_c)}°C</span>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="nav-tabs">
      <div class="nav-tab active" onclick="switchTab('temperature')">📊 Temperature</div>
      <div class="nav-tab" onclick="switchTab('precipitation')">🌧️ Precipitation</div>
      <div class="nav-tab" onclick="switchTab('wind')">💨 Wind</div>
    </div>

    <!-- Temperature Chart -->
    <div class="chart-container">
      <canvas id="tempChart"></canvas>
    </div>

    <!-- Forecast Section -->
    <div class="forecast-container" id="forecastContainer">
      <!-- Forecast days will be added here -->
    </div>
  `;

  // Create temperature chart with animation
  setTimeout(() => {
    createChart(forecast.forecastday[0].hour);
  }, 300);
  
  // Create forecast
  createForecast(forecast.forecastday);
  
  // Add fade-in animation
  const weatherContainer = document.getElementById('weatherInfo');
  weatherContainer.style.opacity = '0';
  weatherContainer.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    weatherContainer.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    weatherContainer.style.opacity = '1';
    weatherContainer.style.transform = 'translateY(0)';
  }, 100);
}

function switchTab(tabType) {
  // Update active tab
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Here you can add logic to switch chart data based on tab
  // For now, we'll just show a simple animation
  const chartContainer = document.querySelector('.chart-container');
  chartContainer.style.transform = 'scale(0.95)';
  chartContainer.style.opacity = '0.7';
  
  setTimeout(() => {
    chartContainer.style.transform = 'scale(1)';
    chartContainer.style.opacity = '1';
  }, 200);
}

function createChart(hourlyData) {
  const ctx = document.getElementById("tempChart");
  if (!ctx) return;
  
  const context = ctx.getContext("2d");
  
  // Get temperatures and labels for the chart
  const temperatures = [];
  const labels = [];
  
  // Show every 3 hours for better visibility
  for (let i = 0; i < 24; i += 3) {
    const hour = hourlyData[i];
    if (hour) {
      temperatures.push(Math.round(hour.temp_c));
      
      const time = new Date(hour.time);
      const hourNum = time.getHours();
      let timeLabel;
      
      if (hourNum === 0) timeLabel = '12am';
      else if (hourNum === 12) timeLabel = '12pm'; 
      else if (hourNum < 12) timeLabel = hourNum + 'am';
      else timeLabel = (hourNum - 12) + 'pm';
      
      labels.push(timeLabel);
    }
  }

  if (myChart) {
    myChart.destroy();
  }

  myChart = new Chart(context, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: temperatures,
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#f59e0b',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 2000,
        easing: 'easeInOutQuart'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#fbbf24',
          borderWidth: 2,
          cornerRadius: 12,
          displayColors: false,
          titleFont: {
            size: 14,
            family: 'Poppins',
            weight: '600'
          },
          bodyFont: {
            size: 13,
            family: 'Inter',
            weight: '500'
          },
          padding: 12,
          callbacks: {
            title: function(context) {
              return `${context[0].label}`;
            },
            label: function(context) {
              return `${context.parsed.y}°C`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: { 
              size: 12,
              family: 'Inter',
              weight: '500'
            },
            padding: 8
          },
          grid: {
            display: false
          },
          border: {
            display: false
          }
        },
        y: {
          display: false,
          grid: {
            display: false
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      elements: {
        point: {
          hoverRadius: 8
        }
      }
    }
  });
}

function createForecast(forecastDays) {
  const forecastContainer = document.getElementById("forecastContainer");
  if (!forecastContainer) return;
  
  forecastContainer.innerHTML = "";

  // Show all forecast days (up to 7)
  forecastDays.forEach((day, index) => {
    const date = new Date(day.date);
    let dayName;
    
    if (index === 0) {
      dayName = 'Today';
    } else if (index === 1) {
      dayName = 'Tomorrow';
    } else {
      dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    const weatherIcon = getWeatherIcon(day.day.condition.text, 1);

    const forecastDay = document.createElement('div');
    forecastDay.className = 'forecast-day';
    forecastDay.style.animationDelay = `${index * 0.1}s`;
    
    forecastDay.innerHTML = `
      <div class="day-name">${dayName}</div>
      <div class="day-icon">${weatherIcon}</div>
      <div class="day-temps">
        <span class="temp-high">${Math.round(day.day.maxtemp_c)}°</span>
        <span class="temp-low">${Math.round(day.day.mintemp_c)}°</span>
      </div>
    `;
    
    // Add click event for detailed view (you can expand this)
    forecastDay.addEventListener('click', () => {
      showDayDetail(day, dayName);
    });
    
    forecastContainer.appendChild(forecastDay);
  });
}

function showDayDetail(dayData, dayName) {
  // Simple alert for now - you can create a modal later
  const maxTemp = Math.round(dayData.day.maxtemp_c);
  const minTemp = Math.round(dayData.day.mintemp_c);
  const condition = dayData.day.condition.text;
  const humidity = dayData.day.avghumidity;
  const windSpeed = Math.round(dayData.day.maxwind_kph);
  
  alert(`${dayName} Forecast:
🌡️ High: ${maxTemp}°C
🌡️ Low: ${minTemp}°C
☁️ Condition: ${condition}
💧 Humidity: ${humidity}%
💨 Max Wind: ${windSpeed} km/h`);
}

// Add some CSS animations via JavaScript
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .forecast-day {
    animation: fadeInUp 0.6s ease-out forwards;
    opacity: 0;
  }
  
  .search-container {
    animation: fadeInUp 0.8s ease-out 0.2s forwards;
    opacity: 0;
  }
  
  .search-title {
    animation: fadeInUp 0.8s ease-out forwards;
    opacity: 0;
  }
  
  .search-subtitle {
    animation: fadeInUp 0.8s ease-out 0.1s forwards;
    opacity: 0;
  }
`;
document.head.appendChild(style);

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
  // Add click effect to search button
  const searchBtn = document.querySelector('.search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255,255,255,0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }
  
  // Add ripple animation
  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    @keyframes ripple {
      to {
        transform: scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(rippleStyle);
});