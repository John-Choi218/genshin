// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAs5cuNHl0Xz8Uh67orB_kIS73FlDHAFyo",
  authDomain: "genshin-19001.firebaseapp.com",
  projectId: "genshin-19001",
  storageBucket: "genshin-19001.firebasestorage.app",
  messagingSenderId: "665245286525",
  appId: "1:665245286525:web:6e6ed97f903f2019057114",
  measurementId: "G-J8H6Q2G4WS"
};

// Initialize Firebase
let db;
try {
  console.log('Initializing Firebase...');
  const app = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  alert('Firebase 초기화에 실패했습니다. 콘솔을 확인해주세요.');
}

const taskLists = {
  daily: document.getElementById('daily-tasks'),
  weekly: document.getElementById('weekly-tasks'),
  todo: document.getElementById('todo-tasks')
};

function renderTasks(box, tasks) {
  console.log(`Rendering tasks for ${box}:`, tasks);
  if (!taskLists[box]) {
      console.error(`Task list for ${box} not found`);
      return;
  }
  taskLists[box].innerHTML = '';
  tasks.forEach((task) => {
      console.log(`Rendering task: ${task.data.text}, ID: ${task.id}`);
      const li = document.createElement('li');
      li.className = task.data.completed ? 'completed' : '';
      li.dataset.id = task.id;
      li.innerHTML = `
          <input type="checkbox" ${task.data.completed ? 'checked' : ''} data-id="${task.id}" data-box="${box}">
          <span>${task.data.text}</span>
          <div class="button-group">
              <button class="edit-btn" data-id="${task.id}" data-box="${box}">수정</button>
              <button class="delete-btn" data-id="${task.id}" data-box="${box}">삭제</button>
              <span class="drag-handle">☰</span>
          </div>
      `;
      taskLists[box].appendChild(li);
  });
}

