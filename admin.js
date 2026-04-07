document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  if (role !== 'admin' || !userId) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('welcomeText').innerText = userName || userId;

  const tableBody = document.getElementById('adminComplaintsTableBody');
  const refreshBtn = document.getElementById('refreshBtn');
  
  const modal = document.getElementById('resolutionModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const resolutionForm = document.getElementById('resolutionForm');
  const saveBtnText = document.querySelector('#saveUpdateBtn span').childNodes[0];
  const adminModalSpinner = document.getElementById('adminModalSpinner');

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.logout();
    });
  }
  
  let currentComplaintId = null;

  const loadComplaints = async () => {
    try {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem;">Loading data...</td></tr>`;

      const [complaintsRes, studentsRes] = await Promise.all([
        window.supabaseClient.from('complaints').select('*').order('date_submitted', { ascending: false }),
        window.supabaseClient.from('students').select('student_id, name')
      ]);

      if (complaintsRes.error) throw complaintsRes.error;
      
      const complaints = complaintsRes.data || [];
      const students = studentsRes.data || [];
      const studentMap = {};
      students.forEach(s => { studentMap[s.student_id] = s.name; });

      tableBody.innerHTML = '';

      if (complaints.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem;">No complaints registered yet.</td></tr>`;
        return;
      }

      complaints.forEach(c => {
        const tr = document.createElement('tr');
        
        let statusClass = 'pending';
        let statusText = c.status || 'Pending';
        if (statusText.toLowerCase() === 'in progress') statusClass = 'in-progress';
        if (statusText.toLowerCase() === 'resolved') statusClass = 'resolved';

        const dateStr = new Date(c.date_submitted || Date.now()).toLocaleDateString();
        const studentName = studentMap[c.student_id] || c.student_id;

        tr.innerHTML = `
          <td style="color: var(--text-muted);">#${String(c.complaint_id).substring(0,6)}</td>
          <td style="font-weight: 500;">${studentName}</td>
          <td>${dateStr}</td>
          <td>${c.category}</td>
          <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.description}">
            ${c.description}
          </td>
          <td><span class="status ${statusClass}">${statusText}</span></td>
          <td>
            <button class="btn btn-sm btn-outline update-btn" data-id="${c.complaint_id}" data-status="${statusText}" style="padding: 0.35rem 0.75rem;">Manage</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });

      document.querySelectorAll('.update-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const currentStatus = e.target.getAttribute('data-status');
          openModal(id, currentStatus);
        });
      });

    } catch (err) {
      console.error(err);
      window.showToast('Failed to load complaints.', true);
    }
  };

  refreshBtn.addEventListener('click', loadComplaints);

  const openModal = (id, currentStatus) => {
    currentComplaintId = id;
    document.getElementById('modalComplaintId').innerText = `#${String(id).substring(0,8)}...`;
    
    // Default valid matching logic
    const s = document.getElementById('statusSelect');
    s.value = ['Pending', 'In Progress', 'Resolved'].includes(currentStatus) ? currentStatus : 'Pending';
    
    document.getElementById('actionTaken').value = '';
    modal.classList.add('show');
  };

  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    currentComplaintId = null;
  });

  resolutionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentComplaintId) return;

    saveBtnText.nodeValue = 'Saving ';
    adminModalSpinner.classList.remove('hidden');

    const newStatus = document.getElementById('statusSelect').value;
    const actionTaken = document.getElementById('actionTaken').value.trim();

    try {
      const { error: updateError } = await window.supabaseClient
        .from('complaints')
        .update({ status: newStatus })
        .eq('complaint_id', currentComplaintId);

      if (updateError) throw updateError;

      if (actionTaken || newStatus === 'Resolved') {
        const resolution = {
          complaint_id: currentComplaintId,
          remarks: 'Status updated to ' + newStatus,
          action_taken: actionTaken || 'Status progressed by Admin.',
          date_closed: newStatus === 'Resolved' ? new Date().toISOString() : null
        };
        
        await window.supabaseClient.from('resolutions').insert([resolution]);
      }

      window.showToast('Status successfully updated!');
      modal.classList.remove('show');
      loadComplaints();
      
    } catch (err) {
      console.error(err);
      window.showToast('Failed to save changes.', true);
    } finally {
      saveBtnText.nodeValue = 'Save ';
      adminModalSpinner.classList.add('hidden');
    }
  });

  loadComplaints();
});
