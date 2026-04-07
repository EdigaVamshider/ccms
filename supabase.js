const supabaseUrl = 'https://qljebjegoiphrjfffgyo.supabase.co';
const supabaseKey = 'sb_publishable_74ldDV2xOJ2H9Pkg8tsuXg_Gb1Wcwv-';

window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

window.showToast = function(message, isError = false) {
  let toast = document.getElementById('toast');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  
  const icon = isError ? '⚠️' : '✅';
  const color = isError ? '#ef4444' : '#10b981';
  
  toast.innerHTML = `<span style="color: ${color}; font-size: 1.25rem;">${icon}</span> ${message}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
};

window.logout = function() {
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  window.location.href = 'index.html';
};

// Global Mouse Trailer Animation & Ambient Blob
document.addEventListener('DOMContentLoaded', () => {
  // Disable global cursor effect on the landing page, as it has its own premium effect
  if (window.location.pathname.includes('landing.html') || window.location.pathname === '/' || window.location.pathname.endsWith('CCMS/')) return;

  const colors = ['rgba(59, 130, 246, 0.6)']; // Single color for entire website as per specs
  let colorIndex = 0;

  // Initialize background blob
  const appBlob = document.createElement('div');
  appBlob.id = 'ambient-blob';
  document.body.appendChild(appBlob);

  document.addEventListener('mousemove', (e) => {
    
    // Smooth blob animation (requires the Web Animations API)
    appBlob.animate({
      left: `${e.clientX}px`,
      top: `${e.clientY}px`
    }, { duration: 3000, fill: "forwards" });

    // Only spawn a dot occasionally based on mouse speed (via requestAnimationFrame gating or simple random) to prevent overloading the DOM
    if (Math.random() > 0.4) return;

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    
    // Dynamic size scaling slightly
    const size = Math.random() * 8 + 4; // 4px to 12px
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    dot.style.backgroundColor = colors[colorIndex % colors.length];
    dot.style.boxShadow = `0 0 8px ${colors[colorIndex % colors.length]}`;
    colorIndex++;

    document.body.appendChild(dot);

    // Fade out and remove
    setTimeout(() => {
      dot.style.opacity = '0';
      dot.style.transform = `translate(-50%, -50%) scale(0.5) translateY(10px)`;
    }, 50);

    setTimeout(() => {
      if(dot.parentNode) dot.parentNode.removeChild(dot);
    }, 400); // Wait for transition
  });
});
