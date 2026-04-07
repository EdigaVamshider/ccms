document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  if (role !== 'student' || !userId) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('welcomeText').innerText = userName || userId;

  const complaintForm = document.getElementById('complaintForm');
  const tableBody = document.getElementById('complaintsTableBody');
  const submitBtnText = document.querySelector('#submitComplaintBtn span').childNodes[0];
  const submitSpinner = document.getElementById('submitSpinner');

  // Inject Student Data Fetch UI dynamically
  const fetchUI = document.createElement('div');
  fetchUI.innerHTML = `
    <div class="form-group" style="margin-bottom: 0.5rem;">
      <input type="text" id="regNo" placeholder=" " required autocomplete="off">
      <label for="regNo">Registration Number</label>
    </div>
    <div id="regError" style="color: #ef4444; font-size: 0.8rem; margin-bottom: 1rem; margin-left: 1rem; display: none; opacity: 0; transition: opacity 0.3s ease;">Student not found in system</div>
    <div id="studentDetailsWrapper" style="display: none; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
      <div class="form-group" style="flex: 1; min-width: 120px; margin-bottom: 0;">
        <input type="text" id="stuName" placeholder=" " readonly style="background: rgba(255,255,255,0.02); pointer-events: none;">
        <label for="stuName">Name</label>
      </div>
      <div class="form-group" style="flex: 1; min-width: 120px; margin-bottom: 0;">
        <input type="text" id="stuEmail" placeholder=" " readonly style="background: rgba(255,255,255,0.02); pointer-events: none;">
        <label for="stuEmail">Email</label>
      </div>
      <div class="form-group" style="flex: 1; min-width: 120px; margin-bottom: 0;">
        <input type="text" id="stuDept" placeholder=" " readonly style="background: rgba(255,255,255,0.02); pointer-events: none;">
        <label for="stuDept">Department</label>
      </div>
    </div>
  `;
  complaintForm.insertBefore(fetchUI, complaintForm.firstChild);

  const regNoInput = document.getElementById('regNo');
  const regError = document.getElementById('regError');
  const studentDetailsWrapper = document.getElementById('studentDetailsWrapper');
  const stuName = document.getElementById('stuName');
  const stuEmail = document.getElementById('stuEmail');
  const stuDept = document.getElementById('stuDept');

  let dbDebounceTimer;
  regNoInput.addEventListener('input', (e) => {
    clearTimeout(dbDebounceTimer);
    const val = e.target.value.trim();
    if (!val) {
      studentDetailsWrapper.style.display = 'none';
      regError.style.display = 'none';
      return;
    }
    
    dbDebounceTimer = setTimeout(async () => {
      try {
        const { data, error } = await window.supabaseClient
          .from('students')
          .select('name, email, department')
          .eq('student_id', val)
          .single();

        if (error || !data) {
          studentDetailsWrapper.style.display = 'none';
          regError.style.display = 'block';
          setTimeout(() => regError.style.opacity = '1', 10);
        } else {
          regError.style.opacity = '0';
          setTimeout(() => regError.style.display = 'none', 300);
          
          stuName.value = data.name || '';
          stuEmail.value = data.email || '';
          stuDept.value = data.department || '';
          
          studentDetailsWrapper.style.display = 'flex';
        }
      } catch (err) {
        studentDetailsWrapper.style.display = 'none';
        regError.style.display = 'block';
        setTimeout(() => regError.style.opacity = '1', 10);
      }
    }, 400); // Debounce to prevent excessive queries
  });

  // Pre-fill with the currently logged-in user if available
  if (userId) {
    regNoInput.value = userId;
    regNoInput.dispatchEvent(new Event('input'));
  }


  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.logout();
    });
  }

  const loadComplaints = async () => {
    try {
      const { data, error } = await window.supabaseClient
        .from('complaints')
        .select('*')
        .eq('student_id', userId)
        .order('date_submitted', { ascending: false });

      if (error) throw error;

      tableBody.innerHTML = '';

      let pendingIdx = 0;
      let resolvedIdx = 0;
      let totalIdx = data ? data.length : 0;

      if (totalIdx === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-muted); padding: 2rem;">No complaints filed yet.</td></tr>`;
      } else {
        data.forEach(c => {
          const tr = document.createElement('tr');
          
          let statusClass = 'pending';
          let statusText = c.status || 'Pending';
          const sLower = statusText.toLowerCase();

          if (sLower === 'pending') pendingIdx++;
          if (sLower === 'in progress') statusClass = 'in-progress';
          if (sLower === 'resolved') {
            statusClass = 'resolved';
            resolvedIdx++;
          }

          const dateStr = new Date(c.date_submitted || Date.now()).toLocaleDateString();

          tr.innerHTML = `
            <td>${dateStr}</td>
            <td><strong>${c.category}</strong></td>
            <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.description}">
              ${c.description}
            </td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
          `;
          tableBody.appendChild(tr);
        });
      }

      // Update Metrics
      document.getElementById('statTotal').innerText = totalIdx;
      document.getElementById('statPending').innerText = pendingIdx;
      document.getElementById('statResolved').innerText = resolvedIdx;

    } catch (err) {
      console.error(err);
      window.showToast('Failed to load complaints.', true);
    }
  };

  complaintForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentIdVal = document.getElementById('regNo').value.trim();
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value.trim();

    if (!studentIdVal || !category || !description) return;

    // Spinner specific UX
    submitBtnText.nodeValue = 'Submitting... ';
    submitSpinner.classList.remove('hidden');

    const newComplaint = {
      student_id: studentIdVal,
      category: category,
      description: description,
      status: 'Pending',
      date_submitted: new Date().toISOString()
    };

    try {
      const { error } = await window.supabaseClient
        .from('complaints')
        .insert([newComplaint]);

      if (error) throw error;

      window.showToast('Complaint submitted successfully!');
      complaintForm.reset();
      loadComplaints();
      
    } catch (err) {
      console.error(err);
      window.showToast('Failed to submit complaint.', true);
    } finally {
      submitBtnText.nodeValue = 'Submit Complaint ';
      submitSpinner.classList.add('hidden');
    }
  });

  loadComplaints();
});
