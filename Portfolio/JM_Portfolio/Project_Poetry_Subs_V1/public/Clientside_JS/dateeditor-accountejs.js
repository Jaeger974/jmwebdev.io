document.addEventListener('DOMContentLoaded', () => {
  const dateDisplay = document.getElementById('date-display');
  const datePicker = document.getElementById('date-picker');
  const editBtn = document.getElementById('edit-date-btn');
  const saveBtn = document.getElementById('save-date-btn');

  editBtn.addEventListener('click', () => {
    datePicker.style.display = 'inline-block';
    saveBtn.style.display = 'inline-block';
    editBtn.style.display = 'none';
    console.log('JS loaded and DOM ready');
  });

  saveBtn.addEventListener('click', () => {
    const selectedDate = datePicker.value;
    if (!selectedDate) return;

    dateDisplay.textContent = selectedDate;
    datePicker.style.display = 'none';
    saveBtn.style.display = 'none';
    editBtn.style.display = 'inline';

   


    // Send to server
    fetch('/save-date', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate })
    });
  });
});