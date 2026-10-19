
const TaskService = (function () {
  const KEY = 'cinema_tasks';
  const PRIORITIES = ['Low', 'Medium', 'High'];
  const STATUSES = ['Pending', 'Done'];

  /* ---------- Đọc / ghi LocalStorage ---------- */

  function getAll() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveAll(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  // ID tự sinh: lớn nhất hiện có + 1
  function nextId(list) {
    let max = 0;
    list.forEach(function (t) {
      if (Number(t.id) > max) max = Number(t.id);
    });
    return max + 1;
  }

  /* ---------- CRUD ---------- */

  function getById(id) {
    return getAll().find(function (t) { return t.id === Number(id); }) || null;
  }

  function create(data) {
    const list = getAll();
    const task = {
      id: nextId(list),
      title: data.title.trim(),
      description: data.description.trim(),
      deadline: data.deadline,
      priority: data.priority,
      status: data.status,
      room: data.room
    };
    list.push(task);
    saveAll(list);
    return task;
  }

  function update(id, data) {
    const list = getAll();
    const index = list.findIndex(function (t) { return t.id === Number(id); });
    if (index === -1) return null;
    list[index] = {
      id: list[index].id,
      title: data.title.trim(),
      description: data.description.trim(),
      deadline: data.deadline,
      priority: data.priority,
      status: data.status,
      room: data.room
    };
    saveAll(list);
    return list[index];
  }

  function remove(id) {
    const list = getAll().filter(function (t) { return t.id !== Number(id); });
    saveAll(list);
  }

  // Đổi Pending <-> Done
  function toggleStatus(id) {
    const list = getAll();
    const task = list.find(function (t) { return t.id === Number(id); });
    if (!task) return null;
    task.status = task.status === 'Done' ? 'Pending' : 'Done';
    saveAll(list);
    return task;
  }

  function clearAll() {
    saveAll([]);
  }

  /* ---------- Export / Import JSON ---------- */

  function exportJSON() {
    const json = JSON.stringify(getAll(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rap-phim-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Trả về { ok, count, message }
  function importJSON(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { ok: false, count: 0, message: 'File không phải JSON hợp lệ.' };
    }
    if (!Array.isArray(data)) {
      return { ok: false, count: 0, message: 'Dữ liệu phải là một danh sách (mảng) suất chiếu.' };
    }

    const result = [];
    for (let i = 0; i < data.length; i++) {
      const t = data[i];
      if (!t || typeof t.title !== 'string' || typeof t.deadline !== 'string') {
        return { ok: false, count: 0, message: 'Phần tử thứ ' + (i + 1) + ' thiếu title hoặc deadline.' };
      }
      result.push({
        id: i + 1,
        title: t.title,
        description: typeof t.description === 'string' ? t.description : '',
        deadline: t.deadline,
        priority: PRIORITIES.indexOf(t.priority) !== -1 ? t.priority : 'Medium',
        status: STATUSES.indexOf(t.status) !== -1 ? t.status : 'Pending',
        room: typeof t.room === 'string' ? t.room : 'Phòng 1'
      });
    }
    saveAll(result);
    return { ok: true, count: result.length, message: 'Đã nhập ' + result.length + ' suất chiếu.' };
  }

  /* ---------- Dữ liệu mẫu (chỉ tạo lần đầu mở web) ---------- */

  function seedIfEmpty() {
    if (localStorage.getItem(KEY) !== null) return;
    const d = App.addDays;
    const sample = [
      { title: 'Truy Kích - Phim hành động', description: 'Suất chiếu đầu tiên trong tuần, dự kiến kín ghế.', deadline: d(1), priority: 'High', status: 'Pending', room: 'Phòng 4 (IMAX)' },
      { title: 'Hoạt hình gia đình: Chuyến phiêu lưu', description: 'Suất chiếu dành cho trẻ em, có combo bắp nước.', deadline: d(2), priority: 'Medium', status: 'Pending', room: 'Phòng 1' },
      { title: 'Chuyện tình mùa thu', description: 'Phim tình cảm, chiếu buổi tối cuối tuần.', deadline: d(4), priority: 'Low', status: 'Pending', room: 'Phòng 2' },
      { title: 'Kinh dị đêm khuya', description: 'Chiếu suất 22h, chỉ dành cho khán giả từ 18 tuổi.', deadline: d(5), priority: 'High', status: 'Pending', room: 'Phòng 3' },
      { title: 'Hài Tết: Nhà có khách', description: 'Suất chiếu đặc biệt cho khách đặt vé nhóm.', deadline: d(7), priority: 'Medium', status: 'Pending', room: 'Phòng 5 (VIP)' },
      { title: 'Phim tài liệu: Biển xanh', description: 'Suất chiếu thử dành cho học sinh, sinh viên.', deadline: d(10), priority: 'Low', status: 'Done', room: 'Phòng 2' }
    ];
    const list = sample.map(function (t, i) {
      t.id = i + 1;
      return t;
    });
    saveAll(list);
  }

  return {
    getAll: getAll,
    getById: getById,
    create: create,
    update: update,
    remove: remove,
    toggleStatus: toggleStatus,
    clearAll: clearAll,
    exportJSON: exportJSON,
    importJSON: importJSON,
    seedIfEmpty: seedIfEmpty
  };
})();
