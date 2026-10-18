(function () {
  function init() {
    App.init();
    TaskService.seedIfEmpty();

    const all = TaskService.getAll();
    const pending = all.filter(function (t) { return t.status === 'Pending'; });

    document.getElementById('homeTotal').textContent = all.length;
    document.getElementById('homePending').textContent = pending.length;
    document.getElementById('homeDone').textContent = all.length - pending.length;

    // 3 suất chiếu sắp tới (ngày gần nhất)
    const upcoming = pending
      .slice()
      .sort(function (a, b) { return a.deadline.localeCompare(b.deadline); })
      .slice(0, 3);

    const box = document.getElementById('upcomingList');
    if (upcoming.length === 0) {
      box.innerHTML = '<div class="col-12 text-center text-body-secondary py-4">Chưa có suất chiếu sắp tới. Hãy thêm ở trang Quản lý.</div>';
      return;
    }

    box.innerHTML = upcoming.map(function (t) {
      const p = App.CONFIG.PRIORITY[t.priority];
      return '' +
        '<div class="col-12 col-md-4 fade-in">' +
          '<div class="card task-card h-100 prio-' + t.priority.toLowerCase() + '">' +
            '<div class="card-body">' +
              '<span class="badge ' + p.badge + ' mb-2"><i class="bi ' + p.icon + '"></i> ' + p.label + '</span>' +
              '<h5 class="card-title">' + App.escapeHtml(t.title) + '</h5>' +
              '<p class="small text-body-secondary mb-2">' + App.escapeHtml(t.description) + '</p>' +
              '<div class="small"><i class="bi bi-calendar-event me-1"></i>' + App.formatDate(t.deadline) +
                ' &middot; <i class="bi bi-door-open me-1"></i>' + App.escapeHtml(t.room || '') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', init);
})();