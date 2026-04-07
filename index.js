document.addEventListener('DOMContentLoaded', () => {
  const btnStudentTab = document.getElementById('btnStudentTab');
  const btnAdminTab = document.getElementById('btnAdminTab');
  const studentForm = document.getElementById('studentLoginForm');
  const adminForm = document.getElementById('adminLoginForm');
  
  const studentBtnText = document.querySelector('#studentBtn span');
  const studentSpinner = document.getElementById('studentSpinner');
  const adminBtnText = document.querySelector('#adminBtn span');
  const adminSpinner = document.getElementById('adminSpinner');

  // Check if already logged in
  const role = localStorage.getItem('role');
  if (role === 'student') window.location.href = 'student.html';
  else if (role === 'admin') window.location.href = 'dashboard.html';

  const setTabActive = (activeBtn, inactiveBtn) => {
    activeBtn.style.background = 'var(--card-bg)';
    activeBtn.style.color = 'var(--text-main)';
    activeBtn.style.border = '1px solid var(--card-border)';
    activeBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';

    inactiveBtn.style.background = 'transparent';
    inactiveBtn.style.color = 'var(--text-muted)';
    inactiveBtn.style.border = '1px solid transparent';
    inactiveBtn.style.boxShadow = 'none';
  };

  btnStudentTab.addEventListener('click', (e) => {
    e.preventDefault();
    setTabActive(btnStudentTab, btnAdminTab);
    studentForm.classList.remove('hidden');
    adminForm.classList.add('hidden');
    studentForm.classList.add('animate-fade-in');
  });

  btnAdminTab.addEventListener('click', (e) => {
    e.preventDefault();
    setTabActive(btnAdminTab, btnStudentTab);
    adminForm.classList.remove('hidden');
    studentForm.classList.add('hidden');
    adminForm.classList.add('animate-fade-in');
  });

  studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('studentId').value.trim();
    if (!id) return;

    studentBtnText.innerText = 'Signing in...';
    studentSpinner.classList.remove('hidden');

    try {
      const { data, error } = await window.supabaseClient
        .from('students')
        .select('*')
        .eq('student_id', id)
        .single();
        
      if (error || !data) throw error;
      
      localStorage.setItem('role', 'student');
      localStorage.setItem('userId', data.student_id);
      localStorage.setItem('userName', data.name);
      
      window.showToast('Login successful!');
      setTimeout(() => { window.location.href = 'student.html'; }, 800);
      
    } catch (err) {
      window.showToast('Student ID not found.', true);
      studentBtnText.innerText = 'Sign in as Student';
      studentSpinner.classList.add('hidden');
    }
  });

  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('adminId').value.trim();
    if (!id) return;

    adminBtnText.innerText = 'Signing in...';
    adminSpinner.classList.remove('hidden');

    try {
      const { data, error } = await window.supabaseClient
        .from('admins')
        .select('*')
        .eq('admin_id', id)
        .single();
        
      if (error || !data) throw error;
      
      localStorage.setItem('role', 'admin');
      localStorage.setItem('userId', data.admin_id);
      localStorage.setItem('userName', data.name);
      
      window.showToast('Login successful!');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
      
    } catch (err) {
      window.showToast('Admin ID not found.', true);
      adminBtnText.innerText = 'Sign in as Admin';
      adminSpinner.classList.add('hidden');
    }
  });
});
