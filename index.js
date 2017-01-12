class App {
  constructor({ tasks = [], elem }) {
    this.elem = elem;
    this.tasks = tasks;
  }

  getActions(task) {
    return {
      delete: ()=> this.handleDelete(task),
      next:   ()=> this.handleNext(task),
      prev:   ()=> this.handlePrev(task),
      up:     ()=> this.handleUp(task),
      down:   ()=> this.handleDown(task),
    }
  }

  set tasks(arr) {
    this._tasks = arr;
    this.render();
  }

  get tasks() {
    return this._tasks;
  }

  handleDown(task) {
    const { columnTasks, taskIndex } = this.getColumnIndex(task);
    if (taskIndex === columnTasks.length - 1) return;
    this.swapTaskOrder(task, columnTasks[taskIndex + 1])
  }

  handleUp(task) {
    const { columnTasks, taskIndex } = this.getColumnIndex(task);
    if (!taskIndex) return;
    this.swapTaskOrder(task, columnTasks[taskIndex - 1]);
  }

  swapTaskOrder(first, second) {
    const newFirst = Object.assign({}, first, { order: second.order });
    const newSecond = Object.assign({}, second, { order: first.order });
    const filtered = this.tasks.filter(i=>i !== first && i !== second);
    this.tasks = [...filtered, newFirst, newSecond].sort((a, b) => a.order - b.order);
  }

  getColumnIndex(task) {
    const columnTasks = this.tasks.filter(i=>i.status === task.status);
    const taskIndex = columnTasks.findIndex(i => i === task);
    return {
      columnTasks,
      taskIndex
    }
  }

  handleDelete(task) {
    this.tasks = this.tasks.filter(i => i !== task);
  }

  handlePrev(task) {
    const status = task.status === 'done' ? 'inprogress' : 'todo';
    this.replaceTask(task, status);
  }

  handleNext(task) {
    const status = task.status === 'todo' ? 'inprogress' : 'done';
    this.replaceTask(task, status);
  }

  replaceTask(task, status) {
    const newTask = Object.assign({}, task, {
             status,
      order: this.getNextOrder(status)
    });
    this.tasks = [...this.tasks.filter(i => i !== task), newTask];
  }

  getNextOrder(status) {
    const column = this.tasks.filter(i=>i.status === status);
    const lastElem = column[column.length - 1];
    return lastElem ? lastElem.order + 1 : 0;
  }

  addTask(task) {
    const newTask = Object.assign({}, task, { order: this.getNextOrder(task.status) });
    this.tasks = [...this.tasks, newTask];
  }

  render() {
    const view = new AppDrawer(this.tasks, this.getActions.bind(this), this.addTask.bind(this));
    this.elem.innerHTML = '';
    this.elem.appendChild(view);
  }
}
class AppDrawer extends HTMLElement {
  constructor(tasks, getActions, addTask) {
    super();
    this.tasks = tasks;
    this.getActions = getActions;
    this.addTask = addTask;
    const shadowRoot = this.attachShadowRoot('#app-drawer-template');
    const form = shadowRoot.querySelector('#send');
    form.onsubmit = (e) => this.handleSubmit(e);
  }

  connectedCallback() {
    this.render();
  }

  attachShadowRoot(template) {
    const shadowRoot = this.attachShadow({ mode: 'open' });
    const t = document.querySelector(template);
    const instance = t.content.cloneNode(true);
    shadowRoot.appendChild(instance);
    return shadowRoot;
  }

  handleSubmit(e) {
    e.preventDefault();
    const { name, description } = e.target.elements;
    if (!name.value) return;
    this.addTask({
      name:        name.value,
      description: description.value || 'empty task',
      status:      'todo'
    });
    name.value = '';
    description.value = ''
  };

  render() {
    const task = (i) => new Task(Object.assign({}, i, { actions: this.getActions(i) }));
    this.append(...this.tasks.map(task));
  }
}
window.customElements.define('app-drawer', AppDrawer);
class Task extends HTMLElement {
  constructor({ name, description, status, order, actions }={}) {
    super();
    const shadowRoot = this.attachShadowRoot('#x-task-template');
    this.status = status;
    this.name = name;
    this.description = description;
    this.order = order;
    this.actions = actions;
    const controls = shadowRoot.querySelector('.controls');
    controls.onclick = ({ target }) => this.handleControls(target);
  }

  handleControls(target){
    const type = target.classList.value;
    if (type in this.actions) this.actions[type]();
  }

  attachShadowRoot(template) {
    const shadowRoot = this.attachShadow({ mode: 'open' });
    const t = document.querySelector(template);
    const instance = t.content.cloneNode(true);
    shadowRoot.appendChild(instance);
    return shadowRoot;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const span = this.shadowRoot.querySelector('.task');
    span.textContent = this.name;
    this.slot = this.status;
    if (!this.lastChild) this.appendChild(document.createTextNode(this.description))
  }
}
window.customElements.define('x-task', Task);
class Column extends HTMLElement {
  constructor() {
    super();
    let shadowRoot = this.attachShadow({ mode: 'open' });
    const t = document.querySelector('#x-column-template');
    const instance = t.content.cloneNode(true);
    shadowRoot.appendChild(instance);
  }

  connectedCallback() {
    this.render()
  }

  render() {
    const span = this.shadowRoot.querySelector('.column');
    span.textContent = this.id;
    const slot = this.shadowRoot.querySelector('slot').assignedNodes();
    const nested = slot.find(i=>i.nodeName === 'SLOT').assignedNodes();
    const first = nested[0];
    const last = nested[nested.length - 1];
    if (first) first.setAttribute('first', 'first');
    if (last) last.setAttribute('last', 'last');
  }
}
window.customElements.define('x-column', Column);
const tasks = [
  {
    name:        'first',
    description: 'первая задача',
    status:      'todo',
    order:       0
  },
  {
    name:        'second',
    description: 'вторая задача',
    status:      'inprogress',
    order:       0
  },
  {
    name:        'third',
    description: 'третья задача',
    status:      'inprogress',
    order:       1
  },
  {
    name:        'fourth',
    description: 'четвертая задача',
    status:      'done',
    order:       0
  },
];
const elem = document.querySelector('#app');
new App({
  tasks,
  elem
});
