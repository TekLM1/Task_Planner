function TaskCard({ task, active, onSelect }) {
  const className = 'task-card' + (active ? ' active' : '');
  return (
    <div className={className} data-id={task.id} onClick={() => onSelect(task)}>
      {'📝 '}{task.titel || '(Unbenannter Task)'}
    </div>
  );
}

function TaskList({ tasks, selectedId, onSelect }) {
  if (!tasks || tasks.length === 0) {
    return <div className="task-card">Keine Tasks vorhanden</div>;
  }
  return (
    <>
      {tasks.map(t => (
        <TaskCard
          key={t.id}
          task={t}
          active={selectedId === t.id}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

const ReactUI = {
  root: null,
  ensureRoot() {
    if (this.root) return;
    const mountEl = document.getElementById('task-list');
    if (!mountEl) return;
    this.root = ReactDOM.createRoot(mountEl);
  },
  renderTaskList({ tasks, selectedTask }) {
    this.ensureRoot();
    if (!this.root) return;
    const onSelect = (task) => {
      // nutzt deine bestehende Funktion aus index.js
      if (window.showTaskDetail) window.showTaskDetail(task);
    };
    this.root.render(
      <TaskList tasks={tasks} selectedId={selectedTask?.id || null} onSelect={onSelect} />
    );
  }
};

// global, damit index.js es aufrufen kann
window.ReactUI = ReactUI;
