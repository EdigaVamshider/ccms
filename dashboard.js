document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  if (role !== 'admin' || !userId) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('welcomeText').innerText = userName || userId;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.logout();
    });
  }

  const loadDashboardData = async () => {
    try {
      const { data, error } = await window.supabaseClient.from('complaints').select('status');
      if (error) throw error;

      let pending = 0;
      let inProgress = 0;
      let resolved = 0;

      data.forEach(c => {
        if (!c.status) return;
        const s = c.status.toLowerCase();
        if (s === 'pending') pending++;
        else if (s === 'in progress') inProgress++;
        else if (s === 'resolved') resolved++;
      });

      const total = pending + inProgress + resolved;

      document.getElementById('statTotal').innerText = total;
      document.getElementById('statPending').innerText = pending;
      document.getElementById('statProgress').innerText = inProgress;
      document.getElementById('statResolved').innerText = resolved;

      renderChart(pending, inProgress, resolved);

    } catch (err) {
      console.error(err);
      window.showToast('Failed to load dashboard data.', true);
    }
  };

  let chartInstance = null;
  const renderChart = (pending, inProgress, resolved) => {
    const ctx = document.getElementById('complaintsChart').getContext('2d');
    
    if (chartInstance) {
      chartInstance.destroy();
    }

    // Set defaults for dark mode Apple aesthetic
    Chart.defaults.color = '#a1a1aa';
    Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Pending', 'In Progress', 'Resolved'],
        datasets: [{
          label: 'Count',
          data: [pending, inProgress, resolved],
          backgroundColor: [
            'rgba(245, 158, 11, 0.2)',   // Yellow
            'rgba(59, 130, 246, 0.2)',   // Blue
            'rgba(16, 185, 129, 0.2)'    // Green
          ],
          borderColor: [
            'rgb(245, 158, 11)',
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)'
          ],
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              padding: 10
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false
            }
          },
          x: {
            grid: {
              display: false,
              drawBorder: false
            }
          }
        }
      }
    });
  };

  loadDashboardData();
});
