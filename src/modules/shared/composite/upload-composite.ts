export interface UploadComponent {
  getId(): string;
  getName(): string;
  getStatus(): string;
  getSize(): number;
  add(component: UploadComponent): void;
  remove(component: UploadComponent): void;
  getChildren(): UploadComponent[];
  process(): Promise<void>;
}

export class UploadLeaf implements UploadComponent {
  constructor(
    private id: string,
    private name: string,
    private status: string,
    private size: number = 0,
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getStatus(): string {
    return this.status;
  }

  getSize(): number {
    return this.size;
  }

  add(component: UploadComponent): void {
    throw new Error('Cannot add to leaf component');
  }

  remove(component: UploadComponent): void {
    throw new Error('Cannot remove from leaf component');
  }

  getChildren(): UploadComponent[] {
    return [];
  }

  async process(): Promise<void> {
    console.log(`Processing upload: ${this.name}`);
  }
}

export class UploadComposite implements UploadComponent {
  private children: UploadComponent[] = [];

  constructor(
    private id: string,
    private name: string,
    private status: string = 'pending',
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getStatus(): string {
    const statuses = this.children.map(child => child.getStatus());

    if (statuses.every(status => status === 'completed')) {
      return 'completed';
    } else if (statuses.some(status => status === 'failed')) {
      return 'failed';
    } else if (statuses.some(status => status === 'processing')) {
      return 'processing';
    } else {
      return 'pending';
    }
  }

  getSize(): number {
    return this.children.reduce((total, child) => total + child.getSize(), 0);
  }

  add(component: UploadComponent): void {
    this.children.push(component);
  }

  remove(component: UploadComponent): void {
    const index = this.children.indexOf(component);
    if (index > -1) {
      this.children.splice(index, 1);
    }
  }

  getChildren(): UploadComponent[] {
    return [...this.children];
  }

  async process(): Promise<void> {
    console.log(`Processing upload group: ${this.name}`);

    for (const child of this.children) {
      await child.process();
    }
  }

  getCompletedCount(): number {
    return this.children.filter(child => child.getStatus() === 'completed')
      .length;
  }

  getFailedCount(): number {
    return this.children.filter(child => child.getStatus() === 'failed').length;
  }

  getPendingCount(): number {
    return this.children.filter(child => child.getStatus() === 'pending')
      .length;
  }

  getProcessingCount(): number {
    return this.children.filter(child => child.getStatus() === 'processing')
      .length;
  }
}

export class UploadBatch extends UploadComposite {
  constructor(
    id: string,
    name: string,
    private maxConcurrent: number = 3,
  ) {
    super(id, name);
  }

  async process(): Promise<void> {
    console.log(`Processing upload batch: ${this.getName()}`);

    const children = this.getChildren();
    const chunks = this.chunkArray(children, this.maxConcurrent);

    for (const chunk of chunks) {
      await Promise.all(chunk.map(child => child.process()));
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export class UploadQueue extends UploadComposite {
  constructor(id: string, name: string) {
    super(id, name);
  }

  async process(): Promise<void> {
    console.log(`Processing upload queue: ${this.getName()}`);

    const children = this.getChildren();

    for (const child of children) {
      await child.process();
    }
  }

  enqueue(component: UploadComponent): void {
    this.add(component);
  }

  dequeue(): UploadComponent | null {
    const children = this.getChildren();
    if (children.length === 0) {
      return null;
    }

    const first = children[0];
    this.remove(first);
    return first;
  }

  peek(): UploadComponent | null {
    const children = this.getChildren();
    return children.length > 0 ? children[0] : null;
  }

  isEmpty(): boolean {
    return this.getChildren().length === 0;
  }

  getLength(): number {
    return this.getChildren().length;
  }
}

export class UploadManager {
  private root: UploadComposite;

  constructor() {
    this.root = new UploadComposite('root', 'Upload Manager');
  }

  addUpload(upload: any): void {
    const leaf = new UploadLeaf(
      upload.id,
      upload.filename,
      upload.status,
      upload.fileSize || 0,
    );
    this.root.add(leaf);
  }

  createBatch(
    id: string,
    name: string,
    maxConcurrent: number = 3,
  ): UploadBatch {
    const batch = new UploadBatch(id, name, maxConcurrent);
    this.root.add(batch);
    return batch;
  }

  createQueue(id: string, name: string): UploadQueue {
    const queue = new UploadQueue(id, name);
    this.root.add(queue);
    return queue;
  }

  async processAll(): Promise<void> {
    await this.root.process();
  }

  getStatus(): any {
    return {
      id: this.root.getId(),
      name: this.root.getName(),
      status: this.root.getStatus(),
      size: this.root.getSize(),
      completed: this.root.getCompletedCount(),
      failed: this.root.getFailedCount(),
      pending: this.root.getPendingCount(),
      processing: this.root.getProcessingCount(),
      children: this.root.getChildren().map(child => ({
        id: child.getId(),
        name: child.getName(),
        status: child.getStatus(),
        size: child.getSize(),
      })),
    };
  }

  findComponent(id: string): UploadComponent | null {
    return this.findComponentRecursive(this.root, id);
  }

  private findComponentRecursive(
    component: UploadComponent,
    id: string,
  ): UploadComponent | null {
    if (component.getId() === id) {
      return component;
    }

    for (const child of component.getChildren()) {
      const found = this.findComponentRecursive(child, id);
      if (found) {
        return found;
      }
    }

    return null;
  }

  removeComponent(id: string): boolean {
    const component = this.findComponent(id);
    if (component && component !== this.root) {
      this.removeComponentRecursive(this.root, component);
      return true;
    }
    return false;
  }

  private removeComponentRecursive(
    parent: UploadComponent,
    target: UploadComponent,
  ): boolean {
    for (const child of parent.getChildren()) {
      if (child === target) {
        parent.remove(child);
        return true;
      }

      if (this.removeComponentRecursive(child, target)) {
        return true;
      }
    }
    return false;
  }
}