async function addTask(box, text) {
  if (!text.trim()) {
      alert('항목 내용을 입력해주세요.');
      return;
  }
  try {
      console.log(`Adding task to ${box}: ${text}`);
      const snapshot = await db.collection(`${box}Tasks`).orderBy('order', 'desc').limit(1).get();
      const maxOrder = snapshot.empty ? 0 : snapshot.docs[0].data().order || 0;
      await db.collection(`${box}Tasks`).add({
          text,
          completed: false,
          order: maxOrder + 1,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Task added to ${box}`);
  } catch (error) {
      console.error('항목 추가 오류:', error);
      alert('항목 추가에 실패했습니다. Firestore 권한을 확인해주세요.');
  }
}

async function editTask(box, id, newText) {
  if (!newText.trim()) {
      alert('수정할 내용을 입력해주세요.');
      return;
  }
  try {
      console.log(`Editing task in ${box} with ID: ${id}, new text: ${newText}`);
      await db.collection(`${box}Tasks`).doc(id).update({ text: newText });
      console.log(`Task edited in ${box}`);
  } catch (error) {
      console.error('항목 수정 오류:', error);
      alert('항목 수정에 실패했습니다. Firestore 권한을 확인해주세요.');
  }
}

async function toggleTask(box, id) {
  try {
      console.log(`Toggling task in ${box} with ID: ${id}`);
      const taskRef = db.collection(`${box}Tasks`).doc(id);
      const taskSnap = await taskRef.get();
      if (taskSnap.exists) {
          await taskRef.update({ completed: !taskSnap.data().completed });
          console.log(`Task toggled in ${box}`);
      }
  } catch (error) {
      console.error('항목 토글 오류:', error);
      alert('항목 상태 변경에 실패했습니다. Firestore 권한을 확인해주세요.');
  }
}

async function deleteTask(box, id) {
  try {
      console.log(`Deleting task in ${box} with ID: ${id}`);
      await db.collection(`${box}Tasks`).doc(id).delete();
      console.log(`Task deleted from ${box}`);
  } catch (error) {
      console.error('항목 삭제 오류:', error);
      alert('항목 삭제에 실패했습니다. Firestore 권한을 확인해주세요.');
  }
}

async function updateTaskOrder(box, orderedIds) {
  try {
      console.log(`Updating order for ${box}:`, orderedIds);
      const batch = db.batch();
      orderedIds.forEach((id, index) => {
          const taskRef = db.collection(`${box}Tasks`).doc(id);
          batch.update(taskRef, { order: index + 1 });
      });
      await batch.commit();
      console.log(`Order updated for ${box}`);
  } catch (error) {
      console.error('순서 업데이트 오류:', error);
      alert('항목 순서 변경에 실패했습니다. Firestore 권한을 확인해주세요.');
  }
}

async function resetDailyTasks() {
  try {
      console.log('Resetting daily tasks');
      const dailyTasks = await db.collection('dailyTasks').get();
      const batch = db.batch();
      dailyTasks.forEach((task) => {
          const taskRef = db.collection('dailyTasks').doc(task.id);
          batch.update(taskRef, { completed: false });
      });
      await batch.commit();
      await db.collection('metadata').doc('resetTimes').set({ // 🔄 변경됨
          lastDailyReset: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }); // 🔄 변경됨
      console.log('Daily tasks reset');
  } catch (error) {
      console.error('일일 리셋 오류:', error);
      alert('일일 리셋에 실패했습니다. Firestore 권한을 확인해주세요.');
  }
}

async function resetWeeklyTasks() {
  try {
      console.log('Resetting weekly tasks');
      const weeklyTasks = await db.collection('weeklyTasks').get();
      const batch = db.batch();
      weeklyTasks.forEach((task) => {
          const taskRef = db.collection('weeklyTasks').doc(task.id);
          batch.update(taskRef, { completed: false });
      });
      await batch.commit();
      await db.collection('metadata').doc('resetTimes').set({ // 🔄 변경됨
          lastWeeklyReset: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }); // 🔄 변경됨
      console.log('Weekly tasks reset');
  } catch (error) {
      console.error('주간 리셋 오류:', error);
      alert('주간 리셋에 실패했습니다. Firestore 권한을 확인해주세요.');
  }
}

async function checkAndResetTasks() {
  const { DateTime } = luxon;
  const now = DateTime.now().setZone('Asia/Seoul');
  const today5am = now.startOf('day').plus({ hours: 5 });
  const lastMonday5am = now.startOf('week').plus({ hours: 5 });

  try {
      const resetDoc = await db.collection('metadata').doc('resetTimes').get();
      const resetData = resetDoc.exists ? resetDoc.data() : {};

      const lastDailyReset = resetData.lastDailyReset
          ? DateTime.fromJSDate(resetData.lastDailyReset.toDate()).setZone('Asia/Seoul')
          : DateTime.fromMillis(0);
      if (now >= today5am && lastDailyReset < today5am) {
          await resetDailyTasks();
      }

      const lastWeeklyReset = resetData.lastWeeklyReset
          ? DateTime.fromJSDate(resetData.lastWeeklyReset.toDate()).setZone('Asia/Seoul')
          : DateTime.fromMillis(0);
      if (now >= lastMonday5am && lastWeeklyReset < lastMonday5am) {
          await resetWeeklyTasks();
      }
  } catch (error) {
      console.error('리셋 확인 오류:', error);
      alert('리셋 확인에 실패했습니다. Firestore 권한을 확인해주세요.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, setting up event listeners');

  const addTaskButtons = document.querySelectorAll('.add-task');
  console.log('Found add-task buttons:', addTaskButtons.length);
  addTaskButtons.forEach(button => {
      button.addEventListener('click', () => {
          console.log('Add task button clicked for box:', button.dataset.box);
          const box = button.dataset.box;
          const text = prompt('새로운 항목을 입력하세요:');
          if (text && text.trim()) {
              addTask(box, text);
          } else if (text !== null) {
              alert('항목 내용을 입력해주세요.');
          }
      });
  });

  document.addEventListener('click', (e) => {
      if (e.target.type === 'checkbox') {
          const box = e.target.dataset.box;
          const id = e.target.dataset.id;
          console.log('Checkbox clicked:', box, id);
          toggleTask(box, id);
      } else if (e.target.classList.contains('delete-btn')) {
          const box = e.target.dataset.box;
          const id = e.target.dataset.id;
          console.log('Delete button clicked:', box, id);
          deleteTask(box, id);
      } else if (e.target.classList.contains('edit-btn')) {
          const box = e.target.dataset.box;
          const id = e.target.dataset.id;
          console.log('Edit button clicked:', box, id);
          const currentText = e.target.parentElement.parentElement.querySelector('span').textContent;
          const newText = prompt('항목 내용을 수정하세요:', currentText);
          if (newText && newText.trim()) {
              editTask(box, id, newText);
          } else if (newText !== null) {
              alert('수정할 내용을 입력해주세요.');
          }
      }
  });

  Object.keys(taskLists).forEach(box => {
      console.log(`Setting up Sortable for ${box}Tasks`);
      new Sortable(taskLists[box], {
          animation: 150,
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
          handle: '.drag-handle',
          onEnd: async (evt) => {
              const orderedIds = Array.from(taskLists[box].children).map(li => li.dataset.id);
              console.log(`New order for ${box}:`, orderedIds);
              await updateTaskOrder(box, orderedIds);
          }
      });
  });

  Object.keys(taskLists).forEach(box => {
      console.log(`Setting up snapshot listener for ${box}Tasks`);
      db.collection(`${box}Tasks`).orderBy('order').onSnapshot((snapshot) => {
          const tasks = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
          const completedTasks = tasks.filter(t => t.data.completed);
          const incompleteTasks = tasks.filter(t => !t.data.completed);
          renderTasks(box, [...incompleteTasks, ...completedTasks]);
      }, (error) => {
          console.error(`Snapshot error for ${box}Tasks:`, error);
          alert(`데이터 동기화에 실패했습니다. ${box}Tasks 컬렉션의 Firestore 권한을 확인해주세요.`);
      });
  });

  checkAndResetTasks();
});
