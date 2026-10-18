
(function () {
  const $ = function (id) { return document.getElementById(id); };

  // Trạng thái bộ lọc hiện tại
  const state = {
    keyword: '',
    status: 'all',
    priority: 'all',
    sort: 'asc',
    page: 1,
    perPage: 6
  };

  let editingId = null;       
  let taskModal = null;
  let confirmModal = null;
  let onConfirm = null;       // hàm chạy khi bấm "Đồng ý"
// danh sách

  function cardHtml(t) {
    const done = t.status === 'Done';
    const p = App.CONFIG.PRIORITY[t.priority];
    const s = App.CONFIG.STATUS[t.status];
    const overdue = !done && t.deadline < App.todayStr();

    return '' +
      '<div class="col-12 col-md-6 col-xl-4 fade-in">' +
        '<div class="card task-card h-100 prio-' + t.priority.toLowerCase() + (done ? ' is-done' : '') + '">' +
          '<div class="card-body d-flex flex-column">' +
            '<div class="d-flex justify-content-between align-items-start mb-2">' +
              '<span class="badge ' + p.badge + '"><i class="bi ' + p.icon + '"></i> ' + p.label + '</span>' +
              '<span class="badge ' + s.badge + '"><i class="bi ' + s.icon + '"></i> ' + s.label + '</span>' +
            '</div>' +
            '<h5 class="card-title task-title">' + App.escapeHtml(t.title) + '</h5>' +
            '<p class="card-text text-body-secondary small flex-grow-1">' + App.escapeHtml(t.description) + '</p>' +
            '<ul class="list-unstyled small mb-3">' +
              '<li><i class="bi bi-calendar-event me-1"></i> Ngày chiếu: <strong>' + App.formatDate(t.deadline) + '</strong>' +
                (overdue ? ' <span class="badge text-bg-danger">Quá hạn</span>' : '') + '</li>' +
              '<li><i class="bi bi-door-open me-1"></i> ' + App.escapeHtml(t.room || '') + '</li>' +
              '<li class="text-body-secondary"><i class="bi bi-hash me-1"></i>Mã: ' + t.id + '</li>' +
            '</ul>' +
            '<div class="d-flex gap-2 flex-wrap">' +
              '<button class="btn btn-sm ' + (done ? 'btn-outline-secondary' : 'btn-success') + '" data-action="toggle" data-id="' + t.id + '">' +
                '<i class="bi ' + (done ? 'bi-arrow-counterclockwise' : 'bi-check2') + '"></i> ' + (done ? 'Bỏ đánh dấu' : 'Đã chiếu') + '</button>' +
              '<button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="' + t.id + '"><i class="bi bi-pencil-square"></i> Sửa</button>' +
              '<button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="' + t.id + '"><i class="bi bi-trash3"></i> Xóa</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function render() {
    const all = TaskService.getAll();
    const filtered = Filter.apply(all, state);
    const pg = Filter.paginate(filtered, state.page, state.perPage);
    state.page = pg.page;

    $('taskCount').textContent = 'Hiển thị ' + filtered.length + ' / ' + all.length + ' suất chiếu';

    if (pg.items.length === 0) {
      $('taskList').innerHTML =
        '<div class="col-12"><div class="empty-state text-center py-5">' +
          '<i class="bi bi-film display-3"></i>' +
          '<p class="mt-3 mb-0">' + (all.length === 0
            ? 'Chưa có suất chiếu nào. Bấm "Thêm suất chiếu" để bắt đầu!'
            : 'Không tìm thấy suất chiếu phù hợp với bộ lọc.') + '</p>' +
        '</div></div>';
    } else {
      $('taskList').innerHTML = pg.items.map(cardHtml).join('');
    }
    renderPagination(pg);
  }

  function renderPagination(pg) {
    const box = $('pagination');
    if (pg.totalPages <= 1) {
      box.innerHTML = '';
      return;
    }
    let html = '<li class="page-item ' + (pg.page === 1 ? 'disabled' : '') + '">' +
      '<a class="page-link" href="#" data-page="' + (pg.page - 1) + '">&laquo;</a></li>';
    for (let i = 1; i <= pg.totalPages; i++) {
      html += '<li class="page-item ' + (i === pg.page ? 'active' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + i + '">' + i + '</a></li>';
    }
    html += '<li class="page-item ' + (pg.page === pg.totalPages ? 'disabled' : '') + '">' +
      '<a class="page-link" href="#" data-page="' + (pg.page + 1) + '">&raquo;</a></li>';
    box.innerHTML = html;
  }

  /* ============ FORM THÊM / SỬA ============ */

  const FIELDS = ['title', 'description', 'deadline'];
  const FIELD_IDS = { title: 'fTitle', description: 'fDescription', deadline: 'fDeadline' };
  const ERR_IDS = { title: 'errTitle', description: 'errDescription', deadline: 'errDeadline' };

  function showFieldError(field, message) {
    const input = $(FIELD_IDS[field]);
    $(ERR_IDS[field]).textContent = message;
    input.classList.toggle('is-invalid', !!message);
    input.classList.toggle('is-valid', !message && input.value.trim() !== '');
  }

  function clearErrors() {
    FIELDS.forEach(function (f) {
      $(FIELD_IDS[f]).classList.remove('is-invalid', 'is-valid');
      $(ERR_IDS[f]).textContent = '';
    });
  }

  function fillRoomOptions() {
    $('fRoom').innerHTML = App.CONFIG.ROOMS.map(function (r) {
      return '<option value="' + App.escapeHtml(r) + '">' + App.escapeHtml(r) + '</option>';
    }).join('');
  }

  function openAdd() {
    editingId = null;
    $('taskForm').reset();
    clearErrors();
    $('taskModalTitle').innerHTML = '<i class="bi bi-plus-circle"></i> Thêm suất chiếu';
    $('fDeadline').value = App.todayStr();
    taskModal.show();
  }

  function openEdit(id) {
    const t = TaskService.getById(id);
    if (!t) return;
    editingId = t.id;
    clearErrors();
    $('taskModalTitle').innerHTML = '<i class="bi bi-pencil-square"></i> Sửa suất chiếu #' + t.id;
    $('fTitle').value = t.title;
    $('fDescription').value = t.description;
    $('fDeadline').value = t.deadline;
    $('fRoom').value = t.room;
    $('fPriority').value = t.priority;
    $('fStatus').value = t.status;
    taskModal.show();
  }

  function readForm() {
    return {
      title: $('fTitle').value,
      description: $('fDescription').value,
      deadline: $('fDeadline').value,
      room: $('fRoom').value,
      priority: $('fPriority').value,
      status: $('fStatus').value
    };
  }

  function submitForm(e) {
    e.preventDefault();
    const data = readForm();
    const errors = Validation.validateAll(data);

    FIELDS.forEach(function (f) { showFieldError(f, errors[f] || ''); });

    if (Object.keys(errors).length > 0) {
      App.showToast('Vui lòng kiểm tra lại các trường bị lỗi.', 'danger');
      return;
    }

    if (editingId === null) {
      TaskService.create(data);
      App.showToast('Đã thêm suất chiếu mới.');
    } else {
      TaskService.update(editingId, data);
      App.showToast('Đã cập nhật suất chiếu #' + editingId + '.');
    }
    taskModal.hide();
    render();
  }

  /* ============ HỘP THOẠI XÁC NHẬN ============ */

  function askConfirm(message, callback) {
    $('confirmMessage').textContent = message;
    onConfirm = callback;
    confirmModal.show();
  }

  /* ============ SỰ KIỆN ============ */

  function onListClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === 'edit') {
      openEdit(id);
    } else if (action === 'toggle') {
      const t = TaskService.toggleStatus(id);
      App.showToast(t.status === 'Done' ? 'Đã đánh dấu: Đã chiếu.' : 'Đã chuyển về: Sắp chiếu.', 'info');
      render();
    } else if (action === 'delete') {
      const t = TaskService.getById(id);
      askConfirm('Bạn có chắc muốn xóa suất chiếu "' + t.title + '"? Hành động này không thể hoàn tác.', function () {
        TaskService.remove(id);
        App.showToast('Đã xóa suất chiếu.', 'warning');
        render();
      });
    }
  }

  function bindFilters() {
    $('searchInput').addEventListener('input', function (e) {
      state.keyword = e.target.value;
      state.page = 1;
      render();
    });
    $('filterStatus').addEventListener('change', function (e) {
      state.status = e.target.value;
      state.page = 1;
      render();
    });
    $('filterPriority').addEventListener('change', function (e) {
      state.priority = e.target.value;
      state.page = 1;
      render();
    });
    $('sortOrder').addEventListener('change', function (e) {
      state.sort = e.target.value;
      state.page = 1;
      render();
    });
    $('btnReset').addEventListener('click', function () {
      state.keyword = '';
      state.status = 'all';
      state.priority = 'all';
      state.sort = 'asc';
      state.page = 1;
      $('searchInput').value = '';
      $('filterStatus').value = 'all';
      $('filterPriority').value = 'all';
      $('sortOrder').value = 'asc';
      render();
    });
    $('pagination').addEventListener('click', function (e) {
      const a = e.target.closest('a[data-page]');
      if (!a) return;
      e.preventDefault();
      state.page = Number(a.dataset.page);
      render();
    });
  }

  function bindDataTools() {
    $('btnExport').addEventListener('click', function () {
      if (TaskService.getAll().length === 0) {
        App.showToast('Không có dữ liệu để xuất.', 'warning');
        return;
      }
      TaskService.exportJSON();
      App.showToast('Đã xuất file JSON.');
    });

    $('importFile').addEventListener('change', function (e) {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        askConfirm('Nhập file "' + file.name + '" sẽ thay thế toàn bộ dữ liệu hiện tại. Tiếp tục?', function () {
          const res = TaskService.importJSON(String(reader.result));
          App.showToast(res.message, res.ok ? 'success' : 'danger');
          state.page = 1;
          render();
        });
      };
      reader.readAsText(file);
    });

    $('btnClearAll').addEventListener('click', function () {
      if (TaskService.getAll().length === 0) {
        App.showToast('Danh sách đang trống.', 'info');
        return;
      }
      askConfirm('Xóa TOÀN BỘ suất chiếu? Hành động này không thể hoàn tác (hãy Export JSON để sao lưu trước).', function () {
        TaskService.clearAll();
        App.showToast('Đã xóa toàn bộ dữ liệu.', 'warning');
        state.page = 1;
        render();
      });
    });
  }

  function bindForm() {
    $('btnAdd').addEventListener('click', openAdd);
    $('taskForm').addEventListener('submit', submitForm);

    // Validation realtime khi gõ
    FIELDS.forEach(function (f) {
      $(FIELD_IDS[f]).addEventListener('input', function () {
        showFieldError(f, Validation.validateField(f, $(FIELD_IDS[f]).value));
      });
    });

    $('btnConfirmYes').addEventListener('click', function () {
      confirmModal.hide();
      if (typeof onConfirm === 'function') onConfirm();
      onConfirm = null;
    });
  }

  /* ============ KHỞI TẠO ============ */

  function init() {
    App.init();
    TaskService.seedIfEmpty();
    taskModal = new bootstrap.Modal($('taskModal'));
    confirmModal = new bootstrap.Modal($('confirmModal'));
    fillRoomOptions();
    $('taskList').addEventListener('click', onListClick);
    bindFilters();
    bindDataTools();
    bindForm();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();