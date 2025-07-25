export interface UploadExpression {
  interpret(context: UploadContext): any;
}

export interface UploadContext {
  getVariable(name: string): any;
  setVariable(name: string, value: any): void;
}

export class UploadContextImpl implements UploadContext {
  private variables: Map<string, any> = new Map();

  constructor(private upload: any) {
    this.variables.set('uploadId', upload.id);
    this.variables.set('originalUrl', upload.originalUrl);
    this.variables.set('filename', upload.filename);
    this.variables.set('status', upload.status);
    this.variables.set('fileSize', upload.fileSize);
    this.variables.set('googleDriveId', upload.googleDriveId);
    this.variables.set('googleDriveLink', upload.googleDriveLink);
    this.variables.set('errorMessage', upload.errorMessage);
  }

  getVariable(name: string): any {
    return this.variables.get(name);
  }

  setVariable(name: string, value: any): void {
    this.variables.set(name, value);
  }

  getUpload(): any {
    return this.upload;
  }
}

export class VariableExpression implements UploadExpression {
  constructor(private name: string) {}

  interpret(context: UploadContext): any {
    return context.getVariable(this.name);
  }
}

export class StatusCheckExpression implements UploadExpression {
  constructor(private status: string) {}

  interpret(context: UploadContext): boolean {
    const currentStatus = context.getVariable('status');
    return currentStatus === this.status;
  }
}

export class FileSizeCheckExpression implements UploadExpression {
  constructor(private maxSize: number) {}

  interpret(context: UploadContext): boolean {
    const fileSize = context.getVariable('fileSize');
    return fileSize && fileSize <= this.maxSize;
  }
}

export class UrlValidationExpression implements UploadExpression {
  interpret(context: UploadContext): boolean {
    const url = context.getVariable('originalUrl');
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export class AndExpression implements UploadExpression {
  constructor(
    private left: UploadExpression,
    private right: UploadExpression,
  ) {}

  interpret(context: UploadContext): boolean {
    return this.left.interpret(context) && this.right.interpret(context);
  }
}

export class OrExpression implements UploadExpression {
  constructor(
    private left: UploadExpression,
    private right: UploadExpression,
  ) {}

  interpret(context: UploadContext): boolean {
    return this.left.interpret(context) || this.right.interpret(context);
  }
}

export class NotExpression implements UploadExpression {
  constructor(private expression: UploadExpression) {}

  interpret(context: UploadContext): boolean {
    return !this.expression.interpret(context);
  }
}

export class ConditionalExpression implements UploadExpression {
  constructor(
    private condition: UploadExpression,
    private trueExpression: UploadExpression,
    private falseExpression?: UploadExpression,
  ) {}

  interpret(context: UploadContext): any {
    if (this.condition.interpret(context)) {
      return this.trueExpression.interpret(context);
    } else if (this.falseExpression) {
      return this.falseExpression.interpret(context);
    }
    return null;
  }
}

export class UploadRuleEngine {
  private rules: Map<string, UploadExpression> = new Map();

  addRule(name: string, expression: UploadExpression): void {
    this.rules.set(name, expression);
  }

  evaluateRule(name: string, context: UploadContext): any {
    const rule = this.rules.get(name);
    if (!rule) {
      throw new Error(`Rule '${name}' not found`);
    }
    return rule.interpret(context);
  }

  evaluateAllRules(context: UploadContext): Map<string, any> {
    const results = new Map<string, any>();

    this.rules.forEach((rule, name) => {
      try {
        results.set(name, rule.interpret(context));
      } catch (error) {
        results.set(name, { error: error.message });
      }
    });

    return results;
  }

  removeRule(name: string): boolean {
    return this.rules.delete(name);
  }

  getRuleNames(): string[] {
    return Array.from(this.rules.keys());
  }
}

export class UploadRuleBuilder {
  static createStatusRule(status: string): UploadExpression {
    return new StatusCheckExpression(status);
  }

  static createFileSizeRule(maxSize: number): UploadExpression {
    return new FileSizeCheckExpression(maxSize);
  }

  static createUrlValidationRule(): UploadExpression {
    return new UrlValidationExpression();
  }

  static createAndRule(
    left: UploadExpression,
    right: UploadExpression,
  ): UploadExpression {
    return new AndExpression(left, right);
  }

  static createOrRule(
    left: UploadExpression,
    right: UploadExpression,
  ): UploadExpression {
    return new OrExpression(left, right);
  }

  static createNotRule(expression: UploadExpression): UploadExpression {
    return new NotExpression(expression);
  }

  static createConditionalRule(
    condition: UploadExpression,
    trueExpression: UploadExpression,
    falseExpression?: UploadExpression,
  ): UploadExpression {
    return new ConditionalExpression(
      condition,
      trueExpression,
      falseExpression,
    );
  }

  static createValidUploadRule(): UploadExpression {
    const urlValidation = this.createUrlValidationRule();
    const fileSizeCheck = this.createFileSizeRule(100 * 1024 * 1024);
    return this.createAndRule(urlValidation, fileSizeCheck);
  }

  static createCompletedUploadRule(): UploadExpression {
    const statusCheck = this.createStatusRule('completed');
    const hasDriveId = new VariableExpression('googleDriveId');
    const hasDriveLink = new VariableExpression('googleDriveLink');
    const hasDriveInfo = this.createAndRule(hasDriveId, hasDriveLink);
    return this.createAndRule(statusCheck, hasDriveInfo);
  }

  static createFailedUploadRule(): UploadExpression {
    const statusCheck = this.createStatusRule('failed');
    const hasErrorMessage = new VariableExpression('errorMessage');
    return this.createAndRule(statusCheck, hasErrorMessage);
  }
}
